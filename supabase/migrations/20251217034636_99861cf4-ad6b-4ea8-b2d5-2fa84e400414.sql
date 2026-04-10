-- Add input validation to buy_item function
CREATE OR REPLACE FUNCTION public.buy_item(p_user_id uuid, p_item_id integer, p_quantity integer DEFAULT 1)
 RETURNS TABLE(success boolean, message text, new_pokecoins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item_price INTEGER;
  current_pokecoins INTEGER;
  total_cost INTEGER;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0::INTEGER;
    RETURN;
  END IF;

  -- Input validation: quantity must be positive and reasonable
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 1000 THEN
    RETURN QUERY SELECT FALSE, 'Invalid quantity: must be between 1 and 1000'::TEXT, 0::INTEGER;
    RETURN;
  END IF;

  SELECT price INTO item_price
  FROM public.items
  WHERE id = p_item_id;
  
  IF item_price IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Item não encontrado'::TEXT, 0::INTEGER;
    RETURN;
  END IF;
  
  total_cost := item_price * p_quantity;
  
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF current_pokecoins < total_cost THEN
    RETURN QUERY SELECT FALSE, 'Pokécoins insuficientes'::TEXT, current_pokecoins;
    RETURN;
  END IF;
  
  UPDATE public.profiles 
  SET pokecoins = pokecoins - total_cost,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.user_items (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = user_items.quantity + p_quantity,
    updated_at = now();
  
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Item comprado com sucesso!'::TEXT, current_pokecoins;
END;
$function$;

-- Add input validation to sell_pokemon function (with is_shiny parameter)
CREATE OR REPLACE FUNCTION public.sell_pokemon(p_user_id uuid, p_pokemon_id integer, p_quantity integer, p_is_shiny boolean DEFAULT false)
 RETURNS TABLE(success boolean, message text, pokecoins_earned integer, new_pokecoins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity INTEGER;
  pokemon_rarity TEXT;
  pokemon_name_value TEXT;
  is_starter BOOLEAN;
  coin_value INTEGER;
  total_earned INTEGER;
  mission_result RECORD;
  achievement_result RECORD;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;

  -- Input validation: quantity must be positive and reasonable
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 10000 THEN
    RETURN QUERY SELECT FALSE, 'Invalid quantity: must be between 1 and 10000'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;

  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  
  IF current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pokémon não encontrado no inventário'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  IF p_quantity > current_quantity THEN
    RETURN QUERY SELECT FALSE, 'Quantidade insuficiente'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND starter_pokemon IS NOT NULL
    AND starter_pokemon = pokemon_name_value
  ) INTO is_starter;
  
  IF is_starter THEN
    RETURN QUERY SELECT FALSE, 'Não é possível vender seu Pokémon inicial'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  coin_value := CASE pokemon_rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 5
    WHEN 'pseudo' THEN 25
    WHEN 'legendary' THEN 150
    WHEN 'secret' THEN 500
    ELSE 1
  END;
  
  IF p_is_shiny THEN
    coin_value := coin_value * 3;
  END IF;
  
  total_earned := coin_value * p_quantity;
  
  IF p_quantity = current_quantity THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;
  
  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  SELECT pokecoins INTO new_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'sell', p_quantity);
  
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'sales', p_quantity);
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$function$;

