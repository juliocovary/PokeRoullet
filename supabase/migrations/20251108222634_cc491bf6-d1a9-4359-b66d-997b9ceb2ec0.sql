-- Fix place_pokemon_in_pokedex to prevent placing same type over same type
CREATE OR REPLACE FUNCTION public.place_pokemon_in_pokedex(p_user_id uuid, p_pokemon_id integer, p_pokemon_name text, p_is_shiny boolean DEFAULT false)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owned_quantity INTEGER;
  v_existing_card RECORD;
BEGIN
  -- Check if user owns the Pokemon (Shiny or non-Shiny as requested)
  SELECT quantity INTO v_owned_quantity
  FROM pokemon_inventory
  WHERE user_id = p_user_id 
    AND pokemon_id = p_pokemon_id
    AND is_shiny = p_is_shiny;
  
  -- If doesn't own it, return error
  IF v_owned_quantity IS NULL OR v_owned_quantity <= 0 THEN
    RETURN QUERY SELECT false, ('Você não possui este Pokémon' || 
      CASE WHEN p_is_shiny THEN ' Shiny' ELSE '' END || ' no inventário.')::TEXT;
    RETURN;
  END IF;
  
  -- Check if a card already exists (Shiny or non-Shiny)
  SELECT * INTO v_existing_card
  FROM pokedex_cards
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  
  -- If card already exists
  IF FOUND THEN
    -- Check if trying to place the same type of card
    IF v_existing_card.is_shiny = p_is_shiny THEN
      RETURN QUERY SELECT false, ('Já existe um card ' || 
        CASE WHEN p_is_shiny THEN 'Shiny' ELSE 'Normal' END || 
        ' colado. Você só pode substituir por um tipo diferente.')::TEXT;
      RETURN;
    END IF;
    
    -- If we got here, we're swapping Normal <-> Shiny, so update is allowed
    UPDATE pokedex_cards
    SET is_shiny = p_is_shiny,
        placed_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
    
    -- Decrement quantity in inventory
    UPDATE pokemon_inventory
    SET quantity = quantity - 1
    WHERE user_id = p_user_id 
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny;
    
    -- Remove from inventory if quantity reaches 0
    DELETE FROM pokemon_inventory
    WHERE user_id = p_user_id 
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny
      AND quantity <= 0;
    
    RETURN QUERY SELECT true, ('Card ' || 
      CASE WHEN p_is_shiny THEN 'Shiny ' ELSE '' END || 
      'colado com sucesso! Card anterior substituído.')::TEXT;
  ELSE
    -- Insert new card
    INSERT INTO pokedex_cards (user_id, pokemon_id, pokemon_name, is_shiny)
    VALUES (p_user_id, p_pokemon_id, p_pokemon_name, p_is_shiny);
    
    -- Decrement quantity in inventory
    UPDATE pokemon_inventory
    SET quantity = quantity - 1
    WHERE user_id = p_user_id 
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny;
    
    -- Remove from inventory if quantity reaches 0
    DELETE FROM pokemon_inventory
    WHERE user_id = p_user_id 
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny
      AND quantity <= 0;
    
    RETURN QUERY SELECT true, ('Card ' || 
      CASE WHEN p_is_shiny THEN 'Shiny ' ELSE '' END || 
      'colado com sucesso na Pokédex!')::TEXT;
  END IF;
END;
$function$;