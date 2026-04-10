-- Drop and recreate the affiliate bonus functions with 4-hour cooldown
DROP FUNCTION IF EXISTS public.claim_affiliate_bonus_spins();
DROP FUNCTION IF EXISTS public.get_affiliate_bonus_status();

CREATE FUNCTION public.claim_affiliate_bonus_spins()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_last_claim timestamptz;
  v_next_claim timestamptz;
  v_hours_remaining numeric;
  v_new_spin_count integer;
  v_cooldown_hours integer := 4;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'User not authenticated'
    );
  END IF;
  
  SELECT last_affiliate_claim_at INTO v_last_claim
  FROM user_spins
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_spins_record',
      'message', 'No spins record found'
    );
  END IF;
  
  IF v_last_claim IS NOT NULL THEN
    v_next_claim := v_last_claim + (v_cooldown_hours || ' hours')::interval;
    
    IF NOW() < v_next_claim THEN
      v_hours_remaining := EXTRACT(EPOCH FROM (v_next_claim - NOW())) / 3600;
      
      RETURN json_build_object(
        'success', false,
        'error', 'cooldown_active',
        'message', 'Bonus ainda em cooldown',
        'next_claim_at', v_next_claim,
        'hours_remaining', ROUND(v_hours_remaining, 2)
      );
    END IF;
  END IF;
  
  UPDATE user_spins
  SET 
    free_spins = free_spins + 5,
    last_affiliate_claim_at = NOW(),
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING free_spins INTO v_new_spin_count;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Bonus de 5 giros concedido!',
    'new_spin_count', v_new_spin_count,
    'next_claim_at', NOW() + (v_cooldown_hours || ' hours')::interval
  );
END;
$$;

CREATE FUNCTION public.get_affiliate_bonus_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_last_claim timestamptz;
  v_next_claim timestamptz;
  v_hours_remaining numeric;
  v_cooldown_hours integer := 4;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'can_claim', false,
      'error', 'unauthorized'
    );
  END IF;
  
  SELECT last_affiliate_claim_at INTO v_last_claim
  FROM user_spins
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'can_claim', false,
      'error', 'no_spins_record'
    );
  END IF;
  
  IF v_last_claim IS NULL THEN
    RETURN json_build_object(
      'can_claim', true,
      'next_claim_at', null
    );
  END IF;
  
  v_next_claim := v_last_claim + (v_cooldown_hours || ' hours')::interval;
  
  IF NOW() >= v_next_claim THEN
    RETURN json_build_object(
      'can_claim', true,
      'next_claim_at', null
    );
  ELSE
    v_hours_remaining := EXTRACT(EPOCH FROM (v_next_claim - NOW())) / 3600;
    
    RETURN json_build_object(
      'can_claim', false,
      'next_claim_at', v_next_claim,
      'hours_remaining', ROUND(v_hours_remaining, 2)
    );
  END IF;
END;
$$;