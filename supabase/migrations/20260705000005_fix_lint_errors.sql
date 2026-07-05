
-- Fix ambiguous column references in request_document_download
CREATE OR REPLACE FUNCTION public.request_document_download(_document_id UUID)
RETURNS TABLE (storage_path TEXT, credits_spent INTEGER, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  doc RECORD;
  already_paid BOOLEAN;
  cost INTEGER := 1;
  bal INTEGER;
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

  IF doc.uploader_id = caller OR public.has_role(caller, 'admin') THEN
    RETURN QUERY SELECT doc.path, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0);
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.document_downloads
     WHERE user_id = caller AND document_id = _document_id
  ) INTO already_paid;

  IF already_paid THEN
    RETURN QUERY SELECT doc.path, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0);
    RETURN;
  END IF;

  bal := public.change_credits(caller, -cost, 'document_download', jsonb_build_object('document_id', _document_id));

  INSERT INTO public.document_downloads (user_id, document_id, credits_spent)
  VALUES (caller, _document_id, cost);

  UPDATE public.documents
     SET downloads_count = downloads_count + 1
   WHERE id = _document_id;

  RETURN QUERY SELECT doc.path, cost, bal;
END;
$$;

REVOKE ALL ON FUNCTION public.request_document_download(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_document_download(UUID) TO authenticated;

-- Fix ambiguous column references in consume_ai_credit
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
     AND ai_usage.was_free = true
     AND created_at > now() - interval '24 hours';

  IF daily_free_used < free_limit THEN
    INSERT INTO public.ai_usage(user_id, mode, credits_spent, was_free, ip_address)
    VALUES (caller, _mode, 0, true, _ip);
    RETURN QUERY SELECT true, true, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0), 'free_quota'::TEXT;
    RETURN;
  END IF;

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

-- Add unique constraint on user_roles for sync_admin_role ON CONFLICT
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
