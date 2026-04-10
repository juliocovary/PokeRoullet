-- Enable pg_cron extension (required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the spin reset job to run every 2 hours at odd hours (1h, 3h, 5h, etc.)
-- This will call the reset_all_spins function directly from the database
SELECT cron.schedule(
  'reset-spins-every-2-hours',
  '0 1,3,5,7,9,11,13,15,17,19,21,23 * * *',
  $$SELECT public.reset_all_spins()$$
);

-- Add a log entry function to track when resets happen
CREATE OR REPLACE FUNCTION public.log_spin_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE LOG 'Scheduled spin reset executed at %', now();
  PERFORM public.reset_all_spins();
END;
$$;