
-- Fix spin_pokemon_roulette: consistent signature, remove pokemon_id ambiguity, keep all-regions + secret IDs
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id UUID,
  p_region TEXT,
  p_pokemon_data JSONB,
  p_skip_reload BOOLEAN DEFAULT false
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  pokemon_id INTEGER,
  pokemon_name TEXT,
  pokemon_rarity TEXT,
  is_shiny BOOLEAN,
  xp_gained INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_spins INTEGER;
  v_selected_pokemon JSONB;
  v_selected_pokemon_id INTEGER;
  v_selected_pokemon_name TEXT;
  v_selected_pokemon_rarity TEXT;
  v_is_shiny BOOLEAN := false;
  v_xp_gained INTEGER := 0;
  v_luck_multiplier NUMERIC;
  v_shiny_boost_active BOOLEAN := false;
  v_xp_multiplier NUMERIC := 1.0;
  v_random_value NUMERIC;
  v_shiny_chance NUMERIC := 0.01;
  v_unlocked_regions TEXT[];
  v_existing_quantity INTEGER;
BEGIN
  -- Security check
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check free spins
  SELECT us.free_spins INTO v_free_spins
  FROM user_spins us
  WHERE us.user_id = p_user_id;

  IF v_free_spins IS NULL OR v_free_spins <= 0 THEN
    RETURN QUERY SELECT false, 'No spins available'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get user profile data
  SELECT 
    COALESCE(pr.luck_multiplier, 1.0),
    CASE WHEN pr.shiny_boost_expires_at > now() THEN true ELSE false END,
    COALESCE(pr.xp_multiplier, 1.0),
    pr.unlocked_regions
  INTO v_luck_multiplier, v_shiny_boost_active, v_xp_multiplier, v_unlocked_regions
  FROM profiles pr
  WHERE pr.user_id = p_user_id;

  -- Select random pokemon based on region
  v_random_value := random();
  
  IF p_region = 'all' THEN
    -- For "all" region, filter by unlocked regions
    SELECT pdata INTO v_selected_pokemon
    FROM (
      SELECT jsonb_array_elements(p_pokemon_data) AS pdata
    ) sub
    WHERE (
      -- Kanto (1-151)
      ('kanto' = ANY(v_unlocked_regions) AND (pdata->>'id')::INTEGER BETWEEN 1 AND 151)
      -- Johto (152-251)
      OR ('johto' = ANY(v_unlocked_regions) AND (pdata->>'id')::INTEGER BETWEEN 152 AND 251)
      -- Hoenn (252-386, includes 385 Jirachi)
      OR ('hoenn' = ANY(v_unlocked_regions) AND (pdata->>'id')::INTEGER BETWEEN 252 AND 386)
      -- Sinnoh (387-493, includes 493 Arceus)
      OR ('sinnoh' = ANY(v_unlocked_regions) AND (pdata->>'id')::INTEGER BETWEEN 387 AND 493)
      -- Unova (494-649)
      OR ('unova' = ANY(v_unlocked_regions) AND (pdata->>'id')::INTEGER BETWEEN 494 AND 649)
    )
    ORDER BY random()
    LIMIT 1;
  ELSE
    -- For specific region
    SELECT pdata INTO v_selected_pokemon
    FROM (
      SELECT jsonb_array_elements(p_pokemon_data) AS pdata
    ) sub
    WHERE 
      CASE p_region
        WHEN 'kanto' THEN (pdata->>'id')::INTEGER BETWEEN 1 AND 151
        WHEN 'johto' THEN (pdata->>'id')::INTEGER BETWEEN 152 AND 251
        WHEN 'hoenn' THEN (pdata->>'id')::INTEGER BETWEEN 252 AND 386
        WHEN 'sinnoh' THEN (pdata->>'id')::INTEGER BETWEEN 387 AND 493
        WHEN 'unova' THEN (pdata->>'id')::INTEGER BETWEEN 494 AND 649
        ELSE true
      END
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Fallback if no pokemon found
  IF v_selected_pokemon IS NULL THEN
    SELECT pdata INTO v_selected_pokemon
    FROM (
      SELECT jsonb_array_elements(p_pokemon_data) AS pdata
    ) sub
    ORDER BY random()
    LIMIT 1;
  END IF;

  IF v_selected_pokemon IS NULL THEN
    RETURN QUERY SELECT false, 'No pokemon available'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
    RETURN;
  END IF;

  -- Extract pokemon data
  v_selected_pokemon_id := (v_selected_pokemon->>'id')::INTEGER;
  v_selected_pokemon_name := v_selected_pokemon->>'name';
  v_selected_pokemon_rarity := v_selected_pokemon->>'rarity';

  -- Calculate shiny chance
  IF v_shiny_boost_active THEN
    v_shiny_chance := 0.05;
  END IF;
  v_shiny_chance := v_shiny_chance * v_luck_multiplier;
  
  IF random() < v_shiny_chance THEN
    v_is_shiny := true;
  END IF;

  -- Calculate XP based on rarity
  v_xp_gained := CASE v_selected_pokemon_rarity
    WHEN 'common' THEN 10
    WHEN 'uncommon' THEN 25
    WHEN 'rare' THEN 50
    WHEN 'pseudo' THEN 100
    WHEN 'legendary' THEN 200
    WHEN 'secret' THEN 250
    WHEN 'starter' THEN 15
    ELSE 10
  END;
  
  IF v_is_shiny THEN
    v_xp_gained := v_xp_gained * 3;
  END IF;
  
  v_xp_gained := FLOOR(v_xp_gained * v_xp_multiplier);

  -- Deduct spin
  UPDATE user_spins us
  SET free_spins = us.free_spins - 1, updated_at = now()
  WHERE us.user_id = p_user_id;

  -- Add XP to profile
  UPDATE profiles pr
  SET experience_points = pr.experience_points + v_xp_gained, updated_at = now()
  WHERE pr.user_id = p_user_id;

  -- UPSERT into pokemon_inventory (manual to avoid ambiguity)
  SELECT pi.quantity INTO v_existing_quantity
  FROM pokemon_inventory pi
  WHERE pi.user_id = p_user_id 
    AND pi.pokemon_id = v_selected_pokemon_id 
    AND pi.is_shiny = v_is_shiny;

  IF v_existing_quantity IS NOT NULL THEN
    UPDATE pokemon_inventory pi
    SET quantity = pi.quantity + 1, created_at = now()
    WHERE pi.user_id = p_user_id 
      AND pi.pokemon_id = v_selected_pokemon_id 
      AND pi.is_shiny = v_is_shiny;
  ELSE
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
    VALUES (p_user_id, v_selected_pokemon_id, v_selected_pokemon_name, v_selected_pokemon_rarity, 1, v_is_shiny);
  END IF;

  -- Update missions progress
  PERFORM update_mission_progress(p_user_id, 'spin', 1);
  PERFORM update_launch_event_progress(p_user_id, 'spin', 1);
  
  -- Update achievement progress
  PERFORM update_achievement_progress(p_user_id, 'spins', 1);
  IF v_is_shiny THEN
    PERFORM update_achievement_progress(p_user_id, 'shiny_pokemon', 1);
  END IF;

  RETURN QUERY SELECT 
    true, 
    'Pokemon obtained!'::TEXT, 
    v_selected_pokemon_id, 
    v_selected_pokemon_name, 
    v_selected_pokemon_rarity, 
    v_is_shiny, 
    v_xp_gained;
END;
$$;
