-- Create function to get pokedex counts without row limits
CREATE OR REPLACE FUNCTION public.get_pokedex_counts()
RETURNS TABLE (user_id uuid, pokedex_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, COUNT(*) as pokedex_count
  FROM pokedex_cards
  GROUP BY user_id;
$$;