-- Make evolve_pokemon robust across environments even if unique index differs.
-- Avoid ON CONFLICT dependency by using manual update/insert for evolved pokemon.

CREATE OR REPLACE FUNCTION public.evolve_pokemon(
  p_user_id uuid,
  p_base_pokemon_id integer,
  p_evolved_pokemon_id integer,
  p_evolved_pokemon_name text,
  p_evolved_pokemon_rarity text,
  p_cards_required integer DEFAULT 3,
  p_item_id integer DEFAULT NULL::integer
)
RETURNS TABLE(success boolean, message text, new_pokemon json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity integer;
  item_quantity integer;
  evolved_existing_id uuid;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::text, '{}'::json;
    RETURN;
  END IF;

  -- Check if user has enough base cards (non-shiny evolution path)
  SELECT quantity INTO current_quantity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id
    AND pokemon_id = p_base_pokemon_id
    AND is_shiny = false;

  IF current_quantity IS NULL OR current_quantity < p_cards_required THEN
    RETURN QUERY SELECT FALSE, format('Você precisa de %s cards para evoluir', p_cards_required)::text, '{}'::json;
    RETURN;
  END IF;

  -- Validate and consume required item
  IF p_item_id IS NOT NULL THEN
    SELECT quantity INTO item_quantity
    FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id;

    IF item_quantity IS NULL OR item_quantity < 1 THEN
      RETURN QUERY SELECT FALSE, 'Você não possui o item necessário para esta evolução'::text, '{}'::json;
      RETURN;
    END IF;

    UPDATE public.user_items
    SET quantity = quantity - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND item_id = p_item_id;

    DELETE FROM public.user_items
    WHERE user_id = p_user_id AND item_id = p_item_id AND quantity <= 0;
  END IF;

  -- Consume base cards
  IF current_quantity = p_cards_required THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id
      AND pokemon_id = p_base_pokemon_id
      AND is_shiny = false;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_cards_required,
        created_at = now()
    WHERE user_id = p_user_id
      AND pokemon_id = p_base_pokemon_id
      AND is_shiny = false;
  END IF;

  -- Add evolved pokemon using manual upsert
  SELECT id INTO evolved_existing_id
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id
    AND pokemon_id = p_evolved_pokemon_id
    AND is_shiny = false
  LIMIT 1;

  IF evolved_existing_id IS NOT NULL THEN
    UPDATE public.pokemon_inventory
    SET quantity = quantity + 1,
        created_at = now()
    WHERE id = evolved_existing_id;
  ELSE
    INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
    VALUES (p_user_id, p_evolved_pokemon_id, p_evolved_pokemon_name, p_evolved_pokemon_rarity, 1, false);
  END IF;

  -- Progress hooks: use PERFORM to avoid coupling to return column names.
  PERFORM update_mission_progress(p_user_id, 'evolve', 1);
  PERFORM update_achievement_progress(p_user_id, 'evolutions', 1);

  RETURN QUERY
  SELECT TRUE,
         format('Seu %s evoluiu para %s!', p_base_pokemon_id, p_evolved_pokemon_name)::text,
         json_build_object(
           'id', p_evolved_pokemon_id,
           'name', p_evolved_pokemon_name,
           'rarity', p_evolved_pokemon_rarity
         );
END;
$function$;
