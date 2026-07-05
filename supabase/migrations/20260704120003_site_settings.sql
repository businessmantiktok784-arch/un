-- Site settings table (single-row config)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text,
  support_email text,
  auto_approve boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Single-row constraint
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_single_row ON public.site_settings ((true));

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for maintenance mode check)
CREATE POLICY "Public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admin update site_settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert site_settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default row
INSERT INTO public.site_settings (platform_name, support_email)
VALUES ('UniHub Rwanda', 'support@unihub.rw')
ON CONFLICT DO NOTHING;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
