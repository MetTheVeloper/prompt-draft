ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_storage_key TEXT;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_avatar_storage_consistency;

ALTER TABLE users
  ADD CONSTRAINT users_avatar_storage_consistency
  CHECK (
    (avatar_url IS NULL AND avatar_storage_key IS NULL)
    OR
    (avatar_url IS NOT NULL AND avatar_storage_key IS NOT NULL)
  );
