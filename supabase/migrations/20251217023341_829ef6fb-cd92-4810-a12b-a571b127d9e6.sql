-- Drop the view since it won't work with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

-- Create a SECURITY DEFINER function that safely returns only non-sensitive profile fields
-- This allows friend search without exposing sensitive data
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_term text, exclude_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  nickname text,
  avatar text,
  level integer,
  current_region text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.nickname,
    p.avatar,
    p.level,
    p.current_region
  FROM profiles p
  WHERE 
    p.nickname ILIKE '%' || search_term || '%'
    AND (exclude_user_id IS NULL OR p.user_id != exclude_user_id)
  LIMIT 10;
$$;

-- Create function to get public profiles by IDs for friend lists
CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  nickname text,
  avatar text,
  level integer,
  experience_points integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.nickname,
    p.avatar,
    p.level,
    p.experience_points
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
$$;