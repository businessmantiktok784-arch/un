-- Donation settings singleton table (MoMo number, name, toggle)

CREATE TABLE IF NOT EXISTS public.donation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  momo_number text,
  momo_name text,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public read donation_settings"
  ON public.donation_settings FOR SELECT
  USING (true);

-- Admins can update
CREATE POLICY "Admin update donation_settings"
  ON public.donation_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can insert
CREATE POLICY "Admin insert donation_settings"
  ON public.donation_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_donation_settings_updated
  BEFORE UPDATE ON public.donation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.donation_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.donation_settings TO authenticated;
GRANT ALL ON public.donation_settings TO service_role;
