-- Milestone 21.5 Phase 4B.5A — localized public Prompt descriptions
--
-- Backward-safe rollout:
-- - existing rows receive an empty object
-- - publication completeness is enforced only after founder-reviewed backfill
-- - public Prompt projection is unchanged by this migration alone

ALTER TABLE prompt_archive_items
  ADD COLUMN IF NOT EXISTS descriptions JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_archive_items_descriptions_object'
  ) THEN
    ALTER TABLE prompt_archive_items
      ADD CONSTRAINT prompt_archive_items_descriptions_object
      CHECK (jsonb_typeof(descriptions) = 'object');
  END IF;
END
$$;
