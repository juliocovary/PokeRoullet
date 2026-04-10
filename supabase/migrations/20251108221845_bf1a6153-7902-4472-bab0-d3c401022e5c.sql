-- Update sell_pokemon function to handle shiny pokemon
CREATE OR REPLACE FUNCTION public.sell_pokemon(p_user_id uuid, p_pokemon_id integer, p_quantity integer, p_is_shiny boolean DEFAULT false)
 RETURNS TABLE(success boolean, message text, pokecoins_earned integer, new_pokecoins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  RAISE LOG 'sell_pokemon called for user % pokemon % quantity % shiny %', p_user_id, p_pokemon_id, p_quantity, p_is_shiny;
  
  -- Get current quantity, rarity and pokemon name
  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  
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
    AND starter_pokemon = pokemon_name_value
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
  
  -- Apply shiny multiplier (3x for shiny)
  IF p_is_shiny THEN
    coin_value := coin_value * 3;
  END IF;
  
  total_earned := coin_value * p_quantity;
  
  -- Update pokemon inventory
  IF p_quantity = current_quantity THEN
    -- Remove completely if selling all
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    -- Reduce quantity
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
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
  
  RAISE LOG 'Pokemon sold successfully, earned % coins', total_earned;
  
  -- Update mission progress for selling cards (keep as 'sell' for missions)
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'sell', p_quantity);
  
  RAISE LOG 'Mission progress updated for selling cards';
  
  -- Update achievement progress for selling cards (use 'sales' for achievements)
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'sales', p_quantity);
  
  RAISE LOG 'Achievement progress updated for selling cards';
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$$;