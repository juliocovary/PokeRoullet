-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the reset_missions function to be more comprehensive
CREATE OR REPLACE FUNCTION public.reset_missions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset daily missions for all users
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    rewards_claimed = false,
    daily_bonus_claimed_at = null,
    updated_at = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'daily';
  
  -- Reset weekly missions for all users  
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    rewards_claimed = false,
    weekly_bonus_claimed_at = null,
    updated_at = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'weekly';
    
  RAISE LOG 'Missions reset completed at %', now();
END;
$function$;

-- Create separate functions for daily and weekly resets
CREATE OR REPLACE FUNCTION public.reset_daily_missions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset daily missions for all users
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    rewards_claimed = false,
    daily_bonus_claimed_at = null,
    updated_at = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'daily';
    
  RAISE LOG 'Daily missions reset completed at %', now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_weekly_missions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset weekly missions for all users  
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    rewards_claimed = false,
    weekly_bonus_claimed_at = null,
    updated_at = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'weekly';
    
  RAISE LOG 'Weekly missions reset completed at %', now();
END;
$function$;