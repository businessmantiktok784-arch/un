
CREATE OR REPLACE FUNCTION public.admin_change_credits(
  _target_user UUID,
  _amount INTEGER,
  _reason TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
  caller UUID := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _target_user IS NULL THEN
    RAISE EXCEPTION 'target_user required';
  END IF;
  IF _amount = 0 THEN
    RAISE EXCEPTION 'amount must not be zero';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'reason required (min 3 chars)';
  END IF;

  INSERT INTO public.credits (user_id, balance)
  VALUES (_target_user, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credits
     SET balance = balance + _amount,
         updated_at = now()
   WHERE user_id = _target_user
   RETURNING balance INTO new_balance;

  IF new_balance < 0 THEN
    RAISE EXCEPTION 'would_go_negative';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (
    _target_user,
    _amount,
    _reason,
    jsonb_build_object('admin_action', true, 'admin_id', caller)
  );

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_credits(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_credits(UUID, INTEGER, TEXT) TO authenticated;

-- Allow admins to read all profiles, credits, transactions for the panel
CREATE POLICY "Admins read all credits"
  ON public.credits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read all transactions"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
