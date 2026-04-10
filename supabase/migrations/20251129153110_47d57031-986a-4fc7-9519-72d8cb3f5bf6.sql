-- Create rankings table
CREATE TABLE public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nickname text NOT NULL,
  avatar text,
  
  -- Ranking por Nível
  level integer NOT NULL DEFAULT 1,
  experience_points integer NOT NULL DEFAULT 0,
  level_rank integer,
  
  -- Ranking por Pokédex
  pokedex_count integer NOT NULL DEFAULT 0,
  pokedex_rank integer,
  
  -- Metadados
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes para buscas rápidas
CREATE INDEX idx_rankings_level_rank ON public.rankings(level_rank);
CREATE INDEX idx_rankings_pokedex_rank ON public.rankings(pokedex_rank);
CREATE INDEX idx_rankings_user_id ON public.rankings(user_id);

-- RLS: Todos podem ver os rankings
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rankings são públicos" 
ON public.rankings 
FOR SELECT 
USING (true);