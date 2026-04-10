-- Drop the existing function
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb, boolean);

-- Ensure unique index exists for UPSERT to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS pokemon_inventory_user_pokemon_shiny_ux
ON pokemon_inventory(user_id, pokemon_id, is_shiny);

-- Recreate the function WITHOUT pokemon_sprite references
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
  v_user_luck numeric;
  v_random_value numeric;
  v_cumulative numeric := 0;
  v_rarity_roll text;
  v_shiny_chance numeric := 0.01;
  v_profile_record RECORD;
BEGIN
  -- Get user profile (profiles uses user_id, not id)
  SELECT luck_multiplier, level, experience INTO v_profile_record
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF v_profile_record IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;
  
  v_user_luck := COALESCE(v_profile_record.luck_multiplier, 1.0);

  -- Check free spins
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

  -- Extract pokemon data from input
  v_selected_pokemon := p_pokemon_data;
  v_pokemon_id := (v_selected_pokemon->>'id')::integer;
  v_pokemon_name := v_selected_pokemon->>'name';
  v_pokemon_rarity := v_selected_pokemon->>'rarity';
  
  -- Handle shiny
  v_is_shiny := p_is_shiny;

  -- XP by rarity
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'common' THEN 50
    WHEN 'uncommon' THEN 100
    WHEN 'rare' THEN 200
    WHEN 'epic' THEN 500
    WHEN 'legendary' THEN 1000
    WHEN 'mythic' THEN 1500
    WHEN 'secret' THEN 2500
    ELSE 50
  END;

  -- Add experience and check for level up
  SELECT new_level, leveled_up INTO v_new_level, v_leveled_up
  FROM add_experience(p_user_id, v_xp_earned);

  -- Upsert into pokemon_inventory (NO pokemon_sprite column!)
  INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, 1, v_is_shiny)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

  -- Update missions
  UPDATE user_missions
  SET current_progress = current_progress + 1, updated_at = now()
  WHERE user_id = p_user_id
    AND mission_type IN ('spin', 'catch_pokemon')
    AND is_completed = false;

  -- Mark missions complete if goal reached
  UPDATE user_missions
  SET is_completed = true, completed_at = now()
  WHERE user_id = p_user_id
    AND current_progress >= goal
    AND is_completed = false;

  -- Return result (NO sprite field - UI derives it)
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