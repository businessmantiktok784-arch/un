-- AI usage log
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 1,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  was_free BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_created ON public.ai_usage(user_id, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI usage"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Rate-limit + credit consumption RPC
-- Limits: 20 requests/hour/user. First 5/day are free; after that charges 1 credit.
-- Admins bypass all limits and charges.
CREATE OR REPLACE FUNCTION public.consume_ai_credit(_mode TEXT, _ip TEXT DEFAULT NULL)
RETURNS TABLE(allowed BOOLEAN, was_free BOOLEAN, credits_spent INTEGER, new_balance INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  hourly_count INTEGER;
  daily_free_used INTEGER;
  free_limit CONSTANT INTEGER := 5;
  hourly_limit CONSTANT INTEGER := 20;
  cost CONSTANT INTEGER := 1;
  bal INTEGER;
  is_admin BOOLEAN;
BEGIN
  IF caller IS NULL THEN
    RETURN QUERY SELECT false, false, 0, 0, 'not_authenticated'::TEXT;
    RETURN;
  END IF;

  is_admin := public.has_role(caller, 'admin');

  IF is_admin THEN
    INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
    VALUES (caller, _mode, 0, true, _ip);
    RETURN QUERY SELECT true, true, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0), 'admin_bypass'::TEXT;
    RETURN;
  END IF;

  SELECT count(*) INTO hourly_count
    FROM public.ai_usage
   WHERE user_id = caller
     AND created_at > now() - interval '1 hour';

  IF hourly_count >= hourly_limit THEN
    RETURN QUERY SELECT false, false, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0), 'rate_limited'::TEXT;
    RETURN;
  END IF;

  SELECT count(*) INTO daily_free_used
    FROM public.ai_usage
   WHERE user_id = caller
     AND was_free = true
     AND created_at > now() - interval '24 hours';

  IF daily_free_used < free_limit THEN
    INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
    VALUES (caller, _mode, 0, true, _ip);
    RETURN QUERY SELECT true, true, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0), 'free_quota'::TEXT;
    RETURN;
  END IF;

  -- Charge 1 credit
  BEGIN
    bal := public.change_credits(caller, -cost, 'ai_assistant', jsonb_build_object('mode', _mode));
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, false, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0), 'insufficient_credits'::TEXT;
    RETURN;
  END;

  INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
  VALUES (caller, _mode, cost, false, _ip);

  RETURN QUERY SELECT true, false, cost, bal, 'charged'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_credit(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(TEXT, TEXT) TO authenticated;