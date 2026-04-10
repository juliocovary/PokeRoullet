-- 1) Update roulette boost values: Shiny I = 20%, Shiny II = 35% (multiplicative percentages)
UPDATE roulette_boosts SET boost_value = 20 WHERE boost_type = 'shiny_chance' AND tier = 1;
UPDATE roulette_boosts SET boost_value = 35 WHERE boost_type = 'shiny_chance' AND tier = 2;

-- 2) Recreate spin_pokemon_roulette with new shiny logic
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(p_user_id uuid, p_region text, p_pokemon_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_spin_refund_chance numeric;
  v_spin_refunded boolean := false;
  v_shiny_boost_value numeric := 0;
  v_xp_boost_value numeric := 0;
  v_badge_shiny_bonus numeric := 0;
  v_badge_xp_bonus numeric := 0;
  v_slot_1 integer;
  v_slot_2 integer;
  v_slot_3 integer;
BEGIN
  IF p_pokemon_data IS NULL THEN
    RAISE EXCEPTION 'Pokemon data is required';
  END IF;
  
  v_pokemon_id := (p_pokemon_data->>'id')::integer;
  v_pokemon_name := p_pokemon_data->>'name';
  v_pokemon_rarity := p_pokemon_data->>'rarity';
  
  IF v_pokemon_id IS NULL OR v_pokemon_name IS NULL OR v_pokemon_rarity IS NULL THEN
    RAISE EXCEPTION 'Invalid pokemon data: id, name, and rarity are required';
  END IF;

  SELECT free_spins INTO v_current_spins FROM user_spins WHERE user_id = p_user_id;
  
  IF v_current_spins IS NULL OR v_current_spins <= 0 THEN
    RAISE EXCEPTION 'No free spins available';
  END IF;
  
  UPDATE user_spins SET free_spins = free_spins - 1, updated_at = now() WHERE user_id = p_user_id;
  
  SELECT 
    COALESCE(SUM(CASE WHEN rb.boost_type = 'spin_refund' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'shiny_chance' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'xp_bonus' THEN rb.boost_value ELSE 0 END), 0)
  INTO v_spin_refund_chance, v_shiny_boost_value, v_xp_boost_value
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id AND urb.is_active = true;
  
  SELECT slot_1_item_id, slot_2_item_id, slot_3_item_id
  INTO v_slot_1, v_slot_2, v_slot_3
  FROM user_equipped_badges WHERE user_id = p_user_id;
  
  IF FOUND THEN
    IF v_slot_1 = 200 OR v_slot_2 = 200 OR v_slot_3 = 200 THEN
      v_badge_xp_bonus := v_badge_xp_bonus + 0.15;
    END IF;
    IF v_slot_1 = 202 OR v_slot_2 = 202 OR v_slot_3 = 202 THEN
      v_badge_shiny_bonus := v_badge_shiny_bonus + 0.005;
    END IF;
  END IF;
  
  IF v_spin_refund_chance > 0 AND random() * 100 < v_spin_refund_chance THEN
    UPDATE user_spins SET free_spins = free_spins + 1, updated_at = now() WHERE user_id = p_user_id;
    v_spin_refunded := true;
  END IF;
  
  -- Base shiny chance: 0.5% (0.005)
  v_shiny_chance := 0.005;
  
  -- Roulette boosts: multiplicative % on base (e.g. 20 = base * 1.20)
  IF v_shiny_boost_value > 0 THEN
    v_shiny_chance := v_shiny_chance * (1.0 + v_shiny_boost_value / 100.0);
  END IF;
  
  -- Badge shiny bonus: absolute addition
  v_shiny_chance := v_shiny_chance + v_badge_shiny_bonus;
  
  -- Shiny potion: 2x multiplier on current total
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires FROM profiles WHERE user_id = p_user_id;
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := v_shiny_chance * 2.0;
  END IF;
  
  v_is_shiny := random() < v_shiny_chance;
  
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20
  END;
  
  IF v_xp_boost_value > 0 OR v_badge_xp_bonus > 0 THEN
    v_xp_earned := CEIL(v_xp_earned * (1.0 + v_xp_boost_value / 100.0 + v_badge_xp_bonus));
  END IF;
  
  SELECT ae.new_level, ae.level_up INTO v_new_level, v_leveled_up
  FROM public.add_experience(p_user_id, v_xp_earned) ae;
  
  SELECT id INTO v_existing_id FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = v_pokemon_id AND is_shiny = v_is_shiny LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE pokemon_inventory SET quantity = quantity + 1 WHERE id = v_existing_id;
  ELSE
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, 1);
  END IF;
  
  UPDATE user_missions
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT goal FROM missions WHERE id = user_missions.mission_id) THEN true ELSE completed END,
      updated_at = now()
  WHERE user_id = p_user_id AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE type = 'spin');
  
  PERFORM add_clan_points(p_user_id, 1, 'spin');
  
  RETURN jsonb_build_object(
    'success', true,
    'pokemon', jsonb_build_object(
      'id', v_pokemon_id,
      'name', v_pokemon_name,
      'rarity', v_pokemon_rarity,
      'isShiny', v_is_shiny
    ),
    'xp_earned', v_xp_earned,
    'leveled_up', v_leveled_up,
    'new_level', v_new_level,
    'spin_refunded', v_spin_refunded,
    'shiny_chance_applied', v_shiny_chance
  );
