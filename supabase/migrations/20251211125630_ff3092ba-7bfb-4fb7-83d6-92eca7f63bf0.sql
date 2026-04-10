-- Add shiny columns to rankings table
ALTER TABLE public.rankings 
ADD COLUMN shiny_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN shiny_rank INTEGER;

-- Create function to get shiny pokedex counts
CREATE OR REPLACE FUNCTION public.get_shiny_pokedex_counts()
RETURNS TABLE (user_id uuid, shiny_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, COUNT(*) as shiny_count
  FROM pokedex_cards
  WHERE is_shiny = true
  GROUP BY user_id;
$$;