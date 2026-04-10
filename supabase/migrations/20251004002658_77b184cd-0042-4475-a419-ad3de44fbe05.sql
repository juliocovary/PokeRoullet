-- Create function to unlock region when claiming Pokedex reward
CREATE OR REPLACE FUNCTION public.unlock_region(p_user_id uuid, p_region text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Add region to unlocked_regions array if not already present
  UPDATE public.profiles
  SET unlocked_regions = array_append(unlocked_regions, p_region)
  WHERE user_id = p_user_id
  AND NOT (p_region = ANY(unlocked_regions));
  
  RETURN FOUND;
END;
$$;