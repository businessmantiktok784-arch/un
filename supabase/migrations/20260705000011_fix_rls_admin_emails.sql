-- Fix RLS for admin_emails: enable RLS and add proper SELECT policy.
-- sync_admin_role() is SECURITY DEFINER so it bypasses RLS.
-- Authenticated users need SELECT to check if their email is in the list.

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin emails"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (true);
