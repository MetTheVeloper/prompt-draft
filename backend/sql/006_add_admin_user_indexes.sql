CREATE INDEX IF NOT EXISTS users_created_id_idx
  ON users (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS users_role_created_id_idx
  ON users (role, created_at DESC, id DESC);
