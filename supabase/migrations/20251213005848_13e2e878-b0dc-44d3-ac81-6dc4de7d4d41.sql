-- Tabela de configuração do evento
CREATE TABLE public.launch_event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de missões do evento
CREATE TABLE public.launch_event_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_order INTEGER NOT NULL UNIQUE,
  category TEXT NOT NULL,
  goal INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  reward_shards INTEGER DEFAULT 0,
  reward_spins INTEGER DEFAULT 0,
  reward_mystery_boxes INTEGER DEFAULT 0,
  reward_luck_potion INTEGER DEFAULT 0,
  reward_shiny_potion INTEGER DEFAULT 0,
  reward_legendary_spin INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de progresso do usuário no evento
CREATE TABLE public.user_launch_event_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_order INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_order)
);

-- RLS para launch_event_config (público para leitura)
ALTER TABLE public.launch_event_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event config is viewable by everyone"
ON public.launch_event_config
FOR SELECT
USING (true);

-- RLS para launch_event_missions (público para leitura)
ALTER TABLE public.launch_event_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event missions are viewable by everyone"
ON public.launch_event_missions
FOR SELECT
USING (true);

-- RLS para user_launch_event_progress
ALTER TABLE public.user_launch_event_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event progress"
ON public.user_launch_event_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event progress"
ON public.user_launch_event_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event progress"
ON public.user_launch_event_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Inserir configuração do evento (15 dias a partir de agora)
INSERT INTO public.launch_event_config (event_name, start_date, end_date)
VALUES ('Launch Event', now(), now() + interval '15 days');

-- Inserir as 7 missões do evento com suas recompensas
INSERT INTO public.launch_event_missions (mission_order, category, goal, reward_coins, reward_shards, reward_spins, reward_mystery_boxes, reward_luck_potion, reward_shiny_potion, reward_legendary_spin) VALUES
(1, 'spin', 15, 100, 0, 0, 0, 0, 0, 0),
(2, 'sell', 20, 0, 50, 0, 0, 0, 0, 0),
(3, 'evolve', 3, 50, 0, 0, 3, 0, 0, 0),
(4, 'marketplace', 1, 0, 0, 10, 0, 1, 0, 0),
(5, 'upgrade', 1, 0, 35, 0, 0, 0, 1, 0),
(6, 'spin', 100, 150, 75, 0, 5, 0, 0, 0),
(7, 'friends', 5, 0, 0, 0, 0, 0, 0, 1);

-- Função para atualizar progresso do evento
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
BEGIN
  -- Verificar se o evento está ativo
  SELECT is_active INTO v_event_active
  FROM launch_event_config
  WHERE end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Buscar a missão atual (não completa ou não resgatada) da categoria
  SELECT m.*, COALESCE(up.progress, 0) as current_progress, COALESCE(up.completed, false) as is_completed, COALESCE(up.rewards_claimed, false) as is_claimed
  INTO v_current_mission
  FROM launch_event_missions m
  LEFT JOIN user_launch_event_progress up ON (m.mission_order = up.mission_order AND up.user_id = p_user_id)
  WHERE m.category = p_category
    AND (up.rewards_claimed IS NULL OR up.rewards_claimed = false)
  ORDER BY m.mission_order
  LIMIT 1;
  
  IF v_current_mission IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Verificar se a missão anterior foi resgatada (exceto para missão 1)
  IF v_current_mission.mission_order > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_launch_event_progress
      WHERE user_id = p_user_id
        AND mission_order = v_current_mission.mission_order - 1
        AND rewards_claimed = true
    ) THEN
      RETURN QUERY SELECT FALSE, 0;
      RETURN;
    END IF;
  END IF;
  
  -- Inicializar ou atualizar progresso
  INSERT INTO user_launch_event_progress (user_id, mission_order, progress)
  VALUES (p_user_id, v_current_mission.mission_order, p_increment)
  ON CONFLICT (user_id, mission_order)
  DO UPDATE SET 
    progress = user_launch_event_progress.progress + p_increment,
    updated_at = now();
  
  -- Verificar se completou
  SELECT progress INTO v_user_progress
  FROM user_launch_event_progress
  WHERE user_id = p_user_id AND mission_order = v_current_mission.mission_order;
  
  IF v_user_progress >= v_current_mission.goal THEN
    UPDATE user_launch_event_progress
    SET completed = true, completed_at = now()
    WHERE user_id = p_user_id AND mission_order = v_current_mission.mission_order;
    
    v_mission_completed := TRUE;
  END IF;
  
  RETURN QUERY SELECT v_mission_completed, v_current_mission.mission_order;
