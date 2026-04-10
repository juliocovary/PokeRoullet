-- Create function to buy upgrades with server-side validation
CREATE OR REPLACE FUNCTION public.buy_upgrade(
  p_user_id UUID,
  p_upgrade_type TEXT -- 'spin', 'luck', 'xp'
)
RETURNS TABLE(success BOOLEAN, message TEXT, new_pokeshards INTEGER, new_purchase_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_pokeshards INTEGER;
  v_current_purchases INTEGER;
  v_price INTEGER;
  v_item_id INTEGER;
  v_base_price INTEGER;
  v_increment INTEGER;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Validate upgrade type and set item_id, base price, and increment
  CASE p_upgrade_type
    WHEN 'spin' THEN
      v_item_id := 999;
      v_base_price := 25;
      v_increment := 10;
    WHEN 'luck' THEN
      v_item_id := 1000;
      v_base_price := 10;
      v_increment := 10;
    WHEN 'xp' THEN
      v_item_id := 1001;
      v_base_price := 15;
      v_increment := 15;
    ELSE
      RETURN QUERY SELECT FALSE, 'Invalid upgrade type'::TEXT, 0, 0;
      RETURN;
  END CASE;

  -- Get current pokeshards (lock row for update)
  SELECT pokeshards INTO v_current_pokeshards
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_pokeshards IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Get current purchase count
  SELECT COALESCE(quantity, 0) INTO v_current_purchases
  FROM user_items
  WHERE user_id = p_user_id AND item_id = v_item_id;

  IF v_current_purchases IS NULL THEN
    v_current_purchases := 0;
  END IF;

  -- Calculate actual price based on purchase count
  v_price := v_base_price + (v_current_purchases * v_increment);

  -- Check if user has enough pokeshards
  IF v_current_pokeshards < v_price THEN
    RETURN QUERY SELECT FALSE, 'Pokeshards insuficientes'::TEXT, v_current_pokeshards, v_current_purchases;
    RETURN;
  END IF;

  -- Deduct pokeshards
  UPDATE profiles
  SET pokeshards = pokeshards - v_price, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Update purchase count
  INSERT INTO user_items (user_id, item_id, quantity)
  VALUES (p_user_id, v_item_id, 1)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = user_items.quantity + 1, updated_at = NOW();

  -- Apply the upgrade effect
  CASE p_upgrade_type
    WHEN 'spin' THEN
      -- Increase base spins by 1
      UPDATE user_spins
      SET base_free_spins = base_free_spins + 1,
          free_spins = free_spins + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    WHEN 'luck' THEN
      -- Increase luck multiplier by 0.10
      UPDATE profiles
      SET luck_multiplier = COALESCE(luck_multiplier, 1.0) + 0.10,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    WHEN 'xp' THEN
      -- Increase XP multiplier by 5%
      UPDATE profiles
      SET xp_multiplier = COALESCE(xp_multiplier, 1.0) * 1.05,
          updated_at = NOW()
      WHERE user_id = p_user_id;
  END CASE;

  -- Get updated values
  SELECT pokeshards INTO v_current_pokeshards
  FROM profiles
  WHERE user_id = p_user_id;

  SELECT quantity INTO v_current_purchases
  FROM user_items
  WHERE user_id = p_user_id AND item_id = v_item_id;

  RETURN QUERY SELECT TRUE, 'Upgrade comprado com sucesso!'::TEXT, v_current_pokeshards, v_current_purchases;
END;
$$;