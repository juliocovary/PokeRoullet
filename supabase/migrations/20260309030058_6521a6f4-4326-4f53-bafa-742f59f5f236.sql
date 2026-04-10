
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
  IF p_user_id != auth.uid() THEN
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
  FROM marketplace_item_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_count >= 3 THEN
    RETURN QUERY SELECT false, 'Maximum 3 active item listings allowed'::text;
    RETURN;
  END IF;

  SELECT nickname INTO v_nickname FROM profiles WHERE user_id = p_user_id;
  IF v_nickname IS NULL THEN
    RETURN QUERY SELECT false, 'Profile not found'::text;
    RETURN;
  END IF;

  SELECT name, type, icon_url INTO v_item_name, v_item_type, v_item_icon
  FROM items WHERE id = p_item_id;
  IF v_item_name IS NULL THEN
    RETURN QUERY SELECT false, 'Item not found'::text;
    RETURN;
  END IF;

  -- Block permanent upgrades from being sold
  IF v_item_type = 'upgrade' THEN
    RETURN QUERY SELECT false, 'Permanent upgrades cannot be sold'::text;
    RETURN;
  END IF;

  SELECT quantity INTO v_user_qty
  FROM user_items
  WHERE user_id = p_user_id AND item_id = p_item_id;

  IF v_user_qty IS NULL OR v_user_qty < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient item quantity'::text;
    RETURN;
  END IF;

  UPDATE user_items
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE user_id = p_user_id AND item_id = p_item_id;

  INSERT INTO marketplace_item_listings (seller_id, seller_nickname, item_id, item_name, item_type, item_icon_url, quantity, price)
  VALUES (p_user_id, v_nickname, p_item_id, v_item_name, v_item_type, v_item_icon, p_quantity, p_price);

  RETURN QUERY SELECT true, 'Item listing created successfully'::text;
END;
$$;
