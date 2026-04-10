-- Create a secure view for friend search that only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  nickname,
  avatar,
  level,
  current_region
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view profiles for search" ON public.profiles;

-- The existing "Users can view their own profile" policy (auth.uid() = user_id) 
-- will handle full access to own profile data