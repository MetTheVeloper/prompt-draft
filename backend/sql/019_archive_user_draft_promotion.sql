CREATE SEQUENCE IF NOT EXISTS prompt_archive_public_id_seq AS INTEGER;

ALTER TABLE prompt_archive_items
  ADD COLUMN IF NOT EXISTS public_id INTEGER;

UPDATE prompt_archive_items
SET public_id = telegram_message_id
WHERE public_id IS NULL
  AND telegram_message_id IS NOT NULL;

SELECT setval(
  'prompt_archive_public_id_seq',
  GREATEST(
    COALESCE((SELECT MAX(public_id) FROM prompt_archive_items), 0) + 1,
    1
  ),
  false
);

ALTER TABLE prompt_archive_items
  ALTER COLUMN public_id SET DEFAULT nextval('prompt_archive_public_id_seq'),
  ALTER COLUMN public_id SET NOT NULL,
  ALTER COLUMN telegram_message_id DROP NOT NULL,
  ALTER COLUMN telegram_url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_draft_id TEXT;

ALTER SEQUENCE prompt_archive_public_id_seq
  OWNED BY prompt_archive_items.public_id;

CREATE UNIQUE INDEX IF NOT EXISTS prompt_archive_items_public_id_uidx
  ON prompt_archive_items (public_id);

CREATE INDEX IF NOT EXISTS prompt_archive_items_published_public_id_idx
  ON prompt_archive_items (published_at DESC, public_id DESC);

CREATE INDEX IF NOT EXISTS prompt_archive_items_status_published_public_id_idx
  ON prompt_archive_items (status, published_at DESC, public_id DESC);

ALTER TABLE prompt_archive_items
  DROP CONSTRAINT IF EXISTS prompt_archive_items_source_kind_check;

ALTER TABLE prompt_archive_items
  ADD CONSTRAINT prompt_archive_items_source_kind_check
  CHECK (source_kind IN ('managed', 'legacy_json', 'user_draft'));

ALTER TABLE prompt_archive_items
  DROP CONSTRAINT IF EXISTS prompt_archive_items_user_draft_source_check;

ALTER TABLE prompt_archive_items
  ADD CONSTRAINT prompt_archive_items_user_draft_source_check
  CHECK (source_kind <> 'user_draft' OR source_draft_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS prompt_archive_items_user_draft_source_uidx
  ON prompt_archive_items (source_user_id, source_draft_id)
  WHERE source_kind = 'user_draft'
    AND source_user_id IS NOT NULL
    AND source_draft_id IS NOT NULL;
