CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  discovery_interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_preferences_discovery_interests_count_check
    CHECK (cardinality(discovery_interests) <= 6),
  CONSTRAINT user_preferences_discovery_interests_no_null_check
    CHECK (array_position(discovery_interests, NULL) IS NULL)
);

CREATE INDEX IF NOT EXISTS user_preferences_updated_idx
  ON user_preferences (updated_at DESC);
