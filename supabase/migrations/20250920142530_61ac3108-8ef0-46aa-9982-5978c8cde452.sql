-- Corrigir o progresso das missões de spin e conquistas de nível para PokeJulio

-- 1. Resetar progresso das missões de spin para refletir os 20 giros feitos
UPDATE public.user_missions 
SET progress = 20, completed = true, completed_at = now()
FROM public.missions m
WHERE user_missions.mission_id = m.id 
  AND user_missions.user_id = (SELECT user_id FROM profiles WHERE nickname = 'PokeJulio')
  AND m.category = 'spin'
  AND m.type = 'daily';

UPDATE public.user_missions 
SET progress = 20, completed = false
FROM public.missions m
WHERE user_missions.mission_id = m.id 
  AND user_missions.user_id = (SELECT user_id FROM profiles WHERE nickname = 'PokeJulio')
  AND m.category = 'spin'
  AND m.type = 'weekly';

-- 2. Criar conquistas de nível para o usuário (ele está no nível 3)
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed, completed_at)
SELECT 
  p.user_id,
  a.id,
  3 as progress,  -- nível atual é 3
  a.goal_value as next_goal_value,  -- meta da conquista
  true as is_completed,  -- conquista de nível 3 está completa
  now() as completed_at
FROM public.profiles p
CROSS JOIN public.achievements a
WHERE p.nickname = 'PokeJulio' 
  AND a.goal_type = 'level'
  AND a.goal_value = 3
ON CONFLICT (user_id, achievement_id) DO UPDATE SET 
  progress = EXCLUDED.progress,
  is_completed = EXCLUDED.is_completed,
  completed_at = EXCLUDED.completed_at,
  updated_at = now();

-- 3. Criar outras conquistas de nível com progresso parcial
INSERT INTO public.user_achievements (user_id, achievement_id, progress, next_goal_value, is_completed)
SELECT 
  p.user_id,
  a.id,
  3 as progress,  -- nível atual é 3
  a.goal_value as next_goal_value,  -- meta da conquista
  false as is_completed  -- conquistas de nível 5, 10, 15 não completas ainda
FROM public.profiles p
CROSS JOIN public.achievements a
WHERE p.nickname = 'PokeJulio' 
  AND a.goal_type = 'level'
  AND a.goal_value > 3
ON CONFLICT (user_id, achievement_id) DO UPDATE SET 
  progress = EXCLUDED.progress,
  updated_at = now();