
-- 1. Add base_reward_badge column to achievements table
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS base_reward_badge boolean NOT NULL DEFAULT false;

-- 2. Insert new achievements

-- Exterminador (progressive, trainer_defeats, every 500)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, increment_step, reward_increment, base_reward_badge)
VALUES ('Exterminador', 'Derrote {goal} inimigos no Modo Treinador', 'trainer_defeats', 500, 'progressive', 50, 100, 5, 0, 500, 1, false);

-- Campeão de Arena (unique, trainer_stage 10)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Campeão de Arena', 'Alcance o estágio 10 no Modo Treinador', 'trainer_stage', 10, 'unique', 100, 200, 15, 0, false);

-- Mestre de Arena (unique, trainer_stage 25)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Mestre de Arena', 'Alcance o estágio 25 no Modo Treinador', 'trainer_stage', 25, 'unique', 200, 0, 20, 2, false);

-- Destruidor Lendário (unique, trainer_defeats 15000, rewards random badge!)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Destruidor Lendário', 'Derrote 15.000 inimigos no Modo Treinador', 'trainer_defeats', 15000, 'unique', 500, 0, 50, 0, true);

-- Nível 25 (unique)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Trainer Nível 25', 'Alcance o nível 25 como treinador', 'level', 25, 'unique', 50, 0, 40, 0, false);

-- Nível 50 (unique)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Trainer Nível 50', 'Alcance o nível 50 como treinador', 'level', 50, 'unique', 100, 0, 75, 3, false);

-- Colecionador Shiny (unique, shiny_capture 10)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Colecionador Shiny', 'Capture 10 Pokémon Shiny', 'shiny_capture', 10, 'unique', 200, 0, 30, 0, false);

-- Explorador de Regiões (unique, region_unlock 3)
INSERT INTO public.achievements (title, description, goal_type, goal_value, category, base_reward_coins, base_reward_xp, base_reward_shards, base_reward_spins, base_reward_badge)
VALUES ('Explorador de Regiões', 'Desbloqueie 3 novas regiões', 'region_unlock', 3, 'unique', 150, 0, 25, 0, false);

-- 3. Update claim_achievement_rewards to support badge rewards
CREATE OR REPLACE FUNCTION public.claim_achievement_rewards(p_user_id uuid, p_achievement_id uuid)
RETURNS TABLE(success boolean, message text, rewards json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  reward_coins integer := 0;
  reward_xp integer := 0;
  reward_shards integer := 0;
  reward_spins integer := 0;
  has_badge_reward boolean := false;
  reward_badge_id integer := 0;
  reward_badge_name text := '';
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count, ua.progress, ua.next_goal_value, ua.completed_at
  INTO achievement_record
  FROM public.achievements a
  JOIN public.user_achievements ua ON a.id = ua.achievement_id
  WHERE a.id = p_achievement_id 
    AND ua.user_id = p_user_id;
  
  IF achievement_record IS NULL THEN
    RETURN QUERY SELECT false, 'Conquista não encontrada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  IF achievement_record.category = 'progressive' THEN
    IF achievement_record.progress < achievement_record.next_goal_value THEN
      RETURN QUERY SELECT false, 'Conquista ainda não completada'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.completed_at IS NULL THEN
      RETURN QUERY SELECT false, 'Conquista ainda não está pronta para coleta'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.rewards_claimed AND achievement_record.completed_at IS NOT NULL THEN
      RETURN QUERY SELECT false, 'Recompensas já coletadas para este nível'::TEXT, '{}'::json;
      RETURN;
    END IF;
  ELSE
    IF NOT achievement_record.is_completed OR achievement_record.rewards_claimed THEN
      RETURN QUERY SELECT false, 'Conquista não encontrada ou já coletada'::TEXT, '{}'::json;
      RETURN;
    END IF;
  END IF;
  
  reward_coins := achievement_record.base_reward_coins;
  reward_xp := achievement_record.base_reward_xp;
  reward_shards := achievement_record.base_reward_shards;
  reward_spins := achievement_record.base_reward_spins;
  has_badge_reward := achievement_record.base_reward_badge;
  
  IF achievement_record.category = 'progressive' THEN
    reward_shards := reward_shards + (achievement_record.completed_count * achievement_record.reward_increment);
  END IF;
  
  -- Handle badge reward: pick a random badge (items 200-203)
  IF has_badge_reward THEN
    SELECT id, name INTO reward_badge_id, reward_badge_name
    FROM public.items
    WHERE id IN (200, 201, 202, 203)
    ORDER BY random()
    LIMIT 1;
    
    IF reward_badge_id > 0 THEN
      INSERT INTO public.user_items (user_id, item_id, quantity)
      VALUES (p_user_id, reward_badge_id, 1)
      ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_items.quantity + 1, updated_at = now();
    END IF;
  END IF;
  
  IF achievement_record.category = 'progressive' THEN
    UPDATE public.user_achievements 
    SET completed_count = completed_count + 1,
        next_goal_value = next_goal_value + achievement_record.increment_step,
        completed_at = NULL,
        rewards_claimed = false,
        updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  ELSE
    UPDATE public.user_achievements 
    SET rewards_claimed = true, updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  END IF;
  
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + reward_coins,
    pokeshards = pokeshards + reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF reward_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, reward_xp);
  END IF;
  
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
      'spins', reward_spins,
      'badge_name', CASE WHEN has_badge_reward AND reward_badge_id > 0 THEN reward_badge_name ELSE '' END
    );
END;
$$;
