-- Add columns to track daily and weekly bonus collection
ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS daily_bonus_claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS weekly_bonus_claimed_at timestamp with time zone;

-- Update the claim_daily_completion_bonus function to check if already claimed today
CREATE OR REPLACE FUNCTION public.claim_daily_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  daily_missions_count INTEGER;
  completed_daily_missions_count INTEGER;
  already_claimed BOOLEAN := false;
BEGIN
  -- Check if bonus was already claimed today
  SELECT EXISTS(
    SELECT 1 FROM public.user_missions
    WHERE user_id = p_user_id 
    AND daily_bonus_claimed_at::date = CURRENT_DATE
  ) INTO already_claimed;
  
  IF already_claimed THEN
    RETURN QUERY SELECT false, 'Bônus diário já foi coletado hoje'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Check how many daily missions exist and how many are completed
  SELECT COUNT(*) INTO daily_missions_count
  FROM public.missions
  WHERE type = 'daily';
  
  SELECT COUNT(*) INTO completed_daily_missions_count
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.type = 'daily' 
    AND um.user_id = p_user_id 
    AND um.completed = true
    AND um.rewards_claimed = true;
  
  -- Check if all daily missions are completed and claimed
  IF completed_daily_missions_count < daily_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões diárias foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Apply daily completion bonus
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 15,
    experience_points = experience_points + 100,
    pokeshards = pokeshards + 15,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Mark daily bonus as claimed for today (using any mission record for this user)
  UPDATE public.user_missions 
  SET daily_bonus_claimed_at = now()
  WHERE user_id = p_user_id 
  AND mission_id = (
    SELECT mission_id FROM public.user_missions 
    WHERE user_id = p_user_id 
    LIMIT 1
  );
  
  RETURN QUERY SELECT 
    true, 
    'Bônus de conclusão diária coletado!'::TEXT,
    json_build_object(
      'coins', 15,
      'xp', 100,
      'shards', 15
    );
END;
$function$;

-- Update the claim_weekly_completion_bonus function to check if already claimed this week  
CREATE OR REPLACE FUNCTION public.claim_weekly_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  weekly_missions_count INTEGER;
  completed_weekly_missions_count INTEGER;
  already_claimed BOOLEAN := false;
BEGIN
  -- Check if bonus was already claimed this week (Monday to Sunday)
  SELECT EXISTS(
    SELECT 1 FROM public.user_missions
    WHERE user_id = p_user_id 
    AND weekly_bonus_claimed_at >= date_trunc('week', CURRENT_DATE)
    AND weekly_bonus_claimed_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
  ) INTO already_claimed;
  
  IF already_claimed THEN
    RETURN QUERY SELECT false, 'Bônus semanal já foi coletado esta semana'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Check how many weekly missions exist and how many are completed
  SELECT COUNT(*) INTO weekly_missions_count
  FROM public.missions
  WHERE type = 'weekly';
  
  SELECT COUNT(*) INTO completed_weekly_missions_count
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.type = 'weekly' 
    AND um.user_id = p_user_id 
    AND um.completed = true
    AND um.rewards_claimed = true;
  
  -- Check if all weekly missions are completed and claimed
  IF completed_weekly_missions_count < weekly_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões semanais foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Apply weekly completion bonus
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 75,
    experience_points = experience_points + 250,
    pokeshards = pokeshards + 50,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Mark weekly bonus as claimed for this week (using any mission record for this user)
  UPDATE public.user_missions 
  SET weekly_bonus_claimed_at = now()
  WHERE user_id = p_user_id 
  AND mission_id = (
    SELECT mission_id FROM public.user_missions 
    WHERE user_id = p_user_id 
    LIMIT 1
  );
  
  RETURN QUERY SELECT 
    true, 
    'Bônus de conclusão semanal coletado!'::TEXT,
    json_build_object(
      'coins', 75,
      'xp', 250,
      'shards', 50
    );
END;
$function$;