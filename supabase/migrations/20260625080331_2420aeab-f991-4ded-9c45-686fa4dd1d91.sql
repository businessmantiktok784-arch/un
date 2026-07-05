DROP TABLE IF EXISTS public.takedown_requests CASCADE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'takedown_status') THEN
    DROP TYPE public.takedown_status;
  END IF;
END $$;