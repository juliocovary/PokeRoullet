-- =====================================================
-- FIX: Shiny determination now happens SERVER-SIDE
-- This ensures shiny_boost_expires_at is always fresh
-- =====================================================

-- Drop and recreate spin_pokemon_roulette with server-side shiny calculation
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb,
  p_is_shiny boolean DEFAULT false -- Still accepted but IGNORED - server calculates
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
  v_shiny_boost_expires timestamptz;
  v_shiny_chance numeric;
  v_is_shiny boolean;
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
  
  -- ===== SERVER-SIDE SHINY CALCULATION =====
  -- Get the shiny boost expiration directly from the database
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Calculate shiny chance: 5% with active boost, 1% base
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := 0.05;
  ELSE
    v_shiny_chance := 0.01;
  END IF;
  
  -- Roll for shiny
  v_is_shiny := random() < v_shiny_chance;
  -- ===== END SHINY CALCULATION =====
  
  -- Calculate XP based on rarity
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20 -- common
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
    AND is_shiny = v_is_shiny
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing entry
    UPDATE pokemon_inventory
    SET quantity = quantity + 1
    WHERE id = v_existing_id;
  ELSE
    -- Insert new entry
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, 1);
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
  
  -- Return success with server-calculated shiny status
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
    'level_up', v_leveled_up,
    'leveled_up', v_leveled_up,
    'spins_remaining', v_current_spins - 1,
    'shiny_chance_applied', v_shiny_chance
  );
END;
$$;

-- Drop and recreate add_pokemon_without_spin with server-side shiny calculation
CREATE OR REPLACE FUNCTION public.add_pokemon_without_spin(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb,
  p_is_shiny boolean DEFAULT false -- Still accepted but IGNORED - server calculates
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_earned integer;
  v_new_level integer;
  v_leveled_up boolean;
  v_pokemon_id integer;
  v_pokemon_name text;
  v_pokemon_rarity text;
  v_existing_id uuid;
  v_shiny_boost_expires timestamptz;
  v_shiny_chance numeric;
  v_is_shiny boolean;
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
  
  -- ===== SERVER-SIDE SHINY CALCULATION =====
  -- Get the shiny boost expiration directly from the database
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Calculate shiny chance: 5% with active boost, 1% base
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := 0.05;
  ELSE
    v_shiny_chance := 0.01;
  END IF;
  
  -- Roll for shiny
  v_is_shiny := random() < v_shiny_chance;
  -- ===== END SHINY CALCULATION =====
  
  -- Calculate XP based on rarity
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20 -- common
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
    AND is_shiny = v_is_shiny
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing entry
    UPDATE pokemon_inventory
    SET quantity = quantity + 1
    WHERE id = v_existing_id;
  ELSE
    -- Insert new entry
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, 1);
  END IF;
  
  -- Update spin missions (still count as spin for missions)
  UPDATE user_missions
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (
        SELECT goal FROM missions WHERE id = user_missions.mission_id
      ) THEN true ELSE completed END,
      updated_at = now()
  WHERE user_id = p_user_id
    AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE type = 'spin');
  
  -- Return success with server-calculated shiny status
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
    'level_up', v_leveled_up,
    'leveled_up', v_leveled_up,
    'shiny_chance_applied', v_shiny_chance
  );
END;
$$;