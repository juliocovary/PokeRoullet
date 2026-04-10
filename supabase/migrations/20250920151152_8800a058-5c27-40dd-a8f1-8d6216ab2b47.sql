-- 1. Adicionar campo rewards_claimed nas tabelas user_missions e user_achievements
ALTER TABLE public.user_missions ADD COLUMN IF NOT EXISTS rewards_claimed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS rewards_claimed BOOLEAN NOT NULL DEFAULT false;

-- 2. Criar entradas user_missions faltantes para todas as missões existentes
INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
SELECT DISTINCT 
  p.user_id,
  m.id,
  0 as progress,
  false as completed,
  false as rewards_claimed
FROM public.profiles p
CROSS JOIN public.missions m
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_missions um 
  WHERE um.user_id = p.user_id AND um.mission_id = m.id
);

-- 3. Atualizar função update_mission_progress para NÃO aplicar recompensas automaticamente
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
        
        -- Add to completed missions (NÃO aplicar recompensas aqui)
        completed_missions := completed_missions || json_build_object(
          'id', mission_record.id,
          'title', mission_record.title,
          'type', mission_record.type,
          'reward_coins', mission_record.reward_coins,
          'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_missions, total_rewards;
END;
$function$;

-- 4. Atualizar função update_achievement_progress para NÃO aplicar recompensas automaticamente
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
BEGIN
  -- Log para debug
  RAISE LOG 'update_achievement_progress called for user % goal_type % increment %', p_user_id, p_goal_type, p_increment;

  -- Para conquistas de nível, usar o nível atual em vez de incrementar
  IF p_goal_type = 'level' THEN
    SELECT level INTO current_level FROM public.profiles WHERE user_id = p_user_id;
    RAISE LOG 'User current level: %', current_level;
  END IF;

  -- Process all achievements for this goal type
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
    -- Initialize user achievement if not exists
    INSERT INTO public.user_achievements (user_id, achievement_id, next_goal_value, rewards_claimed)
    VALUES (p_user_id, achievement_record.id, achievement_record.goal_value, false)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Skip if unique achievement already completed
    IF achievement_record.category = 'unique' AND achievement_record.is_completed THEN
      CONTINUE;
    END IF;
    
    -- Update progress
    IF p_goal_type = 'level' THEN
      -- Para conquistas de nível, definir progresso como o nível atual
      UPDATE public.user_achievements 
      SET progress = current_level, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      achievement_record.current_progress := current_level;
    ELSE
      -- Para outras conquistas, incrementar progresso
      UPDATE public.user_achievements 
      SET progress = progress + p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      
      -- Get updated progress
      SELECT progress INTO achievement_record.current_progress
      FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    RAISE LOG 'Achievement % progress: % / %', achievement_record.title, achievement_record.current_progress, achievement_record.target_goal;
    
    -- Check if achievement is completed
    IF achievement_record.current_progress >= achievement_record.target_goal THEN
      -- Calculate rewards (progressive achievements get increased rewards)
      DECLARE
        reward_coins integer := achievement_record.base_reward_coins;
        reward_xp integer := achievement_record.base_reward_xp;
        reward_shards numeric := achievement_record.base_reward_shards;
        reward_spins integer := achievement_record.base_reward_spins;
      BEGIN
        -- For progressive achievements, calculate increased rewards
        IF achievement_record.category = 'progressive' THEN
          reward_shards := achievement_record.base_reward_shards + (achievement_record.times_completed * achievement_record.reward_increment);
        END IF;
        
        -- Mark as completed but DON'T apply rewards automatically
        IF achievement_record.category = 'unique' THEN
          UPDATE public.user_achievements 
          SET is_completed = true, completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
        ELSE
          -- Progressive: increment completed_count and set new goal
          UPDATE public.user_achievements 
          SET completed_count = completed_count + 1,
              next_goal_value = next_goal_value + achievement_record.increment_step,
              progress = 0,
              completed_at = now(),
              updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
        END IF;
        
        RAISE LOG 'Achievement % completed!', achievement_record.title;
        
        -- Add to completed achievements (NÃO aplicar recompensas aqui)
        completed_achievements := completed_achievements || json_build_object(
          'id', achievement_record.id,
          'title', achievement_record.title,
          'description', achievement_record.description,
          'category', achievement_record.category,
          'reward_coins', reward_coins,
          'reward_xp', reward_xp,
          'reward_shards', reward_shards,
          'reward_spins', reward_spins
        );
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$function$;

-- 5. Criar função para coletar recompensas de missões
CREATE OR REPLACE FUNCTION public.claim_mission_rewards(p_user_id uuid, p_mission_id uuid)
RETURNS TABLE(success boolean, message text, rewards json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mission_record RECORD;
  reward_coins integer := 0;
  reward_xp integer := 0;
  reward_shards integer := 0;
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
  
  -- Aplicar recompensas
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + mission_record.reward_coins,
    experience_points = experience_points + mission_record.reward_xp,
    pokeshards = pokeshards + mission_record.reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
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

-- 6. Criar função para coletar recompensas de conquistas
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
BEGIN
  -- Buscar conquista completada e não coletada
  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count
  INTO achievement_record
  FROM public.achievements a
  JOIN public.user_achievements ua ON a.id = ua.achievement_id
  WHERE a.id = p_achievement_id 
    AND ua.user_id = p_user_id 
    AND ua.is_completed = true 
    AND ua.rewards_claimed = false;
  
  IF achievement_record IS NULL THEN
    RETURN QUERY SELECT false, 'Conquista não encontrada ou já coletada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Calcular recompensas
  reward_coins := achievement_record.base_reward_coins;
  reward_xp := achievement_record.base_reward_xp;
  reward_shards := achievement_record.base_reward_shards;
  reward_spins := achievement_record.base_reward_spins;
  
  -- Para conquistas progressivas, aumentar recompensas
  IF achievement_record.category = 'progressive' THEN
    reward_shards := reward_shards + (achievement_record.completed_count * achievement_record.reward_increment);
  END IF;
  
  -- Marcar como coletada
  UPDATE public.user_achievements 
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  
  -- Aplicar recompensas
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + reward_coins,
    experience_points = experience_points + reward_xp,
    pokeshards = pokeshards + reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Aplicar giros gratuitos se houver
  IF reward_spins > 0 THEN
    UPDATE public.user_spins 
    SET free_spins = free_spins + reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
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