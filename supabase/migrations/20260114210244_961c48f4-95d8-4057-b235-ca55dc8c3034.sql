-- Drop existing function
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb, boolean);

-- Recreate with correct columns (no pokemon_sprite, no region)
-- Use manual upsert since no UNIQUE constraint exists
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb,
  p_is_shiny boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_spins integer;
  v_xp_earned integer;
  v_new_level integer;
  v_leveled_up boolean;
  v_pokemon_id integer;
  v_pokemon_name text;
  v_pokemon_rarity text;
  v_existing_id uuid;
BEGIN
  -- Validate input
  IF p_pokemon_data IS NULL THEN
    RAISE EXCEPTION 'Pokemon data is required';
  END IF;
  
  -- Extract pokemon data
  v_pokemon_id := (p_pokemon_data->>'id')::integer;
  v_pokemon_name := p_pokemon_data->>'name';
  v_pokemon_rarity := p_pokemon_data->>'rarity';
  
  IF v_pokemon_id IS NULL OR v_pokemon_name IS NULL OR v_pokemon_rarity IS NULL THEN
    RAISE EXCEPTION 'Invalid pokemon data: id, name, and rarity are required';
  END IF;

  -- Check available spins
  SELECT free_spins INTO v_current_spins
  FROM user_spins
  WHERE user_id = p_user_id;
  
  IF v_current_spins IS NULL OR v_current_spins <= 0 THEN
    RAISE EXCEPTION 'No free spins available';
  END IF;
  
  -- Decrement spins
  UPDATE user_spins
  SET free_spins = free_spins - 1,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Calculate XP based on rarity
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'epic' THEN 100
    WHEN 'rare' THEN 50
    WHEN 'uncommon' THEN 25
    ELSE 10
  END;
  
  -- Add experience and get level info
  SELECT ae.new_level, ae.level_up
  INTO v_new_level, v_leveled_up
  FROM public.add_experience(p_user_id, v_xp_earned) ae;
  
  -- Manual upsert: check if pokemon already exists in inventory
  SELECT id INTO v_existing_id
  FROM pokemon_inventory
  WHERE user_id = p_user_id 
    AND pokemon_id = v_pokemon_id 
    AND is_shiny = p_is_shiny
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing entry
    UPDATE pokemon_inventory
    SET quantity = quantity + 1
    WHERE id = v_existing_id;
  ELSE
    -- Insert new entry (only columns that exist in the table)
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, p_is_shiny, 1);
  END IF;
  
  -- Update spin missions
  UPDATE user_missions
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (
        SELECT goal FROM missions WHERE id = user_missions.mission_id
      ) THEN true ELSE completed END,
      updated_at = now()
  WHERE user_id = p_user_id
    AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE type = 'spin');
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'pokemon', jsonb_build_object(
      'id', v_pokemon_id,
      'name', v_pokemon_name,
      'rarity', v_pokemon_rarity,
      'is_shiny', p_is_shiny
    ),
    'xp_earned', v_xp_earned,
    'new_level', v_new_level,
    'level_up', v_leveled_up,
    'leveled_up', v_leveled_up,
    'spins_remaining', v_current_spins - 1
  );
END;
$$;