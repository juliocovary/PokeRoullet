-- Fix claim_mission_rewards to properly calculate level on XP gain
CREATE OR REPLACE FUNCTION public.claim_mission_rewards(p_user_id uuid, p_mission_id uuid)
RETURNS TABLE(success boolean, message text, rewards json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mission_record RECORD;
  xp_result RECORD;
BEGIN
  -- Buscar missão completada e não coletada
  SELECT m.*, um.completed, um.rewards_claimed 
  INTO mission_record
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.id = p_mission_id 
    AND um.user_id = p_user_id 
    AND um.completed = true 
    AND um.rewards_claimed = false;
  
  IF mission_record IS NULL THEN
    RETURN QUERY SELECT false, 'Missão não encontrada ou já coletada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Marcar como coletada
  UPDATE public.user_missions 
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND mission_id = p_mission_id;
  
  -- Aplicar moedas e shards
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + mission_record.reward_coins,
    pokeshards = pokeshards + mission_record.reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Aplicar XP usando a função add_experience para recalcular nível
  IF mission_record.reward_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, mission_record.reward_xp);
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    'Recompensas coletadas com sucesso!'::TEXT,
    json_build_object(
      'coins', mission_record.reward_coins,
      'xp', mission_record.reward_xp,
      'shards', mission_record.reward_shards
    );
END;
$function$;

-- Fix claim_achievement_rewards to properly calculate level on XP gain
CREATE OR REPLACE FUNCTION public.claim_achievement_rewards(p_user_id uuid, p_achievement_id uuid)
RETURNS TABLE(success boolean, message text, rewards json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  achievement_record RECORD;
  reward_coins integer := 0;
  reward_xp integer := 0;
  reward_shards integer := 0;
  reward_spins integer := 0;
  xp_result RECORD;
BEGIN
  RAISE LOG 'claim_achievement_rewards called for user % achievement %', p_user_id, p_achievement_id;
  
  -- Get achievement data
  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count, ua.progress, ua.next_goal_value, ua.completed_at
  INTO achievement_record
  FROM public.achievements a
  JOIN public.user_achievements ua ON a.id = ua.achievement_id
  WHERE a.id = p_achievement_id 
    AND ua.user_id = p_user_id;
  
  IF achievement_record IS NULL THEN
    RAISE LOG 'Achievement record not found for user % achievement %', p_user_id, p_achievement_id;
    RETURN QUERY SELECT false, 'Conquista não encontrada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  RAISE LOG 'Achievement found: % category % completed % rewards_claimed % progress % goal %', 
    achievement_record.title, achievement_record.category, achievement_record.is_completed, 
    achievement_record.rewards_claimed, achievement_record.progress, achievement_record.next_goal_value;
  
  -- Check if achievement is actually completed and rewards not yet claimed
  IF achievement_record.category = 'progressive' THEN
    IF achievement_record.progress < achievement_record.next_goal_value THEN
      RAISE LOG 'Progressive achievement not completed yet: progress % < target %', 
        achievement_record.progress, achievement_record.next_goal_value;
      RETURN QUERY SELECT false, 'Conquista ainda não completada'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.completed_at IS NULL THEN
      RAISE LOG 'Progressive achievement not marked as completed yet';
      RETURN QUERY SELECT false, 'Conquista ainda não está pronta para coleta'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.rewards_claimed AND achievement_record.completed_at IS NOT NULL THEN
      RAISE LOG 'Progressive achievement rewards already claimed for current level';
      RETURN QUERY SELECT false, 'Recompensas já coletadas para este nível'::TEXT, '{}'::json;
      RETURN;
    END IF;
  ELSE
    IF NOT achievement_record.is_completed OR achievement_record.rewards_claimed THEN
      RAISE LOG 'Unique achievement not completed or already claimed: completed % claimed %', 
        achievement_record.is_completed, achievement_record.rewards_claimed;
      RETURN QUERY SELECT false, 'Conquista não encontrada ou já coletada'::TEXT, '{}'::json;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate rewards
  reward_coins := achievement_record.base_reward_coins;
  reward_xp := achievement_record.base_reward_xp;
  reward_shards := achievement_record.base_reward_shards;
  reward_spins := achievement_record.base_reward_spins;
  
  IF achievement_record.category = 'progressive' THEN
    reward_shards := reward_shards + (achievement_record.completed_count * achievement_record.reward_increment);
  END IF;
  
  -- Mark as rewards claimed and advance progressive achievements
  IF achievement_record.category = 'progressive' THEN
    UPDATE public.user_achievements 
    SET completed_count = completed_count + 1,
        next_goal_value = next_goal_value + achievement_record.increment_step,
        completed_at = NULL,
        rewards_claimed = false,
        updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
    
    RAISE LOG 'Progressive achievement advanced to next level. New goal: %', achievement_record.next_goal_value + achievement_record.increment_step;
  ELSE
    UPDATE public.user_achievements 
    SET rewards_claimed = true, updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  END IF;
  
  RAISE LOG 'Marked rewards as claimed for achievement %', achievement_record.title;
  
  -- Apply coins and shards
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + reward_coins,
    pokeshards = pokeshards + reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Apply XP using add_experience to recalculate level
  IF reward_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, reward_xp);
  END IF;
  
  RAISE LOG 'Applied rewards: coins % xp % shards %', reward_coins, reward_xp, reward_shards;
  
  -- Apply free spins if any
  IF reward_spins > 0 THEN
    UPDATE public.user_spins 
    SET free_spins = free_spins + reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
    
    RAISE LOG 'Added % free spins', reward_spins;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    'Recompensas coletadas com sucesso!'::TEXT,
    json_build_object(
      'coins', reward_coins,
      'xp', reward_xp,
      'shards', reward_shards,
      'spins', reward_spins
    );
