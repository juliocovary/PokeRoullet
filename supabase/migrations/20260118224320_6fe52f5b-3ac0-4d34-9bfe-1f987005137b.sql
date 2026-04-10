
-- Enable required extensions for CRON jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the update-trainer-rankings function to run every hour at minute 0
SELECT cron.schedule(
  'update-trainer-rankings-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/update-trainer-rankings',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE'
        ),
        body:='{}'::jsonb
    ) as request_id;
  $$
);
