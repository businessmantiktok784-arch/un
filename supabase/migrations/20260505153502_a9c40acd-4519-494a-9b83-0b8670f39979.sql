
-- DMCA / Takedown system
CREATE TYPE public.takedown_status AS ENUM ('pending','reviewing','accepted','rejected','withdrawn');

CREATE TABLE public.takedown_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  document_url text,
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  reporter_organization text,
  copyright_owner text NOT NULL,
  description text NOT NULL,
  proof_of_ownership text NOT NULL,
  good_faith_statement boolean NOT NULL DEFAULT false,
  accuracy_statement boolean NOT NULL DEFAULT false,
  signature text NOT NULL,
  status public.takedown_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.takedown_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit takedown" ON public.takedown_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (good_faith_statement = true AND accuracy_statement = true);

CREATE POLICY "Admins read takedowns" ON public.takedown_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update takedowns" ON public.takedown_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- GDPR data deletion requests
CREATE TYPE public.gdpr_request_type AS ENUM ('export','delete');
CREATE TYPE public.gdpr_request_status AS ENUM ('pending','processing','completed','rejected');

CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type public.gdpr_request_type NOT NULL,
  status public.gdpr_request_status NOT NULL DEFAULT 'pending',
  reason text,
  admin_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own gdpr request" ON public.gdpr_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own gdpr requests" ON public.gdpr_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update gdpr requests" ON public.gdpr_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Self-service GDPR export RPC: returns all the user's data as JSON
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  result jsonb;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', caller,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = caller),
    'credits', (SELECT to_jsonb(c) FROM public.credits c WHERE c.user_id = caller),
    'credit_transactions', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.credit_transactions t WHERE t.user_id = caller), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(to_jsonb(d)) FROM public.documents d WHERE d.uploader_id = caller), '[]'::jsonb),
    'document_downloads', COALESCE((SELECT jsonb_agg(to_jsonb(dd)) FROM public.document_downloads dd WHERE dd.user_id = caller), '[]'::jsonb),
    'ai_usage', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM public.ai_usage a WHERE a.user_id = caller), '[]'::jsonb),
    'payment_orders', COALESCE((SELECT jsonb_agg(to_jsonb(o)) FROM public.payment_orders o WHERE o.user_id = caller), '[]'::jsonb),
    'gdpr_requests', COALESCE((SELECT jsonb_agg(to_jsonb(g)) FROM public.gdpr_requests g WHERE g.user_id = caller), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- Self-service deletion request: marks pending; actual purge handled by admin/edge fn
CREATE OR REPLACE FUNCTION public.request_account_deletion(_reason text DEFAULT NULL)
RETURNS public.gdpr_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  row public.gdpr_requests;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  INSERT INTO public.gdpr_requests (user_id, request_type, reason)
  VALUES (caller, 'delete', _reason)
  RETURNING * INTO row;

  RETURN row;
END;
$$;
