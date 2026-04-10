-- Fix SQL injection in search_public_profiles by escaping ILIKE special characters
DROP FUNCTION IF EXISTS public.search_public_profiles(text, uuid);

CREATE OR REPLACE FUNCTION public.search_public_profiles(
  search_term text, 
  exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  nickname text,
  avatar text,
  level integer,
  current_region text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escaped_term text;
BEGIN
  -- Escape ILIKE special characters to prevent pattern injection
  v_escaped_term := replace(replace(search_term, '%', '\%'), '_', '\_');
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.nickname,
    p.avatar,
    p.level,
    p.current_region
  FROM profiles p
  WHERE 
    p.nickname ILIKE '%' || v_escaped_term || '%' ESCAPE '\'
    AND (exclude_user_id IS NULL OR p.user_id != exclude_user_id)
  LIMIT 10;
END;
$$;

-- Create server-side mystery box opening function
CREATE OR REPLACE FUNCTION public.open_mystery_box(
  p_user_id uuid,
  p_count integer DEFAULT 1
)
RETURNS TABLE(success boolean, message text, rewards jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mystery_box_count INTEGER;
  v_roll NUMERIC;
  v_reward JSONB;
  v_rewards JSONB := '[]'::jsonb;
  i INTEGER;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, '[]'::jsonb;
    RETURN;
  END IF;
  
  -- Validate count
  IF p_count < 1 OR p_count > 100 THEN
    RETURN QUERY SELECT FALSE, 'Invalid count: must be between 1 and 100'::TEXT, '[]'::jsonb;
    RETURN;
  END IF;
  
  -- Check user has enough mystery boxes
  SELECT quantity INTO v_mystery_box_count
  FROM user_items
  WHERE user_id = p_user_id AND item_id = 52;
  
  IF v_mystery_box_count IS NULL OR v_mystery_box_count < p_count THEN
    RETURN QUERY SELECT FALSE, 'Not enough mystery boxes'::TEXT, '[]'::jsonb;
    RETURN;
  END IF;
  
  -- Consume mystery boxes
  UPDATE user_items 
  SET quantity = quantity - p_count, updated_at = now()
  WHERE user_id = p_user_id AND item_id = 52;
  
  -- Delete if quantity is 0
  DELETE FROM user_items WHERE user_id = p_user_id AND item_id = 52 AND quantity <= 0;
  
  -- Open each box with server-side random
  FOR i IN 1..p_count LOOP
    v_roll := random() * 100;
    
    IF v_roll < 40 THEN
      -- 5 Spins (40%)
      v_reward := jsonb_build_object('type', 'spins', 'amount', 5);
      UPDATE user_spins SET free_spins = free_spins + 5, updated_at = now() WHERE user_id = p_user_id;
    ELSIF v_roll < 55 THEN
      -- 100 Coins (15%)
      v_reward := jsonb_build_object('type', 'pokecoins', 'amount', 100);
      UPDATE profiles SET pokecoins = pokecoins + 100, updated_at = now() WHERE user_id = p_user_id;
    ELSIF v_roll < 70 THEN
      -- 25 Shards (15%)
      v_reward := jsonb_build_object('type', 'pokeshards', 'amount', 25);
      UPDATE profiles SET pokeshards = pokeshards + 25, updated_at = now() WHERE user_id = p_user_id;
    ELSIF v_roll < 80 THEN
      -- Shiny Potion (10%)
      v_reward := jsonb_build_object('type', 'item', 'amount', 1, 'itemName', 'Shiny Potion');
      INSERT INTO user_items (user_id, item_id, quantity)
      VALUES (p_user_id, 51, 1)
      ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_items.quantity + 1, updated_at = now();
    ELSIF v_roll < 90 THEN
      -- Luck Potion (10%)
      v_reward := jsonb_build_object('type', 'item', 'amount', 1, 'itemName', 'Luck Potion');
      INSERT INTO user_items (user_id, item_id, quantity)
      VALUES (p_user_id, 50, 1)
      ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_items.quantity + 1, updated_at = now();
    ELSIF v_roll < 95 THEN
      -- 15 Spins (5%)
      v_reward := jsonb_build_object('type', 'spins', 'amount', 15);
      UPDATE user_spins SET free_spins = free_spins + 15, updated_at = now() WHERE user_id = p_user_id;
    ELSIF v_roll < 97.5 THEN
      -- 250 Coins (2.5%)
      v_reward := jsonb_build_object('type', 'pokecoins', 'amount', 250);
      UPDATE profiles SET pokecoins = pokecoins + 250, updated_at = now() WHERE user_id = p_user_id;
    ELSIF v_roll < 99 THEN
      -- 100 Shards (1.5%)
      v_reward := jsonb_build_object('type', 'pokeshards', 'amount', 100);
      UPDATE profiles SET pokeshards = pokeshards + 100, updated_at = now() WHERE user_id = p_user_id;
    ELSE
      -- Legendary Spin (1%)
      v_reward := jsonb_build_object('type', 'legendary_spin', 'amount', 1);
      INSERT INTO user_items (user_id, item_id, quantity)
      VALUES (p_user_id, 53, 1)
      ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_items.quantity + 1, updated_at = now();
    END IF;
    
    v_rewards := v_rewards || v_reward;
  END LOOP;
  
  RETURN QUERY SELECT TRUE, 'Mystery boxes opened successfully'::TEXT, v_rewards;
END;
$$;

-- Create server-side legendary spin function
CREATE OR REPLACE FUNCTION public.use_legendary_spin(
  p_user_id uuid
)
RETURNS TABLE(success boolean, message text, pokemon_id integer, pokemon_name text, is_shiny boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_count INTEGER;
  v_legendary_ids INTEGER[] := ARRAY[144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 491];
  v_legendary_names TEXT[] := ARRAY['articuno', 'zapdos', 'moltres', 'mewtwo', 'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'darkrai'];
  v_random_index INTEGER;
  v_pokemon_id INTEGER;
  v_pokemon_name TEXT;
  v_is_shiny BOOLEAN;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0, ''::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Check user has legendary spin item
  SELECT quantity INTO v_item_count
  FROM user_items
  WHERE user_id = p_user_id AND item_id = 53;
  
  IF v_item_count IS NULL OR v_item_count < 1 THEN
    RETURN QUERY SELECT FALSE, 'No legendary spin available'::TEXT, 0, ''::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Consume legendary spin item
  UPDATE user_items 
  SET quantity = quantity - 1, updated_at = now()
  WHERE user_id = p_user_id AND item_id = 53;
  
  DELETE FROM user_items WHERE user_id = p_user_id AND item_id = 53 AND quantity <= 0;
  
  -- Server-side random selection
  v_random_index := floor(random() * array_length(v_legendary_ids, 1)) + 1;
  v_pokemon_id := v_legendary_ids[v_random_index];
  v_pokemon_name := v_legendary_names[v_random_index];
  
  -- 5% chance for shiny (server-side)
  v_is_shiny := random() < 0.05;
  
  -- Add to inventory
  INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, 'legendary', 1, v_is_shiny)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = now();
  
  RETURN QUERY SELECT TRUE, 'Legendary spin successful'::TEXT, v_pokemon_id, v_pokemon_name, v_is_shiny;
END;
$$;