
-- Step 1: Drop ALL existing overloads first
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb, boolean);
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, integer, text, text, text, boolean, text, boolean);

-- Step 2: Create the unified function with correct XP, level-up, and weighted odds
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
    p_user_id uuid,
    p_region text,
    p_pokemon_data jsonb,
    p_skip_reload boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_free_spins integer;
    v_luck_multiplier numeric;
    v_xp_multiplier numeric;
    v_unlocked_regions text[];
    v_roll numeric;
    v_selected_rarity text;
    v_selected_pokemon jsonb;
    v_pokemon_id integer;
    v_pokemon_name text;
    v_pokemon_sprite text;
    v_pokemon_rarity text;
    v_is_shiny boolean;
    v_shiny_roll numeric;
    v_shiny_chance numeric;
    v_xp_gained integer;
    v_level_up boolean;
    v_new_level integer;
    v_filtered_pokemon jsonb;
    v_rarity_pokemon jsonb;
    v_adjusted_chances jsonb;
    v_cumulative numeric;
    v_luck_boost numeric;
    v_common_adj numeric;
    v_uncommon_adj numeric;
    v_rare_adj numeric;
    v_pseudo_adj numeric;
    v_starter_adj numeric;
    v_legendary_adj numeric;
    v_secret_adj numeric;
    v_total numeric;
    v_rarity_order text[] := ARRAY['common', 'uncommon', 'rare', 'pseudo', 'starter', 'legendary', 'secret'];
    v_i integer;
