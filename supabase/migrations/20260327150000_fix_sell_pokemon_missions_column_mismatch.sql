-- Fix sell_pokemon runtime error caused by outdated update_mission_progress column name assumptions.
-- Use PERFORM instead of selecting named output columns from progress functions.

DROP FUNCTION IF EXISTS public.sell_pokemon(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.sell_pokemon(uuid, integer, integer, boolean);

CREATE OR REPLACE FUNCTION public.sell_pokemon(
  p_user_id uuid,
  p_pokemon_id integer,
  p_quantity integer DEFAULT 1,
  p_is_shiny boolean DEFAULT false
)
RETURNS TABLE(success boolean, message text, pokecoins_earned integer, new_pokecoins integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity integer;
  pokemon_rarity text;
  pokemon_name_value text;
  is_starter boolean;
  coin_value integer;
  total_earned integer;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::text, 0::integer, 0::integer;
    RETURN;
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 10000 THEN
    RETURN QUERY SELECT FALSE, 'Invalid quantity: must be between 1 and 10000'::text, 0::integer, 0::integer;
    RETURN;
  END IF;

  SELECT quantity, rarity, pokemon_name
  INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id
    AND pokemon_id = p_pokemon_id
    AND is_shiny = p_is_shiny;

  IF current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pokémon não encontrado no inventário'::text, 0::integer, 0::integer;
    RETURN;
  END IF;

  IF p_quantity > current_quantity THEN
    RETURN QUERY SELECT FALSE, 'Quantidade insuficiente'::text, 0::integer, 0::integer;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = p_user_id
      AND starter_pokemon IS NOT NULL
      AND starter_pokemon = pokemon_name_value
  ) INTO is_starter;

  IF is_starter THEN
    RETURN QUERY SELECT FALSE, 'Não é possível vender seu Pokémon inicial'::text, 0::integer, 0::integer;
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

  IF p_is_shiny THEN
    coin_value := coin_value * 3;
  END IF;

  total_earned := coin_value * p_quantity;

  IF p_quantity = current_quantity THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id
      AND pokemon_id = p_pokemon_id
      AND is_shiny = p_is_shiny;
  END IF;

  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Avoid coupling to update_mission_progress output column names.
  PERFORM update_mission_progress(p_user_id, 'sell', p_quantity);
  PERFORM update_achievement_progress(p_user_id, 'sales', p_quantity);

  PERFORM add_clan_points(p_user_id, 5 * p_quantity, 'sell');

  RETURN QUERY
  SELECT TRUE,
         'Pokémon vendido com sucesso!'::text,
         total_earned,
         (SELECT pokecoins FROM public.profiles WHERE user_id = p_user_id);
END;
$function$;
