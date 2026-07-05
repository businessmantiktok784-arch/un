-- Remove all AI-related tables, functions, and policies

-- 1. Drop RLS policy on ai_usage
DROP POLICY IF EXISTS "Users insert own AI usage" ON public.ai_usage;

-- 2. Drop the consume_ai_credit function
DROP FUNCTION IF EXISTS public.consume_ai_credit(TEXT, TEXT);

-- 3. Drop the ai_usage table
DROP TABLE IF EXISTS public.ai_usage CASCADE;

-- 4. Recreate export_my_data without ai_usage reference
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
    'gdpr_requests', COALESCE((SELECT jsonb_agg(to_jsonb(g)) FROM public.gdpr_requests g WHERE g.user_id = caller), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;