BEGIN
    -- Get user profile data
    SELECT free_spins, luck_multiplier, xp_multiplier, unlocked_regions
    INTO v_free_spins, v_luck_multiplier, v_xp_multiplier, v_unlocked_regions
    FROM profiles
    WHERE id = p_user_id;

    IF v_free_spins IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    IF v_free_spins <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No free spins available');
    END IF;

    -- Set defaults
    v_luck_multiplier := COALESCE(v_luck_multiplier, 1.0);
    v_xp_multiplier := COALESCE(v_xp_multiplier, 1.0);
    v_unlocked_regions := COALESCE(v_unlocked_regions, ARRAY['kanto']);

    -- Calculate luck boost factor (luck_multiplier > 1 increases rare+ chances)
    v_luck_boost := v_luck_multiplier;

    -- Adjust chances based on luck_multiplier
    -- Base: common: 0.65, uncommon: 0.25, rare: 0.085, pseudo: 0.01, starter: 0.004, legendary: 0.001, secret: 0.0001
    v_common_adj := 0.6499;
    v_uncommon_adj := 0.25;
    v_rare_adj := 0.085 * v_luck_boost;
    v_pseudo_adj := 0.01 * v_luck_boost;
    v_starter_adj := 0.004 * v_luck_boost;
    v_legendary_adj := 0.001 * v_luck_boost;
    v_secret_adj := 0.0001 * v_luck_boost;
    
    v_total := v_common_adj + v_uncommon_adj + v_rare_adj + v_pseudo_adj + v_starter_adj + v_legendary_adj + v_secret_adj;
    
    v_adjusted_chances := jsonb_build_object(
        'common', v_common_adj / v_total,
        'uncommon', v_uncommon_adj / v_total,
        'rare', v_rare_adj / v_total,
        'pseudo', v_pseudo_adj / v_total,
        'starter', v_starter_adj / v_total,
        'legendary', v_legendary_adj / v_total,
        'secret', v_secret_adj / v_total
    );

    -- Roll for rarity
    v_roll := random();
    v_cumulative := 0;
    v_selected_rarity := 'common'; -- default fallback

    -- Check each rarity in order
    v_cumulative := v_cumulative + (v_adjusted_chances->>'common')::numeric;
    IF v_roll < v_cumulative THEN
        v_selected_rarity := 'common';
    ELSE
        v_cumulative := v_cumulative + (v_adjusted_chances->>'uncommon')::numeric;
        IF v_roll < v_cumulative THEN
            v_selected_rarity := 'uncommon';
        ELSE
            v_cumulative := v_cumulative + (v_adjusted_chances->>'rare')::numeric;
            IF v_roll < v_cumulative THEN
                v_selected_rarity := 'rare';
            ELSE
                v_cumulative := v_cumulative + (v_adjusted_chances->>'pseudo')::numeric;
                IF v_roll < v_cumulative THEN
                    v_selected_rarity := 'pseudo';
                ELSE
                    v_cumulative := v_cumulative + (v_adjusted_chances->>'starter')::numeric;
                    IF v_roll < v_cumulative THEN
                        v_selected_rarity := 'starter';
                    ELSE
                        v_cumulative := v_cumulative + (v_adjusted_chances->>'legendary')::numeric;
                        IF v_roll < v_cumulative THEN
                            v_selected_rarity := 'legendary';
                        ELSE
                            v_selected_rarity := 'secret';
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    -- Filter pokemon by region
    IF p_region = 'all' THEN
        -- For "all", only include pokemon from unlocked regions
        SELECT jsonb_agg(pokemon)
        INTO v_filtered_pokemon
        FROM jsonb_array_elements(p_pokemon_data) AS pokemon
        WHERE (
            (v_unlocked_regions @> ARRAY['kanto'] AND (pokemon->>'id')::integer BETWEEN 1 AND 151) OR
            (v_unlocked_regions @> ARRAY['johto'] AND (pokemon->>'id')::integer BETWEEN 152 AND 251) OR
            (v_unlocked_regions @> ARRAY['hoenn'] AND (pokemon->>'id')::integer BETWEEN 252 AND 386) OR
            (v_unlocked_regions @> ARRAY['sinnoh'] AND (pokemon->>'id')::integer BETWEEN 387 AND 493) OR
            (v_unlocked_regions @> ARRAY['unova'] AND (pokemon->>'id')::integer BETWEEN 494 AND 649)
        );
    ELSE
        SELECT jsonb_agg(pokemon)
        INTO v_filtered_pokemon
        FROM jsonb_array_elements(p_pokemon_data) AS pokemon
        WHERE (
            (p_region = 'kanto' AND (pokemon->>'id')::integer BETWEEN 1 AND 151) OR
            (p_region = 'johto' AND (pokemon->>'id')::integer BETWEEN 152 AND 251) OR
            (p_region = 'hoenn' AND (pokemon->>'id')::integer BETWEEN 252 AND 386) OR
            (p_region = 'sinnoh' AND (pokemon->>'id')::integer BETWEEN 387 AND 493) OR
            (p_region = 'unova' AND (pokemon->>'id')::integer BETWEEN 494 AND 649)
        );
    END IF;

    IF v_filtered_pokemon IS NULL OR jsonb_array_length(v_filtered_pokemon) = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No Pokemon available for this region');
    END IF;

    -- Filter by selected rarity, with fallback to lower rarities if empty
    v_rarity_pokemon := NULL;
    
    FOR v_i IN REVERSE array_length(v_rarity_order, 1)..1 LOOP
        IF v_rarity_order[v_i] = v_selected_rarity OR v_rarity_pokemon IS NULL THEN
            SELECT jsonb_agg(pokemon)
            INTO v_rarity_pokemon
            FROM jsonb_array_elements(v_filtered_pokemon) AS pokemon
            WHERE pokemon->>'rarity' = v_rarity_order[v_i];
            
            IF v_rarity_pokemon IS NOT NULL AND jsonb_array_length(v_rarity_pokemon) > 0 THEN
                v_selected_rarity := v_rarity_order[v_i];
                EXIT;
            END IF;
        END IF;
    END LOOP;

    -- If still no pokemon found, just pick any from filtered
    IF v_rarity_pokemon IS NULL OR jsonb_array_length(v_rarity_pokemon) = 0 THEN
        v_rarity_pokemon := v_filtered_pokemon;
        SELECT pokemon->>'rarity'
        INTO v_selected_rarity
        FROM jsonb_array_elements(v_filtered_pokemon) AS pokemon
        ORDER BY random()
        LIMIT 1;
    END IF;

    -- Select a random pokemon from the rarity pool
    SELECT pokemon
    INTO v_selected_pokemon
    FROM jsonb_array_elements(v_rarity_pokemon) AS pokemon
    ORDER BY random()
    LIMIT 1;

    v_pokemon_id := (v_selected_pokemon->>'id')::integer;
    v_pokemon_name := v_selected_pokemon->>'name';
    v_pokemon_sprite := v_selected_pokemon->>'sprite';
    v_pokemon_rarity := v_selected_pokemon->>'rarity';

    -- Shiny check (base 1/512, affected by luck_multiplier)
    v_shiny_chance := 1.0 / 512.0 * v_luck_multiplier;
    v_shiny_roll := random();
    v_is_shiny := v_shiny_roll < v_shiny_chance;

    -- Calculate XP based on rarity (aligned with frontend XP_BY_RARITY)
    v_xp_gained := CASE v_pokemon_rarity
        WHEN 'common' THEN 20
        WHEN 'uncommon' THEN 25
        WHEN 'rare' THEN 40
        WHEN 'pseudo' THEN 75
        WHEN 'starter' THEN 100
        WHEN 'legendary' THEN 500
        WHEN 'secret' THEN 2500
        ELSE 20
    END;

    -- Apply shiny bonus (3x XP)
    IF v_is_shiny THEN
        v_xp_gained := v_xp_gained * 3;
    END IF;

    -- Apply XP multiplier from profile
    v_xp_gained := FLOOR(v_xp_gained * v_xp_multiplier);

    -- Decrement free spins
    UPDATE profiles
    SET free_spins = free_spins - 1
    WHERE id = p_user_id;

    -- Add experience using add_experience function (handles level-up automatically)
    SELECT level_up, new_level
    INTO v_level_up, v_new_level
    FROM add_experience(p_user_id, v_xp_gained);

    -- Upsert pokemon to inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, pokemon_sprite, rarity, quantity, is_shiny)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_sprite, v_pokemon_rarity, 1, v_is_shiny)
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

    -- Update missions
    UPDATE user_missions
    SET current_progress = current_progress + 1,
        completed = CASE WHEN current_progress + 1 >= target THEN true ELSE completed END,
        completed_at = CASE WHEN current_progress + 1 >= target AND completed_at IS NULL THEN now() ELSE completed_at END
    WHERE user_id = p_user_id
      AND mission_type IN ('spin', 'catch_pokemon')
      AND completed = false;

    -- Update rarity-specific missions
    UPDATE user_missions
    SET current_progress = current_progress + 1,
        completed = CASE WHEN current_progress + 1 >= target THEN true ELSE completed END,
        completed_at = CASE WHEN current_progress + 1 >= target AND completed_at IS NULL THEN now() ELSE completed_at END
    WHERE user_id = p_user_id
      AND mission_type = 'catch_rarity'
      AND mission_subtype = v_pokemon_rarity
      AND completed = false;

    -- Update shiny missions if shiny
    IF v_is_shiny THEN
        UPDATE user_missions
        SET current_progress = current_progress + 1,
            completed = CASE WHEN current_progress + 1 >= target THEN true ELSE completed END,
            completed_at = CASE WHEN current_progress + 1 >= target AND completed_at IS NULL THEN now() ELSE completed_at END
        WHERE user_id = p_user_id
          AND mission_type = 'catch_shiny'
          AND completed = false;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pokemon', jsonb_build_object(
            'id', v_pokemon_id,
            'name', v_pokemon_name,
            'sprite', v_pokemon_sprite,
            'rarity', v_pokemon_rarity,
            'isShiny', v_is_shiny
        ),
        'xp_gained', v_xp_gained,
        'level_up', COALESCE(v_level_up, false),
        'new_level', v_new_level
    );
