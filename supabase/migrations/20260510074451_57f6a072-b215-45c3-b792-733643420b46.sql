-- BOOKMARKS
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_doc ON public.bookmarks(document_id);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookmarks"
  ON public.bookmarks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users add own bookmarks"
  ON public.bookmarks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own bookmarks"
  ON public.bookmarks FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- COMMENTS (nested via parent_id)
CREATE TABLE public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_doc ON public.document_comments(document_id, created_at DESC);
CREATE INDEX idx_comments_parent ON public.document_comments(parent_id);
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read comments"
  ON public.document_comments FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Users insert own comments"
  ON public.document_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own comments"
  ON public.document_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authors or admins delete comments"
  ON public.document_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_comments_updated
  BEFORE UPDATE ON public.document_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();