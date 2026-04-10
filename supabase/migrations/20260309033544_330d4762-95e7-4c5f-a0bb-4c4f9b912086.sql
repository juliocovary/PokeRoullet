
-- 1. Update Mestre das Moedas I -> Giro Sortudo I (spin_refund, 2%)
UPDATE roulette_boosts SET
  name = 'Giro Sortudo I',
  description = 'Chance de o giro não ser consumido',
  boost_type = 'spin_refund',
  boost_value = 2,
  task_type = 'pokedex_pokemon',
  task_description = 'Registre 100 Pokémon na Pokédex',
  task_goal = 100
WHERE id = 'c53111e6-68ba-42f1-b99d-f6bbf5f7b31f';

-- 2. Update Mestre das Moedas II -> Giro Sortudo II (spin_refund, 5%)
UPDATE roulette_boosts SET
  name = 'Giro Sortudo II',
  description = 'Chance maior de o giro não ser consumido',
  boost_type = 'spin_refund',
  boost_value = 5,
  task_type = 'pokedex_pokemon',
  task_description = 'Registre 300 Pokémon na Pokédex',
  task_goal = 300
WHERE id = '957ab85c-1789-4f20-b7a1-a3a08ddef8e7';

-- 3. Fix progress for existing users: set progress to actual pokedex count (capped at goal)
-- and mark as completed/active if they already reached the goal
-- Tier 1 (goal=100)
UPDATE user_roulette_boosts urb SET
  progress = LEAST((SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id), 100),
  is_completed = (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 100,
  is_active = (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 100,
  completed_at = CASE 
    WHEN (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 100 THEN now()
    ELSE NULL 
  END
WHERE urb.boost_id = 'c53111e6-68ba-42f1-b99d-f6bbf5f7b31f';

-- Tier 2 (goal=300)
UPDATE user_roulette_boosts urb SET
  progress = LEAST((SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id), 300),
  is_completed = (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 300,
  is_active = (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 300,
  completed_at = CASE 
    WHEN (SELECT COUNT(*) FROM pokedex_cards pc WHERE pc.user_id = urb.user_id) >= 300 THEN now()
    ELSE NULL 
  END
WHERE urb.boost_id = '957ab85c-1789-4f20-b7a1-a3a08ddef8e7';
