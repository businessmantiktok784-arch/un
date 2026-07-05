
-- =====================================================================
-- PHASE 1: Admin foundation
-- =====================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.opportunity_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.testimonial_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('new','replied','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- profiles.suspended
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- universities
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  city TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.universities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.universities TO authenticated;
GRANT ALL ON public.universities TO service_role;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read universities" ON public.universities;
CREATE POLICY "Public can read universities" ON public.universities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage universities" ON public.universities;
CREATE POLICY "Admins manage universities" ON public.universities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT,
  category TEXT,
  country TEXT,
  deadline DATE,
  description TEXT,
  link TEXT,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  status public.opportunity_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read approved opportunities" ON public.opportunities;
CREATE POLICY "Public can read approved opportunities" ON public.opportunities
  FOR SELECT USING (status = 'approved' OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users can submit opportunities" ON public.opportunities;
CREATE POLICY "Users can submit opportunities" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
DROP POLICY IF EXISTS "Admins manage opportunities" ON public.opportunities;
CREATE POLICY "Admins manage opportunities" ON public.opportunities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  photo_url TEXT,
  university TEXT,
  quote TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  status public.testimonial_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read approved testimonials" ON public.testimonials;
CREATE POLICY "Public can read approved testimonials" ON public.testimonials
  FOR SELECT USING (status = 'approved' OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users can submit testimonials" ON public.testimonials;
CREATE POLICY "Users can submit testimonials" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- browse_categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.browse_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  parent_id UUID REFERENCES public.browse_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.browse_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.browse_categories TO authenticated;
GRANT ALL ON public.browse_categories TO service_role;
ALTER TABLE public.browse_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read browse_categories" ON public.browse_categories;
CREATE POLICY "Public can read browse_categories" ON public.browse_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage browse_categories" ON public.browse_categories;
CREATE POLICY "Admins manage browse_categories" ON public.browse_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status public.contact_status NOT NULL DEFAULT 'new',
  reply_body TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage contact" ON public.contact_messages;
CREATE POLICY "Admins manage contact" ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- support_content
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.support_content TO authenticated;
GRANT ALL ON public.support_content TO service_role;
ALTER TABLE public.support_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read support_content" ON public.support_content;
CREATE POLICY "Public can read support_content" ON public.support_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage support_content" ON public.support_content;
CREATE POLICY "Admins manage support_content" ON public.support_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit" ON public.admin_audit_log;
CREATE POLICY "Admins read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.admin_suspend_user(_target UUID, _suspend BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_universities_updated ON public.universities;
CREATE TRIGGER trg_universities_updated BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_opportunities_updated ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_testimonials_updated ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_browse_categories_updated ON public.browse_categories;
CREATE TRIGGER trg_browse_categories_updated BEFORE UPDATE ON public.browse_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contact_messages_updated ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_updated BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_support_content_updated ON public.support_content;
CREATE TRIGGER trg_support_content_updated BEFORE UPDATE ON public.support_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
