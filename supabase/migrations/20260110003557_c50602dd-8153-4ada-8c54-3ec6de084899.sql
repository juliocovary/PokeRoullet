-- Fix the use_legendary_spin function to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.use_legendary_spin(p_user_id uuid)
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
  SELECT ui.quantity INTO v_item_count
  FROM user_items ui
  WHERE ui.user_id = p_user_id AND ui.item_id = 53;
  
  IF v_item_count IS NULL OR v_item_count < 1 THEN
    RETURN QUERY SELECT FALSE, 'No legendary spin available'::TEXT, 0, ''::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Consume legendary spin item
  UPDATE user_items ui
  SET quantity = ui.quantity - 1, updated_at = now()
  WHERE ui.user_id = p_user_id AND ui.item_id = 53;
  
  DELETE FROM user_items ui WHERE ui.user_id = p_user_id AND ui.item_id = 53 AND ui.quantity <= 0;
  
  -- Server-side random selection
  v_random_index := floor(random() * array_length(v_legendary_ids, 1)) + 1;
  v_pokemon_id := v_legendary_ids[v_random_index];
  v_pokemon_name := v_legendary_names[v_random_index];
  
  -- 5% chance for shiny (server-side)
  v_is_shiny := random() < 0.05;
  
  -- Add to inventory using explicit table alias to avoid ambiguity
  INSERT INTO pokemon_inventory AS pi (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, 'legendary', 1, v_is_shiny)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pi.quantity + 1, created_at = now();
  
  RETURN QUERY SELECT TRUE, 'Legendary spin successful'::TEXT, v_pokemon_id, v_pokemon_name, v_is_shiny;
END;
$$;