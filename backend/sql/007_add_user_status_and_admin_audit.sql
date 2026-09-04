ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_status_check
      CHECK (status IN ('active', 'suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_status_created_idx
  ON users (status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_actor_created_idx
  ON admin_audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_target_created_idx
  ON admin_audit_log (target_user_id, created_at DESC);
