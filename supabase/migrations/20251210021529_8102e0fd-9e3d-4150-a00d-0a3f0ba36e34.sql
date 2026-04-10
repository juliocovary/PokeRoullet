
CREATE OR REPLACE FUNCTION public.evolve_pokemon(p_user_id uuid, p_base_pokemon_id integer, p_evolved_pokemon_id integer, p_evolved_pokemon_name text, p_evolved_pokemon_rarity text, p_cards_required integer DEFAULT 3, p_item_id integer DEFAULT NULL::integer)
 RETURNS TABLE(success boolean, message text, new_pokemon json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity INTEGER;
  item_quantity INTEGER;
  mission_result RECORD;
  achievement_result RECORD;
BEGIN
  RAISE LOG 'evolve_pokemon called for user % base_pokemon % evolved_pokemon %', p_user_id, p_base_pokemon_id, p_evolved_pokemon_id;
  
  -- Check if user has enough cards of base pokemon (non-shiny only for evolution)
  SELECT quantity INTO current_quantity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  
  IF current_quantity IS NULL OR current_quantity < p_cards_required THEN
    RETURN QUERY SELECT FALSE, format('Você precisa de %s cards para evoluir', p_cards_required)::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Check if item is required and user has it
  IF p_item_id IS NOT NULL THEN
    SELECT quantity INTO item_quantity
    FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    IF item_quantity IS NULL OR item_quantity < 1 THEN
      RETURN QUERY SELECT FALSE, 'Você não possui o item necessário para esta evolução'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    -- Consume the item
    UPDATE public.user_items
    SET quantity = quantity - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- Remove item completely if quantity is 0
    DELETE FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id AND quantity <= 0;
  END IF;
  
  -- Consume the required cards (non-shiny)
  IF current_quantity = p_cards_required THEN
    -- Remove completely if using all cards
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  ELSE
    -- Reduce quantity
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_cards_required,
        created_at = now()
    WHERE user_id = p_user_id AND pokemon_id = p_base_pokemon_id AND is_shiny = false;
  END IF;
  
  -- Add evolved pokemon to inventory (non-shiny)
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, p_evolved_pokemon_id, p_evolved_pokemon_name, p_evolved_pokemon_rarity, 1, false)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET 
    quantity = pokemon_inventory.quantity + 1,
    created_at = now();
  
  RAISE LOG 'Pokemon evolved successfully from % to %', p_base_pokemon_id, p_evolved_pokemon_id;
  
  -- Update mission progress for evolving pokemon
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'evolve', 1);
  
  RAISE LOG 'Mission progress updated for evolution';
  
  -- Update achievement progress for evolving pokemon
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'evolutions', 1);
  
  RAISE LOG 'Achievement progress updated for evolution';
  
  RETURN QUERY SELECT 
    TRUE, 
    format('Seu %s evoluiu para %s!', p_base_pokemon_id, p_evolved_pokemon_name)::TEXT,
    json_build_object(
      'id', p_evolved_pokemon_id,
      'name', p_evolved_pokemon_name,
      'rarity', p_evolved_pokemon_rarity
    );
END;
$function$;
