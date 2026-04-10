-- Pack marketplace listings (TradeHub)
CREATE TABLE public.marketplace_pack_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  seller_nickname text NOT NULL,
  pack_type_id text NOT NULL REFERENCES public.pack_types(id),
  pack_name text NOT NULL,
  pack_icon_url text,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  buyer_id uuid,
  sold_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '5 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_pack_status ON public.marketplace_pack_listings(status);
CREATE INDEX idx_marketplace_pack_seller ON public.marketplace_pack_listings(seller_id);
CREATE INDEX idx_marketplace_pack_type ON public.marketplace_pack_listings(pack_type_id);
CREATE INDEX idx_marketplace_pack_created_at ON public.marketplace_pack_listings(created_at DESC);

ALTER TABLE public.marketplace_pack_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pack listings"
  ON public.marketplace_pack_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create pack listings"
  ON public.marketplace_pack_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own pack listings"
  ON public.marketplace_pack_listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE OR REPLACE FUNCTION public.create_pack_marketplace_listing(
  p_user_id uuid,
  p_pack_type_id text,
  p_quantity integer,
  p_price integer
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname text;
  v_pack_name text;
  v_pack_icon text;
  v_user_qty integer;
  v_active_count integer;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  IF p_price < 1 OR p_price > 99999 THEN
    RETURN QUERY SELECT false, 'Price must be between 1 and 99999'::text;
    RETURN;
  END IF;

  IF p_quantity < 1 THEN
    RETURN QUERY SELECT false, 'Quantity must be at least 1'::text;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.marketplace_pack_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_count >= 3 THEN
    RETURN QUERY SELECT false, 'Maximum 3 active pack listings allowed'::text;
    RETURN;
  END IF;

  SELECT nickname INTO v_nickname
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_nickname IS NULL THEN
    RETURN QUERY SELECT false, 'Profile not found'::text;
    RETURN;
  END IF;

  SELECT name, icon_url INTO v_pack_name, v_pack_icon
  FROM public.pack_types
  WHERE id = p_pack_type_id;

  IF v_pack_name IS NULL THEN
    RETURN QUERY SELECT false, 'Pack type not found'::text;
    RETURN;
  END IF;

  SELECT quantity INTO v_user_qty
  FROM public.user_packs
  WHERE user_id = p_user_id AND pack_type_id = p_pack_type_id;

  IF v_user_qty IS NULL OR v_user_qty < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient pack quantity'::text;
    RETURN;
  END IF;

  UPDATE public.user_packs
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE user_id = p_user_id AND pack_type_id = p_pack_type_id;

  DELETE FROM public.user_packs
  WHERE user_id = p_user_id AND pack_type_id = p_pack_type_id AND quantity <= 0;

  INSERT INTO public.marketplace_pack_listings (
    seller_id,
    seller_nickname,
    pack_type_id,
    pack_name,
    pack_icon_url,
    quantity,
    price
  )
  VALUES (
    p_user_id,
    v_nickname,
    p_pack_type_id,
    v_pack_name,
    v_pack_icon,
    p_quantity,
    p_price
  );

  RETURN QUERY SELECT true, 'Pack listing created successfully'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_pack_marketplace_listing(
  p_user_id uuid,
  p_listing_id uuid
)
RETURNS TABLE(success boolean, message text, pack_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.marketplace_pack_listings%ROWTYPE;
  v_buyer_coins integer;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, ''::text;
    RETURN;
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_pack_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT false, 'Listing not found'::text, ''::text;
    RETURN;
  END IF;

  IF v_listing.status <> 'active' THEN
    RETURN QUERY SELECT false, 'Listing is no longer active'::text, ''::text;
    RETURN;
  END IF;

  IF v_listing.expires_at IS NOT NULL AND v_listing.expires_at < now() THEN
    RETURN QUERY SELECT false, 'Listing has expired'::text, ''::text;
    RETURN;
  END IF;

  IF v_listing.seller_id = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot buy your own listing'::text, ''::text;
    RETURN;
  END IF;

  SELECT pokecoins INTO v_buyer_coins
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_buyer_coins IS NULL OR v_buyer_coins < v_listing.price THEN
    RETURN QUERY SELECT false, 'Insufficient Pokecoins'::text, ''::text;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET pokecoins = pokecoins - v_listing.price,
      updated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET pokecoins = pokecoins + v_listing.price,
      updated_at = now()
  WHERE user_id = v_listing.seller_id;

  INSERT INTO public.user_packs (user_id, pack_type_id, quantity)
  VALUES (p_user_id, v_listing.pack_type_id, v_listing.quantity)
  ON CONFLICT (user_id, pack_type_id)
  DO UPDATE SET quantity = public.user_packs.quantity + EXCLUDED.quantity,
                updated_at = now();

  UPDATE public.marketplace_pack_listings
  SET status = 'sold',
      buyer_id = p_user_id,
      sold_at = now(),
      updated_at = now()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT true, 'Purchase successful!'::text, v_listing.pack_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pack_marketplace_listing(
  p_user_id uuid,
  p_listing_id uuid
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.marketplace_pack_listings%ROWTYPE;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_pack_listings
  WHERE id = p_listing_id
    AND seller_id = p_user_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT false, 'Listing not found'::text;
    RETURN;
  END IF;

  IF v_listing.status <> 'active' THEN
    RETURN QUERY SELECT false, 'Listing is no longer active'::text;
    RETURN;
  END IF;

  INSERT INTO public.user_packs (user_id, pack_type_id, quantity)
  VALUES (p_user_id, v_listing.pack_type_id, v_listing.quantity)
  ON CONFLICT (user_id, pack_type_id)
  DO UPDATE SET quantity = public.user_packs.quantity + EXCLUDED.quantity,
                updated_at = now();

  UPDATE public.marketplace_pack_listings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT true, 'Listing cancelled, packs returned'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_pack_marketplace_listings(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  seller_id uuid,
  seller_nickname text,
  pack_type_id text,
  pack_name text,
  pack_icon_url text,
  quantity integer,
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
  v_offset integer;
  v_total bigint;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM public.marketplace_pack_listings mpl
  WHERE mpl.status = 'active'
    AND (mpl.expires_at IS NULL OR mpl.expires_at > now())
    AND (p_search IS NULL OR p_search = '' OR mpl.pack_name ILIKE '%' || p_search || '%');

  RETURN QUERY
  SELECT
    mpl.id,
    mpl.seller_id,
    mpl.seller_nickname,
    mpl.pack_type_id,
    mpl.pack_name,
    mpl.pack_icon_url,
    mpl.quantity,
    mpl.price,
    mpl.status,
    mpl.created_at,
    mpl.expires_at,
    v_total
  FROM public.marketplace_pack_listings mpl
  WHERE mpl.status = 'active'
    AND (mpl.expires_at IS NULL OR mpl.expires_at > now())
    AND (p_search IS NULL OR p_search = '' OR mpl.pack_name ILIKE '%' || p_search || '%')
  ORDER BY mpl.created_at DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_pack_marketplace_listings(
  p_user_id uuid
)
RETURNS TABLE(
  id uuid,
  seller_id uuid,
  seller_nickname text,
  pack_type_id text,
  pack_name text,
  pack_icon_url text,
  quantity integer,
  price integer,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mpl.id,
    mpl.seller_id,
    mpl.seller_nickname,
    mpl.pack_type_id,
    mpl.pack_name,
    mpl.pack_icon_url,
    mpl.quantity,
    mpl.price,
    mpl.status,
    mpl.created_at,
    mpl.expires_at
  FROM public.marketplace_pack_listings mpl
  WHERE mpl.seller_id = p_user_id
    AND mpl.status = 'active'
  ORDER BY mpl.created_at DESC;
END;
$$;
