-- Seed the admin_emails table with the superadmin email
INSERT INTO public.admin_emails (email)
VALUES ('imbutoconnect@gmail.com')
ON CONFLICT (email) DO NOTHING;
