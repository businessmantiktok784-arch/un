
-- Remove default EXECUTE from PUBLIC for all public schema functions.
-- This is the root cause of all 'anon can execute SECURITY DEFINER' warnings:
-- by default PostgreSQL grants EXECUTE to PUBLIC, which includes the anon role.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Re-grant EXECUTE to authenticated for functions that the frontend calls via RPC.
-- These functions already have internal authorization checks where needed.
GRANT EXECUTE ON FUNCTION public.sync_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_document_download(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_credits(UUID, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_payment_settings(payment_provider, BOOLEAN, payment_environment, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment_order(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_order(UUID, payment_provider, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_payment_order(UUID, TEXT, payment_order_status) TO authenticated;

-- All remaining functions (trigger-only helpers) are intentionally NOT re-granted.
-- They are only ever invoked by database triggers, not via /rest/v1/rpc/.
-- bump_request_votes, handle_new_answer, handle_new_user,
-- notify_admins*, notify_university_on_*, notify_uploader_on_comment,
-- reward_referrer_on_first_upload, update_updated_at_column
