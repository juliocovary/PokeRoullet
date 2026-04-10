-- Corrige a função spin_pokemon_roulette para incluir Pokémons secretos em suas respectivas regiões
-- Mew (151) em Kanto, Celebi (251) em Johto, Jirachi (385) em Hoenn, Arceus (493) em Sinnoh

CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(
    p_user_id UUID,
    p_region TEXT,
    p_pokemon_data JSONB,
    p_skip_reload BOOLEAN DEFAULT FALSE
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
AS $function$
DECLARE
    v_free_spins INTEGER;
    v_random_num FLOAT;
    v_selected_rarity TEXT;
    v_selected_pokemon JSONB;
    v_pokemon_id INTEGER;
    v_pokemon_name TEXT;
    v_pokemon_rarity TEXT;
    v_is_shiny BOOLEAN := FALSE;
    v_shiny_random FLOAT;
    v_base_shiny_chance FLOAT := 0.01;
    v_shiny_chance FLOAT;
    v_shiny_boost_active BOOLEAN := FALSE;
    v_xp_gained INTEGER;
    v_luck_multiplier FLOAT := 1.0;
    v_xp_multiplier FLOAT := 1.0;
    v_luck_boost_active BOOLEAN := FALSE;
    v_region_pokemon JSONB;
BEGIN
    -- Verify user has spins available
    SELECT us.free_spins INTO v_free_spins
    FROM user_spins us
    WHERE us.user_id = p_user_id;
    
    IF v_free_spins IS NULL OR v_free_spins <= 0 THEN
        RETURN QUERY SELECT FALSE, 'No spins available'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get luck multiplier and check boosts
    SELECT 
        COALESCE(p.luck_multiplier, 1.0),
        COALESCE(p.xp_multiplier, 1.0),
        CASE WHEN p.luck_boost_expires_at IS NOT NULL AND p.luck_boost_expires_at > NOW() THEN TRUE ELSE FALSE END,
        CASE WHEN p.shiny_boost_expires_at IS NOT NULL AND p.shiny_boost_expires_at > NOW() THEN TRUE ELSE FALSE END
    INTO v_luck_multiplier, v_xp_multiplier, v_luck_boost_active, v_shiny_boost_active
    FROM profiles p
    WHERE p.user_id = p_user_id;
    
    -- Apply luck boost if active (doubles luck multiplier)
    IF v_luck_boost_active THEN
        v_luck_multiplier := v_luck_multiplier * 2;
    END IF;
    
    -- Deduct one spin
    UPDATE user_spins
    SET free_spins = free_spins - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Generate random number for rarity selection
    v_random_num := random();
    
    -- Apply luck multiplier to improve chances of rare pokemon
    -- Base probabilities: common 50%, uncommon 30%, rare 15%, epic 4%, legendary 0.9%, mythical 0.09%, secret 0.01%
    -- With luck multiplier, we shift probabilities towards rarer pokemon
    IF v_random_num < (0.0001 * v_luck_multiplier) THEN
        v_selected_rarity := 'secret';
    ELSIF v_random_num < (0.001 * v_luck_multiplier) THEN
        v_selected_rarity := 'mythical';
    ELSIF v_random_num < (0.01 * v_luck_multiplier) THEN
        v_selected_rarity := 'legendary';
    ELSIF v_random_num < (0.05 * v_luck_multiplier) THEN
        v_selected_rarity := 'epic';
    ELSIF v_random_num < (0.20 * v_luck_multiplier) THEN
        v_selected_rarity := 'rare';
    ELSIF v_random_num < (0.50) THEN
        v_selected_rarity := 'uncommon';
    ELSE
        v_selected_rarity := 'common';
    END IF;
    
    -- Filter pokemon by region and rarity from the provided data
    -- CORRIGIDO: Agora inclui os Pokémons secretos em suas respectivas regiões
    SELECT jsonb_agg(p) INTO v_region_pokemon
    FROM jsonb_array_elements(p_pokemon_data) AS p
    WHERE (p->>'rarity') = v_selected_rarity
    AND (
        (p_region = 'kanto' AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
        (p_region = 'johto' AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
        (p_region = 'hoenn' AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
        (p_region = 'sinnoh' AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
        (p_region = 'unova' AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
    );
    
    -- If no pokemon found for selected rarity, fallback to common
    IF v_region_pokemon IS NULL OR jsonb_array_length(v_region_pokemon) = 0 THEN
        -- CORRIGIDO: Fallback também inclui os Pokémons secretos
        SELECT jsonb_agg(p) INTO v_region_pokemon
        FROM jsonb_array_elements(p_pokemon_data) AS p
        WHERE (p->>'rarity') = 'common'
        AND (
            (p_region = 'kanto' AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
            (p_region = 'johto' AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
            (p_region = 'hoenn' AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
            (p_region = 'sinnoh' AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
            (p_region = 'unova' AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
        );
        v_selected_rarity := 'common';
    END IF;
    
    -- If still no pokemon found, return error
    IF v_region_pokemon IS NULL OR jsonb_array_length(v_region_pokemon) = 0 THEN
        RETURN QUERY SELECT FALSE, 'No pokemon available for this region'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Select random pokemon from filtered list
    SELECT p INTO v_selected_pokemon
    FROM jsonb_array_elements(v_region_pokemon) AS p
    ORDER BY random()
    LIMIT 1;
    
    v_pokemon_id := (v_selected_pokemon->>'id')::INTEGER;
    v_pokemon_name := v_selected_pokemon->>'name';
    v_pokemon_rarity := v_selected_pokemon->>'rarity';
    
    -- Check for shiny
    v_shiny_random := random();
    v_shiny_chance := v_base_shiny_chance;
    
    -- Double shiny chance if shiny boost is active
    IF v_shiny_boost_active THEN
        v_shiny_chance := v_shiny_chance * 2;
    END IF;
    
    IF v_shiny_random < v_shiny_chance THEN
        v_is_shiny := TRUE;
    END IF;
    
    -- Calculate XP based on rarity
    CASE v_pokemon_rarity
        WHEN 'common' THEN v_xp_gained := 10;
        WHEN 'uncommon' THEN v_xp_gained := 25;
        WHEN 'rare' THEN v_xp_gained := 50;
        WHEN 'epic' THEN v_xp_gained := 100;
        WHEN 'legendary' THEN v_xp_gained := 250;
        WHEN 'mythical' THEN v_xp_gained := 500;
        WHEN 'secret' THEN v_xp_gained := 1000;
        ELSE v_xp_gained := 10;
    END CASE;
    
    -- Apply XP multiplier
    v_xp_gained := FLOOR(v_xp_gained * v_xp_multiplier);
    
    -- Double XP for shiny
    IF v_is_shiny THEN
        v_xp_gained := v_xp_gained * 2;
    END IF;
    
    -- Add pokemon to inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, 1)
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();
    
    -- Add XP to profile
    UPDATE profiles
    SET experience_points = experience_points + v_xp_gained,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update mission progress for spin category
    PERFORM update_mission_progress(p_user_id, 'spin', 1);
    
    -- Update achievement progress
    PERFORM update_achievement_progress(p_user_id, 'spin', 1);
    PERFORM update_achievement_progress(p_user_id, 'catch', 1);
    
    -- Update launch event progress
    PERFORM update_launch_event_progress(p_user_id, 'spin', 1);
    
    -- Update rarity-specific achievements
    IF v_pokemon_rarity = 'legendary' THEN
        PERFORM update_achievement_progress(p_user_id, 'catch_legendary', 1);
    ELSIF v_pokemon_rarity = 'mythical' THEN
        PERFORM update_achievement_progress(p_user_id, 'catch_mythical', 1);
    ELSIF v_pokemon_rarity = 'secret' THEN
        PERFORM update_achievement_progress(p_user_id, 'catch_secret', 1);
    END IF;
    
    -- Update shiny achievement if applicable
    IF v_is_shiny THEN
        PERFORM update_achievement_progress(p_user_id, 'catch_shiny', 1);
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Pokemon caught!'::TEXT, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, v_xp_gained;
END;
$function$;