-- Drop the existing function completely
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb, boolean);

-- Recreate the function with CORRECT column names matching the actual schema
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id uuid,
  p_region text DEFAULT 'all',
  p_pokemon_data jsonb DEFAULT NULL,
  p_is_shiny boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_spins integer;
  v_pokemon_id integer;
  v_pokemon_name text;
  v_pokemon_rarity text;
  v_is_shiny boolean;
  v_xp_earned integer;
  v_new_level integer;
  v_leveled_up boolean := false;
  v_selected_pokemon jsonb;
BEGIN
  -- Validate input
  IF p_pokemon_data IS NULL THEN
    RAISE EXCEPTION 'Pokemon data is required';
  END IF;

  -- Check free spins (user_spins table uses free_spins column)
  SELECT free_spins INTO v_free_spins
  FROM user_spins
  WHERE user_id = p_user_id;
  
  IF v_free_spins IS NULL OR v_free_spins <= 0 THEN
    RAISE EXCEPTION 'No free spins available';
  END IF;

  -- Decrement spins
  UPDATE user_spins
  SET free_spins = free_spins - 1, updated_at = now()
  WHERE user_id = p_user_id;

  -- Extract pokemon data from input (p_pokemon_data is a single object with id, name, rarity)
  v_selected_pokemon := p_pokemon_data;
  v_pokemon_id := (v_selected_pokemon->>'id')::integer;
  v_pokemon_name := v_selected_pokemon->>'name';
  v_pokemon_rarity := v_selected_pokemon->>'rarity';
  v_is_shiny := p_is_shiny;
  
  -- Validate extracted data
  IF v_pokemon_id IS NULL OR v_pokemon_name IS NULL OR v_pokemon_rarity IS NULL THEN
    RAISE EXCEPTION 'Invalid pokemon data: id, name, and rarity are required';
  END IF;

  -- XP by rarity
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'common' THEN 50
    WHEN 'uncommon' THEN 100
    WHEN 'rare' THEN 200
    WHEN 'pseudo' THEN 500
    WHEN 'legendary' THEN 1000
    WHEN 'starter' THEN 75
    WHEN 'secret' THEN 2500
    ELSE 50
  END;

  -- Add experience and check for level up (add_experience function handles this)
  SELECT new_level, leveled_up INTO v_new_level, v_leveled_up
  FROM add_experience(p_user_id, v_xp_earned);

  -- Upsert into pokemon_inventory (uses quantity column, NOT count)
  INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, 1, v_is_shiny)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

  -- Update missions progress (user_missions uses 'progress' column, NOT 'current_progress')
  -- Also uses 'completed' column, NOT 'is_completed'
  -- Note: missions table uses 'type' column for mission type
  UPDATE user_missions um
  SET progress = um.progress + 1, updated_at = now()
  FROM missions m
  WHERE um.user_id = p_user_id
    AND um.mission_id = m.id
    AND m.type IN ('spin', 'catch_pokemon')
    AND um.completed = false;

  -- Mark missions complete if goal reached
  UPDATE user_missions um
  SET completed = true, completed_at = now()
  FROM missions m
  WHERE um.user_id = p_user_id
    AND um.mission_id = m.id
    AND um.progress >= m.goal
    AND um.completed = false;

  -- Return result (frontend derives sprite from id)
  RETURN jsonb_build_object(
    'success', true,
    'pokemon', jsonb_build_object(
      'id', v_pokemon_id,
      'name', v_pokemon_name,
      'rarity', v_pokemon_rarity,
      'isShiny', v_is_shiny
    ),
    'xp_earned', v_xp_earned,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'spins_remaining', v_free_spins - 1
  );
END;
$$;