END;
$$;

-- Função para verificar missão de amigos (missão 7)
CREATE OR REPLACE FUNCTION public.check_friends_mission(p_user_id UUID)
RETURNS TABLE(mission_completed BOOLEAN, friends_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_friends_count INTEGER;
  v_mission_goal INTEGER;
  v_event_active BOOLEAN;
BEGIN
  -- Verificar se o evento está ativo
  SELECT is_active INTO v_event_active
  FROM launch_event_config
  WHERE end_date > now()
  LIMIT 1;
  
  IF NOT v_event_active OR v_event_active IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Verificar se missão 6 foi resgatada
  IF NOT EXISTS (
    SELECT 1 FROM user_launch_event_progress
    WHERE user_id = p_user_id AND mission_order = 6 AND rewards_claimed = true
  ) THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;
  
  -- Contar amigos aceitos
  SELECT COUNT(*) INTO v_friends_count
  FROM friendships
  WHERE status = 'accepted'
    AND (requester_id = p_user_id OR addressee_id = p_user_id);
  
  -- Buscar goal da missão 7
  SELECT goal INTO v_mission_goal
  FROM launch_event_missions
  WHERE mission_order = 7;
  
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
$$;

-- Função para resgatar recompensas do evento
CREATE OR REPLACE FUNCTION public.claim_launch_event_rewards(
  p_user_id UUID,
  p_mission_order INTEGER
)
RETURNS TABLE(success BOOLEAN, message TEXT, rewards JSON)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mission RECORD;
  v_progress RECORD;
  v_item_id INTEGER;
BEGIN
  -- Buscar missão
  SELECT * INTO v_mission
  FROM launch_event_missions
  WHERE mission_order = p_mission_order;
  
  IF v_mission IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Missão não encontrada'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  -- Buscar progresso do usuário
  SELECT * INTO v_progress
  FROM user_launch_event_progress
  WHERE user_id = p_user_id AND mission_order = p_mission_order;
  
  IF v_progress IS NULL OR NOT v_progress.completed THEN
    RETURN QUERY SELECT FALSE, 'Missão ainda não completada'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  IF v_progress.rewards_claimed THEN
    RETURN QUERY SELECT FALSE, 'Recompensas já resgatadas'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  -- Marcar como resgatada
  UPDATE user_launch_event_progress
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND mission_order = p_mission_order;
  
  -- Aplicar recompensas de coins e shards
  UPDATE profiles
  SET 
    pokecoins = pokecoins + v_mission.reward_coins,
    pokeshards = pokeshards + v_mission.reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Aplicar spins
  IF v_mission.reward_spins > 0 THEN
    UPDATE user_spins
    SET free_spins = free_spins + v_mission.reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Aplicar Mystery Boxes (item_id = 4)
  IF v_mission.reward_mystery_boxes > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 4, v_mission.reward_mystery_boxes)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_mystery_boxes, updated_at = now();
  END IF;
  
  -- Aplicar Luck Potion (item_id = 1)
  IF v_mission.reward_luck_potion > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 1, v_mission.reward_luck_potion)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_luck_potion, updated_at = now();
  END IF;
  
  -- Aplicar Shiny Potion (item_id = 2)
  IF v_mission.reward_shiny_potion > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 2, v_mission.reward_shiny_potion)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_shiny_potion, updated_at = now();
  END IF;
  
  -- Aplicar Legendary Spin (item_id = 5)
  IF v_mission.reward_legendary_spin > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 5, v_mission.reward_legendary_spin)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_legendary_spin, updated_at = now();
  END IF;
  
  RETURN QUERY SELECT 
    TRUE, 
    'Recompensas resgatadas com sucesso!'::TEXT,
    json_build_object(
      'coins', v_mission.reward_coins,
      'shards', v_mission.reward_shards,
      'spins', v_mission.reward_spins,
      'mystery_boxes', v_mission.reward_mystery_boxes,
      'luck_potion', v_mission.reward_luck_potion,
      'shiny_potion', v_mission.reward_shiny_potion,
      'legendary_spin', v_mission.reward_legendary_spin
    );
END;
$$;