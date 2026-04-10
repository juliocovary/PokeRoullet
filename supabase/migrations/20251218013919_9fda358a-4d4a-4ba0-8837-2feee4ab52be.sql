-- Fix update_launch_event_progress: add table aliases to avoid ambiguous column references
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

  SELECT lec.is_active INTO v_event_active
  FROM launch_event_config lec
  WHERE lec.end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  FOR v_mission IN 
    SELECT lem.* FROM launch_event_missions lem
    WHERE lem.category = p_category
    ORDER BY lem.mission_order
  LOOP
    IF v_mission.mission_order > 1 THEN
      SELECT ulep.rewards_claimed INTO v_previous_completed
      FROM user_launch_event_progress ulep
      WHERE ulep.user_id = p_user_id AND ulep.mission_order = v_mission.mission_order - 1;
      
      IF NOT v_previous_completed OR v_previous_completed IS NULL THEN
        CONTINUE;
      END IF;
    END IF;
    
    SELECT ulep.* INTO v_progress
    FROM user_launch_event_progress ulep
    WHERE ulep.user_id = p_user_id AND ulep.mission_order = v_mission.mission_order;
    
    IF v_progress IS NULL THEN
      INSERT INTO user_launch_event_progress (user_id, mission_order, progress, completed)
      VALUES (p_user_id, v_mission.mission_order, p_increment, p_increment >= v_mission.goal);
      
      IF p_increment >= v_mission.goal THEN
        UPDATE user_launch_event_progress ulep
        SET completed_at = now()
        WHERE ulep.user_id = p_user_id AND ulep.mission_order = v_mission.mission_order;
        
        RETURN QUERY SELECT TRUE, v_mission.mission_order;
        RETURN;
      END IF;
    ELSIF NOT v_progress.completed THEN
      UPDATE user_launch_event_progress ulep
      SET progress = ulep.progress + p_increment,
          completed = (ulep.progress + p_increment) >= v_mission.goal,
          completed_at = CASE WHEN (ulep.progress + p_increment) >= v_mission.goal THEN now() ELSE NULL END,
          updated_at = now()
      WHERE ulep.user_id = p_user_id AND ulep.mission_order = v_mission.mission_order;
      
      IF (v_progress.progress + p_increment) >= v_mission.goal THEN
        RETURN QUERY SELECT TRUE, v_mission.mission_order;
        RETURN;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT FALSE, 0;
END;
$function$;

-- Fix check_friends_mission: add table aliases to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.check_friends_mission(p_user_id uuid)
 RETURNS TABLE(mission_completed boolean, friends_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_friends_count INTEGER;
  v_mission_goal INTEGER;
  v_event_active BOOLEAN;
BEGIN
  -- Verificar se o evento está ativo
  SELECT lec.is_active INTO v_event_active
  FROM launch_event_config lec
  WHERE lec.end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Verificar se missão 6 foi resgatada
  IF NOT EXISTS (
    SELECT 1 FROM user_launch_event_progress ulep
    WHERE ulep.user_id = p_user_id AND ulep.mission_order = 6 AND ulep.rewards_claimed = true
  ) THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Contar amigos aceitos
  SELECT COUNT(*) INTO v_friends_count
  FROM friendships f
  WHERE f.status = 'accepted'
    AND (f.requester_id = p_user_id OR f.addressee_id = p_user_id);
  
  -- Buscar goal da missão 7
  SELECT lem.goal INTO v_mission_goal
  FROM launch_event_missions lem
  WHERE lem.mission_order = 7;
  
  -- Atualizar progresso
  INSERT INTO user_launch_event_progress (user_id, mission_order, progress, completed, completed_at)
  VALUES (p_user_id, 7, v_friends_count, v_friends_count >= v_mission_goal, CASE WHEN v_friends_count >= v_mission_goal THEN now() ELSE NULL END)
  ON CONFLICT (user_id, mission_order)
  DO UPDATE SET 
    progress = v_friends_count,
    completed = v_friends_count >= v_mission_goal,
    completed_at = CASE WHEN v_friends_count >= v_mission_goal AND user_launch_event_progress.completed_at IS NULL THEN now() ELSE user_launch_event_progress.completed_at END,
    updated_at = now();
  
  RETURN QUERY SELECT v_friends_count >= v_mission_goal, v_friends_count;
END;
$function$;

-- Fix check_and_reset_free_spins: sync with frontend odd-hour reset logic
CREATE OR REPLACE FUNCTION public.check_and_reset_free_spins(p_user_id uuid)
 RETURNS TABLE(free_spins integer, last_spin_reset timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_hour INTEGER;
  v_last_odd_hour INTEGER;
  v_last_odd_hour_timestamp TIMESTAMPTZ;
BEGIN
  -- Calculate current hour
  v_current_hour := EXTRACT(HOUR FROM now());
  
  -- Calculate the most recent odd hour (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)
  IF v_current_hour % 2 = 0 THEN
    -- Even hour: last odd hour was 1 hour ago
    v_last_odd_hour := v_current_hour - 1;
  ELSE
    -- Odd hour: we're currently in an odd hour
    v_last_odd_hour := v_current_hour;
  END IF;
  
  -- Handle edge case: if we're at hour 0, last odd hour was 23 yesterday
  IF v_last_odd_hour < 0 THEN
    v_last_odd_hour := 23;
    v_last_odd_hour_timestamp := DATE_TRUNC('day', now()) - INTERVAL '1 day' + (v_last_odd_hour || ' hours')::INTERVAL;
  ELSE
    v_last_odd_hour_timestamp := DATE_TRUNC('day', now()) + (v_last_odd_hour || ' hours')::INTERVAL;
  END IF;
  
  -- Reset spins if:
  -- 1. User has 0 spins
  -- 2. Last reset was before the most recent odd hour
  UPDATE public.user_spins us
  SET 
    free_spins = us.base_free_spins,
    last_spin_reset = now(),
    updated_at = now()
  WHERE 
    us.user_id = p_user_id 
    AND us.free_spins = 0 
    AND us.last_spin_reset < v_last_odd_hour_timestamp;
  
  -- Return updated user data
  RETURN QUERY
  SELECT us.free_spins, us.last_spin_reset
  FROM public.user_spins us
  WHERE us.user_id = p_user_id;
END;
$function$;