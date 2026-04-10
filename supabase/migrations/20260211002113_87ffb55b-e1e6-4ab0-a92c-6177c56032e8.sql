
-- Drop update_mission_progress first due to return type change
DROP FUNCTION IF EXISTS public.update_mission_progress(UUID, TEXT, INTEGER);

-- Recreate spin_pokemon_roulette with clan points
CREATE OR REPLACE FUNCTION public.spin_pokemon_roulette(p_user_id UUID, p_pokemon_data JSONB, p_region TEXT DEFAULT 'kanto')
RETURNS JSONB
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
  
  SELECT shiny_boost_expires_at INTO v_shiny_boost_expires FROM profiles WHERE user_id = p_user_id;
  
  IF v_shiny_boost_expires IS NOT NULL AND v_shiny_boost_expires > now() THEN
    v_shiny_chance := 0.05;
  ELSE
    v_shiny_chance := 0.01;
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
    'spins_remaining', v_current_spins - 1, 'shiny_chance_applied', v_shiny_chance
  );
END;
$$;

-- Recreate update_mission_progress with clan points
CREATE OR REPLACE FUNCTION public.update_mission_progress(p_user_id UUID, p_category TEXT, p_increment INTEGER DEFAULT 1)
RETURNS TABLE(completed_missions json, rewards_earned json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mission_record RECORD;
  v_completed_missions json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0}'::json;
  temp_array json[];
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  IF p_increment IS NULL OR p_increment <= 0 OR p_increment > 10000 THEN
    RAISE EXCEPTION 'Invalid increment: must be between 1 and 10000';
  END IF;

  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, COALESCE(um.completed, false) as is_completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
    VALUES (p_user_id, mission_record.id, 0, false, false)
    ON CONFLICT (user_id, mission_id) DO NOTHING;
    
    IF NOT mission_record.is_completed THEN
      UPDATE public.user_missions 
      SET progress = LEAST(progress + p_increment, mission_record.goal), updated_at = now()
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      SELECT progress INTO mission_record.current_progress
      FROM public.user_missions WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      IF mission_record.current_progress >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        -- === CLAN POINTS ===
        IF mission_record.type = 'daily' THEN
          PERFORM add_clan_points(p_user_id, 10, 'daily_mission');
        ELSIF mission_record.type = 'weekly' THEN
          PERFORM add_clan_points(p_user_id, 25, 'weekly_mission');
        END IF;
        
        temp_array := ARRAY[json_build_object(
          'id', mission_record.id, 'title', mission_record.title, 'type', mission_record.type,
          'reward_coins', mission_record.reward_coins, 'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        )];
        
        v_completed_missions := array_to_json(ARRAY(SELECT json_array_elements(v_completed_missions)) || temp_array);
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_completed_missions, total_rewards;
END;
$$;

-- RPC to get clan collective missions
CREATE OR REPLACE FUNCTION public.get_clan_missions(p_clan_id UUID)
RETURNS TABLE(
  mission_id UUID, mission_type TEXT, title TEXT, description TEXT,
  goal INTEGER, frequency TEXT, reward_clan_points INTEGER,
  reward_member_coins INTEGER, reward_member_shards INTEGER, reward_member_spins INTEGER,
  current_progress INTEGER, is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  
  RETURN QUERY
  SELECT cm.id, cm.mission_type, cm.title, cm.description, cm.goal, cm.frequency,
    cm.reward_clan_points, cm.reward_member_coins, cm.reward_member_shards, cm.reward_member_spins,
    COALESCE(cmp.current_progress, 0)::INTEGER, COALESCE(cmp.is_completed, false)
  FROM clan_collective_missions cm
  LEFT JOIN clan_mission_progress cmp ON (cmp.mission_id = cm.id AND cmp.clan_id = p_clan_id AND cmp.season_id = v_season_id)
  ORDER BY cm.frequency, cm.goal;
END;
$$;

-- Seed collective missions
INSERT INTO clan_collective_missions (mission_type, title, description, goal, reward_clan_points, reward_member_coins, reward_member_shards, reward_member_spins, frequency)
VALUES 
  ('total_spins', 'Giro Coletivo', 'Membros do clã realizam giros na roleta juntos', 500, 100, 50, 10, 2, 'weekly'),
  ('rare_catches', 'Caçadores de Raridades', 'Capture Pokémon raros ou superiores como clã', 50, 200, 100, 20, 3, 'weekly'),
  ('total_sells', 'Comerciantes Unidos', 'Venda Pokémon no TradeHub coletivamente', 100, 150, 75, 15, 2, 'weekly'),
  ('missions_completed', 'Missões em Equipe', 'Complete missões individuais como grupo', 100, 300, 150, 30, 5, 'weekly'),
  ('shiny_catches', 'Brilho Supremo', 'Capture Pokémon Shiny como clã', 10, 500, 200, 50, 5, 'monthly')
ON CONFLICT DO NOTHING;
