-- Fix check_and_reset_free_spins to use base_free_spins instead of hardcoded 5
CREATE OR REPLACE FUNCTION public.check_and_reset_free_spins(p_user_id uuid)
 RETURNS TABLE(free_spins integer, last_spin_reset timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset spins if user has 0 spins and 2 hours have passed since last reset
  UPDATE public.user_spins 
  SET 
    free_spins = base_free_spins,
    last_spin_reset = now()
  WHERE 
    user_id = p_user_id 
    AND user_spins.free_spins = 0 
    AND (now() - user_spins.last_spin_reset) >= interval '2 hours';
  
  -- Return updated user data
  RETURN QUERY
  SELECT us.free_spins, us.last_spin_reset
  FROM public.user_spins us
  WHERE us.user_id = p_user_id;
END;
$function$;