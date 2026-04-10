-- Fix function to sell pokemon - correct starter pokemon check
CREATE OR REPLACE FUNCTION public.sell_pokemon(
  p_user_id uuid,
  p_pokemon_id integer,
  p_quantity integer
) RETURNS TABLE(
  success boolean,
  message text,
  pokecoins_earned integer,
  new_pokecoins integer
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  current_quantity INTEGER;
  pokemon_rarity TEXT;
  pokemon_name TEXT;
  is_starter BOOLEAN;
  coin_value INTEGER;
  total_earned INTEGER;
BEGIN
  -- Get current quantity, rarity and pokemon name
  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  
  -- Check if pokemon exists in inventory
  IF current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pokémon não encontrado no inventário'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user has enough quantity
  IF p_quantity > current_quantity THEN
    RETURN QUERY SELECT FALSE, 'Quantidade insuficiente'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Check if it's a starter pokemon by comparing names
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND starter_pokemon IS NOT NULL
    AND starter_pokemon = pokemon_name
  ) INTO is_starter;
  
  IF is_starter THEN
    RETURN QUERY SELECT FALSE, 'Não é possível vender seu Pokémon inicial'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Calculate coin value based on rarity
  coin_value := CASE pokemon_rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 5
    WHEN 'pseudo' THEN 25
    WHEN 'legendary' THEN 150
    WHEN 'secret' THEN 500
    ELSE 1
  END;
  
  total_earned := coin_value * p_quantity;
  
  -- Update pokemon inventory
  IF p_quantity = current_quantity THEN
    -- Remove completely if selling all
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  ELSE
    -- Reduce quantity
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  END IF;
  
  -- Add pokecoins to user
  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Get new pokecoins total
  SELECT pokecoins INTO new_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$$;