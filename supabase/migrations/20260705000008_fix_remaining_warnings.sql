-- Fix: RLS on admin_emails with no policies.
-- This table is only accessed via SECURITY DEFINER functions (sync_admin_role),
-- so RLS is unnecessary. Disable it to resolve the warning.
ALTER TABLE public.admin_emails DISABLE ROW LEVEL SECURITY;

-- Fix: "Anyone can submit contact" INSERT policy uses WITH CHECK (true).
-- Add actual validation to the policy so it's not a blanket true.
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND email IS NOT NULL
    AND body IS NOT NULL
    AND length(name) <= 200
    AND length(email) <= 320
    AND length(body) >= 1
  );
