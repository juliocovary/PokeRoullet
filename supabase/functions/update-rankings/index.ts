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
    // Validate admin API key
    const adminApiKey = Deno.env.get('ADMIN_API_KEY');
    const providedKey = req.headers.get('x-admin-key');
    
    if (!adminApiKey || providedKey !== adminApiKey) {
      console.error('❌ Unauthorized: Invalid or missing admin API key');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: Invalid or missing admin API key',
          success: false,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🏆 Starting rankings update...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all profiles with level and nickname
    console.log('📊 Fetching profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar, level, experience_points')
      .order('level', { ascending: false })
      .order('experience_points', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // 2. Count pokedex cards for each user using RPC (no row limits)
    console.log('🎴 Counting pokedex cards via RPC...');
    const { data: pokedexCounts, error: pokedexError } = await supabase
      .rpc('get_pokedex_counts');

    if (pokedexError) {
      console.error('Error fetching pokedex counts:', pokedexError);
      throw pokedexError;
    }

    // Convert to lookup object
    const pokedexCountByUser = (pokedexCounts || []).reduce((acc: Record<string, number>, row: { user_id: string; pokedex_count: number }) => {
      acc[row.user_id] = row.pokedex_count;
      return acc;
    }, {});

    // 3. Count shiny pokedex cards for each user using RPC
    console.log('✨ Counting shiny pokedex cards via RPC...');
    const { data: shinyCounts, error: shinyError } = await supabase
      .rpc('get_shiny_pokedex_counts');

    if (shinyError) {
      console.error('Error fetching shiny counts:', shinyError);
      throw shinyError;
    }

    // Convert to lookup object
    const shinyCountByUser = (shinyCounts || []).reduce((acc: Record<string, number>, row: { user_id: string; shiny_count: number }) => {
      acc[row.user_id] = row.shiny_count;
      return acc;
    }, {});

    console.log(`Processed pokedex counts for ${Object.keys(pokedexCountByUser).length} users`);

    // 4. Build rankings data
    const rankingsData = (profiles || []).map(profile => ({
      user_id: profile.user_id,
      nickname: profile.nickname,
      avatar: profile.avatar,
      level: profile.level,
      experience_points: profile.experience_points,
      pokedex_count: pokedexCountByUser[profile.user_id] || 0,
      shiny_count: shinyCountByUser[profile.user_id] || 0,
    }));

    // 5. Calculate level rankings (already sorted by level DESC)
    const levelRankings = rankingsData.map((item, index) => ({
      ...item,
      level_rank: index + 1,
    }));

    // 6. Calculate pokedex rankings
    const pokedexSorted = [...rankingsData].sort((a, b) => {
      if (b.pokedex_count !== a.pokedex_count) {
        return b.pokedex_count - a.pokedex_count;
      }
      // Tie-breaker: higher level wins
      return b.level - a.level;
    });

    const pokedexRankings = pokedexSorted.map((item, index) => ({
      user_id: item.user_id,
      pokedex_rank: index + 1,
    }));

    // 7. Calculate shiny rankings
    const shinySorted = [...rankingsData].sort((a, b) => {
      if (b.shiny_count !== a.shiny_count) {
        return b.shiny_count - a.shiny_count;
      }
      // Tie-breaker: higher pokedex_count wins
      if (b.pokedex_count !== a.pokedex_count) {
        return b.pokedex_count - a.pokedex_count;
      }
      return b.level - a.level;
    });

    const shinyRankings = shinySorted.map((item, index) => ({
      user_id: item.user_id,
      shiny_rank: index + 1,
    }));

    // 8. Merge rankings
    const finalRankings = levelRankings.map(levelItem => {
      const pokedexItem = pokedexRankings.find(p => p.user_id === levelItem.user_id);
      const shinyItem = shinyRankings.find(s => s.user_id === levelItem.user_id);
      return {
        user_id: levelItem.user_id,
        nickname: levelItem.nickname,
        avatar: levelItem.avatar,
        level: levelItem.level,
        experience_points: levelItem.experience_points,
        level_rank: levelItem.level_rank,
        pokedex_count: levelItem.pokedex_count,
        pokedex_rank: pokedexItem?.pokedex_rank || null,
        shiny_count: levelItem.shiny_count,
        shiny_rank: shinyItem?.shiny_rank || null,
      };
    });

    console.log(`Built ${finalRankings.length} ranking entries`);

    // 9. Clear existing rankings
    console.log('🗑️ Clearing old rankings...');
    const { error: deleteError } = await supabase
      .from('rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting old rankings:', deleteError);
      throw deleteError;
    }

    // 10. Insert new rankings (keep top 50 for each category)
    const top50Level = finalRankings.filter(r => r.level_rank && r.level_rank <= 50);
    const top50Pokedex = finalRankings.filter(r => r.pokedex_rank && r.pokedex_rank <= 50);
    const top50Shiny = finalRankings.filter(r => r.shiny_rank && r.shiny_rank <= 50 && r.shiny_count > 0);
    
    // Merge and deduplicate
    const usersToInsert = new Map<string, typeof finalRankings[0]>();
    
    top50Level.forEach(r => usersToInsert.set(r.user_id, r));
    top50Pokedex.forEach(r => {
      if (!usersToInsert.has(r.user_id)) {
        usersToInsert.set(r.user_id, r);
      }
    });
    top50Shiny.forEach(r => {
      if (!usersToInsert.has(r.user_id)) {
        usersToInsert.set(r.user_id, r);
      }
    });

    const rankingsToInsert = Array.from(usersToInsert.values());

    console.log(`💾 Inserting ${rankingsToInsert.length} ranking entries...`);
    const { error: insertError } = await supabase
      .from('rankings')
      .insert(rankingsToInsert);

    if (insertError) {
      console.error('Error inserting rankings:', insertError);
      throw insertError;
    }

    console.log('✅ Rankings updated successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rankings updated successfully',
        stats: {
          total_users: profiles?.length || 0,
          rankings_inserted: rankingsToInsert.length,
          top_level: top50Level[0]?.nickname || 'N/A',
          top_pokedex: top50Pokedex[0]?.nickname || 'N/A',
          top_shiny: top50Shiny[0]?.nickname || 'N/A',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error updating rankings:', error);
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
