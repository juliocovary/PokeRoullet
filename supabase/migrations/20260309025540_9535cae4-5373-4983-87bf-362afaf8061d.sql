
-- Table for item marketplace listings
CREATE TABLE public.marketplace_item_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  seller_nickname text NOT NULL,
  item_id integer NOT NULL REFERENCES public.items(id),
  item_name text NOT NULL,
  item_type text NOT NULL,
  item_icon_url text,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  buyer_id uuid,
  sold_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '5 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.marketplace_item_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active item listings"
  ON public.marketplace_item_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create item listings"
  ON public.marketplace_item_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own item listings"
  ON public.marketplace_item_listings FOR UPDATE
  USING (auth.uid() = seller_id);

-- RPC: Create item listing
CREATE OR REPLACE FUNCTION public.create_item_marketplace_listing(
  p_user_id uuid,
  p_item_id integer,
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
  v_item_name text;
  v_item_type text;
  v_item_icon text;
  v_user_qty integer;
  v_active_count integer;
BEGIN
  -- Validate auth
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  -- Validate price
  IF p_price < 1 OR p_price > 99999 THEN
    RETURN QUERY SELECT false, 'Price must be between 1 and 99999'::text;
    RETURN;
  END IF;

  -- Validate quantity
  IF p_quantity < 1 THEN
    RETURN QUERY SELECT false, 'Quantity must be at least 1'::text;
    RETURN;
  END IF;

  -- Check active listings limit (max 3)
  SELECT COUNT(*) INTO v_active_count
  FROM marketplace_item_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_count >= 3 THEN
    RETURN QUERY SELECT false, 'Maximum 3 active item listings allowed'::text;
    RETURN;
  END IF;

  -- Get user nickname
  SELECT nickname INTO v_nickname FROM profiles WHERE user_id = p_user_id;
  IF v_nickname IS NULL THEN
    RETURN QUERY SELECT false, 'Profile not found'::text;
    RETURN;
  END IF;

  -- Get item info
  SELECT name, type, icon_url INTO v_item_name, v_item_type, v_item_icon
  FROM items WHERE id = p_item_id;
  IF v_item_name IS NULL THEN
    RETURN QUERY SELECT false, 'Item not found'::text;
    RETURN;
  END IF;

  -- Check user has enough of the item
  SELECT quantity INTO v_user_qty
  FROM user_items
  WHERE user_id = p_user_id AND item_id = p_item_id;

  IF v_user_qty IS NULL OR v_user_qty < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient item quantity'::text;
    RETURN;
  END IF;

  -- Deduct items from user
  UPDATE user_items
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE user_id = p_user_id AND item_id = p_item_id;

  -- Create listing
  INSERT INTO marketplace_item_listings (seller_id, seller_nickname, item_id, item_name, item_type, item_icon_url, quantity, price)
  VALUES (p_user_id, v_nickname, p_item_id, v_item_name, v_item_type, v_item_icon, p_quantity, p_price);

  RETURN QUERY SELECT true, 'Item listing created successfully'::text;
END;
$$;

-- RPC: Buy item listing
CREATE OR REPLACE FUNCTION public.buy_item_marketplace_listing(
  p_user_id uuid,
  p_listing_id uuid
)
RETURNS TABLE(success boolean, message text, item_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing marketplace_item_listings%ROWTYPE;
  v_buyer_coins integer;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, ''::text;
    RETURN;
  END IF;

  -- Lock the listing row
  SELECT * INTO v_listing
  FROM marketplace_item_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT false, 'Listing not found'::text, ''::text;
    RETURN;
  END IF;

  IF v_listing.status != 'active' THEN
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

  -- Check buyer has enough coins
  SELECT pokecoins INTO v_buyer_coins FROM profiles WHERE user_id = p_user_id;
  IF v_buyer_coins IS NULL OR v_buyer_coins < v_listing.price THEN
    RETURN QUERY SELECT false, 'Insufficient Pokécoins'::text, ''::text;
    RETURN;
  END IF;

  -- Deduct coins from buyer
  UPDATE profiles SET pokecoins = pokecoins - v_listing.price, updated_at = now()
  WHERE user_id = p_user_id;

  -- Add coins to seller
  UPDATE profiles SET pokecoins = pokecoins + v_listing.price, updated_at = now()
  WHERE user_id = v_listing.seller_id;

  -- Add item to buyer's inventory
  INSERT INTO user_items (user_id, item_id, quantity)
  VALUES (p_user_id, v_listing.item_id, v_listing.quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = user_items.quantity + v_listing.quantity, updated_at = now();

  -- Mark listing as sold
  UPDATE marketplace_item_listings
  SET status = 'sold', buyer_id = p_user_id, sold_at = now(), updated_at = now()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT true, 'Purchase successful!'::text, v_listing.item_name;
END;
$$;

-- RPC: Cancel item listing
CREATE OR REPLACE FUNCTION public.cancel_item_marketplace_listing(
  p_user_id uuid,
  p_listing_id uuid
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing marketplace_item_listings%ROWTYPE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  SELECT * INTO v_listing
  FROM marketplace_item_listings
  WHERE id = p_listing_id AND seller_id = p_user_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT false, 'Listing not found'::text;
    RETURN;
  END IF;

  IF v_listing.status != 'active' THEN
    RETURN QUERY SELECT false, 'Listing is no longer active'::text;
    RETURN;
  END IF;

  -- Return items to seller
  INSERT INTO user_items (user_id, item_id, quantity)
  VALUES (p_user_id, v_listing.item_id, v_listing.quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = user_items.quantity + v_listing.quantity, updated_at = now();

  -- Mark as cancelled
  UPDATE marketplace_item_listings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT true, 'Listing cancelled, items returned'::text;
END;
$$;

-- RPC: Get active item listings with pagination
CREATE OR REPLACE FUNCTION public.get_active_item_marketplace_listings(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12,
  p_item_type text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  seller_id uuid,
  seller_nickname text,
  item_id integer,
  item_name text,
  item_type text,
  item_icon_url text,
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

  -- Count total matching
  SELECT COUNT(*) INTO v_total
  FROM marketplace_item_listings mil
  WHERE mil.status = 'active'
    AND (mil.expires_at IS NULL OR mil.expires_at > now())
    AND (p_item_type IS NULL OR p_item_type = '' OR mil.item_type = p_item_type)
    AND (p_search IS NULL OR p_search = '' OR mil.item_name ILIKE '%' || p_search || '%');

  RETURN QUERY
  SELECT
    mil.id, mil.seller_id, mil.seller_nickname,
    mil.item_id, mil.item_name, mil.item_type, mil.item_icon_url,
    mil.quantity, mil.price, mil.status,
    mil.created_at, mil.expires_at,
    v_total
  FROM marketplace_item_listings mil
  WHERE mil.status = 'active'
    AND (mil.expires_at IS NULL OR mil.expires_at > now())
    AND (p_item_type IS NULL OR p_item_type = '' OR mil.item_type = p_item_type)
    AND (p_search IS NULL OR p_search = '' OR mil.item_name ILIKE '%' || p_search || '%')
  ORDER BY mil.created_at DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;
