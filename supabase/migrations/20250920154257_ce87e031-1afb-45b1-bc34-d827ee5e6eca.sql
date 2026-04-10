-- Fix JSON concatenation operator issue in mission function
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
  -- Log para debug
  RAISE LOG 'update_mission_progress called for user % category % increment %', p_user_id, p_category, p_increment;

  -- Get all missions for this category
  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, COALESCE(um.completed, false) as completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    -- Initialize user mission if not exists
    INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
    VALUES (p_user_id, mission_record.id, 0, false, false)
    ON CONFLICT (user_id, mission_id) DO NOTHING;
    
    -- Update progress if not completed
    IF NOT mission_record.completed THEN
      UPDATE public.user_missions 
      SET progress = LEAST(progress + p_increment, mission_record.goal),
          updated_at = now()
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      -- Get updated progress
      SELECT progress INTO mission_record.current_progress
      FROM public.user_missions
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      -- Log progresso
      RAISE LOG 'Mission % progress updated to %', mission_record.title, mission_record.current_progress;
      
      -- Check if mission is now completed
      IF mission_record.current_progress >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        RAISE LOG 'Mission % completed!', mission_record.title;
        
        -- Add to completed missions array using array concatenation
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

-- Ensure all users have entries for all missions
INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
SELECT 
  p.user_id,
  m.id,
  0,
  false,
  false
FROM public.profiles p
CROSS JOIN public.missions m
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_missions um 
  WHERE um.user_id = p.user_id AND um.mission_id = m.id
)
ON CONFLICT (user_id, mission_id) DO NOTHING;