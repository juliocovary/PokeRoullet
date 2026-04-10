
SELECT cron.schedule(
  'rotate-clan-season-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/rotate-clan-season',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
