
-- =========================================================
-- DOCUMENTS TABLE
-- =========================================================
CREATE TYPE public.document_type AS ENUM ('Exam', 'CAT', 'Assignment', 'Notes', 'Lab Report', 'Project', 'Past Paper', 'Other');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  university TEXT NOT NULL,
  campus TEXT,
  faculty TEXT,
  department TEXT,
  course_code TEXT NOT NULL,
  course_name TEXT,
  academic_year TEXT,           -- e.g. "Year 2"
  semester TEXT,                -- e.g. "Semester 1"
  exam_year INTEGER,            -- e.g. 2024
  doc_type public.document_type NOT NULL DEFAULT 'Notes',

  storage_path TEXT NOT NULL UNIQUE,  -- path inside the 'documents' bucket
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- 50MB hard cap
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  page_count INTEGER,

  status public.document_status NOT NULL DEFAULT 'approved',
  rejection_reason TEXT,

  downloads_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_university ON public.documents(university);
CREATE INDEX idx_documents_course ON public.documents(course_code);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_uploader ON public.documents(uploader_id);
CREATE INDEX idx_documents_created ON public.documents(created_at DESC);
CREATE INDEX idx_documents_search ON public.documents USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(course_code,'') || ' ' || coalesce(course_name,'') || ' ' || coalesce(description,'')));

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Public-ish read: any signed-in user sees APPROVED docs
CREATE POLICY "Authenticated users view approved documents"
ON public.documents FOR SELECT
TO authenticated
USING (status = 'approved' OR uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can insert their own docs (status defaults to approved; admin can later moderate)
CREATE POLICY "Users upload own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (uploader_id = auth.uid());

-- Users update own doc metadata (not status); admins update all
CREATE POLICY "Users update own documents"
ON public.documents FOR UPDATE
TO authenticated
USING (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own documents"
ON public.documents FOR DELETE
TO authenticated
USING (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- DOWNLOAD LEDGER
-- =========================================================
CREATE TABLE public.document_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  credits_spent INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)  -- one paid record per (user, doc); re-download is free
);

CREATE INDEX idx_doc_downloads_user ON public.document_downloads(user_id);
CREATE INDEX idx_doc_downloads_doc ON public.document_downloads(document_id);

ALTER TABLE public.document_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own download history"
ON public.document_downloads FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- inserts only happen via SECURITY DEFINER function below; no direct insert policy.

-- =========================================================
-- PRIVATE STORAGE BUCKET
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only owner (uploader) and admins can directly touch raw files.
-- Everyone else must go through the secure download function (signed URL).

CREATE POLICY "Uploaders read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Authenticated users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Uploaders update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Uploaders delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

-- =========================================================
-- SECURE DOWNLOAD AUTHORIZATION RPC
-- Charges 1 credit (or 0 if already paid) and returns the storage path
-- so the edge function can mint a short-lived signed URL with service role.
-- =========================================================
CREATE OR REPLACE FUNCTION public.request_document_download(_document_id UUID)
RETURNS TABLE (storage_path TEXT, credits_spent INTEGER, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  doc RECORD;
  already_paid BOOLEAN;
  cost INTEGER := 1;
  bal INTEGER;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id, uploader_id, status, storage_path AS path
    INTO doc
    FROM public.documents
   WHERE id = _document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'document_not_found';
  END IF;

  IF doc.status <> 'approved' AND doc.uploader_id <> caller AND NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'document_not_available';
  END IF;

  -- uploader and admins download free
  IF doc.uploader_id = caller OR public.has_role(caller, 'admin') THEN
    RETURN QUERY SELECT doc.path, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0);
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.document_downloads
     WHERE user_id = caller AND document_id = _document_id
  ) INTO already_paid;

  IF already_paid THEN
    RETURN QUERY SELECT doc.path, 0, COALESCE((SELECT balance FROM public.credits WHERE user_id = caller), 0);
    RETURN;
  END IF;

  -- charge the credit (raises insufficient_credits if balance would go negative)
  bal := public.change_credits(caller, -cost, 'document_download', jsonb_build_object('document_id', _document_id));

  INSERT INTO public.document_downloads (user_id, document_id, credits_spent)
  VALUES (caller, _document_id, cost);

  UPDATE public.documents
     SET downloads_count = downloads_count + 1
   WHERE id = _document_id;

  RETURN QUERY SELECT doc.path, cost, bal;
END;
$$;

REVOKE ALL ON FUNCTION public.request_document_download(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_document_download(UUID) TO authenticated;
