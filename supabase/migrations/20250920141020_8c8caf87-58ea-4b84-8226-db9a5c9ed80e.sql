-- Função corrigida para update_mission_progress
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
  daily_completed_count integer := 0;
  weekly_completed_count integer := 0;
  daily_total_count integer := 0;
  weekly_total_count integer := 0;
BEGIN
  -- Get all missions for this category
  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, COALESCE(um.completed, false) as completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    -- Initialize user mission if not exists
    INSERT INTO public.user_missions (user_id, mission_id, progress, completed)
    VALUES (p_user_id, mission_record.id, 0, false)
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
      
      -- Check if mission is now completed
      IF mission_record.current_progress >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        -- Add to completed missions
        completed_missions := completed_missions || json_build_object(
          'id', mission_record.id,
          'title', mission_record.title,
          'type', mission_record.type,
          'reward_coins', mission_record.reward_coins,
          'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        );
        
        -- Add to total rewards
        total_rewards := json_build_object(
          'coins', (total_rewards->>'coins')::integer + mission_record.reward_coins,
          'xp', (total_rewards->>'xp')::integer + mission_record.reward_xp,
          'shards', (total_rewards->>'shards')::integer + mission_record.reward_shards
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Count completed missions by type
  SELECT COUNT(*) INTO daily_completed_count
  FROM public.user_missions um
  JOIN public.missions m ON m.id = um.mission_id
  WHERE um.user_id = p_user_id AND um.completed = true AND m.type = 'daily';
  
  SELECT COUNT(*) INTO weekly_completed_count
  FROM public.user_missions um
  JOIN public.missions m ON m.id = um.mission_id
  WHERE um.user_id = p_user_id AND um.completed = true AND m.type = 'weekly';
  
  SELECT COUNT(*) INTO daily_total_count
  FROM public.missions WHERE type = 'daily';
  
  SELECT COUNT(*) INTO weekly_total_count
  FROM public.missions WHERE type = 'weekly';
  
  -- Check for daily completion bonus
  IF daily_completed_count = daily_total_count THEN
    -- Check if bonus already claimed today
    IF NOT EXISTS (
      SELECT 1 FROM public.user_missions um
      JOIN public.missions m ON m.id = um.mission_id
      WHERE um.user_id = p_user_id 
        AND m.type = 'daily' 
        AND um.completed = true
        AND DATE(um.completed_at) = CURRENT_DATE
        AND um.bonus_claimed = true
    ) THEN
      -- Add daily completion bonus
      total_rewards := json_build_object(
        'coins', (total_rewards->>'coins')::integer + 15,
        'xp', (total_rewards->>'xp')::integer + 100,
        'shards', (total_rewards->>'shards')::integer + 15
      );
      
      -- Mark bonus as claimed
      UPDATE public.user_missions 
      SET bonus_claimed = true
      FROM public.missions m
      WHERE user_missions.mission_id = m.id 
        AND user_missions.user_id = p_user_id 
        AND m.type = 'daily';
    END IF;
  END IF;
  
  -- Check for weekly completion bonus
  IF weekly_completed_count = weekly_total_count THEN
    -- Similar logic for weekly bonus
    IF NOT EXISTS (
      SELECT 1 FROM public.user_missions um
      JOIN public.missions m ON m.id = um.mission_id
      WHERE um.user_id = p_user_id 
        AND m.type = 'weekly' 
        AND um.completed = true
        AND DATE(um.completed_at) >= CURRENT_DATE - INTERVAL '7 days'
        AND um.bonus_claimed = true
    ) THEN
      total_rewards := json_build_object(
        'coins', (total_rewards->>'coins')::integer + 75,
        'xp', (total_rewards->>'xp')::integer + 250,
        'shards', (total_rewards->>'shards')::integer + 50
      );
    END IF;
  END IF;
  
  -- Apply rewards to user profile
  IF (total_rewards->>'coins')::integer > 0 OR (total_rewards->>'xp')::integer > 0 OR (total_rewards->>'shards')::integer > 0 THEN
    UPDATE public.profiles 
    SET 
      pokecoins = pokecoins + (total_rewards->>'coins')::integer,
      experience_points = experience_points + (total_rewards->>'xp')::integer,
      pokeshards = pokeshards + (total_rewards->>'shards')::integer,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT completed_missions, total_rewards;
END;
$function$;

-- Criar entradas para as missões de catch_rare do usuário PokeJulio
INSERT INTO public.user_missions (user_id, mission_id, progress, completed)
SELECT 
  p.user_id,
  m.id,
  CASE 
    WHEN m.type = 'daily' THEN 3  -- ele já capturou 3 raros hoje
    WHEN m.type = 'weekly' THEN 3 -- ele já capturou 3 raros esta semana
  END as progress,
  CASE 
    WHEN m.type = 'daily' THEN true  -- completou a diária (meta é 1)
    WHEN m.type = 'weekly' THEN false -- não completou a semanal (meta é 10)
  END as completed
FROM public.profiles p
CROSS JOIN public.missions m
WHERE p.nickname = 'PokeJulio' 
  AND m.category = 'catch_rare'
ON CONFLICT (user_id, mission_id) DO UPDATE SET 
  progress = EXCLUDED.progress,
  completed = EXCLUDED.completed,
  updated_at = now();