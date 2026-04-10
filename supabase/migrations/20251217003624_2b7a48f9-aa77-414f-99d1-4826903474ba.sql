-- Drop the overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Users can view other profiles for search" ON public.profiles;

-- Create a new policy that requires authentication for viewing other profiles
-- This ensures only logged-in users can search/view profiles
CREATE POLICY "Authenticated users can view profiles for search" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);