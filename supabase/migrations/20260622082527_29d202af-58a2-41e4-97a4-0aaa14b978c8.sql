-- 1. profiles: add year_of_study
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_of_study INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program TEXT;

-- 2. view_history
CREATE TABLE IF NOT EXISTS public.view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.view_history TO authenticated;
GRANT ALL ON public.view_history TO service_role;
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_view_history" ON public.view_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_notifications_delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. notification_subscriptions
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunities BOOLEAN NOT NULL DEFAULT false,
  document_replies BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_subscriptions TO authenticated;
GRANT ALL ON public.notification_subscriptions TO service_role;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_subs" ON public.notification_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. admin_emails table (server-side source of truth)
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- no SELECT policy → only service_role sees it; that's fine, function below is SECURITY DEFINER.

-- 6. function called by frontend after sign-in to grant admin role if email matches
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    VALUES (caller, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- 7. notification triggers

-- Helper: insert notifications for all users matching a filter
-- 7a. requests → notify same-university users
CREATE OR REPLACE FUNCTION public.notify_university_on_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req_uni TEXT;
BEGIN
  SELECT university INTO req_uni FROM public.profiles WHERE id = NEW.requester_id;
  IF req_uni IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.id, 'request',
         'New request at ' || req_uni,
         COALESCE(NEW.title, 'A student is requesting materials'),
         '/requests'
    FROM public.profiles p
   WHERE p.university = req_uni
     AND p.id <> NEW.requester_id;
  RETURN NEW;
END;
$$;

-- Only attach the trigger if a requests table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='requests') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_notify_university_on_request ON public.requests';
    EXECUTE 'CREATE TRIGGER trg_notify_university_on_request AFTER INSERT ON public.requests FOR EACH ROW EXECUTE FUNCTION public.notify_university_on_request()';
  END IF;
END $$;

-- 7b. document_comments → notify uploader (if subscribed)
CREATE OR REPLACE FUNCTION public.notify_uploader_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uploader UUID;
  wants BOOLEAN;
  doc_title TEXT;
BEGIN
  SELECT uploader_id, title INTO uploader, doc_title FROM public.documents WHERE id = NEW.document_id;
  IF uploader IS NULL OR uploader = NEW.user_id THEN RETURN NEW; END IF;
  SELECT document_replies INTO wants FROM public.notification_subscriptions WHERE user_id = uploader;
  IF NOT COALESCE(wants, false) THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (uploader, 'comment', 'New reply on your document',
          'Someone commented on "' || COALESCE(doc_title, 'your document') || '"',
          '/document/' || NEW.document_id::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_uploader_on_comment ON public.document_comments;
CREATE TRIGGER trg_notify_uploader_on_comment
AFTER INSERT ON public.document_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_uploader_on_comment();
