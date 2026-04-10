-- Update handle_new_user function to include base_free_spins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nickname', 'Trainer'));
  
  -- Create user_spins entry with base_free_spins
  INSERT INTO public.user_spins (user_id, free_spins, base_free_spins)
  VALUES (new.id, 5, 5);
  
  RETURN new;
END;
$function$