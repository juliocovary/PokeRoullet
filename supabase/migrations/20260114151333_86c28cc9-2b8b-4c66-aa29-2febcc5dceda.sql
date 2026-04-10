CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(p_user_id UUID, p_region TEXT, p_pokemon_data JSONB)
RETURNS TABLE(success BOOLEAN, message TEXT, pokemon_id INTEGER, pokemon_name TEXT, pokemon_rarity TEXT, is_shiny BOOLEAN, xp_gained INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    v_unlocked_regions TEXT[];
BEGIN
    -- Verify user has spins available
    SELECT us.free_spins INTO v_free_spins
    FROM user_spins us
    WHERE us.user_id = p_user_id;
    
    IF v_free_spins IS NULL OR v_free_spins <= 0 THEN
        RETURN QUERY SELECT FALSE, 'No spins available'::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Get luck multiplier, check boosts, and get unlocked regions
    SELECT 
        COALESCE(p.luck_multiplier, 1.0),
        COALESCE(p.xp_multiplier, 1.0),
        CASE WHEN p.luck_boost_expires_at IS NOT NULL AND p.luck_boost_expires_at > NOW() THEN TRUE ELSE FALSE END,
        CASE WHEN p.shiny_boost_expires_at IS NOT NULL AND p.shiny_boost_expires_at > NOW() THEN TRUE ELSE FALSE END,
        COALESCE(p.unlocked_regions, ARRAY['kanto']::TEXT[])
    INTO v_luck_multiplier, v_xp_multiplier, v_luck_boost_active, v_shiny_boost_active, v_unlocked_regions
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
    -- Suporta p_region = 'all' usando as regiões desbloqueadas do usuário
    SELECT jsonb_agg(p) INTO v_region_pokemon
    FROM jsonb_array_elements(p_pokemon_data) AS p
    WHERE (p->>'rarity') = v_selected_rarity
    AND (
        -- Quando p_region = 'all', usa as regiões desbloqueadas
        (p_region = 'all' AND (
            ('kanto' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
            ('johto' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
            ('hoenn' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
            ('sinnoh' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
            ('unova' = ANY(v_unlocked_regions) AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
        )) OR
        -- Regiões específicas
        (p_region = 'kanto' AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
        (p_region = 'johto' AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
        (p_region = 'hoenn' AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
        (p_region = 'sinnoh' AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
        (p_region = 'unova' AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
    );
    
    -- If no pokemon found for selected rarity, fallback to common
    IF v_region_pokemon IS NULL OR jsonb_array_length(v_region_pokemon) = 0 THEN
        SELECT jsonb_agg(p) INTO v_region_pokemon
        FROM jsonb_array_elements(p_pokemon_data) AS p
        WHERE (p->>'rarity') = 'common'
        AND (
            -- Quando p_region = 'all', usa as regiões desbloqueadas
            (p_region = 'all' AND (
                ('kanto' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
                ('johto' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
                ('hoenn' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
                ('sinnoh' = ANY(v_unlocked_regions) AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
                ('unova' = ANY(v_unlocked_regions) AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
            )) OR
            -- Regiões específicas
            (p_region = 'kanto' AND (((p->>'id')::INTEGER >= 1 AND (p->>'id')::INTEGER <= 150) OR (p->>'id')::INTEGER = 151)) OR
            (p_region = 'johto' AND (((p->>'id')::INTEGER >= 152 AND (p->>'id')::INTEGER <= 250) OR (p->>'id')::INTEGER = 251)) OR
            (p_region = 'hoenn' AND (((p->>'id')::INTEGER >= 252 AND (p->>'id')::INTEGER <= 384) OR (p->>'id')::INTEGER = 385)) OR
            (p_region = 'sinnoh' AND (((p->>'id')::INTEGER >= 387 AND (p->>'id')::INTEGER <= 492) OR (p->>'id')::INTEGER = 493)) OR
            (p_region = 'unova' AND (p->>'id')::INTEGER >= 494 AND (p->>'id')::INTEGER <= 649)
        );
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
    
    -- Calculate shiny chance
    v_shiny_chance := v_base_shiny_chance;
    IF v_shiny_boost_active THEN
        v_shiny_chance := v_shiny_chance * 3;
    END IF;
    
    v_shiny_random := random();
    IF v_shiny_random < v_shiny_chance THEN
        v_is_shiny := TRUE;
    END IF;
    
    -- Calculate XP based on rarity
    CASE v_pokemon_rarity
        WHEN 'common' THEN v_xp_gained := 20;
        WHEN 'uncommon' THEN v_xp_gained := 25;
        WHEN 'rare' THEN v_xp_gained := 40;
        WHEN 'epic' THEN v_xp_gained := 50;
        WHEN 'pseudo' THEN v_xp_gained := 75;
        WHEN 'starter' THEN v_xp_gained := 100;
        WHEN 'legendary' THEN v_xp_gained := 500;
        WHEN 'mythical' THEN v_xp_gained := 750;
        WHEN 'secret' THEN v_xp_gained := 2500;
        ELSE v_xp_gained := 20;
    END CASE;
    
    -- Apply XP multiplier
    v_xp_gained := FLOOR(v_xp_gained * v_xp_multiplier);
    
    -- Add pokemon to inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, sprite, is_shiny, quantity)
    VALUES (
        p_user_id,
        v_pokemon_id,
        v_pokemon_name,
        v_pokemon_rarity,
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || v_pokemon_id || '.png',
        v_is_shiny,
        1
    )
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1;
    
    -- Add XP to profile
    UPDATE profiles
    SET experience = COALESCE(experience, 0) + v_xp_gained
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT TRUE, 'Pokemon caught!'::TEXT, v_pokemon_id, v_pokemon_name, v_pokemon_rarity, v_is_shiny, v_xp_gained;
END;
$$;