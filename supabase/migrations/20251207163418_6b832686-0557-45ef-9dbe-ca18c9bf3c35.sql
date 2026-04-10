
-- Habilitar extensões necessárias se não existirem
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job antigo se existir
SELECT cron.unschedule('update-rankings-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-rankings-daily');

-- Criar cron job para atualizar rankings diariamente às 00:30 UTC
SELECT cron.schedule(
  'update-rankings-daily',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://npwpcxzxkvbcvlycqnih.supabase.co/functions/v1/update-rankings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3BjeHp4a3ZiY3ZseWNxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDEzMDksImV4cCI6MjA3Mzc3NzMwOX0.EaH_YaTdHpyxUhZQlZFCc1CjgghPSFuBzTkCzL_CtaE"}'::jsonb,
    body := '{"source": "daily_cron"}'::jsonb
  ) as request_id;
  $$
);
