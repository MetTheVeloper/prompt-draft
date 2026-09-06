-- Milestone 21E2 — durable Prompt Archive unlock/access primitive
--
-- Simulation default:
--   Prompt Archive first meaningful unlock/copy access -> 5 goin
--
-- With the current 250 toman reference value this is roughly 1,250 toman of
-- simulation reference value. It is not a fiat price or redemption promise.
-- The value is server-authoritative and can be changed later without rewriting
-- historical unlocks.

INSERT INTO economy_settings (setting_key, integer_value)
VALUES
  ('goin_prompt_archive_unlock_cost', 5),
  ('goin_sink_rule_version', 1)
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_content_unlocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  economy_event_id UUID REFERENCES user_economy_events(id) ON DELETE SET NULL,
  price_goin BIGINT NOT NULL CHECK (price_goin >= 0),
  pricing_rule_version BIGINT NOT NULL CHECK (pricing_rule_version > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_content_unlocks_user_resource_unique
    UNIQUE (user_id, resource_type, resource_id),
  CONSTRAINT user_content_unlocks_resource_type_nonempty
    CHECK (BTRIM(resource_type) <> ''),
  CONSTRAINT user_content_unlocks_resource_id_nonempty
    CHECK (BTRIM(resource_id) <> '')
);

CREATE INDEX IF NOT EXISTS user_content_unlocks_user_created_idx
  ON user_content_unlocks (user_id, unlocked_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS user_content_unlocks_resource_idx
  ON user_content_unlocks (resource_type, resource_id, unlocked_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS user_content_unlocks_economy_event_uidx
  ON user_content_unlocks (economy_event_id)
  WHERE economy_event_id IS NOT NULL;
