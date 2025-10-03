import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reset missions function called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { type } = await req.json();
    console.log(`Resetting ${type} missions`);

    let result;
    if (type === 'daily') {
      result = await supabase.rpc('reset_daily_missions');
    } else if (type === 'weekly') {
      result = await supabase.rpc('reset_weekly_missions');
    } else {
      throw new Error('Invalid reset type. Must be "daily" or "weekly"');
    }

    if (result.error) {
      console.error(`Error resetting ${type} missions:`, result.error);
      throw result.error;
    }

    console.log(`${type} missions reset successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} missions reset successfully`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reset-missions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});