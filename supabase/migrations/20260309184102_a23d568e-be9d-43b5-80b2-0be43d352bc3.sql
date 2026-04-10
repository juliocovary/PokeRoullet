
-- =============================================
-- 1. Update spin_pokemon_roulette to apply ALL roulette boosts
-- =============================================
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb
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
  v_spin_refund_chance numeric;
  v_spin_refunded boolean := false;
  v_shiny_boost_value numeric := 0;
  v_xp_boost_value numeric := 0;
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
  
  -- Deduct spin
  UPDATE user_spins SET free_spins = free_spins - 1, updated_at = now() WHERE user_id = p_user_id;
  
  -- ====== FETCH ALL ROULETTE BOOSTS AT ONCE ======
  SELECT 
    COALESCE(SUM(CASE WHEN rb.boost_type = 'spin_refund' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'shiny_chance' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'xp_bonus' THEN rb.boost_value ELSE 0 END), 0)
  INTO v_spin_refund_chance, v_shiny_boost_value, v_xp_boost_value
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id
    AND urb.is_active = true;
  
  -- Check spin_refund boost
  IF v_spin_refund_chance > 0 AND random() * 100 < v_spin_refund_chance THEN
    UPDATE user_spins SET free_spins = free_spins + 1, updated_at = now() WHERE user_id = p_user_id;
    v_spin_refunded := true;
  END IF;
  
  -- Calculate shiny chance (base + potion + roulette boost)
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires FROM profiles WHERE user_id = p_user_id;
  
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := 0.05; -- 5% with potion
  ELSE
    v_shiny_chance := 0.01; -- 1% base
  END IF;
  
  -- Add roulette boost shiny_chance (boost_value is in %, e.g. 2 = +2%)
  v_shiny_chance := v_shiny_chance + (v_shiny_boost_value / 100.0);
  
  v_is_shiny := random() < v_shiny_chance;
  
  -- Calculate XP (base by rarity)
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20
  END;
  
  -- Apply XP boost (boost_value is in %, e.g. 15 = +15%)
  IF v_xp_boost_value > 0 THEN
    v_xp_earned := CEIL(v_xp_earned * (1.0 + v_xp_boost_value / 100.0));
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

  -- === CLAN POINTS ===
  PERFORM add_clan_points(p_user_id, 1, 'spin');
  IF v_is_shiny THEN
    PERFORM add_clan_points(p_user_id, 50, 'shiny_catch');
  END IF;
  IF v_pokemon_rarity = 'legendary' THEN
    PERFORM add_clan_points(p_user_id, 100, 'legendary_catch');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'pokemon', jsonb_build_object('id', v_pokemon_id, 'name', v_pokemon_name, 'rarity', v_pokemon_rarity, 'isShiny', v_is_shiny),
    'xp_earned', v_xp_earned, 'new_level', v_new_level, 'level_up', v_leveled_up, 'leveled_up', v_leveled_up,
    'spins_remaining', (SELECT free_spins FROM user_spins WHERE user_id = p_user_id),
    'shiny_chance_applied', v_shiny_chance,
    'spin_refunded', v_spin_refunded
  );
END;
$$;

-- =============================================
-- 2. Update add_pokemon_without_spin with ALL boosts
-- =============================================
CREATE OR REPLACE FUNCTION public.add_pokemon_without_spin(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb
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
  v_shiny_boost_value numeric := 0;
  v_xp_boost_value numeric := 0;
  v_spin_refund_chance numeric := 0;
  v_spin_refunded boolean := false;
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
  
  -- ====== FETCH ALL ROULETTE BOOSTS AT ONCE ======
  SELECT 
    COALESCE(SUM(CASE WHEN rb.boost_type = 'shiny_chance' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'xp_bonus' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'spin_refund' THEN rb.boost_value ELSE 0 END), 0)
  INTO v_shiny_boost_value, v_xp_boost_value, v_spin_refund_chance
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id
    AND urb.is_active = true;
  
  -- Spin refund for multi-spin: chance to refund 1 spin back
  IF v_spin_refund_chance > 0 AND random() * 100 < v_spin_refund_chance THEN
    UPDATE user_spins SET free_spins = free_spins + 1, updated_at = now() WHERE user_id = p_user_id;
    v_spin_refunded := true;
  END IF;
  
  -- Server-side shiny calculation (base + potion + roulette boost)
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires
  FROM profiles WHERE user_id = p_user_id;
  
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := 0.05;
  ELSE
    v_shiny_chance := 0.01;
  END IF;
  
  -- Add roulette boost shiny_chance
  v_shiny_chance := v_shiny_chance + (v_shiny_boost_value / 100.0);
  
  v_is_shiny := random() < v_shiny_chance;
  
  -- Calculate XP
  v_xp_earned := CASE v_pokemon_rarity
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'rare' THEN 40
    WHEN 'uncommon' THEN 25
    ELSE 20
  END;
  
  -- Apply XP boost
  IF v_xp_boost_value > 0 THEN
    v_xp_earned := CEIL(v_xp_earned * (1.0 + v_xp_boost_value / 100.0));
  END IF;
  
  -- Add experience
  SELECT ae.new_level, ae.level_up
  INTO v_new_level, v_leveled_up
  FROM public.add_experience(p_user_id, v_xp_earned) ae;
  
  -- Upsert inventory
  SELECT id INTO v_existing_id
  FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = v_pokemon_id AND is_shiny = v_is_shiny
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE pokemon_inventory SET quantity = quantity + 1 WHERE id = v_existing_id;
  ELSE
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
  
  -- === CLAN POINTS ===
  PERFORM add_clan_points(p_user_id, 1, 'spin');
  IF v_is_shiny THEN
    PERFORM add_clan_points(p_user_id, 50, 'shiny_catch');
  END IF;
  IF v_pokemon_rarity = 'legendary' THEN
    PERFORM add_clan_points(p_user_id, 100, 'legendary_catch');
  ELSIF v_pokemon_rarity IN ('rare', 'pseudo', 'starter') THEN
    PERFORM add_clan_points(p_user_id, 25, 'rare_catch');
  END IF;
  
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
    'shiny_chance_applied', v_shiny_chance,
    'spin_refunded', v_spin_refunded
  );
END;
$$;

-- =============================================
-- 3. Create helper RPC to get active roulette boost totals for client-side use
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_roulette_boosts(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_luck_bonus numeric := 0;
  v_secret_chance numeric := 0;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN rb.boost_type = 'luck_bonus' THEN rb.boost_value ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN rb.boost_type = 'secret_chance' THEN rb.boost_value ELSE 0 END), 0)
  INTO v_luck_bonus, v_secret_chance
  FROM user_roulette_boosts urb
  JOIN roulette_boosts rb ON rb.id = urb.boost_id
  WHERE urb.user_id = p_user_id
    AND urb.is_active = true;
  
  RETURN jsonb_build_object(
    'luck_bonus', v_luck_bonus,
    'secret_chance', v_secret_chance
  );
END;
$$;
