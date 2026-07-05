
-- 1) Extend universities with abbr + campuses + seed
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS abbr text,
  ADD COLUMN IF NOT EXISTS campuses text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE UNIQUE INDEX IF NOT EXISTS universities_abbr_unique ON public.universities (lower(abbr)) WHERE abbr IS NOT NULL;

-- 2) Document requests
CREATE TABLE IF NOT EXISTS public.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  course_code text,
  university text,
  details text,
  status text NOT NULL DEFAULT 'open',
  votes_count integer NOT NULL DEFAULT 0,
  answers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.document_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_requests TO authenticated;
GRANT ALL ON public.document_requests TO service_role;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read requests" ON public.document_requests FOR SELECT USING (true);
CREATE POLICY "Auth users create requests" ON public.document_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Owners update requests" ON public.document_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = requester_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners or admins delete" ON public.document_requests FOR DELETE TO authenticated USING (auth.uid() = requester_id OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_doc_requests_updated BEFORE UPDATE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Answers
CREATE TABLE IF NOT EXISTS public.request_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  file_name text,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.request_answers TO anon;
GRANT SELECT, INSERT, DELETE ON public.request_answers TO authenticated;
GRANT ALL ON public.request_answers TO service_role;
ALTER TABLE public.request_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read answers" ON public.request_answers FOR SELECT USING (true);
CREATE POLICY "Auth create answers" ON public.request_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = responder_id);
CREATE POLICY "Owners delete answers" ON public.request_answers FOR DELETE TO authenticated USING (auth.uid() = responder_id OR has_role(auth.uid(),'admin'));

-- 4) Votes
CREATE TABLE IF NOT EXISTS public.request_votes (
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.request_votes TO authenticated;
GRANT ALL ON public.request_votes TO service_role;
ALTER TABLE public.request_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users see votes" ON public.request_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users vote" ON public.request_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users unvote" ON public.request_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5) Counter triggers
CREATE OR REPLACE FUNCTION public.bump_request_votes() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.document_requests SET votes_count = votes_count + 1 WHERE id = NEW.request_id; RETURN NEW;
  ELSIF TG_OP='DELETE' THEN UPDATE public.document_requests SET votes_count = greatest(0, votes_count - 1) WHERE id = OLD.request_id; RETURN OLD;
  END IF; RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_request_votes_count ON public.request_votes;
CREATE TRIGGER trg_request_votes_count AFTER INSERT OR DELETE ON public.request_votes FOR EACH ROW EXECUTE FUNCTION public.bump_request_votes();

CREATE OR REPLACE FUNCTION public.handle_new_answer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE req RECORD;
BEGIN
  SELECT id, requester_id, title INTO req FROM public.document_requests WHERE id = NEW.request_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  UPDATE public.document_requests SET answers_count = answers_count + 1, status = 'fulfilled', updated_at = now() WHERE id = req.id;
  IF req.requester_id <> NEW.responder_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (req.requester_id, 'request_answer', 'Your request got an answer',
            'Someone replied to "' || req.title || '"', '/requests');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_handle_new_answer ON public.request_answers;
CREATE TRIGGER trg_handle_new_answer AFTER INSERT ON public.request_answers FOR EACH ROW EXECUTE FUNCTION public.handle_new_answer();

-- 6) Same-university notification on new request
CREATE OR REPLACE FUNCTION public.notify_university_on_doc_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uni text;
BEGIN
  uni := COALESCE(NEW.university, (SELECT university FROM public.profiles WHERE id = NEW.requester_id));
  IF uni IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.id, 'request', 'New request at ' || uni, NEW.title, '/requests'
    FROM public.profiles p
   WHERE p.university = uni AND p.id <> NEW.requester_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_uni_on_doc_request ON public.document_requests;
CREATE TRIGGER trg_notify_uni_on_doc_request AFTER INSERT ON public.document_requests FOR EACH ROW EXECUTE FUNCTION public.notify_university_on_doc_request();

