-- Add is_shiny column to pokemon_inventory
ALTER TABLE pokemon_inventory 
ADD COLUMN is_shiny BOOLEAN DEFAULT false NOT NULL;

-- Add is_shiny column to pokedex_cards
ALTER TABLE pokedex_cards 
ADD COLUMN is_shiny BOOLEAN DEFAULT false NOT NULL;

-- Create or replace the place_pokemon_in_pokedex function with shiny support
CREATE OR REPLACE FUNCTION place_pokemon_in_pokedex(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_pokemon_name TEXT,
  p_is_shiny BOOLEAN DEFAULT false
)
RETURNS TABLE(success BOOLEAN, message TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    -- Update to new version (Shiny or non-Shiny)
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
      'colado com sucesso! ' ||
      CASE WHEN v_existing_card.is_shiny != p_is_shiny THEN 'Card anterior substituído.' ELSE '' END)::TEXT;
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
$$;