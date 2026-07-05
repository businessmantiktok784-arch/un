
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('mtn_momo', 'airtel_money', 'stripe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_environment AS ENUM ('sandbox', 'live');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_order_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ payment_settings ============
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment public.payment_environment NOT NULL DEFAULT 'sandbox',
  -- generic credential fields; not all providers use all of them
  api_key TEXT,             -- MTN: Primary subscription key / Stripe: secret key
  api_secret TEXT,          -- MTN: API key (uuid) / Airtel: client secret / Stripe: (unused)
  api_user TEXT,            -- MTN: API user uuid / Airtel: client id
  webhook_secret TEXT,      -- Stripe webhook signing secret / others: callback hash
  callback_url TEXT,        -- optional override of where the provider should POST results
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read payment settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- writes go through admin RPC only; no INSERT/UPDATE/DELETE policies for clients

CREATE TRIGGER trg_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ credit_packs ============
CREATE TABLE IF NOT EXISTS public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_rwf INTEGER NOT NULL CHECK (price_rwf >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated views active packs"
  ON public.credit_packs FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage packs"
  ON public.credit_packs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_credit_packs_updated_at
  BEFORE UPDATE ON public.credit_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ payment_orders ============
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL REFERENCES public.credit_packs(id),
  provider public.payment_provider NOT NULL,
  amount_rwf INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  status public.payment_order_status NOT NULL DEFAULT 'pending',
  phone_number TEXT,
  provider_reference TEXT,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders"
  ON public.payment_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RPCs ============

-- Admin saves provider credentials
CREATE OR REPLACE FUNCTION public.admin_upsert_payment_settings(
  _provider public.payment_provider,
  _enabled BOOLEAN,
  _environment public.payment_environment,
  _api_key TEXT,
  _api_secret TEXT,
  _api_user TEXT,
  _webhook_secret TEXT,
  _callback_url TEXT,
  _extra JSONB DEFAULT '{}'::jsonb
) RETURNS public.payment_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  row public.payment_settings;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.has_role(caller, 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;

  INSERT INTO public.payment_settings (
    provider, enabled, environment, api_key, api_secret, api_user,
    webhook_secret, callback_url, extra, updated_by
  )
  VALUES (
    _provider, _enabled, _environment, _api_key, _api_secret, _api_user,
    _webhook_secret, _callback_url, COALESCE(_extra, '{}'::jsonb), caller
  )
  ON CONFLICT (provider) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    environment = EXCLUDED.environment,
    api_key = EXCLUDED.api_key,
    api_secret = EXCLUDED.api_secret,
    api_user = EXCLUDED.api_user,
    webhook_secret = EXCLUDED.webhook_secret,
    callback_url = EXCLUDED.callback_url,
    extra = EXCLUDED.extra,
    updated_by = caller,
    updated_at = now()
  RETURNING * INTO row;

  RETURN row;
END;
$$;

-- User starts a purchase
CREATE OR REPLACE FUNCTION public.create_payment_order(
  _pack_id UUID,
  _provider public.payment_provider,
  _phone TEXT DEFAULT NULL
) RETURNS public.payment_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  pack RECORD;
  prov RECORD;
  row public.payment_orders;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO pack FROM public.credit_packs WHERE id = _pack_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pack_not_found_or_inactive'; END IF;

  SELECT * INTO prov FROM public.payment_settings WHERE provider = _provider;
  IF NOT FOUND OR NOT prov.enabled THEN
    RAISE EXCEPTION 'provider_not_available';
  END IF;

  INSERT INTO public.payment_orders (
    user_id, pack_id, provider, amount_rwf, credits, phone_number, status
  ) VALUES (
    caller, pack.id, _provider, pack.price_rwf, pack.credits, _phone, 'pending'
  )
  RETURNING * INTO row;

  RETURN row;
END;
$$;

-- Mark an order succeeded and credit the user atomically (admin or service-role)
CREATE OR REPLACE FUNCTION public.complete_payment_order(
  _order_id UUID,
  _provider_reference TEXT DEFAULT NULL
) RETURNS public.payment_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  ord public.payment_orders;
BEGIN
  -- caller may be NULL when invoked from a service-role edge function
  IF caller IS NOT NULL AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO ord FROM public.payment_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  IF ord.status = 'succeeded' THEN
    RETURN ord; -- idempotent
  END IF;

  IF ord.status NOT IN ('pending','processing') THEN
    RAISE EXCEPTION 'order_not_completable: %', ord.status;
  END IF;

  PERFORM public.change_credits(
    ord.user_id,
    ord.credits,
    'credit_pack_purchase',
    jsonb_build_object('order_id', ord.id, 'provider', ord.provider, 'amount_rwf', ord.amount_rwf)
  );

  UPDATE public.payment_orders
     SET status = 'succeeded',
         provider_reference = COALESCE(_provider_reference, provider_reference),
         completed_at = now(),
         updated_at = now()
   WHERE id = _order_id
   RETURNING * INTO ord;

  RETURN ord;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_payment_order(
  _order_id UUID,
  _reason TEXT,
  _final_status public.payment_order_status DEFAULT 'failed'
) RETURNS public.payment_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  ord public.payment_orders;
BEGIN
  IF caller IS NOT NULL AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _final_status NOT IN ('failed','cancelled') THEN
    RAISE EXCEPTION 'invalid_final_status';
  END IF;

  UPDATE public.payment_orders
     SET status = _final_status,
         failure_reason = _reason,
         updated_at = now()
   WHERE id = _order_id
   RETURNING * INTO ord;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  RETURN ord;
END;
$$;

-- ============ Seed credit packs ============
INSERT INTO public.credit_packs (slug, name, description, credits, price_rwf, sort_order, is_popular)
VALUES
  ('starter',  'Starter',       '5 download credits',  5,   500, 1, false),
  ('student',  'Student Pack',  '15 download credits', 15, 1200, 2, true),
  ('premium',  'Premium',       '50 download credits', 50, 3500, 3, false)
ON CONFLICT (slug) DO NOTHING;

-- ============ Seed disabled provider rows ============
INSERT INTO public.payment_settings (provider, enabled, environment)
VALUES
  ('mtn_momo',     false, 'sandbox'),
  ('airtel_money', false, 'sandbox'),
  ('stripe',       false, 'sandbox')
ON CONFLICT (provider) DO NOTHING;
