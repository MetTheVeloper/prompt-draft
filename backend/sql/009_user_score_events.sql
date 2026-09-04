CREATE TABLE IF NOT EXISTS user_score_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points <> 0),
  source_type TEXT,
  source_id TEXT,
  idempotency_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_score_events_user_idempotency_unique
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS user_score_events_user_created_idx
  ON user_score_events (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS user_score_events_event_type_idx
  ON user_score_events (event_type);

-- Existing accounts should start from the same product semantics as new ones.
-- Stable ids + per-user idempotency keys keep this migration rerunnable.
INSERT INTO user_score_events (
  id,
  user_id,
  event_type,
  points,
  source_type,
  source_id,
  idempotency_key,
  metadata,
  created_at
)
SELECT
  users.id::text || ':account_created:v1',
  users.id,
  'account_created',
  1000,
  'account',
  users.id::text,
  'account_created:v1',
  '{"backfill":true,"ruleVersion":1}'::jsonb,
  users.created_at
FROM users
ON CONFLICT (user_id, idempotency_key) DO NOTHING;

INSERT INTO user_score_events (
  id,
  user_id,
  event_type,
  points,
  source_type,
  source_id,
  idempotency_key,
  metadata,
  created_at
)
SELECT
  users.id::text || ':profile_email_added:v1',
  users.id,
  'profile_email_added',
  1000,
  'profile_field',
  'email',
  'profile_email_added:v1',
  '{"backfill":true,"ruleVersion":1}'::jsonb,
  users.updated_at
FROM users
WHERE users.email IS NOT NULL
ON CONFLICT (user_id, idempotency_key) DO NOTHING;
