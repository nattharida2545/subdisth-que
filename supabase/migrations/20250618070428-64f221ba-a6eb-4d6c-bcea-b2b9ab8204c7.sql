
-- Add missing SMS appointment reminder settings
INSERT INTO public.settings (category, key, value) VALUES 
  ('sms', 'appointment_reminders_enabled', 'true'),
  ('sms', 'appointment_reminder_template', '"เตือนความจำ: คุณ {patientName} มีนัดหมาย {purpose} วันที่ {appointmentDate} เวลา {appointmentTime} น. กรุณามาตรงเวลาค่ะ"')
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Enable pg_cron and pg_net extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job for 11:00 AM Bangkok time (04:00 UTC)
SELECT cron.schedule(
  'appointment-reminder-11am',
  '0 4 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://lkclreldnbejfubzhube.supabase.co/functions/v1/appointment-reminder-sms',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY2xyZWxkbmJlamZ1YnpodWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzODg2MjcsImV4cCI6MjA1Nzk2NDYyN30.1Jz-zMLWVTRePFx947cGCVAYNKFswD25FNMTPGyciRE"}'::jsonb,
        body:='{"time": "11:00"}'::jsonb
    ) as request_id;
  $$
);

-- Create cron job for 5:00 PM Bangkok time (10:00 UTC)
SELECT cron.schedule(
  'appointment-reminder-5pm',  
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://lkclreldnbejfubzhube.supabase.co/functions/v1/appointment-reminder-sms',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY2xyZWxkbmJlamZ1YnpodWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzODg2MjcsImV4cCI6MjA1Nzk2NDYyN30.1Jz-zMLWVTRePFx947cGCVAYNKFswD25FNMTPGyciRE"}'::jsonb,
        body:='{"time": "17:00"}'::jsonb
    ) as request_id;
  $$
);
