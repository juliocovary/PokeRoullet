import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin API key for privileged ranking rebuild operation
    const adminApiKey = Deno.env.get('ADMIN_API_KEY');
    const providedKey = req.headers.get('x-admin-key');

    if (!adminApiKey || providedKey !== adminApiKey) {
      console.error('❌ Unauthorized: Invalid or missing admin API key');
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid or missing admin API key',
          success: false,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🏆 Starting trainer rankings update...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all trainer progress with profile info
    console.log('📊 Fetching trainer progress...');
    const { data: progressData, error: progressError } = await supabase
      .from('trainer_progress')
      .select('user_id, highest_stage_cleared, total_pokemon_defeated');

    if (progressError) {
      console.error('Error fetching trainer progress:', progressError);
      throw progressError;
    }

    console.log(`Found ${progressData?.length || 0} trainer progress entries`);

    // 2. Get profile info for all users with trainer progress
    const userIds = (progressData || []).map(p => p.user_id);
    
    if (userIds.length === 0) {
      console.log('No trainer progress found, nothing to update');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No trainer progress to rank',
          stats: { total_users: 0, rankings_inserted: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Create profile lookup
    const profileLookup = (profiles || []).reduce((acc: Record<string, { nickname: string; avatar: string | null }>, p) => {
      acc[p.user_id] = { nickname: p.nickname, avatar: p.avatar };
      return acc;
    }, {});

    // 3. Build combined data
    const combinedData = (progressData || [])
      .filter(p => profileLookup[p.user_id])
      .map(p => ({
        user_id: p.user_id,
        nickname: profileLookup[p.user_id].nickname,
        avatar: profileLookup[p.user_id].avatar,
        highest_stage: p.highest_stage_cleared,
        total_pokemon_defeated: p.total_pokemon_defeated,
      }));

    // 4. Calculate highest stage rankings
    const stageSorted = [...combinedData].sort((a, b) => {
      if (b.highest_stage !== a.highest_stage) {
        return b.highest_stage - a.highest_stage;
      }
      // Tie-breaker: more pokemon defeated wins
      return b.total_pokemon_defeated - a.total_pokemon_defeated;
    });

    const stageRankings = stageSorted.map((item, index) => ({
      user_id: item.user_id,
      highest_stage_rank: index + 1,
    }));

    // 5. Calculate defeated pokemon rankings
    const defeatedSorted = [...combinedData].sort((a, b) => {
      if (b.total_pokemon_defeated !== a.total_pokemon_defeated) {
        return b.total_pokemon_defeated - a.total_pokemon_defeated;
      }
      // Tie-breaker: higher stage wins
      return b.highest_stage - a.highest_stage;
    });

    const defeatedRankings = defeatedSorted.map((item, index) => ({
      user_id: item.user_id,
      defeated_rank: index + 1,
    }));

    // 6. Merge rankings
    const finalRankings = combinedData.map(item => {
      const stageItem = stageRankings.find(s => s.user_id === item.user_id);
      const defeatedItem = defeatedRankings.find(d => d.user_id === item.user_id);
      return {
        user_id: item.user_id,
        nickname: item.nickname,
        avatar: item.avatar,
        highest_stage: item.highest_stage,
        highest_stage_rank: stageItem?.highest_stage_rank || null,
        total_pokemon_defeated: item.total_pokemon_defeated,
        defeated_rank: defeatedItem?.defeated_rank || null,
      };
    });

    console.log(`Built ${finalRankings.length} ranking entries`);

    // 7. Clear existing rankings
    console.log('🗑️ Clearing old trainer rankings...');
    const { error: deleteError } = await supabase
      .from('trainer_rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting old trainer rankings:', deleteError);
      throw deleteError;
    }

    // 8. Filter top 50 for each category and merge
    const top50Stage = finalRankings.filter(r => r.highest_stage_rank && r.highest_stage_rank <= 50 && r.highest_stage > 0);
    const top50Defeated = finalRankings.filter(r => r.defeated_rank && r.defeated_rank <= 50 && r.total_pokemon_defeated > 0);
    
    // Merge and deduplicate
    const usersToInsert = new Map<string, typeof finalRankings[0]>();
    
    top50Stage.forEach(r => usersToInsert.set(r.user_id, r));
    top50Defeated.forEach(r => {
      if (!usersToInsert.has(r.user_id)) {
        usersToInsert.set(r.user_id, r);
      }
    });

    const rankingsToInsert = Array.from(usersToInsert.values());

    if (rankingsToInsert.length > 0) {
      console.log(`💾 Inserting ${rankingsToInsert.length} trainer ranking entries...`);
      const { error: insertError } = await supabase
        .from('trainer_rankings')
        .insert(rankingsToInsert);

      if (insertError) {
        console.error('Error inserting trainer rankings:', insertError);
        throw insertError;
      }
    }

    console.log('✅ Trainer rankings updated successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trainer rankings updated successfully',
        stats: {
          total_users: progressData?.length || 0,
          rankings_inserted: rankingsToInsert.length,
          top_stage: top50Stage[0]?.nickname || 'N/A',
          top_defeated: top50Defeated[0]?.nickname || 'N/A',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error updating trainer rankings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
