-- Fix open_card_pack: generate cards from unlocked region pools instead of user inventory
-- - Uses official dex ranges per region
-- - Applies rarity filtering over candidate IDs
-- - Uses fallback common Pokemon from the first valid unlocked region

CREATE OR REPLACE FUNCTION public.open_card_pack(p_user_id uuid, p_pack_type_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack_type record;
  v_user_pack record;
  v_results jsonb := '[]'::jsonb;

  v_card_index integer;
  v_roll numeric;
  v_cumulative numeric;
  v_selected_rarity text;
  v_rarity_key text;
  v_rarity_value numeric;

  v_unlocked_regions text[];
  v_region text;

  v_total_pool_size integer := 0;
  v_random_pick integer;
  v_running_total integer;

  v_min_id integer;
  v_max_id integer;
  v_pokemon_id integer;
  v_pokemon_name text;

  v_found boolean;
  v_try integer;

  v_fallback_min integer := 1;
  v_fallback_max integer := 151;
  v_has_valid_region boolean := false;

  v_is_secret boolean;
  v_is_legendary boolean;
  v_is_pseudo boolean;
  v_is_starter boolean;
  v_is_rare boolean;
  v_is_uncommon boolean;

  v_is_shiny boolean;
  v_shiny_roll numeric;
BEGIN
  -- Validate caller
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Validate pack type
  SELECT * INTO v_pack_type
  FROM pack_types
  WHERE id = p_pack_type_id;

  IF v_pack_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid pack type');
  END IF;

  -- Check available packs
  SELECT * INTO v_user_pack
  FROM user_packs
  WHERE user_id = p_user_id
    AND pack_type_id = p_pack_type_id
    AND quantity > 0;

  IF v_user_pack IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No packs available');
  END IF;

  -- Consume one pack
  UPDATE user_packs
  SET quantity = quantity - 1,
      updated_at = now()
  WHERE id = v_user_pack.id;

  DELETE FROM user_packs
  WHERE id = v_user_pack.id
    AND quantity <= 0;

  -- Get unlocked regions (fallback to Kanto)
  SELECT COALESCE(unlocked_regions, ARRAY['kanto']::text[])
  INTO v_unlocked_regions
  FROM profiles
  WHERE user_id = p_user_id;

  -- Build total pool size and first valid region fallback range
  FOREACH v_region IN ARRAY v_unlocked_regions LOOP
    CASE v_region
      WHEN 'kanto' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 1;
          v_fallback_max := 151;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 151;
      WHEN 'johto' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 152;
          v_fallback_max := 251;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 100;
      WHEN 'hoenn' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 252;
          v_fallback_max := 386;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 135;
      WHEN 'sinnoh' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 387;
          v_fallback_max := 493;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 107;
      WHEN 'unova' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 494;
          v_fallback_max := 649;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 156;
      WHEN 'kalos' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 650;
          v_fallback_max := 721;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 72;
      WHEN 'alola' THEN
        IF NOT v_has_valid_region THEN
          v_fallback_min := 722;
          v_fallback_max := 809;
          v_has_valid_region := true;
        END IF;
        v_total_pool_size := v_total_pool_size + 88;
      ELSE
        NULL;
    END CASE;
  END LOOP;

  -- Defensive fallback if profile has only unknown regions
  IF v_total_pool_size <= 0 THEN
    v_unlocked_regions := ARRAY['kanto']::text[];
    v_fallback_min := 1;
    v_fallback_max := 151;
    v_total_pool_size := 151;
  END IF;

  -- Generate each card
  FOR v_card_index IN 1..v_pack_type.card_count LOOP
    -- Rarity roll based on pack config
    v_roll := random() * 100;
    v_cumulative := 0;
    v_selected_rarity := 'common';

    FOR v_rarity_key, v_rarity_value IN
      SELECT key, value::numeric
      FROM jsonb_each_text(v_pack_type.rarity_weights)
    LOOP
      v_cumulative := v_cumulative + v_rarity_value;
      IF v_roll <= v_cumulative THEN
        v_selected_rarity := v_rarity_key;
        EXIT;
      END IF;
    END LOOP;

    -- Hard guarantee: Secret Ancient pack must always roll secret.
    IF p_pack_type_id = 'secreto_ruina' THEN
      v_selected_rarity := 'secret';
    END IF;

    v_found := false;

    -- Try multiple random candidates from unlocked region pool
    FOR v_try IN 1..50 LOOP
      v_random_pick := floor(random() * v_total_pool_size)::integer + 1;
      v_running_total := 0;
      v_pokemon_id := NULL;

      FOREACH v_region IN ARRAY v_unlocked_regions LOOP
        CASE v_region
          WHEN 'kanto' THEN v_min_id := 1; v_max_id := 151;
          WHEN 'johto' THEN v_min_id := 152; v_max_id := 251;
          WHEN 'hoenn' THEN v_min_id := 252; v_max_id := 386;
          WHEN 'sinnoh' THEN v_min_id := 387; v_max_id := 493;
          WHEN 'unova' THEN v_min_id := 494; v_max_id := 649;
          WHEN 'kalos' THEN v_min_id := 650; v_max_id := 721;
          WHEN 'alola' THEN v_min_id := 722; v_max_id := 809;
          ELSE CONTINUE;
        END CASE;

        IF v_random_pick <= v_running_total + (v_max_id - v_min_id + 1) THEN
          v_pokemon_id := v_min_id + (v_random_pick - v_running_total - 1);
          EXIT;
        END IF;

        v_running_total := v_running_total + (v_max_id - v_min_id + 1);
      END LOOP;

      IF v_pokemon_id IS NULL THEN
        v_pokemon_id := v_fallback_min + floor(random() * (v_fallback_max - v_fallback_min + 1))::integer;
      END IF;

      -- Classify candidate by rarity buckets
      v_is_secret := v_pokemon_id IN (151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809);

      v_is_legendary := v_pokemon_id IN (
        144, 145, 146, 150,
        243, 244, 245, 249, 250,
        377, 378, 379, 380, 381, 382, 383, 384, 385,
        480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492,
        638, 639, 640, 641, 642, 643, 644, 645, 646,
        716, 717, 718,
        785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 803, 804, 805, 806
      );

      v_is_pseudo := v_pokemon_id IN (
        147, 148, 149,
        246, 247, 248,
        371, 372, 373,
        374, 375, 376,
        443, 444, 445,
        610, 611, 612,
        633, 634, 635,
        704, 705, 706,
        782, 783, 784
      );

      v_is_starter := v_pokemon_id IN (
        1,2,3,4,5,6,7,8,9,
        152,153,154,155,156,157,158,159,160,
        252,253,254,255,256,257,258,259,260,
        387,388,389,390,391,392,393,394,395,
        495,496,497,498,499,500,501,502,503,
        650,651,652,653,654,655,656,657,658,
        722,723,724,725,726,727,728,729,730
      );

      v_is_rare := (
        (v_pokemon_id BETWEEN 1 AND 151 AND v_pokemon_id >= 130) OR
        (v_pokemon_id BETWEEN 152 AND 251 AND v_pokemon_id >= 225) OR
        (v_pokemon_id BETWEEN 252 AND 386 AND v_pokemon_id >= 355) OR
        (v_pokemon_id BETWEEN 387 AND 493 AND v_pokemon_id >= 460) OR
        (v_pokemon_id BETWEEN 494 AND 649 AND v_pokemon_id >= 620) OR
        (v_pokemon_id BETWEEN 650 AND 721 AND v_pokemon_id >= 700) OR
        (v_pokemon_id BETWEEN 722 AND 809 AND v_pokemon_id >= 775)
      );

      v_is_uncommon := (
        (v_pokemon_id BETWEEN 1 AND 151 AND v_pokemon_id BETWEEN 60 AND 129) OR
        (v_pokemon_id BETWEEN 152 AND 251 AND v_pokemon_id BETWEEN 185 AND 224) OR
        (v_pokemon_id BETWEEN 252 AND 386 AND v_pokemon_id BETWEEN 310 AND 354) OR
        (v_pokemon_id BETWEEN 387 AND 493 AND v_pokemon_id BETWEEN 430 AND 459) OR
        (v_pokemon_id BETWEEN 494 AND 649 AND v_pokemon_id BETWEEN 570 AND 619) OR
        (v_pokemon_id BETWEEN 650 AND 721 AND v_pokemon_id BETWEEN 680 AND 699) OR
        (v_pokemon_id BETWEEN 722 AND 809 AND v_pokemon_id BETWEEN 755 AND 774)
      );

      CASE v_selected_rarity
        WHEN 'secret' THEN
          v_found := v_is_secret;
        WHEN 'legendary' THEN
          v_found := v_is_legendary;
        WHEN 'pseudo' THEN
          v_found := v_is_pseudo;
        WHEN 'starter' THEN
          v_found := v_is_starter;
        WHEN 'rare' THEN
          v_found := v_is_rare;
        WHEN 'uncommon' THEN
          v_found := v_is_uncommon;
        ELSE
          -- common = everything outside all special buckets
          v_found := NOT (v_is_secret OR v_is_legendary OR v_is_pseudo OR v_is_starter OR v_is_rare OR v_is_uncommon);
      END CASE;

      IF v_found THEN
        EXIT;
      END IF;
    END LOOP;

    -- If we still cannot match after retries, try a direct rarity-specific fallback first
    IF NOT v_found THEN
      IF v_selected_rarity = 'secret' THEN
        SELECT candidate
        INTO v_pokemon_id
        FROM (
          SELECT x AS candidate
          FROM unnest(ARRAY[151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809]) AS x
          WHERE (
            ('kanto' = ANY(v_unlocked_regions) AND x BETWEEN 1 AND 151) OR
            ('johto' = ANY(v_unlocked_regions) AND x BETWEEN 152 AND 251) OR
            ('hoenn' = ANY(v_unlocked_regions) AND x BETWEEN 252 AND 386) OR
            ('sinnoh' = ANY(v_unlocked_regions) AND x BETWEEN 387 AND 493) OR
            ('unova' = ANY(v_unlocked_regions) AND x BETWEEN 494 AND 649) OR
            ('kalos' = ANY(v_unlocked_regions) AND x BETWEEN 650 AND 721) OR
            ('alola' = ANY(v_unlocked_regions) AND x BETWEEN 722 AND 809)
          )
          ORDER BY random()
          LIMIT 1
        ) t;

        IF v_pokemon_id IS NOT NULL THEN
          v_found := true;
        END IF;
      ELSIF v_selected_rarity = 'legendary' THEN
        SELECT candidate
        INTO v_pokemon_id
        FROM (
          SELECT x AS candidate
          FROM unnest(ARRAY[
            144, 145, 146, 150,
            243, 244, 245, 249, 250,
            377, 378, 379, 380, 381, 382, 383, 384, 385,
            480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492,
            638, 639, 640, 641, 642, 643, 644, 645, 646,
            716, 717, 718,
            785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 803, 804, 805, 806
          ]) AS x
          WHERE (
            ('kanto' = ANY(v_unlocked_regions) AND x BETWEEN 1 AND 151) OR
            ('johto' = ANY(v_unlocked_regions) AND x BETWEEN 152 AND 251) OR
            ('hoenn' = ANY(v_unlocked_regions) AND x BETWEEN 252 AND 386) OR
            ('sinnoh' = ANY(v_unlocked_regions) AND x BETWEEN 387 AND 493) OR
            ('unova' = ANY(v_unlocked_regions) AND x BETWEEN 494 AND 649) OR
            ('kalos' = ANY(v_unlocked_regions) AND x BETWEEN 650 AND 721) OR
            ('alola' = ANY(v_unlocked_regions) AND x BETWEEN 722 AND 809)
          )
          ORDER BY random()
          LIMIT 1
        ) t;

        IF v_pokemon_id IS NOT NULL THEN
          v_found := true;
        END IF;
      ELSIF v_selected_rarity = 'pseudo' THEN
        SELECT candidate
        INTO v_pokemon_id
        FROM (
          SELECT x AS candidate
          FROM unnest(ARRAY[
            147, 148, 149,
            246, 247, 248,
            371, 372, 373,
            374, 375, 376,
            443, 444, 445,
            610, 611, 612,
            633, 634, 635,
            704, 705, 706,
            782, 783, 784
          ]) AS x
          WHERE (
            ('kanto' = ANY(v_unlocked_regions) AND x BETWEEN 1 AND 151) OR
            ('johto' = ANY(v_unlocked_regions) AND x BETWEEN 152 AND 251) OR
            ('hoenn' = ANY(v_unlocked_regions) AND x BETWEEN 252 AND 386) OR
            ('sinnoh' = ANY(v_unlocked_regions) AND x BETWEEN 387 AND 493) OR
            ('unova' = ANY(v_unlocked_regions) AND x BETWEEN 494 AND 649) OR
            ('kalos' = ANY(v_unlocked_regions) AND x BETWEEN 650 AND 721) OR
            ('alola' = ANY(v_unlocked_regions) AND x BETWEEN 722 AND 809)
          )
          ORDER BY random()
          LIMIT 1
        ) t;

        IF v_pokemon_id IS NOT NULL THEN
          v_found := true;
        END IF;
      ELSIF v_selected_rarity = 'starter' THEN
        SELECT candidate
        INTO v_pokemon_id
        FROM (
          SELECT x AS candidate
          FROM unnest(ARRAY[
            1,2,3,4,5,6,7,8,9,
            152,153,154,155,156,157,158,159,160,
            252,253,254,255,256,257,258,259,260,
            387,388,389,390,391,392,393,394,395,
            495,496,497,498,499,500,501,502,503,
            650,651,652,653,654,655,656,657,658,
            722,723,724,725,726,727,728,729,730
          ]) AS x
          WHERE (
            ('kanto' = ANY(v_unlocked_regions) AND x BETWEEN 1 AND 151) OR
            ('johto' = ANY(v_unlocked_regions) AND x BETWEEN 152 AND 251) OR
            ('hoenn' = ANY(v_unlocked_regions) AND x BETWEEN 252 AND 386) OR
            ('sinnoh' = ANY(v_unlocked_regions) AND x BETWEEN 387 AND 493) OR
            ('unova' = ANY(v_unlocked_regions) AND x BETWEEN 494 AND 649) OR
            ('kalos' = ANY(v_unlocked_regions) AND x BETWEEN 650 AND 721) OR
            ('alola' = ANY(v_unlocked_regions) AND x BETWEEN 722 AND 809)
          )
          ORDER BY random()
          LIMIT 1
        ) t;

        IF v_pokemon_id IS NOT NULL THEN
          v_found := true;
        END IF;
      END IF;

      -- Last-resort fallback: force a common from first valid region
      IF NOT v_found THEN
      FOR v_try IN 1..100 LOOP
        v_pokemon_id := v_fallback_min + floor(random() * (v_fallback_max - v_fallback_min + 1))::integer;

        v_is_secret := v_pokemon_id IN (151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809);
        v_is_legendary := v_pokemon_id IN (
          144, 145, 146, 150,
          243, 244, 245, 249, 250,
          377, 378, 379, 380, 381, 382, 383, 384, 385,
          480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492,
          638, 639, 640, 641, 642, 643, 644, 645, 646,
          716, 717, 718,
          785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 803, 804, 805, 806
        );
        v_is_pseudo := v_pokemon_id IN (
          147, 148, 149,
          246, 247, 248,
          371, 372, 373,
          374, 375, 376,
          443, 444, 445,
          610, 611, 612,
          633, 634, 635,
          704, 705, 706,
          782, 783, 784
        );
        v_is_starter := v_pokemon_id IN (
          1,2,3,4,5,6,7,8,9,
          152,153,154,155,156,157,158,159,160,
          252,253,254,255,256,257,258,259,260,
          387,388,389,390,391,392,393,394,395,
          495,496,497,498,499,500,501,502,503,
          650,651,652,653,654,655,656,657,658,
          722,723,724,725,726,727,728,729,730
        );
        v_is_rare := (
          (v_pokemon_id BETWEEN 1 AND 151 AND v_pokemon_id >= 130) OR
          (v_pokemon_id BETWEEN 152 AND 251 AND v_pokemon_id >= 225) OR
          (v_pokemon_id BETWEEN 252 AND 386 AND v_pokemon_id >= 355) OR
          (v_pokemon_id BETWEEN 387 AND 493 AND v_pokemon_id >= 460) OR
          (v_pokemon_id BETWEEN 494 AND 649 AND v_pokemon_id >= 620) OR
          (v_pokemon_id BETWEEN 650 AND 721 AND v_pokemon_id >= 700) OR
          (v_pokemon_id BETWEEN 722 AND 809 AND v_pokemon_id >= 775)
        );
        v_is_uncommon := (
          (v_pokemon_id BETWEEN 1 AND 151 AND v_pokemon_id BETWEEN 60 AND 129) OR
          (v_pokemon_id BETWEEN 152 AND 251 AND v_pokemon_id BETWEEN 185 AND 224) OR
          (v_pokemon_id BETWEEN 252 AND 386 AND v_pokemon_id BETWEEN 310 AND 354) OR
          (v_pokemon_id BETWEEN 387 AND 493 AND v_pokemon_id BETWEEN 430 AND 459) OR
          (v_pokemon_id BETWEEN 494 AND 649 AND v_pokemon_id BETWEEN 570 AND 619) OR
          (v_pokemon_id BETWEEN 650 AND 721 AND v_pokemon_id BETWEEN 680 AND 699) OR
          (v_pokemon_id BETWEEN 722 AND 809 AND v_pokemon_id BETWEEN 755 AND 774)
        );

        EXIT WHEN NOT (v_is_secret OR v_is_legendary OR v_is_pseudo OR v_is_starter OR v_is_rare OR v_is_uncommon);
      END LOOP;
      END IF;

      -- Safety net in pathological cases
      IF v_pokemon_id IS NULL THEN
        v_pokemon_id := v_fallback_min;
      END IF;
    END IF;

    -- Resolve display name preferring user-owned name variants
    -- Final safety net: if rarity is secret, force a secret dex ID.
    IF v_selected_rarity = 'secret'
       AND v_pokemon_id NOT IN (151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809)
    THEN
      SELECT candidate
      INTO v_pokemon_id
      FROM (
        SELECT x AS candidate
        FROM unnest(ARRAY[151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809]) AS x
        WHERE (
          ('kanto' = ANY(v_unlocked_regions) AND x BETWEEN 1 AND 151) OR
          ('johto' = ANY(v_unlocked_regions) AND x BETWEEN 152 AND 251) OR
          ('hoenn' = ANY(v_unlocked_regions) AND x BETWEEN 252 AND 386) OR
          ('sinnoh' = ANY(v_unlocked_regions) AND x BETWEEN 387 AND 493) OR
          ('unova' = ANY(v_unlocked_regions) AND x BETWEEN 494 AND 649) OR
          ('kalos' = ANY(v_unlocked_regions) AND x BETWEEN 650 AND 721) OR
          ('alola' = ANY(v_unlocked_regions) AND x BETWEEN 722 AND 809)
        )
        ORDER BY random()
        LIMIT 1
      ) t;

      IF v_pokemon_id IS NULL THEN
        -- If no region-filtered secret exists (or bad unlocked_regions data), pick any secret.
        SELECT x
        INTO v_pokemon_id
        FROM unnest(ARRAY[151, 251, 386, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809]) AS x
        ORDER BY random()
        LIMIT 1;
      END IF;
    END IF;

    SELECT pi.pokemon_name
    INTO v_pokemon_name
    FROM pokemon_inventory pi
    WHERE pi.user_id = p_user_id
      AND pi.pokemon_id = v_pokemon_id
    ORDER BY pi.created_at DESC
    LIMIT 1;

    IF v_pokemon_name IS NULL THEN
      SELECT pc.pokemon_name
      INTO v_pokemon_name
      FROM pokedex_cards pc
      WHERE pc.user_id = p_user_id
        AND pc.pokemon_id = v_pokemon_id
      ORDER BY pc.created_at DESC
      LIMIT 1;
    END IF;

    IF v_pokemon_name IS NULL THEN
      v_pokemon_name := 'pokemon-' || v_pokemon_id;
    END IF;

    -- Roll shiny
    v_shiny_roll := random() * 100;
    v_is_shiny := v_shiny_roll < v_pack_type.shiny_chance;

    -- Add card to inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_selected_rarity, 1, v_is_shiny)
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

    -- Build response payload
    v_results := v_results || jsonb_build_object(
      'pokemon_id', v_pokemon_id,
      'pokemon_name', v_pokemon_name,
      'rarity', v_selected_rarity,
      'is_shiny', v_is_shiny
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'cards', v_results);
END;
$$;
