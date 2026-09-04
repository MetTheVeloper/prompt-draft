ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS cover_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_thumbnail_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS cover_width INTEGER,
  ADD COLUMN IF NOT EXISTS cover_height INTEGER,
  ADD COLUMN IF NOT EXISTS cover_thumbnail_width INTEGER,
  ADD COLUMN IF NOT EXISTS cover_thumbnail_height INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_cover_media_consistency_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_cover_media_consistency_check
      CHECK (
        (
          cover_url IS NULL
          AND cover_storage_key IS NULL
          AND cover_thumbnail_url IS NULL
          AND cover_thumbnail_storage_key IS NULL
          AND cover_width IS NULL
          AND cover_height IS NULL
          AND cover_thumbnail_width IS NULL
          AND cover_thumbnail_height IS NULL
        )
        OR
        (
          cover_url IS NOT NULL
          AND cover_storage_key IS NOT NULL
          AND cover_thumbnail_url IS NOT NULL
          AND cover_thumbnail_storage_key IS NOT NULL
          AND cover_width > 0
          AND cover_height > 0
          AND cover_thumbnail_width > 0
          AND cover_thumbnail_height > 0
        )
      );
  END IF;
END
$$;

ALTER TABLE prompt_drafts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_drafts_visibility_check'
      AND conrelid = 'prompt_drafts'::regclass
  ) THEN
    ALTER TABLE prompt_drafts
      ADD CONSTRAINT prompt_drafts_visibility_check
      CHECK (visibility IN ('private', 'public'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS prompt_drafts_user_visibility_updated_idx
  ON prompt_drafts (user_id, visibility, client_updated_at DESC, draft_id DESC);
