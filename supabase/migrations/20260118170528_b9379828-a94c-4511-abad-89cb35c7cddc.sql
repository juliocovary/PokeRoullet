-- Create a secure RPC to open essence boxes atomically
CREATE OR REPLACE FUNCTION public.open_essence_box(p_user_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_item_id int;
  v_quantity int;
  v_essence_types text[] := ARRAY['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  v_essence_item_ids int[] := ARRAY[102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119];
  v_random_index int;
  v_reward_type text;
  v_reward_item_id int;
  v_reward_amount int;
  v_essence_box_item_id int := 101;
BEGIN
  -- Validate user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;
  
  -- Lock the row and get current state
  SELECT item_id, quantity INTO v_item_id, v_quantity
  FROM user_items
  WHERE id = p_user_item_id
    AND user_id = v_user_id
  FOR UPDATE;
  
  -- Validate the item exists and belongs to user
  IF v_item_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item not found');
  END IF;
  
  -- Validate it's an essence box
  IF v_item_id != v_essence_box_item_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item is not an essence box');
  END IF;
  
  -- Validate quantity
  IF v_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No essence boxes available');
  END IF;
  
  -- Generate random reward (server-side)
  v_random_index := floor(random() * array_length(v_essence_types, 1)) + 1;
  v_reward_type := v_essence_types[v_random_index];
  v_reward_item_id := v_essence_item_ids[v_random_index];
  v_reward_amount := floor(random() * 31) + 40; -- 40 to 70
  
  -- Decrement or delete the essence box
  IF v_quantity > 1 THEN
    UPDATE user_items
    SET quantity = quantity - 1, updated_at = now()
    WHERE id = p_user_item_id;
  ELSE
    DELETE FROM user_items
    WHERE id = p_user_item_id;
  END IF;
  
  -- Add the essence reward
  PERFORM add_user_item(v_user_id, v_reward_item_id, v_reward_amount);
  
  -- Return success with reward info
  RETURN jsonb_build_object(
    'success', true,
    'essence_type', v_reward_type,
    'essence_item_id', v_reward_item_id,
    'amount', v_reward_amount,
    'remaining_quantity', GREATEST(v_quantity - 1, 0)
  );
END;
$$;