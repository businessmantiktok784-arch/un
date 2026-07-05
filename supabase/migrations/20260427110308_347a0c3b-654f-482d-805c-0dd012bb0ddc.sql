
-- Credit balances
CREATE TABLE public.credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits"
  ON public.credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ledger
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

CREATE POLICY "Users view own transactions"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Atomic credit change function (security definer; refuses overdraft)
CREATE OR REPLACE FUNCTION public.change_credits(
  _user_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  INSERT INTO public.credits (user_id, balance)
  VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credits
     SET balance = balance + _amount,
         updated_at = now()
   WHERE user_id = _user_id
   RETURNING balance INTO new_balance;

  IF new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (_user_id, _amount, _reason, _metadata);

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.change_credits(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_credits(UUID, INTEGER, TEXT, JSONB) TO authenticated, service_role;

-- Extend new-user trigger to create credits row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, university, campus, faculty)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'university', ''),
    COALESCE(NEW.raw_user_meta_data->>'campus', ''),
    COALESCE(NEW.raw_user_meta_data->>'faculty', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$$;