END;
$function$;

-- Fix claim_daily_completion_bonus to properly calculate level on XP gain
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
  xp_result RECORD;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_missions
    WHERE user_id = p_user_id 
    AND daily_bonus_claimed_at::date = CURRENT_DATE
  ) INTO already_claimed;
  
  IF already_claimed THEN
    RETURN QUERY SELECT false, 'Bônus diário já foi coletado hoje'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
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
  
  IF completed_daily_missions_count < daily_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões diárias foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Apply coins and shards
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 15,
    pokeshards = pokeshards + 15,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Apply XP using add_experience
  SELECT * INTO xp_result FROM add_experience(p_user_id, 100);
  
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

-- Fix claim_weekly_completion_bonus to properly calculate level on XP gain
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
  xp_result RECORD;
BEGIN
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
  
  IF completed_weekly_missions_count < weekly_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões semanais foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Apply coins and shards
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 75,
    pokeshards = pokeshards + 50,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Apply XP using add_experience
  SELECT * INTO xp_result FROM add_experience(p_user_id, 250);
  
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

-- Fix claim_pokedex_reward to properly calculate level on XP gain
CREATE OR REPLACE FUNCTION public.claim_pokedex_reward(p_user_id uuid, p_section text, p_milestone integer, p_coins integer, p_xp integer, p_shards integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_already_claimed BOOLEAN;
  xp_result RECORD;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pokedex_rewards_claimed
    WHERE user_id = p_user_id
    AND section = p_section
    AND milestone = p_milestone
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Recompensa já coletada!'
    );
  END IF;

  INSERT INTO pokedex_rewards_claimed (user_id, section, milestone)
  VALUES (p_user_id, p_section, p_milestone);

  -- Apply coins and shards
  UPDATE profiles
  SET 
    pokecoins = pokecoins + p_coins,
    pokeshards = pokeshards + p_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Apply XP using add_experience
  IF p_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, p_xp);
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Recompensa coletada com sucesso!'
  );
END;
$function$;