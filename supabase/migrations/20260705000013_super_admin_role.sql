-- Make sync_admin_role assign 'super_admin' instead of 'admin'
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
    VALUES (caller, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Upgrade existing admin users to super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT ur.user_id, 'super_admin'
FROM public.user_roles ur
JOIN public.admin_emails ae ON lower(ae.email) = (SELECT lower(email) FROM auth.users WHERE id = ur.user_id)
WHERE ur.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;
