-- Adicionar colunas de XP e nível à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'pikachu';

-- Criar tabela de amizades
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Enable RLS na tabela friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friendship status" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Função para calcular o nível baseado no XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Curva de progressão: level = floor(sqrt(xp / 100)) + 1
  -- Nível 1: 0-199 XP, Nível 2: 200-799 XP, Nível 3: 800-1799 XP, etc.
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para adicionar XP e atualizar nível
CREATE OR REPLACE FUNCTION public.add_experience(p_user_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_level INTEGER, new_xp INTEGER, level_up BOOLEAN) AS $$
DECLARE
  old_level INTEGER;
  new_level INTEGER;
  new_xp INTEGER;
  level_up BOOLEAN := FALSE;
BEGIN
  -- Buscar XP e nível atual
  SELECT experience_points, level INTO new_xp, old_level
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Adicionar XP
  new_xp := new_xp + p_xp_amount;
  
  -- Calcular novo nível
  new_level := public.calculate_level(new_xp);
  
  -- Verificar se houve level up
  IF new_level > old_level THEN
    level_up := TRUE;
  END IF;
  
  -- Atualizar perfil
  UPDATE public.profiles 
  SET 
    experience_points = new_xp,
    level = new_level,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT new_level, new_xp, level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar updated_at na tabela friendships
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();