CREATE TABLE IF NOT EXISTS product_analytics_events (
  id UUID PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id UUID NOT NULL,
  session_id UUID NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  path TEXT,
  locale TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_analytics_events_event_name_check
    CHECK (char_length(event_name) BETWEEN 1 AND 100),
  CONSTRAINT product_analytics_events_resource_type_check
    CHECK (resource_type IS NULL OR char_length(resource_type) BETWEEN 1 AND 100),
  CONSTRAINT product_analytics_events_resource_id_check
    CHECK (resource_id IS NULL OR char_length(resource_id) BETWEEN 1 AND 200),
  CONSTRAINT product_analytics_events_path_check
    CHECK (path IS NULL OR char_length(path) <= 500),
  CONSTRAINT product_analytics_events_locale_check
    CHECK (locale IS NULL OR char_length(locale) BETWEEN 1 AND 10),
  CONSTRAINT product_analytics_events_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS product_analytics_events_name_received_idx
  ON product_analytics_events (event_name, received_at DESC);

CREATE INDEX IF NOT EXISTS product_analytics_events_user_received_idx
  ON product_analytics_events (user_id, received_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_analytics_events_resource_received_idx
  ON product_analytics_events (
    resource_type,
    resource_id,
    event_name,
    received_at DESC
  )
  WHERE resource_type IS NOT NULL
    AND resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_analytics_events_anonymous_received_idx
  ON product_analytics_events (anonymous_id, received_at DESC);

CREATE INDEX IF NOT EXISTS product_analytics_events_session_received_idx
  ON product_analytics_events (session_id, received_at DESC);
