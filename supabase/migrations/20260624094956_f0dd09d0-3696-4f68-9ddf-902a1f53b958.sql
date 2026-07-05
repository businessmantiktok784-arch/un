
-- Notify all admins helper
CREATE OR REPLACE FUNCTION public.notify_admins(_type TEXT, _title TEXT, _body TEXT, _link TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT ur.user_id, _type, _title, _body, _link
    FROM public.user_roles ur
   WHERE ur.role = 'admin';
END $$;

-- New user signup
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('admin.user', 'New user',
    COALESCE(NEW.full_name, NEW.email, 'A new user joined'), '/admin/users');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_admins_new_user ON public.profiles;
CREATE TRIGGER trg_notify_admins_new_user AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_user();

-- New document upload
CREATE OR REPLACE FUNCTION public.notify_admins_new_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('admin.document', 'New document upload',
    NEW.title, '/admin/documents');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_admins_new_document ON public.documents;
CREATE TRIGGER trg_notify_admins_new_document AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_document();

-- New opportunity submission
CREATE OR REPLACE FUNCTION public.notify_admins_new_opportunity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('admin.opportunity', 'New opportunity',
    NEW.title, '/admin/opportunities');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_admins_new_opportunity ON public.opportunities;
CREATE TRIGGER trg_notify_admins_new_opportunity AFTER INSERT ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_opportunity();

-- New contact message
CREATE OR REPLACE FUNCTION public.notify_admins_new_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('admin.contact', 'New contact message',
    COALESCE(NEW.subject, NEW.name), '/admin/contact');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_admins_new_contact ON public.contact_messages;
CREATE TRIGGER trg_notify_admins_new_contact AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_contact();
