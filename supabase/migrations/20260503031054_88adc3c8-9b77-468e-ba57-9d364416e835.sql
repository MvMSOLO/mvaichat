
-- user_memories
CREATE TABLE IF NOT EXISTS public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  weight real NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories select" ON public.user_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own memories insert" ON public.user_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own memories update" ON public.user_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own memories delete" ON public.user_memories FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER touch_user_memories BEFORE UPDATE ON public.user_memories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- code_runs
CREATE TABLE IF NOT EXISTS public.code_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text,
  ok boolean NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.code_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own code_runs select" ON public.code_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own code_runs insert" ON public.code_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- error_logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  fn text NOT NULL,
  payload jsonb,
  error text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read error_logs" ON public.error_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "anyone insert error_logs" ON public.error_logs FOR INSERT WITH CHECK (true);

-- user_secrets (encrypted-at-rest is provided by Supabase; access is locked to owner)
CREATE TABLE IF NOT EXISTS public.user_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  token text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own secrets select" ON public.user_secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own secrets insert" ON public.user_secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own secrets update" ON public.user_secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own secrets delete" ON public.user_secrets FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER touch_user_secrets BEFORE UPDATE ON public.user_secrets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- conversations: mode + branching
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS branched_from uuid;
