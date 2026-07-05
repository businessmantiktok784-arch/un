-- Fix has_role so that checking for 'admin' also matches users with 'super_admin'
-- This ensures all existing RLS policies using has_role(auth.uid(), 'admin') work for super_admins too
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
    WHERE user_id = _user_id AND (
      role = _role
      OR
      (_role = 'admin' AND role = 'super_admin')
    )
  );
$$;

-- Update log_admin_action to recognize both admin and super_admin
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

-- Update admin_suspend_user to recognize both admin and super_admin
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
