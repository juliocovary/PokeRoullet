-- Corrigir o search_path das funções existentes
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Curva de progressão: level = floor(sqrt(xp / 100)) + 1
  -- Nível 1: 0-199 XP, Nível 2: 200-799 XP, Nível 3: 800-1799 XP, etc.
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;