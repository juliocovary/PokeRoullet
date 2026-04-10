
-- Drop and recreate sell_pokemon with clan points
DROP FUNCTION IF EXISTS public.sell_pokemon(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.sell_pokemon(p_user_id UUID, p_pokemon_id INTEGER, p_quantity INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, message TEXT, coins_earned INTEGER, new_pokecoins INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  RAISE LOG 'sell_pokemon called for user % pokemon % quantity %', p_user_id, p_pokemon_id, p_quantity;
  
  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  
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
  
  total_earned := coin_value * p_quantity;
  
  IF p_quantity = current_quantity THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  END IF;
  
  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  SELECT pokecoins INTO new_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RAISE LOG 'Pokemon sold successfully, earned % coins', total_earned;
  
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'sell', p_quantity);
  
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'sales', p_quantity);
  
  -- === CLAN POINTS: +5 per sell ===
  PERFORM add_clan_points(p_user_id, 5 * p_quantity, 'sell');
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$$;
