CREATE TABLE public.feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('feature_request', 'bug_report')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback_submissions TO authenticated;
GRANT ALL ON public.feedback_submissions TO service_role;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own feedback" ON public.feedback_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users submit own feedback" ON public.feedback_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX feedback_submissions_user_created_idx ON public.feedback_submissions (user_id, created_at DESC);