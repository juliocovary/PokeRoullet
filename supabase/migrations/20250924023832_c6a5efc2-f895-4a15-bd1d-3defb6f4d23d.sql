-- Create function for global spin reset
CREATE OR REPLACE FUNCTION public.reset_all_spins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset all users' free_spins to their base_free_spins amount
  UPDATE public.user_spins 
  SET 
    free_spins = base_free_spins,
    last_spin_reset = now(),
    updated_at = now();
    
  RAISE LOG 'Global spin reset completed at %. Updated % users.', now(), (SELECT COUNT(*) FROM public.user_spins);
END;
$function$