-- 7) Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.universities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- 8) Seed universities
INSERT INTO public.universities (name, abbr, country, city, campuses, featured, description) VALUES
  ('University of Rwanda', 'UR', 'Rwanda', 'Kigali', ARRAY['Huye','Nyarugenge','Musanze','Rukara','Busogo','Nyagatare'], true, 'The largest public university in Rwanda, spanning six campuses.'),
  ('University of Kigali', 'UK', 'Rwanda', 'Kigali', ARRAY['Kigali'], true, 'Private university focused on business, IT and law.'),
  ('Adventist University of Central Africa', 'AUCA', 'Rwanda', 'Kigali', ARRAY['Masoro','Gitwe','Mudende'], true, 'Faith-based university with strong business and theology programs.'),
  ('Carnegie Mellon University Africa', 'CMU', 'Rwanda', 'Kigali', ARRAY['Kigali'], true, 'Branch of CMU offering graduate programs in IT and engineering.'),
  ('Mount Kenya University Rwanda', 'MKU', 'Rwanda', 'Kigali', ARRAY['Kigali'], false, 'Rwandan branch of Mount Kenya University.'),
  ('INES-Ruhengeri', 'INES', 'Rwanda', 'Musanze', ARRAY['Musanze'], false, 'Institute of Applied Sciences based in Musanze.')
ON CONFLICT (name) DO UPDATE SET abbr = EXCLUDED.abbr, campuses = EXCLUDED.campuses, country = EXCLUDED.country, city = EXCLUDED.city, featured = EXCLUDED.featured, description = EXCLUDED.description;

-- 9) Seed opportunities (approved so visible publicly)
INSERT INTO public.opportunities (title, type, category, country, deadline, description, link, status, featured) VALUES
  ('Software Engineering Intern', 'Internship', 'IT', 'Rwanda', '2026-04-15', 'Join our digital transformation team and build banking solutions.', 'https://bk.rw/careers', 'approved', true),
  ('Civil Engineering Graduate', 'Full-time', 'Engineering', 'Rwanda', '2026-03-30', 'Work on national housing projects across Rwanda.', 'https://rha.gov.rw', 'approved', false),
  ('Data Analyst Intern', 'Internship', 'IT', 'Rwanda', '2026-05-01', 'Analyze telecom data and build dashboards for business insights.', 'https://mtn.co.rw/careers', 'approved', true),
  ('Mining Engineering Trainee', 'Traineeship', 'Mining', 'Rwanda', '2026-04-20', 'Field training program across mining operations in Rwanda.', 'https://rmb.gov.rw', 'approved', false),
  ('Accounting Associate', 'Full-time', 'Business', 'Rwanda', '2026-03-25', 'Audit and assurance services for major Rwandan enterprises.', 'https://deloitte.com/rw', 'approved', false),
  ('Electrical Engineering Intern', 'Internship', 'Engineering', 'Rwanda', '2026-04-10', 'Support Rwanda''s electrification projects and renewable energy initiatives.', 'https://eucl.rw', 'approved', false)
ON CONFLICT DO NOTHING;

-- 10) Seed testimonials
INSERT INTO public.testimonials (student_name, university, quote, status, featured) VALUES
  ('Marie Claire U.', 'University of Rwanda', 'UniHub saved my semester! I found past exams for Organic Chemistry that were exactly what I needed.', 'approved', true),
  ('Patrick H.', 'Carnegie Mellon University Africa', 'Finding quality Machine Learning resources used to be hard. UniHub made it easy.', 'approved', true),
  ('Grace M.', 'University of Kigali', 'I''ve uploaded over 30 documents and helped hundreds of students.', 'approved', false),
  ('Eric N.', 'Adventist University of Central Africa', 'Finding Financial Accounting notes used to be impossible. UniHub made it easy.', 'approved', true)
ON CONFLICT DO NOTHING;
