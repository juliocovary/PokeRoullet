
-- Add is_shiny column to trainer_pokemon
ALTER TABLE public.trainer_pokemon ADD COLUMN IF NOT EXISTS is_shiny boolean NOT NULL DEFAULT false;

-- Create the shiny fusion RPC
CREATE OR REPLACE FUNCTION public.fuse_shiny_pokemon(
  p_user_id uuid,
  p_pokemon_id uuid,
  p_sacrifice_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target RECORD;
  v_sacrifice_count int;
  v_success_chance numeric;
  v_roll numeric;
  v_success boolean;
  v_sacrifice_id uuid;
  v_sac RECORD;
BEGIN
  -- Validate target pokemon exists and belongs to user
  SELECT * INTO v_target FROM trainer_pokemon
  WHERE id = p_pokemon_id AND user_id = p_user_id AND is_shiny = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid target pokemon');
  END IF;

  -- Count sacrifices (min 2, max 5 -- but sacrifice count is array length, target is separate)
  -- Actually: user selects 2-5 TOTAL units (including the one to keep). Sacrifices = total - 1.
  -- Let me re-read: "combinar ate 5 unidades iguais" = combine up to 5 identical units
  -- So sacrifice_ids are the ones to consume, target is kept
  -- Total units used = 1 (target) + array_length(sacrifice_ids)
  -- Min total = 2 (1 target + 1 sacrifice), Max total = 5 (1 target + 4 sacrifices)
  
  v_sacrifice_count := array_length(p_sacrifice_ids, 1);
  
  IF v_sacrifice_count IS NULL OR v_sacrifice_count < 1 OR v_sacrifice_count > 4 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Need 1-4 sacrifices (2-5 total units)');
  END IF;

  -- Validate all sacrifices are same pokemon_id (same species), belong to user, not shiny
  FOR i IN 1..v_sacrifice_count LOOP
    v_sacrifice_id := p_sacrifice_ids[i];
    
    -- Cannot sacrifice the target itself
    IF v_sacrifice_id = p_pokemon_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'Cannot sacrifice target pokemon');
    END IF;
    
    SELECT * INTO v_sac FROM trainer_pokemon
    WHERE id = v_sacrifice_id AND user_id = p_user_id AND is_shiny = false;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Invalid sacrifice pokemon');
    END IF;
    
    IF v_sac.pokemon_id != v_target.pokemon_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'All pokemon must be the same species');
    END IF;
  END LOOP;

  -- Check none of the sacrifices are in a team slot
  IF EXISTS (
    SELECT 1 FROM trainer_teams
    WHERE user_id = p_user_id
    AND (
      slot_1_pokemon_id = ANY(p_sacrifice_ids)
      OR slot_2_pokemon_id = ANY(p_sacrifice_ids)
      OR slot_3_pokemon_id = ANY(p_sacrifice_ids)
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot sacrifice a team member');
  END IF;

  -- Calculate success chance based on total units (target + sacrifices)
  -- 2 units = 25%, 3 = 50%, 4 = 80%, 5 = 100%
  v_success_chance := CASE v_sacrifice_count + 1
    WHEN 2 THEN 0.25
    WHEN 3 THEN 0.50
    WHEN 4 THEN 0.80
    WHEN 5 THEN 1.00
    ELSE 0.0
  END;

  -- Roll for success
  v_roll := random();
  v_success := v_roll < v_success_chance;

  -- Delete all sacrifice pokemon regardless of success
  DELETE FROM trainer_pokemon
  WHERE id = ANY(p_sacrifice_ids) AND user_id = p_user_id;

  -- If success, make target shiny
  IF v_success THEN
    UPDATE trainer_pokemon
    SET is_shiny = true, updated_at = now()
    WHERE id = p_pokemon_id AND user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'fused', v_success,
    'chance', v_success_chance * 100,
    'pokemon_name', v_target.pokemon_name
  );
END;
$$;
