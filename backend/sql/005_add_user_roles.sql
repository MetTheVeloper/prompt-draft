ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin', 'super_admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS users_role_idx
  ON users (role);

-- One-time bootstrap for the current system owner account.
-- Runtime authorization never depends on this username.
UPDATE users
SET role = 'super_admin'
WHERE LOWER(username) = 'grass'
  AND role <> 'super_admin';
