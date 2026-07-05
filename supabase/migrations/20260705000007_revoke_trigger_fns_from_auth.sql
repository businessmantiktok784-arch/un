
-- Revoke authenticated EXECUTE for trigger-only functions that don't need it
REVOKE EXECUTE ON FUNCTION public.notify_admins(TEXT, TEXT, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
