ALTER TABLE prompt_drafts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS prompt_drafts_user_active_updated_idx
  ON prompt_drafts (user_id, client_updated_at DESC, draft_id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS prompt_drafts_user_active_visibility_updated_idx
  ON prompt_drafts (user_id, visibility, client_updated_at DESC, draft_id DESC)
  WHERE deleted_at IS NULL;
