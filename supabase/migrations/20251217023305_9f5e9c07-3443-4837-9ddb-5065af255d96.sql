-- Drop the existing view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view with SECURITY INVOKER so it uses the querying user's permissions
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  nickname,
  avatar,
  level,
  current_region
FROM public.profiles;