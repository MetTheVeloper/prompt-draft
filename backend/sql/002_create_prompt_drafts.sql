CREATE TABLE IF NOT EXISTS prompt_drafts (
  draft_id TEXT PRIMARY KEY CHECK (char_length(trim(draft_id)) > 0),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  created_at TIMESTAMPTZ NOT NULL,
  client_updated_at TIMESTAMPTZ NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  snapshot JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS prompt_drafts_client_updated_idx
  ON prompt_drafts (client_updated_at DESC, draft_id DESC);
