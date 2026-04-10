
-- Backfill achievement progress for existing users based on their current stats

-- 1. Backfill LEVEL achievements (level 3, 5, 10, 15, 25, 50)
-- Create user_achievements records for all level achievements based on current profile level
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at, rewards_claimed)
SELECT 
  p.user_id,
  a.id,
  p.level,
  a.goal_value,
  CASE WHEN p.level >= a.goal_value THEN true ELSE false END,
  CASE WHEN p.level >= a.goal_value THEN now() ELSE NULL END,
  false
FROM public.profiles p
CROSS JOIN public.achievements a
WHERE a.goal_type = 'level' AND a.category = 'unique'
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = CASE WHEN EXCLUDED.is_completed AND user_achievements.completed_at IS NULL THEN now() ELSE user_achievements.completed_at END,
  updated_at = now();

-- 2. Backfill TRAINER_DEFEATS achievements (progressive 500 step + unique 15000)
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at, rewards_claimed)
SELECT 
  tp.user_id,
  a.id,
  tp.total_pokemon_defeated,
  CASE 
    WHEN a.category = 'progressive' THEN 
      -- Calculate correct next_goal_value based on how many times 500 was reached
      a.goal_value + (FLOOR(tp.total_pokemon_defeated::numeric / a.goal_value) * COALESCE(a.increment_step, a.goal_value))
    ELSE a.goal_value
  END,
  CASE 
    WHEN a.category = 'unique' THEN tp.total_pokemon_defeated >= a.goal_value
    WHEN a.category = 'progressive' THEN tp.total_pokemon_defeated >= a.goal_value
    ELSE false
  END,
  CASE 
    WHEN (a.category = 'unique' AND tp.total_pokemon_defeated >= a.goal_value) THEN now()
    WHEN (a.category = 'progressive' AND tp.total_pokemon_defeated >= a.goal_value) THEN now()
    ELSE NULL
  END,
  false
FROM public.trainer_progress tp
CROSS JOIN public.achievements a
WHERE a.goal_type = 'trainer_defeats'
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = CASE WHEN EXCLUDED.is_completed AND user_achievements.completed_at IS NULL THEN now() ELSE user_achievements.completed_at END,
  updated_at = now();

-- 3. Backfill TRAINER_STAGE achievements (unique, stage 10 and 25)
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at, rewards_claimed)
SELECT 
  tp.user_id,
  a.id,
  tp.highest_stage_cleared,
  a.goal_value,
  tp.highest_stage_cleared >= a.goal_value,
  CASE WHEN tp.highest_stage_cleared >= a.goal_value THEN now() ELSE NULL END,
  false
FROM public.trainer_progress tp
CROSS JOIN public.achievements a
WHERE a.goal_type = 'trainer_stage' AND a.category = 'unique'
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = CASE WHEN EXCLUDED.is_completed AND user_achievements.completed_at IS NULL THEN now() ELSE user_achievements.completed_at END,
  updated_at = now();

-- 4. Backfill SHINY_CAPTURE achievement (unique, 10 shinies)
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at, rewards_claimed)
SELECT 
  sub.user_id,
  a.id,
  sub.shiny_count,
  a.goal_value,
  sub.shiny_count >= a.goal_value,
  CASE WHEN sub.shiny_count >= a.goal_value THEN now() ELSE NULL END,
  false
FROM (
  SELECT user_id, COUNT(*) as shiny_count
  FROM public.pokemon_inventory
  WHERE is_shiny = true
  GROUP BY user_id
) sub
CROSS JOIN public.achievements a
WHERE a.goal_type = 'shiny_capture' AND a.category = 'unique'
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = CASE WHEN EXCLUDED.is_completed AND user_achievements.completed_at IS NULL THEN now() ELSE user_achievements.completed_at END,
  updated_at = now();

-- 5. Backfill REGION_UNLOCK achievement (unique, 3 regions)
-- unlocked_regions includes 'kanto' by default, so subtract 1 for "new" unlocks
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at, rewards_claimed)
SELECT 
  p.user_id,
  a.id,
  GREATEST(array_length(p.unlocked_regions, 1) - 1, 0),
  a.goal_value,
  GREATEST(array_length(p.unlocked_regions, 1) - 1, 0) >= a.goal_value,
  CASE WHEN GREATEST(array_length(p.unlocked_regions, 1) - 1, 0) >= a.goal_value THEN now() ELSE NULL END,
  false
FROM public.profiles p
CROSS JOIN public.achievements a
WHERE a.goal_type = 'region_unlock' AND a.category = 'unique'
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = CASE WHEN EXCLUDED.is_completed AND user_achievements.completed_at IS NULL THEN now() ELSE user_achievements.completed_at END,
  updated_at = now();
