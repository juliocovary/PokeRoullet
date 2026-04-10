-- Revoke public execute permissions on admin functions
-- These should only be callable by service_role (Edge Functions with admin key)

-- Prevent any authenticated user from calling these admin functions via RPC
REVOKE EXECUTE ON FUNCTION public.reset_all_spins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_all_spins() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_all_spins() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_daily_missions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_daily_missions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_daily_missions() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_weekly_missions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_weekly_missions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_weekly_missions() FROM authenticated;

-- Grant execute only to service_role (used by Edge Functions with SUPABASE_SERVICE_ROLE_KEY)
GRANT EXECUTE ON FUNCTION public.reset_all_spins() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_missions() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_weekly_missions() TO service_role;