-- Drop and recreate the function with fixed ambiguous column references
CREATE OR REPLACE FUNCTION public.update_launch_event_progress(
  p_user_id UUID,
  p_category TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS TABLE(mission_completed BOOLEAN, mission_order INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_mission RECORD;
  v_event_active BOOLEAN;
  v_user_progress INTEGER;
  v_mission_completed BOOLEAN := FALSE;
  v_previous_claimed BOOLEAN;
BEGIN
  -- Check if event is active
  SELECT is_active INTO v_event_active
  FROM launch_event_config
  WHERE end_date > now() AND is_active = true
  LIMIT 1;
  
  IF v_event_active IS NULL OR v_event_active = FALSE THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Find the first uncompleted/unclaimed mission for this category
  FOR v_current_mission IN 
    SELECT m.*, 
           COALESCE(up.progress, 0) as current_progress, 
           COALESCE(up.completed, false) as is_completed, 
           COALESCE(up.rewards_claimed, false) as is_claimed
    FROM launch_event_missions m
    LEFT JOIN user_launch_event_progress up ON (m.mission_order = up.mission_order AND up.user_id = p_user_id)
    WHERE m.category = p_category
    ORDER BY m.mission_order
  LOOP
    -- Skip if already claimed
    IF v_current_mission.is_claimed THEN
      CONTINUE;
    END IF;
    
    -- Check if previous mission was claimed (except for mission 1)
    IF v_current_mission.mission_order = 1 THEN
      v_previous_claimed := TRUE;
    ELSE
      SELECT COALESCE(rewards_claimed, false) INTO v_previous_claimed
      FROM user_launch_event_progress
      WHERE user_id = p_user_id AND user_launch_event_progress.mission_order = v_current_mission.mission_order - 1;
      
      IF v_previous_claimed IS NULL THEN
        v_previous_claimed := FALSE;
      END IF;
    END IF;
    
    -- Only proceed if previous mission is claimed
    IF NOT v_previous_claimed THEN
      CONTINUE;
    END IF;
    
    -- Initialize or update progress using table alias to avoid ambiguity
    INSERT INTO user_launch_event_progress AS ulep (user_id, mission_order, progress)
    VALUES (p_user_id, v_current_mission.mission_order, p_increment)
    ON CONFLICT (user_id, mission_order)
    DO UPDATE SET 
      progress = ulep.progress + p_increment,
      updated_at = now();
    
    -- Get updated progress
    SELECT ulep2.progress INTO v_user_progress
    FROM user_launch_event_progress ulep2
    WHERE ulep2.user_id = p_user_id AND ulep2.mission_order = v_current_mission.mission_order;
    
    -- Check if completed
    IF v_user_progress >= v_current_mission.goal THEN
      UPDATE user_launch_event_progress ulep3
      SET completed = true, completed_at = now()
      WHERE ulep3.user_id = p_user_id AND ulep3.mission_order = v_current_mission.mission_order
        AND ulep3.completed = false;
      
      v_mission_completed := TRUE;
    END IF;
    
    RETURN QUERY SELECT v_mission_completed, v_current_mission.mission_order::INTEGER;
    RETURN;
  END LOOP;
  
  -- No eligible mission found
  RETURN QUERY SELECT FALSE, 0;
END;
$$;