-- Tabela de definição dos impulsos disponíveis
CREATE TABLE IF NOT EXISTS public.roulette_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  boost_type TEXT NOT NULL,
  boost_value NUMERIC NOT NULL DEFAULT 0,
  task_type TEXT NOT NULL,
  task_goal INTEGER NOT NULL,
  task_description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  tier INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de progresso do usuário nos impulsos
CREATE TABLE IF NOT EXISTS public.user_roulette_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  boost_id UUID NOT NULL REFERENCES public.roulette_boosts(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, boost_id)
);

-- Enable RLS
ALTER TABLE public.roulette_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roulette_boosts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Roulette boosts are viewable by everyone"
ON public.roulette_boosts FOR SELECT USING (true);

CREATE POLICY "Users can view their own roulette boosts"
ON public.user_roulette_boosts FOR SELECT USING (auth.uid() = user_id);

-- Drop e recria função
DROP FUNCTION IF EXISTS public.update_roulette_boost_progress(uuid, text, integer);

CREATE FUNCTION public.update_roulette_boost_progress(
  p_user_id UUID,
  p_task_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  boost_record RECORD;
  user_boost RECORD;
  completed_boosts JSONB := '[]'::JSONB;
BEGIN
  FOR boost_record IN 
    SELECT id, name, boost_type, boost_value, task_goal
    FROM roulette_boosts 
    WHERE task_type = p_task_type AND is_active = true
  LOOP
    INSERT INTO user_roulette_boosts (user_id, boost_id, progress, is_completed, is_active)
    VALUES (p_user_id, boost_record.id, LEAST(boost_record.task_goal, p_increment), false, false)
    ON CONFLICT (user_id, boost_id) DO UPDATE SET
      progress = LEAST(boost_record.task_goal, user_roulette_boosts.progress + p_increment),
      updated_at = now()
    RETURNING * INTO user_boost;

    IF user_boost.progress >= boost_record.task_goal AND NOT user_boost.is_completed THEN
      UPDATE user_roulette_boosts
      SET is_completed = true, is_active = true, completed_at = now()
      WHERE id = user_boost.id;

      completed_boosts := completed_boosts || jsonb_build_object(
        'boost_id', boost_record.id,
        'name', boost_record.name,
        'boost_type', boost_record.boost_type,
        'boost_value', boost_record.boost_value
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'completed_boosts', completed_boosts);
END;
$$;

-- Função para obter boosts ativos
DROP FUNCTION IF EXISTS public.get_user_active_roulette_boosts(uuid);

CREATE FUNCTION public.get_user_active_roulette_boosts(p_user_id UUID)
RETURNS TABLE(boost_type TEXT, total_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rb.boost_type, SUM(rb.boost_value) as total_value
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id AND urb.is_active = true
  GROUP BY rb.boost_type;
END;
$$;

-- Inserir impulsos iniciais
INSERT INTO public.roulette_boosts (name, description, boost_type, boost_value, task_type, task_goal, task_description, icon, tier) VALUES
('Impulso Shiny I', 'Aumenta a chance de encontrar Pokémon Shiny', 'shiny_chance', 5, 'collector_spins', 1000, 'Realize 1.000 giros na roleta', 'sparkles', 1),
('Impulso Shiny II', 'Aumenta ainda mais a chance de Shiny', 'shiny_chance', 10, 'collector_spins', 5000, 'Realize 5.000 giros na roleta', 'sparkles', 2),
('Caça-Segredos I', 'Aumenta a chance de encontrar Pokémon Secretos', 'secret_chance', 25, 'trainer_enemies_defeated', 50000, 'Derrote 50.000 inimigos no Modo Treinador', 'key', 1),
('Caça-Segredos II', 'Aumenta muito a chance de Secretos', 'secret_chance', 50, 'trainer_enemies_defeated', 200000, 'Derrote 200.000 inimigos no Modo Treinador', 'key', 2),
('Impulso XP I', 'Aumenta o XP ganho em cada giro', 'xp_bonus', 15, 'trainer_stages_cleared', 50, 'Complete 50 estágios no Modo Treinador', 'trophy', 1),
('Impulso XP II', 'Aumenta muito o XP por giro', 'xp_bonus', 30, 'trainer_stages_cleared', 150, 'Complete 150 estágios no Modo Treinador', 'trophy', 2),
('Mestre das Moedas I', 'Aumenta as moedas obtidas ao vender', 'coin_bonus', 10, 'pokedex_pokemon', 100, 'Registre 100 Pokémon na Pokédex', 'coins', 1),
('Mestre das Moedas II', 'Aumenta muito as moedas por venda', 'coin_bonus', 25, 'pokedex_pokemon', 300, 'Registre 300 Pokémon na Pokédex', 'coins', 2),
('Sorte Brilhante I', 'Aumenta a sorte geral da roleta', 'luck_bonus', 5, 'shiny_pokemon', 10, 'Capture 10 Pokémon Shiny', 'clover', 1),
('Sorte Brilhante II', 'Aumenta muito a sorte geral', 'luck_bonus', 15, 'shiny_pokemon', 50, 'Capture 50 Pokémon Shiny', 'clover', 2);