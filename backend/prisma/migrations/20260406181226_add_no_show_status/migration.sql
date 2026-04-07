DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'no_show'
      AND enumtypid = 'AppointmentStatus'::regtype
  ) THEN
    ALTER TYPE "AppointmentStatus" ADD VALUE 'no_show';
  END IF;
END$$;