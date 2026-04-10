-- Fix spin reset when last_spin_reset is NULL
CREATE OR REPLACE FUNCTION public.check_and_reset_free_spins(p_user_id uuid)
 RETURNS TABLE(free_spins integer, last_spin_reset timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_hour INTEGER;
  v_last_odd_hour INTEGER;
  v_last_odd_hour_timestamp TIMESTAMPTZ;
BEGIN
  -- Calculate current hour
  v_current_hour := EXTRACT(HOUR FROM now());

  -- Calculate the most recent odd hour (1, 3, 5, ... , 23)
  IF v_current_hour % 2 = 0 THEN
    v_last_odd_hour := v_current_hour - 1;
  ELSE
    v_last_odd_hour := v_current_hour;
  END IF;

  -- Handle edge case: if we're at hour 0, last odd hour was 23 yesterday
  IF v_last_odd_hour < 0 THEN
    v_last_odd_hour := 23;
    v_last_odd_hour_timestamp := DATE_TRUNC('day', now()) - INTERVAL '1 day' + (v_last_odd_hour || ' hours')::INTERVAL;
  ELSE
    v_last_odd_hour_timestamp := DATE_TRUNC('day', now()) + (v_last_odd_hour || ' hours')::INTERVAL;
  END IF;

  -- Reset spins if:
  -- 1. User has 0 spins
  -- 2. Last reset was before the most recent odd hour (or NULL)
  UPDATE public.user_spins us
  SET 
    free_spins = us.base_free_spins,
    last_spin_reset = now(),
    updated_at = now()
  WHERE 
    us.user_id = p_user_id 
    AND us.free_spins = 0 
    AND COALESCE(us.last_spin_reset, 'epoch'::timestamptz) < v_last_odd_hour_timestamp;

  -- Return updated user data
  RETURN QUERY
  SELECT us.free_spins, us.last_spin_reset
  FROM public.user_spins us
  WHERE us.user_id = p_user_id;
END;
$function$;