-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule global spin reset every 2 hours (00:00, 02:00, 04:00, etc.)
SELECT cron.schedule(
  'global-spin-reset', 
  '0 */2 * * *',  -- Every 2 hours at minute 0
  $$
  SELECT net.http_post(
    url := 'https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/reset-spins',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE"}'::jsonb,
    body := '{"source": "cron_job"}'::jsonb
  ) as request_id;
  $$
);