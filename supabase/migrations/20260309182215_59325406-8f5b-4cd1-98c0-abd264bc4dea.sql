
CREATE OR REPLACE FUNCTION public.roll_pokemon_stat(
  p_user_id uuid,
  p_pokemon_id uuid,
  p_stat text,
  p_new_grade text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_qty integer;
BEGIN
  IF p_stat NOT IN ('stat_damage', 'stat_speed', 'stat_effect') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid stat');
  END IF;

  SELECT quantity INTO v_item_qty
  FROM user_items
  WHERE user_id = p_user_id AND item_id = 100
  FOR UPDATE;

  IF v_item_qty IS NULL OR v_item_qty < 1 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No Status Upgrade available');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trainer_pokemon WHERE id = p_pokemon_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pokemon not found');
  END IF;

  UPDATE user_items SET quantity = quantity - 1, updated_at = now()
  WHERE user_id = p_user_id AND item_id = 100;

  IF p_stat = 'stat_damage' THEN
    UPDATE trainer_pokemon SET stat_damage = p_new_grade, updated_at = now() WHERE id = p_pokemon_id;
  ELSIF p_stat = 'stat_speed' THEN
    UPDATE trainer_pokemon SET stat_speed = p_new_grade, updated_at = now() WHERE id = p_pokemon_id;
  ELSIF p_stat = 'stat_effect' THEN
    UPDATE trainer_pokemon SET stat_effect = p_new_grade, updated_at = now() WHERE id = p_pokemon_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_grade', p_new_grade);
END;
$$;
