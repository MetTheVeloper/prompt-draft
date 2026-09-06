CREATE TABLE IF NOT EXISTS user_economy_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  unit_delta BIGINT NOT NULL CHECK (unit_delta <> 0),
  source_type TEXT,
  source_id TEXT,
  source_score_event_id TEXT REFERENCES user_score_events(id) ON DELETE SET NULL,
  idempotency_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_economy_events_user_idempotency_unique
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS user_economy_events_user_created_idx
  ON user_economy_events (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS user_economy_events_type_created_idx
  ON user_economy_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS user_economy_events_score_source_idx
  ON user_economy_events (source_score_event_id)
  WHERE source_score_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS economy_settings (
  setting_key TEXT PRIMARY KEY,
  integer_value BIGINT NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO economy_settings (
  setting_key,
  integer_value
)
VALUES (
  'goin_reference_value_toman',
  250
)
ON CONFLICT (setting_key) DO NOTHING;
