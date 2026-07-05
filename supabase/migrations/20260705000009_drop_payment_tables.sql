-- ============================================================
-- Drop all payment / credit tables, types, and functions.
-- Convert remaining SECURITY DEFINER functions to SECURITY
-- INVOKER with the necessary RLS policies.
-- ============================================================

-- ################################################################
-- PART 1 – Rewrite functions that currently depend on credits
-- ################################################################

-- 1a. request_document_download – no longer charges credits.
--     Return type simplified to just storage_path.
DROP FUNCTION IF EXISTS public.request_document_download(UUID);
CREATE OR REPLACE FUNCTION public.request_document_download(_document_id UUID)
RETURNS TABLE (storage_path TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  doc RECORD;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, uploader_id, status, documents.storage_path AS path
    INTO doc
    FROM public.documents
   WHERE id = _document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'document_not_found';
  END IF;

  IF doc.status <> 'approved' AND doc.uploader_id <> caller AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'document_not_available';
  END IF;

  INSERT INTO public.document_downloads (user_id, document_id, credits_spent)
  VALUES (caller, _document_id, 0);

  UPDATE public.documents
     SET downloads_count = downloads_count + 1
   WHERE id = _document_id;

  RETURN QUERY SELECT doc.path;
END;
$$;


-- 1b. consume_ai_credit – no longer charges credits.
--     Return type simplified to just (allowed, reason).
--     Rate-limiting is kept; admins bypass limits.
DROP FUNCTION IF EXISTS public.consume_ai_credit(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.consume_ai_credit(_mode TEXT, _ip TEXT DEFAULT NULL)
RETURNS TABLE(allowed BOOLEAN, reason TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  hourly_count INTEGER;
  daily_count INTEGER;
  hourly_limit CONSTANT INTEGER := 20;
  daily_limit CONSTANT INTEGER := 50;
  is_admin BOOLEAN;
BEGIN
  IF caller IS NULL THEN
    RETURN QUERY SELECT false, 'not_authenticated'::TEXT;
    RETURN;
  END IF;

  is_admin := public.has_role(caller, 'admin');

  IF is_admin THEN
    INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
    VALUES (caller, _mode, 0, true, _ip);
    RETURN QUERY SELECT true, 'ok'::TEXT;
    RETURN;
  END IF;

  SELECT count(*) INTO hourly_count
    FROM public.ai_usage
   WHERE user_id = caller
     AND created_at > now() - interval '1 hour';

  IF hourly_count >= hourly_limit THEN
    RETURN QUERY SELECT false, 'rate_limited'::TEXT;
    RETURN;
  END IF;

  SELECT count(*) INTO daily_count
    FROM public.ai_usage
   WHERE user_id = caller
     AND created_at > now() - interval '24 hours';

  IF daily_count >= daily_limit THEN
    RETURN QUERY SELECT false, 'daily_limit_reached'::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
  VALUES (caller, _mode, 0, true, _ip);

  RETURN QUERY SELECT true, 'ok'::TEXT;
END;
$$;


-- 1c. export_my_data – remove credits, credit_transactions, payment_orders.
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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
    'documents', COALESCE((SELECT jsonb_agg(to_jsonb(d)) FROM public.documents d WHERE d.uploader_id = caller), '[]'::jsonb),
    'document_downloads', COALESCE((SELECT jsonb_agg(to_jsonb(dd)) FROM public.document_downloads dd WHERE dd.user_id = caller), '[]'::jsonb),
    'ai_usage', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM public.ai_usage a WHERE a.user_id = caller), '[]'::jsonb),
    'gdpr_requests', COALESCE((SELECT jsonb_agg(to_jsonb(g)) FROM public.gdpr_requests g WHERE g.user_id = caller), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;


-- ################################################################
-- PART 2 – Drop payment-specific functions
-- ################################################################

DROP FUNCTION IF EXISTS public.complete_payment_order(UUID, TEXT);
DROP FUNCTION IF EXISTS public.fail_payment_order(UUID, TEXT, public.payment_order_status);
DROP FUNCTION IF EXISTS public.create_payment_order(UUID, public.payment_provider, TEXT);
DROP FUNCTION IF EXISTS public.admin_upsert_payment_settings(public.payment_provider, BOOLEAN, public.payment_environment, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_change_credits(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.change_credits(UUID, INTEGER, TEXT, JSONB);


-- ################################################################
-- PART 3 – Drop payment tables
-- ################################################################

DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP TABLE IF EXISTS public.credit_packs CASCADE;
DROP TABLE IF EXISTS public.payment_settings CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.credits CASCADE;

-- Delete any remaining orphaned FK references
-- (run ANALYZE so the query planner catches up)
ANALYZE;


-- ################################################################
-- PART 4 – Drop payment types (no longer referenced)
-- ################################################################

DROP TYPE IF EXISTS public.payment_order_status;
DROP TYPE IF EXISTS public.payment_environment;
DROP TYPE IF EXISTS public.payment_provider;


-- ################################################################
-- PART 5 – Convert remaining SECURITY DEFINER functions to
--          SECURITY INVOKER
-- ################################################################

-- 5a. has_role – already used as SECURITY INVOKER by other functions
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


-- 5b. sync_admin_role
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  caller_email TEXT;
  is_admin BOOLEAN := false;
BEGIN
  IF caller IS NULL THEN RETURN false; END IF;
  SELECT email INTO caller_email FROM auth.users WHERE id = caller;
  IF caller_email IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(caller_email))
    INTO is_admin;

  IF is_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (caller, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;


-- 5c. log_admin_action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  new_id UUID;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.has_role(caller,'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (caller, _action, _entity_type, _entity_id, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;


-- 5d. admin_suspend_user
CREATE OR REPLACE FUNCTION public.admin_suspend_user(_target UUID, _suspend BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE caller UUID := auth.uid();
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.has_role(caller,'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.profiles SET suspended = _suspend, updated_at = now() WHERE id = _target;
  PERFORM public.log_admin_action(
    CASE WHEN _suspend THEN 'user.suspend' ELSE 'user.reactivate' END,
    'user', _target::text, '{}'::jsonb
  );
  RETURN _suspend;
END $$;


-- 5e. find_duplicate_documents
CREATE OR REPLACE FUNCTION public.find_duplicate_documents()
RETURNS TABLE(file_hash text, doc_count bigint, document_ids uuid[], titles text[])
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT d.file_hash,
         count(*)::bigint AS doc_count,
         array_agg(d.id ORDER BY d.created_at) AS document_ids,
         array_agg(d.title ORDER BY d.created_at) AS titles
    FROM public.documents d
   WHERE d.file_hash IS NOT NULL
   GROUP BY d.file_hash
   HAVING count(*) > 1;
$$;


-- 5f. request_account_deletion
CREATE OR REPLACE FUNCTION public.request_account_deletion(_reason text DEFAULT NULL)
RETURNS public.gdpr_requests
LANGUAGE plpgsql
SECURITY INVOKER
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


-- ################################################################
-- PART 6 – Add RLS policies needed for SECURITY INVOKER functions
-- ################################################################

-- 6a. user_roles: allow INSERT (used by sync_admin_role)
CREATE POLICY "Users insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6b. admin_audit_log: allow INSERT (used by log_admin_action)
CREATE POLICY "Admins insert audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 6c. profiles: allow admins to UPDATE any profile (used by admin_suspend_user)
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6d. document_downloads: allow INSERT (used by request_document_download)
CREATE POLICY "Users insert own downloads"
  ON public.document_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6e. ai_usage: allow INSERT (used by consume_ai_credit)
CREATE POLICY "Users insert own AI usage"
  ON public.ai_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ################################################################
-- PART 7 – Grant EXECUTE to authenticated for all remaining RPCs
-- ################################################################

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_document_download(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(TEXT) TO authenticated;