END;
$function$;

-- 3) Recreate add_pokemon_without_spin with same new shiny logic
CREATE OR REPLACE FUNCTION public.add_pokemon_without_spin(p_user_id uuid, p_region text, p_pokemon_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_shiny_boost_value numeric := 0;
  v_xp_boost_value numeric := 0;
  v_spin_refund_chance numeric := 0;
  v_spin_refunded boolean := false;
  v_badge_shiny_bonus numeric := 0;
  v_badge_xp_bonus numeric := 0;
  v_slot_1 integer;
  v_slot_2 integer;
  v_slot_3 integer;
BEGIN
  IF p_pokemon_data IS NULL THEN
    RAISE EXCEPTION 'Pokemon data is required';
  END IF;
  
  v_pokemon_id := (p_pokemon_data->>'id')::integer;
  v_pokemon_name := p_pokemon_data->>'name';
  v_pokemon_rarity := p_pokemon_data->>'rarity';
  
  IF v_pokemon_id IS NULL OR v_pokemon_name IS NULL OR v_pokemon_rarity IS NULL THEN
    RAISE EXCEPTION 'Invalid pokemon data: id, name, and rarity are required';
  END IF;
  
  SELECT 
    COALESCE(SUM(CASE WHEN rb.boost_type = 'shiny_chance' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'xp_bonus' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'spin_refund' THEN rb.boost_value ELSE 0 END), 0)
  INTO v_shiny_boost_value, v_xp_boost_value, v_spin_refund_chance
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id AND urb.is_active = true;
  
  SELECT slot_1_item_id, slot_2_item_id, slot_3_item_id
  INTO v_slot_1, v_slot_2, v_slot_3
  FROM user_equipped_badges WHERE user_id = p_user_id;
  
  IF FOUND THEN
    IF v_slot_1 = 200 OR v_slot_2 = 200 OR v_slot_3 = 200 THEN
      v_badge_xp_bonus := v_badge_xp_bonus + 0.15;
    END IF;
    IF v_slot_1 = 202 OR v_slot_2 = 202 OR v_slot_3 = 202 THEN
      v_badge_shiny_bonus := v_badge_shiny_bonus + 0.005;
    END IF;
  END IF;
  
  IF v_spin_refund_chance > 0 AND random() * 100 < v_spin_refund_chance THEN
    UPDATE user_spins SET free_spins = free_spins + 1, updated_at = now() WHERE user_id = p_user_id;
    v_spin_refunded := true;
  END IF;
  
  -- Base shiny chance: 0.5% (0.005)
  v_shiny_chance := 0.005;
  
  -- Roulette boosts: multiplicative % on base
  IF v_shiny_boost_value > 0 THEN
    v_shiny_chance := v_shiny_chance * (1.0 + v_shiny_boost_value / 100.0);
  END IF;
  
  -- Badge shiny bonus: absolute addition
  v_shiny_chance := v_shiny_chance + v_badge_shiny_bonus;
  
  -- Shiny potion: 2x multiplier on current total
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires FROM profiles WHERE user_id = p_user_id;
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := v_shiny_chance * 2.0;
  END IF;
  
  v_is_shiny := random() < v_shiny_chance;
  
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20
  END;
  
  IF v_xp_boost_value > 0 OR v_badge_xp_bonus > 0 THEN
    v_xp_earned := CEIL(v_xp_earned * (1.0 + v_xp_boost_value / 100.0 + v_badge_xp_bonus));
  END IF;
  
  SELECT ae.new_level, ae.level_up INTO v_new_level, v_leveled_up
  FROM public.add_experience(p_user_id, v_xp_earned) ae;
  
  SELECT id INTO v_existing_id FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = v_pokemon_id AND is_shiny = v_is_shiny LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE pokemon_inventory SET quantity = quantity + 1 WHERE id = v_existing_id;
  ELSE
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, 1);
  END IF;
  
  UPDATE user_missions
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT goal FROM missions WHERE id = user_missions.mission_id) THEN true ELSE completed END,
      updated_at = now()
  WHERE user_id = p_user_id AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE type = 'spin');
  
  PERFORM add_clan_points(p_user_id, 1, 'spin');
  
  RETURN jsonb_build_object(
    'success', true,
    'pokemon', jsonb_build_object(
      'id', v_pokemon_id,
      'name', v_pokemon_name,
      'rarity', v_pokemon_rarity,
      'isShiny', v_is_shiny
    ),
    'xp_earned', v_xp_earned,
    'leveled_up', v_leveled_up,
    'new_level', v_new_level,
    'spin_refunded', v_spin_refunded,
    'shiny_chance_applied', v_shiny_chance
  );
END;
$function$;