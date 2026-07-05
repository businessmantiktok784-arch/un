
-- Revoke EXECUTE from anon (unauthenticated) for all public functions
-- These should never be callable without authentication via the REST API
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Revoke EXECUTE from authenticated for trigger-only functions
-- These are only ever invoked by database triggers, never via RPC
DO $$ DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'bump_request_votes',
        'handle_new_answer',
        'handle_new_user',
        'notify_admins_new_contact',
        'notify_admins_new_document',
        'notify_admins_new_opportunity',
        'notify_admins_new_user',
        'notify_university_on_doc_request',
        'notify_university_on_request',
        'notify_uploader_on_comment',
        'reward_referrer_on_first_upload'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', fn.name, fn.args);
  END LOOP;
END $$;
