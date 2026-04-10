-- Create purchase_region function
CREATE OR REPLACE FUNCTION public.purchase_region(
  p_user_id UUID,
  p_region TEXT,
  p_price INTEGER
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_shards INTEGER;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  -- Check if region is already unlocked
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user_id 
    AND p_region = ANY(unlocked_regions)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Região já desbloqueada');
  END IF;
  
  -- Get current shards balance
  SELECT pokeshards INTO v_current_shards 
  FROM profiles WHERE user_id = p_user_id;
  
  -- Check if user has enough shards
  IF v_current_shards < p_price THEN
    RETURN json_build_object('success', false, 'message', 'PokéShards insuficientes');
  END IF;
  
  -- Deduct shards and unlock region
  UPDATE profiles 
  SET 
    pokeshards = pokeshards - p_price,
    unlocked_regions = array_append(unlocked_regions, p_region),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Região desbloqueada com sucesso!',
    'new_shards', v_current_shards - p_price
  );
END;
$$;