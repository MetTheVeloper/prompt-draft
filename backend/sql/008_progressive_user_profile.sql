DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND conname <> 'users_identity_present_check'
      AND pg_get_constraintdef(oid) ILIKE '%username%'
      AND pg_get_constraintdef(oid) ILIKE '%email%'
  LOOP
    EXECUTE format(
      'ALTER TABLE users DROP CONSTRAINT %I',
      constraint_row.conname
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND conname = 'users_identity_present_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_identity_present_check
      CHECK (username IS NOT NULL OR email IS NOT NULL);
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE users
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE users
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;
