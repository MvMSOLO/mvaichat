
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS response_style text NOT NULL DEFAULT 'friendly',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS animation_speed text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS response_length text NOT NULL DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS demo_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{"contacts":false,"sms":true,"call":true,"instagram":true,"telegram":true,"youtube":true,"github":true,"location":false,"camera":false,"microphone":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS persona text NOT NULL DEFAULT 'friend';
