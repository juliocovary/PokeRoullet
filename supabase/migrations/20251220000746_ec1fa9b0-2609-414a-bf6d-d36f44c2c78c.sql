-- Create function to update rankings
CREATE OR REPLACE FUNCTION public.update_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pokedex_counts RECORD;
  v_shiny_counts RECORD;
BEGIN
  -- Clear existing rankings
  DELETE FROM public.rankings WHERE id IS NOT NULL;
  
  -- Insert updated rankings with all data
  INSERT INTO public.rankings (
    user_id, 
    nickname, 
    avatar, 
    level, 
    experience_points, 
    pokedex_count, 
    shiny_count,
    level_rank,
    pokedex_rank,
    shiny_rank
  )
  SELECT 
    p.user_id,
    p.nickname,
    p.avatar,
    p.level,
    p.experience_points,
    COALESCE(pc.pokedex_count, 0),
    COALESCE(sc.shiny_count, 0),
    ROW_NUMBER() OVER (ORDER BY p.level DESC, p.experience_points DESC),
    ROW_NUMBER() OVER (ORDER BY COALESCE(pc.pokedex_count, 0) DESC),
    ROW_NUMBER() OVER (ORDER BY COALESCE(sc.shiny_count, 0) DESC)
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as pokedex_count
    FROM public.pokedex_cards
    GROUP BY user_id
  ) pc ON p.user_id = pc.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as shiny_count
    FROM public.pokedex_cards
    WHERE is_shiny = true
    GROUP BY user_id
  ) sc ON p.user_id = sc.user_id
  WHERE p.level > 0
  ORDER BY p.level DESC, p.experience_points DESC
  LIMIT 100;
  
  RAISE LOG 'Rankings updated at %. Total entries: %', now(), (SELECT COUNT(*) FROM public.rankings);
END;
$$;

-- Schedule rankings update every hour using pg_cron
SELECT cron.schedule(
  'update-rankings-hourly',
  '0 * * * *',
  'SELECT public.update_rankings()'
);

-- Run initial update
SELECT public.update_rankings();