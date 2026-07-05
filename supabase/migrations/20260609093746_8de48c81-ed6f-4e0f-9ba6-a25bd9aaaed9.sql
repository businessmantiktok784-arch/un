
-- 1. Duplicate detection columns
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON public.documents(file_hash);

-- Unique only among approved docs (so rejected duplicates don't block re-upload)
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_hash_approved
  ON public.documents(file_hash)
  WHERE status = 'approved' AND file_hash IS NOT NULL;

-- 2. Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rewarded boolean NOT NULL DEFAULT false,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their own referral record"
  ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referred_id = auth.uid());

-- 3. Reward referrer on first approved upload
CREATE OR REPLACE FUNCTION public.reward_referrer_on_first_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref RECORD;
  prior_count INTEGER;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;

  SELECT * INTO ref FROM public.referrals
    WHERE referred_id = NEW.uploader_id AND rewarded = false;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT count(*) INTO prior_count FROM public.documents
    WHERE uploader_id = NEW.uploader_id AND status = 'approved' AND id <> NEW.id;
  IF prior_count > 0 THEN RETURN NEW; END IF;

  PERFORM public.change_credits(
    ref.referrer_id, 3, 'referral_bonus',
    jsonb_build_object('referred_user', NEW.uploader_id, 'document_id', NEW.id)
  );

  UPDATE public.referrals SET rewarded = true, rewarded_at = now()
    WHERE id = ref.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reward_referrer ON public.documents;
CREATE TRIGGER trg_reward_referrer
  AFTER INSERT OR UPDATE OF status ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.reward_referrer_on_first_upload();

-- 4. Admin helper: list duplicate groups by hash
CREATE OR REPLACE FUNCTION public.find_duplicate_documents()
RETURNS TABLE(file_hash text, doc_count bigint, document_ids uuid[], titles text[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.file_hash,
         count(*)::bigint AS doc_count,
         array_agg(d.id ORDER BY d.created_at) AS document_ids,
         array_agg(d.title ORDER BY d.created_at) AS titles
    FROM public.documents d
   WHERE d.file_hash IS NOT NULL
   GROUP BY d.file_hash
   HAVING count(*) > 1;
$$;

REVOKE ALL ON FUNCTION public.find_duplicate_documents() FROM public;
GRANT EXECUTE ON FUNCTION public.find_duplicate_documents() TO authenticated;