-- Add input validation to update_mission_progress function
CREATE OR REPLACE FUNCTION public.update_mission_progress(p_user_id uuid, p_category text, p_increment integer DEFAULT 1)
 RETURNS TABLE(missions_completed json, rewards_earned json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mission_record RECORD;
  completed_missions json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0}'::json;
  temp_array json[];
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  -- Input validation: increment must be positive and reasonable
  IF p_increment IS NULL OR p_increment <= 0 OR p_increment > 10000 THEN
    RAISE EXCEPTION 'Invalid increment: must be between 1 and 10000';
  END IF;

  RAISE LOG 'update_mission_progress called for user % category % increment %', p_user_id, p_category, p_increment;

  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, COALESCE(um.completed, false) as completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    INSERT INTO public.user_missions (user_id, mission_id, progress, completed, rewards_claimed)
    VALUES (p_user_id, mission_record.id, 0, false, false)
    ON CONFLICT (user_id, mission_id) DO NOTHING;
    
    IF NOT mission_record.completed THEN
      UPDATE public.user_missions 
      SET progress = LEAST(progress + p_increment, mission_record.goal),
          updated_at = now()
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      SELECT progress INTO mission_record.current_progress
      FROM public.user_missions
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      RAISE LOG 'Mission % progress updated to %', mission_record.title, mission_record.current_progress;
      
      IF mission_record.current_progress >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        RAISE LOG 'Mission % completed!', mission_record.title;
        
        temp_array := ARRAY[json_build_object(
          'id', mission_record.id,
          'title', mission_record.title,
          'type', mission_record.type,
          'reward_coins', mission_record.reward_coins,
          'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        )];
        
        completed_missions := array_to_json(ARRAY(SELECT json_array_elements(completed_missions)) || temp_array);
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_missions, total_rewards;
END;
$function$;

-- Add input validation to update_achievement_progress function
CREATE OR REPLACE FUNCTION public.update_achievement_progress(p_user_id uuid, p_goal_type text, p_increment integer DEFAULT 1)
 RETURNS TABLE(achievements_completed json, rewards_earned json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  achievement_record RECORD;
  completed_achievements json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0, "spins": 0}'::json;
  current_level integer;
  temp_array json[];
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  -- Input validation: increment must be positive and reasonable
  IF p_increment IS NULL OR p_increment <= 0 OR p_increment > 10000 THEN
    RAISE EXCEPTION 'Invalid increment: must be between 1 and 10000';
  END IF;

  RAISE LOG 'update_achievement_progress called for user % goal_type % increment %', p_user_id, p_goal_type, p_increment;

  IF p_goal_type = 'level' THEN
    SELECT level INTO current_level FROM public.profiles WHERE user_id = p_user_id;
    RAISE LOG 'User current level: %', current_level;
  END IF;

  FOR achievement_record IN 
    SELECT a.*, 
           COALESCE(ua.progress, 0) as current_progress,
           COALESCE(ua.next_goal_value, a.goal_value) as target_goal,
           COALESCE(ua.completed_count, 0) as times_completed,
           ua.is_completed,
           ua.rewards_claimed
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua ON (a.id = ua.achievement_id AND ua.user_id = p_user_id)
    WHERE a.goal_type = p_goal_type
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, next_goal_value, rewards_claimed)
    VALUES (p_user_id, achievement_record.id, achievement_record.goal_value, false)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF achievement_record.category = 'unique' AND achievement_record.is_completed AND achievement_record.rewards_claimed THEN
      CONTINUE;
    END IF;
    
    IF achievement_record.category = 'progressive' AND achievement_record.current_progress >= achievement_record.target_goal AND NOT achievement_record.rewards_claimed THEN
      RAISE LOG 'Skipping progressive achievement % - waiting for reward claim', achievement_record.title;
      CONTINUE;
    END IF;
    
    IF p_goal_type = 'level' THEN
      UPDATE public.user_achievements 
      SET progress = current_level, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      achievement_record.current_progress := current_level;
    ELSE
      UPDATE public.user_achievements 
      SET progress = progress + p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      
      SELECT progress INTO achievement_record.current_progress
      FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    RAISE LOG 'Achievement % progress: % / %', achievement_record.title, achievement_record.current_progress, achievement_record.target_goal;
    
    IF achievement_record.current_progress >= achievement_record.target_goal THEN
      DECLARE
        reward_coins integer := achievement_record.base_reward_coins;
        reward_xp integer := achievement_record.base_reward_xp;
        reward_shards numeric := achievement_record.base_reward_shards;
        reward_spins integer := achievement_record.base_reward_spins;
      BEGIN
        IF achievement_record.category = 'progressive' THEN
          reward_shards := achievement_record.base_reward_shards + (achievement_record.times_completed * achievement_record.reward_increment);
        END IF;
        
        IF achievement_record.category = 'unique' AND NOT achievement_record.is_completed THEN
          UPDATE public.user_achievements 
          SET is_completed = true, completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Unique achievement % completed!', achievement_record.title;
          
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        ELSIF achievement_record.category = 'progressive' THEN
          UPDATE public.user_achievements 
          SET completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Progressive achievement % completed and ready for claiming!', achievement_record.title;
          
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$function$;