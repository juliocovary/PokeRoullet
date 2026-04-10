-- Optimize trainer run rewards into a single RPC call
-- Reduces egress by consolidating 15+ queries into 1
CREATE OR REPLACE FUNCTION public.apply_trainer_run_rewards(
  p_user_id UUID,
  p_pokemon_updates JSONB,
  p_new_pokegems INTEGER,
  p_highest_stage INTEGER,
  p_enemies_defeated INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_highest INTEGER;
  v_current_defeated INTEGER;
  v_current_battles INTEGER;
  v_pokemon_item JSONB;
  v_pokemon_id TEXT;
  v_experience INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get current progress values
  SELECT 
    highest_stage_cleared,
    total_pokemon_defeated,
    total_battles_won
  INTO v_current_highest, v_current_defeated, v_current_battles
  FROM trainer_progress
  WHERE user_id = p_user_id;

  IF v_current_highest IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trainer progress not found');
  END IF;

  -- Batch update all pokemon XP in single transaction
  FOR v_pokemon_item IN SELECT jsonb_array_elements(p_pokemon_updates)
  LOOP
    v_pokemon_id := v_pokemon_item->>'id';
    v_experience := (v_pokemon_item->>'experience')::INTEGER;
    v_new_level := (v_pokemon_item->>'level')::INTEGER;

    UPDATE trainer_pokemon
    SET 
      experience = v_experience,
      level = v_new_level,
      updated_at = now()
    WHERE id = v_pokemon_id AND user_id = p_user_id;
  END LOOP;

  -- Update profile (pokegems)
  UPDATE profiles
  SET pokegems = p_new_pokegems
  WHERE user_id = p_user_id;

  -- Update progress (highest stage, battles won, enemies defeated)
  UPDATE trainer_progress
  SET 
    highest_stage_cleared = GREATEST(v_current_highest, p_highest_stage),
    total_battles_won = v_current_battles + 1,
    total_pokemon_defeated = v_current_defeated + p_enemies_defeated,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trainer rewards applied successfully',
    'new_pokegems', p_new_pokegems,
    'new_highest_stage', GREATEST(v_current_highest, p_highest_stage),
    'new_enemies_defeated', v_current_defeated + p_enemies_defeated
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
