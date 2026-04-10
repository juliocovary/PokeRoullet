CREATE OR REPLACE FUNCTION public.activate_booster(p_user_id uuid, p_booster_type text)
 RETURNS TABLE(success boolean, message text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item_id INTEGER;
  v_item_count INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate booster type and set item_id
  IF p_booster_type = 'luck' THEN
    v_item_id := 50;
  ELSIF p_booster_type = 'shiny' THEN
    v_item_id := 51;
  ELSE
    RETURN QUERY SELECT FALSE, 'Tipo de booster inválido'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check if user has the item (with row lock)
  SELECT quantity INTO v_item_count
  FROM user_items
  WHERE user_id = p_user_id AND item_id = v_item_id
  FOR UPDATE;
  
  IF v_item_count IS NULL OR v_item_count < 1 THEN
    RETURN QUERY SELECT FALSE, 
      CASE p_booster_type 
        WHEN 'luck' THEN 'Você não possui Poção de Sorte'
        ELSE 'Você não possui Poção de Shiny'
      END::TEXT, 
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Consume item atomically
  UPDATE user_items
  SET quantity = quantity - 1, updated_at = now()
  WHERE user_id = p_user_id AND item_id = v_item_id;
  
  -- Delete if quantity reaches 0
  DELETE FROM user_items
  WHERE user_id = p_user_id AND item_id = v_item_id AND quantity <= 0;
  
  -- Set boost expiration (6 hours from now - nerfed from 12 hours)
  v_expires_at := now() + INTERVAL '6 hours';
  
  -- Activate the boost
  IF p_booster_type = 'luck' THEN
    UPDATE profiles 
    SET luck_boost_expires_at = v_expires_at, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE profiles 
    SET shiny_boost_expires_at = v_expires_at, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT TRUE, 
    CASE p_booster_type 
      WHEN 'luck' THEN 'Poção de Sorte ativada! Sua sorte foi duplicada por 6 horas!'
      ELSE 'Poção de Shiny ativada! Sua chance de shiny foi duplicada por 6 horas!'
    END::TEXT, 
    v_expires_at;
END;
$function$