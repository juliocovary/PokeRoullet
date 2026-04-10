-- Fix legendary spin item-id mismatch: allow consuming item 32 or 53
CREATE OR REPLACE FUNCTION public.use_legendary_spin(p_user_id uuid)
RETURNS TABLE(success boolean, message text, pokemon_id integer, pokemon_name text, is_shiny boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_item_id INTEGER;
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

  -- Determine which legendary-spin item the user has (prefer 53 if present)
  SELECT ui.item_id, ui.quantity
  INTO v_item_id, v_item_count
  FROM public.user_items ui
  WHERE ui.user_id = p_user_id
    AND ui.item_id IN (53, 32)
    AND ui.quantity > 0
  ORDER BY CASE ui.item_id WHEN 53 THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_item_id IS NULL OR v_item_count IS NULL OR v_item_count < 1 THEN
    RETURN QUERY SELECT FALSE, 'No legendary spin available'::TEXT, 0, ''::TEXT, FALSE;
    RETURN;
  END IF;

  -- Consume the item we found
  UPDATE public.user_items ui
  SET quantity = ui.quantity - 1,
      updated_at = now()
  WHERE ui.user_id = p_user_id
    AND ui.item_id = v_item_id;

  DELETE FROM public.user_items ui
  WHERE ui.user_id = p_user_id
    AND ui.item_id = v_item_id
    AND ui.quantity <= 0;

  -- Server-side random selection
  v_random_index := floor(random() * array_length(v_legendary_ids, 1)) + 1;
  v_pokemon_id := v_legendary_ids[v_random_index];
  v_pokemon_name := v_legendary_names[v_random_index];

  -- 5% chance for shiny
  v_is_shiny := random() < 0.05;

  -- Add to inventory
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, 'legendary', 1, v_is_shiny)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = public.pokemon_inventory.quantity + 1,
                created_at = now();

  RETURN QUERY SELECT TRUE, 'Legendary spin successful'::TEXT, v_pokemon_id, v_pokemon_name, v_is_shiny;
END;
$$;
