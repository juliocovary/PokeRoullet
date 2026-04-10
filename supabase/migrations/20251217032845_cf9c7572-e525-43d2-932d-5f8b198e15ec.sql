-- Restrict aggregate functions to service_role only
-- These are used by update-rankings Edge Function and should not be callable by regular users

-- Revoke from public and authenticated users
REVOKE EXECUTE ON FUNCTION public.get_pokedex_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pokedex_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pokedex_counts() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_shiny_pokedex_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_shiny_pokedex_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_shiny_pokedex_counts() FROM authenticated;

-- Grant only to service_role (used by Edge Functions with SUPABASE_SERVICE_ROLE_KEY)
GRANT EXECUTE ON FUNCTION public.get_pokedex_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_shiny_pokedex_counts() TO service_role;