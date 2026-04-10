-- Corrigir função create_marketplace_listing para funcionar corretamente com SECURITY DEFINER
-- O problema era que auth.uid() pode retornar NULL em contexto SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.create_marketplace_listing(p_user_id uuid, p_pokemon_id integer, p_price integer, p_is_shiny boolean DEFAULT false)
RETURNS TABLE(success boolean, message text, listing_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quantity INTEGER;
  v_pokemon_name TEXT;
  v_rarity TEXT;
  v_nickname TEXT;
  v_new_listing_id UUID;
  v_active_listings_count INTEGER;
  v_auth_uid UUID;
BEGIN
  -- Get auth.uid() safely
  v_auth_uid := auth.uid();
  
  -- Auth validation - verificar se o usuário está autenticado E se é o mesmo usuário
  IF v_auth_uid IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: user not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_user_id != v_auth_uid THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- First, cleanup any expired listings for this user (to free up slots)
  PERFORM cleanup_expired_listings();

  -- Check if user already has 3 active listings
  SELECT COUNT(*) INTO v_active_listings_count
  FROM marketplace_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_listings_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'Você já possui 3 ofertas ativas. Remova uma para criar outra.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Price validation
  IF p_price < 1 OR p_price > 9999 THEN
    RETURN QUERY SELECT FALSE, 'Preço deve ser entre 1 e 9999 Pokécoins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check inventory
  SELECT quantity, pokemon_name, rarity INTO v_quantity, v_pokemon_name, v_rarity
  FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_quantity IS NULL OR v_quantity < 1 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no inventário'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get seller nickname
  SELECT nickname INTO v_nickname
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_nickname IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Perfil do usuário não encontrado'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Remove from inventory
  IF v_quantity = 1 THEN
    DELETE FROM pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE pokemon_inventory
    SET quantity = quantity - 1, created_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;

  -- Create listing with expiration date
  INSERT INTO marketplace_listings (
    seller_id, seller_nickname, pokemon_id, pokemon_name, rarity, is_shiny, price, expires_at
  ) VALUES (
    p_user_id, v_nickname, p_pokemon_id, v_pokemon_name, v_rarity, p_is_shiny, p_price, now() + INTERVAL '5 days'
  )
  RETURNING id INTO v_new_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta criada com sucesso!'::TEXT, v_new_listing_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Erro ao criar oferta: ' || SQLERRM)::TEXT, NULL::UUID;
END;
$$;