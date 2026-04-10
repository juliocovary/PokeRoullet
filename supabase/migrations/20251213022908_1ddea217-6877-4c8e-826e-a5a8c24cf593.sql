CREATE OR REPLACE FUNCTION public.update_launch_event_progress(p_user_id uuid, p_category text, p_increment integer DEFAULT 1)
 RETURNS TABLE(mission_completed boolean, mission_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_mission RECORD;
  v_new_progress INTEGER;
  v_mission_completed BOOLEAN := FALSE;
  v_event_active BOOLEAN;
BEGIN
  -- Check if event is active
  SELECT is_active INTO v_event_active
  FROM launch_event_config
  WHERE end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Find the current mission for this category that is not yet completed
  SELECT lem.* INTO v_current_mission
  FROM launch_event_missions lem
  LEFT JOIN user_launch_event_progress ulep ON ulep.mission_order = lem.mission_order AND ulep.user_id = p_user_id
  WHERE lem.category = p_category
    AND (ulep.completed IS NULL OR ulep.completed = FALSE)
    AND (
      lem.mission_order = 1 
      OR EXISTS (
        SELECT 1 FROM user_launch_event_progress prev 
        WHERE prev.user_id = p_user_id 
        AND prev.mission_order = lem.mission_order - 1 
        AND prev.rewards_claimed = TRUE
      )
    )
  ORDER BY lem.mission_order
  LIMIT 1;
  
  -- If no mission found for this category, return
  IF v_current_mission IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Insert or update progress using named constraint
  INSERT INTO user_launch_event_progress AS ulep (user_id, mission_order, progress)
  VALUES (p_user_id, v_current_mission.mission_order, p_increment)
  ON CONFLICT ON CONSTRAINT user_launch_event_progress_user_id_mission_order_key
  DO UPDATE SET progress = ulep.progress + p_increment, updated_at = now();
  
  -- Get updated progress
  SELECT ulep2.progress INTO v_new_progress
  FROM user_launch_event_progress ulep2
  WHERE ulep2.user_id = p_user_id AND ulep2.mission_order = v_current_mission.mission_order;
  
  -- Check if mission is completed
  IF v_new_progress >= v_current_mission.goal THEN
    UPDATE user_launch_event_progress ulep3
    SET completed = TRUE, completed_at = now(), updated_at = now()
    WHERE ulep3.user_id = p_user_id AND ulep3.mission_order = v_current_mission.mission_order;
    
    v_mission_completed := TRUE;
  END IF;
  
  RETURN QUERY SELECT v_mission_completed, v_current_mission.mission_order;
END;
$function$;