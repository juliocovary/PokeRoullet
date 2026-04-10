-- Tabela de ofertas do mercado
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  seller_nickname TEXT NOT NULL,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  is_shiny BOOLEAN NOT NULL DEFAULT FALSE,
  price INTEGER NOT NULL CHECK (price >= 1 AND price <= 9999),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX idx_marketplace_rarity ON public.marketplace_listings(rarity);
CREATE INDEX idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_pokemon_name ON public.marketplace_listings(pokemon_name);
CREATE INDEX idx_marketplace_created_at ON public.marketplace_listings(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view active listings"
ON public.marketplace_listings
FOR SELECT
USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create listings"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
ON public.marketplace_listings
FOR UPDATE
USING (auth.uid() = seller_id OR auth.uid() IS NOT NULL);

-- Função para criar uma oferta no mercado
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_price INTEGER,
  p_is_shiny BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(success BOOLEAN, message TEXT, listing_id UUID)
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
BEGIN
  -- Validar preço
  IF p_price < 1 OR p_price > 9999 THEN
    RETURN QUERY SELECT FALSE, 'Preço deve ser entre 1 e 9999 Pokécoins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verificar se o jogador tem o card no inventário
  SELECT quantity, pokemon_name, rarity INTO v_quantity, v_pokemon_name, v_rarity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_quantity IS NULL OR v_quantity < 1 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no inventário'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Buscar nickname do vendedor
  SELECT nickname INTO v_nickname
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Remover card do inventário
  IF v_quantity = 1 THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - 1, created_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;

  -- Criar a oferta
  INSERT INTO public.marketplace_listings (
    seller_id, seller_nickname, pokemon_id, pokemon_name, rarity, is_shiny, price
  ) VALUES (
    p_user_id, v_nickname, p_pokemon_id, v_pokemon_name, v_rarity, p_is_shiny, p_price
  )
  RETURNING id INTO v_new_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta criada com sucesso!'::TEXT, v_new_listing_id;
END;
$$;

-- Função para comprar uma oferta
CREATE OR REPLACE FUNCTION public.buy_marketplace_listing(
  p_user_id UUID,
  p_listing_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, pokemon_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
  v_buyer_coins INTEGER;
BEGIN
  -- Buscar a oferta
  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Oferta não encontrada ou já vendida'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Verificar se não é o próprio vendedor
  IF v_listing.seller_id = p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não pode comprar sua própria oferta'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Verificar coins do comprador
  SELECT pokecoins INTO v_buyer_coins
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_buyer_coins < v_listing.price THEN
    RETURN QUERY SELECT FALSE, 'Pokécoins insuficientes'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Deduzir coins do comprador
  UPDATE public.profiles
  SET pokecoins = pokecoins - v_listing.price, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Adicionar coins ao vendedor
  UPDATE public.profiles
  SET pokecoins = pokecoins + v_listing.price, updated_at = NOW()
  WHERE user_id = v_listing.seller_id;

  -- Adicionar card ao inventário do comprador
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
  VALUES (p_user_id, v_listing.pokemon_id, v_listing.pokemon_name, v_listing.rarity, v_listing.is_shiny, 1)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();

  -- Atualizar status da oferta
  UPDATE public.marketplace_listings
  SET status = 'sold', buyer_id = p_user_id, sold_at = NOW(), updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT TRUE, 'Compra realizada com sucesso!'::TEXT, v_listing.pokemon_name;
END;
$$;

-- Função para cancelar uma oferta
CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(
  p_user_id UUID,
  p_listing_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
BEGIN
  -- Buscar a oferta
  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id AND status = 'active' AND seller_id = p_user_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Oferta não encontrada ou você não é o vendedor'::TEXT;
    RETURN;
  END IF;

  -- Retornar card ao inventário do vendedor
  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
  VALUES (p_user_id, v_listing.pokemon_id, v_listing.pokemon_name, v_listing.rarity, v_listing.is_shiny, 1)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();

  -- Atualizar status da oferta
  UPDATE public.marketplace_listings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta cancelada com sucesso!'::TEXT;
END;
$$;