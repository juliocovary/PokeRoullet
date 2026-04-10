-- Fix 1: Marketplace UPDATE policy - remove overly permissive condition
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.marketplace_listings;
CREATE POLICY "Sellers can update their own listings"
ON public.marketplace_listings
FOR UPDATE
USING (auth.uid() = seller_id);

-- Fix 2: Add auth validation to evolve_pokemon function
CREATE OR REPLACE FUNCTION public.evolve_pokemon(p_user_id uuid, p_base_pokemon_id integer, p_evolved_pokemon_id integer, p_evolved_pokemon_name text, p_evolved_pokemon_rarity text, p_cards_required integer DEFAULT 3, p_item_id integer DEFAULT NULL::integer)
 RETURNS TABLE(success boolean, message text, new_pokemon json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity INTEGER;
  item_quantity INTEGER;
  mission_result RECORD;
  achievement_result RECORD;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  RAISE LOG 'evolve_pokemon called for user % base_pokemon % evolved_pokemon %', p_user_id, p_base_pokemon_id, p_evolved_pokemon_id;
  
  -- Check if user has enough cards of base pokemon (non-shiny only for evolution)
  SELECT quantity INTO current_quantity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  
  IF current_quantity IS NULL OR current_quantity < p_cards_required THEN
    RETURN QUERY SELECT FALSE, format('Você precisa de %s cards para evoluir', p_cards_required)::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Check if item is required and user has it
  IF p_item_id IS NOT NULL THEN
    SELECT quantity INTO item_quantity
    FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    IF item_quantity IS NULL OR item_quantity < 1 THEN
      RETURN QUERY SELECT FALSE, 'Você não possui o item necessário para esta evolução'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    -- Consume the item
    UPDATE public.user_items
    SET quantity = quantity - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- Remove item completely if quantity is 0
    DELETE FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id AND quantity <= 0;
  END IF;
  
  -- Consume the required cards (non-shiny)
  IF current_quantity = p_cards_required THEN
    -- Remove completely if using all cards
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  ELSE
    -- Reduce quantity
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_cards_required,
        created_at = now()
    WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  END IF;
  
  -- Add evolved pokemon to inventory (non-shiny)
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, p_evolved_pokemon_id, p_evolved_pokemon_name, p_evolved_pokemon_rarity, 1, false)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET 
    quantity = pokemon_inventory.quantity + 1,
    created_at = now();
  
  RAISE LOG 'Pokemon evolved successfully from % to %', p_base_pokemon_id, p_evolved_pokemon_id;
  
  -- Update mission progress for evolving pokemon
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'evolve', 1);
  
  RAISE LOG 'Mission progress updated for evolution';
  
  -- Update achievement progress for evolving pokemon
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'evolutions', 1);
  
  RAISE LOG 'Achievement progress updated for evolution';
  
  RETURN QUERY SELECT 
    TRUE, 
    format('Seu %s evoluiu para %s!', p_base_pokemon_id, p_evolved_pokemon_name)::TEXT,
    json_build_object(
      'id', p_evolved_pokemon_id,
      'name', p_evolved_pokemon_name,
      'rarity', p_evolved_pokemon_rarity
    );
END;
$function$;

