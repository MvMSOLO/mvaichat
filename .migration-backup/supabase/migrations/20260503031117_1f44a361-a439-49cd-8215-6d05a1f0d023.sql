
DROP POLICY IF EXISTS "anyone insert error_logs" ON public.error_logs;
CREATE POLICY "auth insert error_logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
