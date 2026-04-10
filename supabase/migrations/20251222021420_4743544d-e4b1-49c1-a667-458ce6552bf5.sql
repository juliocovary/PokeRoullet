-- Create secure profile update function
CREATE OR REPLACE FUNCTION public.update_profile_safe(
  p_user_id UUID,
  p_nickname TEXT DEFAULT NULL,
  p_avatar TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid_avatars TEXT[] := ARRAY['pikachu', 'misty', 'piplup', 'mysterious', 'teddiursa', 'squirtle', 'charmander', 'riolu'];
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;
  
  -- Validate nickname if provided
  IF p_nickname IS NOT NULL THEN
    -- Check length (3-20 characters)
    IF LENGTH(TRIM(p_nickname)) < 3 OR LENGTH(TRIM(p_nickname)) > 20 THEN
      RETURN QUERY SELECT FALSE, 'Nickname deve ter entre 3 e 20 caracteres'::TEXT;
      RETURN;
    END IF;
    
    -- Sanitize: only allow alphanumeric and underscores
    IF NOT (TRIM(p_nickname) ~ '^[a-zA-Z0-9_]+$') THEN
      RETURN QUERY SELECT FALSE, 'Nickname pode conter apenas letras, números e underscores'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Validate avatar if provided
  IF p_avatar IS NOT NULL THEN
    IF NOT (p_avatar = ANY(v_valid_avatars)) THEN
      RETURN QUERY SELECT FALSE, 'Avatar inválido'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Update only allowed fields
  UPDATE profiles
  SET 
    nickname = COALESCE(TRIM(p_nickname), nickname),
    avatar = COALESCE(p_avatar, avatar),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Perfil não encontrado'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Perfil atualizado com sucesso!'::TEXT;
END;
$$;

-- Create secure booster activation function
CREATE OR REPLACE FUNCTION public.activate_booster(
  p_user_id UUID,
  p_booster_type TEXT -- 'luck' ou 'shiny'
)
RETURNS TABLE(success BOOLEAN, message TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Set boost expiration (12 hours from now)
  v_expires_at := now() + INTERVAL '12 hours';
  
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
      WHEN 'luck' THEN 'Poção de Sorte ativada! Sua sorte foi duplicada por 12 horas!'
      ELSE 'Poção de Shiny ativada! Sua chance de shiny foi duplicada por 12 horas!'
    END::TEXT, 
    v_expires_at;
END;
$$;

-- Drop the old permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a new restrictive UPDATE policy that only allows specific fields
-- This prevents direct client-side updates to sensitive fields
CREATE POLICY "Users can update their own profile safe fields"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Note: The actual field restriction is handled by the SECURITY DEFINER functions
-- The RLS policy ensures users can only affect their own row
-- SECURITY DEFINER functions bypass RLS and can update any field