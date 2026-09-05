CREATE TABLE IF NOT EXISTS prompt_draft_images (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  draft_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  url TEXT NOT NULL CHECK (char_length(trim(url)) > 0),
  storage_key TEXT NOT NULL CHECK (char_length(trim(storage_key)) > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prompt_draft_images_draft_fkey
    FOREIGN KEY (user_id, draft_id)
    REFERENCES prompt_drafts(user_id, draft_id)
    ON DELETE CASCADE,
  CONSTRAINT prompt_draft_images_storage_key_unique
    UNIQUE (storage_key),
  CONSTRAINT prompt_draft_images_position_unique
    UNIQUE (user_id, draft_id, position)
    DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS prompt_draft_images_draft_position_idx
  ON prompt_draft_images (user_id, draft_id, position, created_at);