-- Fix 3: Create server-side spin function
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
  p_user_id uuid,
  p_region text,
  p_pokemon_data jsonb,
  p_skip_reload boolean DEFAULT false
)
RETURNS TABLE(
  success boolean,
  message text,
  pokemon_id integer,
  pokemon_name text,
  pokemon_rarity text,
  is_shiny boolean,
  xp_gained integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_free_spins INTEGER;
  v_luck_multiplier NUMERIC;
  v_luck_boost_expires TIMESTAMPTZ;
  v_shiny_boost_expires TIMESTAMPTZ;
  v_xp_multiplier NUMERIC;
  v_final_luck NUMERIC;
  v_random_num NUMERIC;
  v_cumulative NUMERIC := 0;
  v_selected_rarity TEXT := 'common';
  v_adjusted_chances JSONB;
  v_pokemon_of_rarity JSONB;
  v_selected_pokemon JSONB;
  v_pokemon_count INTEGER;
  v_random_index INTEGER;
  v_is_shiny BOOLEAN;
  v_final_shiny_chance NUMERIC;
  v_existing_quantity INTEGER;
  v_base_xp INTEGER;
  v_final_xp INTEGER;
  v_rarity_key TEXT;
  v_rarity_chance NUMERIC;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0, ''::TEXT, ''::TEXT, FALSE, 0;
    RETURN;
  END IF;

  -- Get user's spins and profile data
  SELECT free_spins INTO v_free_spins
  FROM public.user_spins
  WHERE user_id = p_user_id;

  IF NOT p_skip_reload THEN
    IF v_free_spins IS NULL OR v_free_spins <= 0 THEN
      RETURN QUERY SELECT FALSE, 'No free spins available'::TEXT, 0, ''::TEXT, ''::TEXT, FALSE, 0;
      RETURN;
    END IF;
  END IF;

  -- Get profile data for luck/shiny multipliers
  SELECT 
    COALESCE(luck_multiplier, 1.0),
    luck_boost_expires_at,
    shiny_boost_expires_at,
    COALESCE(xp_multiplier, 1.0)
  INTO v_luck_multiplier, v_luck_boost_expires, v_shiny_boost_expires, v_xp_multiplier
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Apply luck boost if active
  v_final_luck := v_luck_multiplier;
  IF v_luck_boost_expires IS NOT NULL AND v_luck_boost_expires > now() THEN
    v_final_luck := v_luck_multiplier * 2;
  END IF;

  -- Calculate adjusted probabilities server-side
  v_adjusted_chances := jsonb_build_object(
    'common', 0.65,
    'uncommon', 0.25,
    'rare', 0.10,
    'pseudo', 0.01,
    'starter', 0.005,
    'legendary', 0.001,
    'secret', 0.0001
  );

  -- Adjust chances based on luck
  DECLARE
    v_increment NUMERIC := v_final_luck - 1.0;
    v_total_increase NUMERIC := 0;
    v_total NUMERIC := 0;
  BEGIN
    -- Increase rare+ rarities
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{rare}', to_jsonb((v_adjusted_chances->>'rare')::NUMERIC * (1 + v_increment)));
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{pseudo}', to_jsonb((v_adjusted_chances->>'pseudo')::NUMERIC * (1 + v_increment)));
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{starter}', to_jsonb((v_adjusted_chances->>'starter')::NUMERIC * (1 + v_increment)));
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{legendary}', to_jsonb((v_adjusted_chances->>'legendary')::NUMERIC * (1 + v_increment)));
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{secret}', to_jsonb((v_adjusted_chances->>'secret')::NUMERIC * (1 + v_increment)));

    -- Calculate total increase
    v_total_increase := 
      ((v_adjusted_chances->>'rare')::NUMERIC - 0.10) +
      ((v_adjusted_chances->>'pseudo')::NUMERIC - 0.01) +
      ((v_adjusted_chances->>'starter')::NUMERIC - 0.005) +
      ((v_adjusted_chances->>'legendary')::NUMERIC - 0.001) +
      ((v_adjusted_chances->>'secret')::NUMERIC - 0.0001);

    -- Decrease common/uncommon to compensate
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{common}', to_jsonb(GREATEST(0.01, (v_adjusted_chances->>'common')::NUMERIC - v_total_increase / 2)));
    v_adjusted_chances := jsonb_set(v_adjusted_chances, '{uncommon}', to_jsonb(GREATEST(0.01, (v_adjusted_chances->>'uncommon')::NUMERIC - v_total_increase / 2)));

    -- Normalize to sum to 1.0
    v_total := (v_adjusted_chances->>'common')::NUMERIC + (v_adjusted_chances->>'uncommon')::NUMERIC +
               (v_adjusted_chances->>'rare')::NUMERIC + (v_adjusted_chances->>'pseudo')::NUMERIC +
               (v_adjusted_chances->>'starter')::NUMERIC + (v_adjusted_chances->>'legendary')::NUMERIC +
               (v_adjusted_chances->>'secret')::NUMERIC;

    v_adjusted_chances := jsonb_build_object(
      'common', (v_adjusted_chances->>'common')::NUMERIC / v_total,
      'uncommon', (v_adjusted_chances->>'uncommon')::NUMERIC / v_total,
      'rare', (v_adjusted_chances->>'rare')::NUMERIC / v_total,
      'pseudo', (v_adjusted_chances->>'pseudo')::NUMERIC / v_total,
      'starter', (v_adjusted_chances->>'starter')::NUMERIC / v_total,
      'legendary', (v_adjusted_chances->>'legendary')::NUMERIC / v_total,
      'secret', (v_adjusted_chances->>'secret')::NUMERIC / v_total
    );
  END;

  -- Server-side random number generation
  v_random_num := random();

  -- Select rarity based on probabilities
  v_cumulative := 0;
  FOR v_rarity_key, v_rarity_chance IN SELECT key, value::NUMERIC FROM jsonb_each_text(v_adjusted_chances) LOOP
    v_cumulative := v_cumulative + v_rarity_chance;
    IF v_random_num <= v_cumulative THEN
      v_selected_rarity := v_rarity_key;
      EXIT;
    END IF;
  END LOOP;

  -- Filter pokemon by rarity and region from passed data
  SELECT jsonb_agg(p)
  INTO v_pokemon_of_rarity
  FROM jsonb_array_elements(p_pokemon_data) AS p
  WHERE p->>'rarity' = v_selected_rarity
    AND (
      (p_region = 'kanto' AND (p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR
      (p_region = 'johto' AND (p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR
      (p_region = 'hoenn' AND (p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR
      (p_region = 'sinnoh' AND (p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492)
    );

  -- Fallback if no pokemon found for rarity
  IF v_pokemon_of_rarity IS NULL OR jsonb_array_length(v_pokemon_of_rarity) = 0 THEN
    v_selected_rarity := 'common';
    SELECT jsonb_agg(p)
    INTO v_pokemon_of_rarity
    FROM jsonb_array_elements(p_pokemon_data) AS p
    WHERE p->>'rarity' = 'common'
      AND (
        (p_region = 'kanto' AND (p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR
        (p_region = 'johto' AND (p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR
        (p_region = 'hoenn' AND (p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR
        (p_region = 'sinnoh' AND (p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492)
      );
  END IF;

  -- Select random pokemon from filtered list using server-side random
  v_pokemon_count := jsonb_array_length(v_pokemon_of_rarity);
  v_random_index := floor(random() * v_pokemon_count);
  v_selected_pokemon := v_pokemon_of_rarity->v_random_index;

  -- Determine shiny status with server-side random
  v_final_shiny_chance := 0.01;
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_final_shiny_chance := 0.02;
  END IF;
  v_is_shiny := random() < v_final_shiny_chance;

  -- Decrement spins if not skip_reload
  IF NOT p_skip_reload THEN
    UPDATE public.user_spins
    SET free_spins = free_spins - 1,
        last_spin_reset = now(),
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Add to inventory (upsert)
  SELECT quantity INTO v_existing_quantity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id 
    AND pokemon_id = (v_selected_pokemon->>'id')::INTEGER
    AND is_shiny = v_is_shiny;

  IF v_existing_quantity IS NOT NULL THEN
    UPDATE public.pokemon_inventory
    SET quantity = quantity + 1, created_at = now()
    WHERE user_id = p_user_id 
      AND pokemon_id = (v_selected_pokemon->>'id')::INTEGER
      AND is_shiny = v_is_shiny;
  ELSE
    INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
    VALUES (
      p_user_id,
      (v_selected_pokemon->>'id')::INTEGER,
      v_selected_pokemon->>'name',
      v_selected_rarity,
      1,
      v_is_shiny
    );
  END IF;

  -- Calculate XP
  v_base_xp := CASE v_selected_rarity
    WHEN 'common' THEN 20
    WHEN 'uncommon' THEN 25
    WHEN 'rare' THEN 40
    WHEN 'pseudo' THEN 75
    WHEN 'starter' THEN 100
    WHEN 'legendary' THEN 500
    WHEN 'secret' THEN 2500
    ELSE 20
  END;
  v_final_xp := floor(v_base_xp * v_xp_multiplier);

  -- Add experience
  PERFORM add_experience(p_user_id, v_final_xp);

  -- Update mission progress
  PERFORM update_mission_progress(p_user_id, 'spin', 1);
  PERFORM update_achievement_progress(p_user_id, 'spins', 1);
  PERFORM update_launch_event_progress(p_user_id, 'spin', 1);

  -- Update legendary achievement if applicable
  IF v_selected_rarity = 'legendary' THEN
    PERFORM update_achievement_progress(p_user_id, 'legendary_capture', 1);
  END IF;

  -- Update rare catch mission if applicable
  IF v_selected_rarity IN ('rare', 'pseudo', 'legendary', 'secret') THEN
    PERFORM update_mission_progress(p_user_id, 'catch_rare', 1);
  END IF;

  RETURN QUERY SELECT 
    TRUE,
    'Spin successful!'::TEXT,
    (v_selected_pokemon->>'id')::INTEGER,
    (v_selected_pokemon->>'name')::TEXT,
    v_selected_rarity,
    v_is_shiny,
    v_final_xp;
END;
$function$;