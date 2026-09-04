ALTER TABLE prompt_drafts
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_drafts_user_id_fkey'
      AND conrelid = 'prompt_drafts'::regclass
  ) THEN
    ALTER TABLE prompt_drafts
      ADD CONSTRAINT prompt_drafts_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- Pre-auth Cloud Draft rows have no trustworthy owner. The canonical localStorage
-- collection remains untouched; users can explicitly upload those local drafts
-- again after signing in.
DELETE FROM prompt_drafts
WHERE user_id IS NULL;

ALTER TABLE prompt_drafts
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_drafts_pkey'
      AND conrelid = 'prompt_drafts'::regclass
  ) THEN
    ALTER TABLE prompt_drafts
      DROP CONSTRAINT prompt_drafts_pkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_drafts_user_draft_pkey'
      AND conrelid = 'prompt_drafts'::regclass
  ) THEN
    ALTER TABLE prompt_drafts
      ADD CONSTRAINT prompt_drafts_user_draft_pkey
      PRIMARY KEY (user_id, draft_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS prompt_drafts_user_updated_idx
  ON prompt_drafts (user_id, client_updated_at DESC, draft_id DESC);
