
REVOKE EXECUTE ON FUNCTION public.admin_upsert_payment_settings(public.payment_provider, boolean, public.payment_environment, text, text, text, text, text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_payment_order(uuid, public.payment_provider, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.complete_payment_order(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fail_payment_order(uuid, text, public.payment_order_status) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_upsert_payment_settings(public.payment_provider, boolean, public.payment_environment, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_order(uuid, public.payment_provider, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment_order(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fail_payment_order(uuid, text, public.payment_order_status) TO authenticated, service_role;
