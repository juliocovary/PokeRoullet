-- Add auth validation to update_mission_progress
CREATE OR REPLACE FUNCTION public.update_mission_progress(p_user_id uuid, p_category text, p_increment integer DEFAULT 1)
 RETURNS TABLE(missions_completed json, rewards_earned json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mission_record RECORD;
  completed_missions json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0}'::json;
  temp_array json[];
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  RAISE LOG 'update_mission_progress called for user % category % increment %', p_user_id, p_category, p_increment;

  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, COALESCE(um.completed, false) as completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
    VALUES (p_user_id, mission_record.id, 0, false, false)
    ON CONFLICT (user_id, mission_id) DO NOTHING;
    
    IF NOT mission_record.completed THEN
      UPDATE public.user_missions 
      SET progress = LEAST(progress + p_increment, mission_record.goal),
          updated_at = now()
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      SELECT progress INTO mission_record.current_progress
      FROM public.user_missions
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      RAISE LOG 'Mission % progress updated to %', mission_record.title, mission_record.current_progress;
      
      IF mission_record.current_progress >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        RAISE LOG 'Mission % completed!', mission_record.title;
        
        temp_array := ARRAY[json_build_object(
          'id', mission_record.id,
          'title', mission_record.title,
          'type', mission_record.type,
          'reward_coins', mission_record.reward_coins,
          'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        )];
        
        completed_missions := array_to_json(ARRAY(SELECT json_array_elements(completed_missions)) || temp_array);
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_missions, total_rewards;
END;
$function$;

-- Add auth validation to update_achievement_progress
CREATE OR REPLACE FUNCTION public.update_achievement_progress(p_user_id uuid, p_goal_type text, p_increment integer DEFAULT 1)
 RETURNS TABLE(achievements_completed json, rewards_earned json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  achievement_record RECORD;
  completed_achievements json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0, "spins": 0}'::json;
  current_level integer;
  temp_array json[];
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  RAISE LOG 'update_achievement_progress called for user % goal_type % increment %', p_user_id, p_goal_type, p_increment;

  IF p_goal_type = 'level' THEN
    SELECT level INTO current_level FROM public.profiles WHERE user_id = p_user_id;
    RAISE LOG 'User current level: %', current_level;
  END IF;

  FOR achievement_record IN 
    SELECT a.*, 
           COALESCE(ua.progress, 0) as current_progress,
           COALESCE(ua.next_goal_value, a.goal_value) as target_goal,
           COALESCE(ua.completed_count, 0) as times_completed,
           ua.is_completed,
           ua.rewards_claimed
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua ON (a.id = ua.achievement_id AND ua.user_id = p_user_id)
    WHERE a.goal_type = p_goal_type
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, next_goal_value, rewards_claimed)
    VALUES (p_user_id, achievement_record.id, achievement_record.goal_value, false)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF achievement_record.category = 'unique' AND achievement_record.is_completed AND achievement_record.rewards_claimed THEN
      CONTINUE;
    END IF;
    
    IF achievement_record.category = 'progressive' AND achievement_record.current_progress >= achievement_record.target_goal AND NOT achievement_record.rewards_claimed THEN
      RAISE LOG 'Skipping progressive achievement % - waiting for reward claim', achievement_record.title;
      CONTINUE;
    END IF;
    
    IF p_goal_type = 'level' THEN
      UPDATE public.user_achievements 
      SET progress = current_level, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      achievement_record.current_progress := current_level;
    ELSE
      UPDATE public.user_achievements 
      SET progress = progress + p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      
      SELECT progress INTO achievement_record.current_progress
      FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    RAISE LOG 'Achievement % progress: % / %', achievement_record.title, achievement_record.current_progress, achievement_record.target_goal;
    
    IF achievement_record.current_progress >= achievement_record.target_goal THEN
      DECLARE
        reward_coins integer := achievement_record.base_reward_coins;
        reward_xp integer := achievement_record.base_reward_xp;
        reward_shards numeric := achievement_record.base_reward_shards;
        reward_spins integer := achievement_record.base_reward_spins;
      BEGIN
        IF achievement_record.category = 'progressive' THEN
          reward_shards := achievement_record.base_reward_shards + (achievement_record.times_completed * achievement_record.reward_increment);
        END IF;
        
        IF achievement_record.category = 'unique' AND NOT achievement_record.is_completed THEN
          UPDATE public.user_achievements 
          SET is_completed = true, completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Unique achievement % completed!', achievement_record.title;
          
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        ELSIF achievement_record.category = 'progressive' THEN
          UPDATE public.user_achievements 
          SET completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Progressive achievement % completed and ready for claiming!', achievement_record.title;
          
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$function$;

-- Add auth validation to update_launch_event_progress
CREATE OR REPLACE FUNCTION public.update_launch_event_progress(p_user_id uuid, p_category text, p_increment integer DEFAULT 1)
 RETURNS TABLE(mission_completed boolean, mission_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mission RECORD;
  v_progress RECORD;
  v_event_active BOOLEAN;
  v_previous_completed BOOLEAN;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  SELECT is_active INTO v_event_active
  FROM launch_event_config
  WHERE end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  FOR v_mission IN 
    SELECT * FROM launch_event_missions 
    WHERE category = p_category
    ORDER BY mission_order
  LOOP
    IF v_mission.mission_order > 1 THEN
      SELECT rewards_claimed INTO v_previous_completed
      FROM user_launch_event_progress
      WHERE user_id = p_user_id AND mission_order = v_mission.mission_order - 1;
      
      IF NOT v_previous_completed OR v_previous_completed IS NULL THEN
        CONTINUE;
      END IF;
    END IF;
    
    SELECT * INTO v_progress
    FROM user_launch_event_progress
    WHERE user_id = p_user_id AND mission_order = v_mission.mission_order;
    
    IF v_progress IS NULL THEN
      INSERT INTO user_launch_event_progress (user_id, mission_order, progress, completed)
      VALUES (p_user_id, v_mission.mission_order, p_increment, p_increment >= v_mission.goal);
      
      IF p_increment >= v_mission.goal THEN
        UPDATE user_launch_event_progress
        SET completed_at = now()
        WHERE user_id = p_user_id AND mission_order = v_mission.mission_order;
        
        RETURN QUERY SELECT TRUE, v_mission.mission_order;
        RETURN;
      END IF;
    ELSIF NOT v_progress.completed THEN
      UPDATE user_launch_event_progress
      SET progress = progress + p_increment,
          completed = (progress + p_increment) >= v_mission.goal,
          completed_at = CASE WHEN (progress + p_increment) >= v_mission.goal THEN now() ELSE NULL END,
          updated_at = now()
      WHERE user_id = p_user_id AND mission_order = v_mission.mission_order;
      
      IF (v_progress.progress + p_increment) >= v_mission.goal THEN
        RETURN QUERY SELECT TRUE, v_mission.mission_order;
        RETURN;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT FALSE, 0;
END;
$function$;