END;
$$;

-- Step 3: Fix any existing profile levels that are inconsistent
UPDATE profiles
SET level = (
    SELECT COALESCE(
        (SELECT l.level FROM (
            SELECT 1 as level, 0 as min_xp
            UNION ALL SELECT 2, 200
            UNION ALL SELECT 3, 500
            UNION ALL SELECT 4, 1000
            UNION ALL SELECT 5, 2000
            UNION ALL SELECT 6, 3500
            UNION ALL SELECT 7, 5500
            UNION ALL SELECT 8, 8000
            UNION ALL SELECT 9, 11000
            UNION ALL SELECT 10, 15000
            UNION ALL SELECT 11, 20000
            UNION ALL SELECT 12, 26000
            UNION ALL SELECT 13, 33000
            UNION ALL SELECT 14, 41000
            UNION ALL SELECT 15, 50000
            UNION ALL SELECT 16, 60000
            UNION ALL SELECT 17, 72000
            UNION ALL SELECT 18, 86000
            UNION ALL SELECT 19, 102000
            UNION ALL SELECT 20, 120000
        ) l WHERE profiles.experience_points >= l.min_xp ORDER BY l.level DESC LIMIT 1),
        1
    )
)
WHERE level != (
    SELECT COALESCE(
        (SELECT l.level FROM (
            SELECT 1 as level, 0 as min_xp
            UNION ALL SELECT 2, 200
            UNION ALL SELECT 3, 500
            UNION ALL SELECT 4, 1000
            UNION ALL SELECT 5, 2000
            UNION ALL SELECT 6, 3500
            UNION ALL SELECT 7, 5500
            UNION ALL SELECT 8, 8000
            UNION ALL SELECT 9, 11000
            UNION ALL SELECT 10, 15000
            UNION ALL SELECT 11, 20000
            UNION ALL SELECT 12, 26000
            UNION ALL SELECT 13, 33000
            UNION ALL SELECT 14, 41000
            UNION ALL SELECT 15, 50000
            UNION ALL SELECT 16, 60000
            UNION ALL SELECT 17, 72000
            UNION ALL SELECT 18, 86000
            UNION ALL SELECT 19, 102000
            UNION ALL SELECT 20, 120000
        ) l WHERE profiles.experience_points >= l.min_xp ORDER BY l.level DESC LIMIT 1),
        1
    )
);
