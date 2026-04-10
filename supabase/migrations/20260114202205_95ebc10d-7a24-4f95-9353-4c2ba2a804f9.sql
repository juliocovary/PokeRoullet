-- Fix existing inconsistent levels first
UPDATE profiles
SET level = FLOOR(SQRT(experience_points / 100.0)) + 1
WHERE level != FLOOR(SQRT(experience_points / 100.0)) + 1;

-- Recreate spin_pokemon_roulette with correct XP values and add_experience call
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_pokemon_name TEXT,
  p_pokemon_sprite TEXT,
  p_pokemon_rarity TEXT,
  p_is_shiny BOOLEAN DEFAULT false,
  p_region TEXT DEFAULT 'kanto',
  p_skip_reload BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_spins INTEGER;
  v_xp_gained INTEGER;
  v_new_count INTEGER;
  v_unlocked_regions TEXT[];
  v_valid_regions TEXT[] := ARRAY['kanto', 'johto', 'hoenn', 'sinnoh', 'unova'];
  v_region_pokemon_ranges JSONB := '{
    "kanto": [1, 151],
    "johto": [152, 251],
    "hoenn": [252, 386],
    "sinnoh": [387, 493],
    "unova": [494, 649]
  }'::JSONB;
  v_range JSONB;
  v_min_id INTEGER;
  v_max_id INTEGER;
  v_is_valid BOOLEAN := false;
  v_secret_ids INTEGER[] := ARRAY[151, 251, 386, 493];
  v_r TEXT;
BEGIN
  -- Security check
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Get current spins
  SELECT remaining_spins INTO v_current_spins
  FROM user_spins
  WHERE user_id = p_user_id;

  IF v_current_spins IS NULL OR v_current_spins <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_spins');
  END IF;

  -- Validate region and pokemon_id
  IF p_region = 'all' THEN
    SELECT unlocked_regions INTO v_unlocked_regions
    FROM profiles
    WHERE id = p_user_id;

    IF v_unlocked_regions IS NULL THEN
      v_unlocked_regions := ARRAY['kanto'];
    END IF;

    -- Check if pokemon_id is in any unlocked region OR is a secret
    IF p_pokemon_id = ANY(v_secret_ids) THEN
      v_is_valid := true;
    ELSE
      FOREACH v_r IN ARRAY v_unlocked_regions LOOP
        v_range := v_region_pokemon_ranges -> v_r;
        IF v_range IS NOT NULL THEN
          v_min_id := (v_range ->> 0)::INTEGER;
          v_max_id := (v_range ->> 1)::INTEGER;
          IF p_pokemon_id >= v_min_id AND p_pokemon_id <= v_max_id THEN
            v_is_valid := true;
            EXIT;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    -- Single region validation
    IF NOT (p_region = ANY(v_valid_regions)) THEN
      RETURN json_build_object('success', false, 'error', 'invalid_region');
    END IF;

    v_range := v_region_pokemon_ranges -> p_region;
    v_min_id := (v_range ->> 0)::INTEGER;
    v_max_id := (v_range ->> 1)::INTEGER;

    IF p_pokemon_id >= v_min_id AND p_pokemon_id <= v_max_id THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN json_build_object('success', false, 'error', 'invalid_pokemon_for_region');
  END IF;

  -- Calculate XP based on rarity (aligned with frontend XP_BY_RARITY)
  v_xp_gained := CASE p_pokemon_rarity
    WHEN 'common' THEN 20
    WHEN 'uncommon' THEN 25
    WHEN 'rare' THEN 40
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    ELSE 10
  END;

  -- Decrement spins
  UPDATE user_spins
  SET remaining_spins = remaining_spins - 1,
      last_spin_at = NOW()
  WHERE user_id = p_user_id;

  -- Manual UPSERT for pokemon_inventory to avoid ambiguity
  SELECT count INTO v_new_count
  FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_new_count IS NULL THEN
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, pokemon_sprite, rarity, is_shiny, count)
    VALUES (p_user_id, p_pokemon_id, p_pokemon_name, p_pokemon_sprite, p_pokemon_rarity, p_is_shiny, 1);
    v_new_count := 1;
  ELSE
    UPDATE pokemon_inventory
    SET count = count + 1
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny
    RETURNING count INTO v_new_count;
  END IF;

  -- Add experience using the add_experience function (handles level-up automatically)
  PERFORM add_experience(p_user_id, v_xp_gained);

  -- Update missions
  UPDATE user_missions
  SET current_progress = current_progress + 1
  WHERE user_id = p_user_id
    AND mission_type IN ('spin', 'catch_pokemon')
    AND NOT completed;

  -- Update rarity-specific missions
  UPDATE user_missions
  SET current_progress = current_progress + 1
  WHERE user_id = p_user_id
    AND mission_type = 'catch_rarity'
    AND mission_target = p_pokemon_rarity
    AND NOT completed;

  -- Update shiny missions
  IF p_is_shiny THEN
    UPDATE user_missions
    SET current_progress = current_progress + 1
    WHERE user_id = p_user_id
      AND mission_type = 'catch_shiny'
      AND NOT completed;
  END IF;

  RETURN json_build_object(
    'success', true,
    'xp_gained', v_xp_gained,
    'new_count', v_new_count,
    'is_shiny', p_is_shiny
  );
END;
$$;