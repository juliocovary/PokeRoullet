-- Create function to increase base spins for progression
CREATE OR REPLACE FUNCTION public.increase_base_spins(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_spins 
  SET base_free_spins = base_free_spins + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$