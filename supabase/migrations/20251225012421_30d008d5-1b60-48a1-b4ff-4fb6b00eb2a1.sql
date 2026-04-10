-- Corrigir a função select_starter_pokemon com search_path adequado
CREATE OR REPLACE FUNCTION public.select_starter_pokemon(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_pokemon_name TEXT,
  p_rarity TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_existing_starter TEXT;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  -- Check if user already has a starter
  SELECT starter_pokemon INTO v_existing_starter
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_existing_starter IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Você já selecionou um Pokémon inicial'::TEXT;
    RETURN;
  END IF;

  -- Update profile with starter selection
  UPDATE public.profiles
  SET starter_pokemon = p_pokemon_name, updated_at = now()
  WHERE user_id = p_user_id;

  -- Add Pokemon to inventory
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, p_pokemon_id, p_pokemon_name, p_rarity, 1, false)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = now();

  RETURN QUERY SELECT TRUE, 'Pokémon inicial selecionado com sucesso!'::TEXT;
END;
$$;