
-- 1. Atualizar a constraint de status para incluir 'expired'
ALTER TABLE marketplace_listings DROP CONSTRAINT marketplace_listings_status_check;
ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'sold'::text, 'cancelled'::text, 'expired'::text]));

-- 2. Executar limpeza das ofertas expiradas
SELECT cleanup_expired_listings();

-- 3. Corrigir a função create_marketplace_listing para não depender de auth.uid() em SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(
  p_user_id uuid, 
  p_pokemon_id integer, 
  p_price integer, 
  p_is_shiny boolean DEFAULT false
)
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
BEGIN
  -- Validar que p_user_id foi fornecido
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'ID do usuário é obrigatório'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verificar se o usuário existe no profiles (prova que é um usuário válido)
  SELECT nickname INTO v_nickname
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_nickname IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Perfil do usuário não encontrado'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Primeiro, limpar ofertas expiradas
  PERFORM cleanup_expired_listings();

  -- Verificar limite de 3 ofertas ativas
  SELECT COUNT(*) INTO v_active_listings_count
  FROM marketplace_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_listings_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'Você já possui 3 ofertas ativas. Remova uma para criar outra.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Validação de preço
  IF p_price < 1 OR p_price > 9999 THEN
    RETURN QUERY SELECT FALSE, 'Preço deve ser entre 1 e 9999 Pokécoins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verificar inventário
  SELECT quantity, pokemon_name, rarity INTO v_quantity, v_pokemon_name, v_rarity
  FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_quantity IS NULL OR v_quantity < 1 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no inventário'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Remover do inventário
  IF v_quantity = 1 THEN
    DELETE FROM pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE pokemon_inventory
    SET quantity = quantity - 1, created_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;

  -- Criar oferta com data de expiração
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

-- 4. Criar função para buscar ofertas ativas (filtra expiradas automaticamente)
CREATE OR REPLACE FUNCTION public.get_active_marketplace_listings(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12,
  p_rarity text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  seller_id uuid,
  seller_nickname text,
  pokemon_id integer,
  pokemon_name text,
  rarity text,
  is_shiny boolean,
  price integer,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Primeiro, limpar ofertas expiradas
  PERFORM cleanup_expired_listings();
  
  -- Contar total
  SELECT COUNT(*) INTO v_total
  FROM marketplace_listings ml
  WHERE ml.status = 'active'
    AND ml.expires_at > NOW()
    AND (p_rarity IS NULL OR p_rarity = 'all' OR ml.rarity = p_rarity)
    AND (p_search IS NULL OR ml.pokemon_name ILIKE '%' || p_search || '%');
  
  -- Retornar resultados
  RETURN QUERY
  SELECT 
    ml.id,
    ml.seller_id,
    ml.seller_nickname,
    ml.pokemon_id,
    ml.pokemon_name,
    ml.rarity,
    ml.is_shiny,
    ml.price,
    ml.status,
    ml.created_at,
    ml.expires_at,
    v_total
  FROM marketplace_listings ml
  WHERE ml.status = 'active'
    AND ml.expires_at > NOW()
    AND (p_rarity IS NULL OR p_rarity = 'all' OR ml.rarity = p_rarity)
    AND (p_search IS NULL OR ml.pokemon_name ILIKE '%' || p_search || '%')
  ORDER BY ml.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;
