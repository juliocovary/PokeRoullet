-- Schedule daily missions reset at midnight UTC (00:00)
SELECT cron.schedule(
  'reset-daily-missions',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT
    net.http_post(
        url:='https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/reset-missions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE"}'::jsonb,
        body:='{"type": "daily"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule weekly missions reset every Sunday at midnight UTC (00:00)
SELECT cron.schedule(
  'reset-weekly-missions',
  '0 0 * * 0', -- Every Sunday at midnight
  $$
  SELECT
    net.http_post(
        url:='https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/reset-missions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE"}'::jsonb,
        body:='{"type": "weekly"}'::jsonb
    ) as request_id;
  $$
);