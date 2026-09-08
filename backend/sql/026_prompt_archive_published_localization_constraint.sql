-- Milestone 21.5 Phase 4B.5A — published localization completeness
--
-- Safe to apply only after the founder-reviewed description backfill.
-- Draft/archived rows may remain incomplete; published rows must have complete
-- authoritative EN/FA title + description presentation content.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_archive_items_published_localization_complete'
  ) THEN
    ALTER TABLE prompt_archive_items
      ADD CONSTRAINT prompt_archive_items_published_localization_complete
      CHECK (
        status <> 'published'
        OR (
          BTRIM(COALESCE(titles->>'en', '')) <> ''
          AND BTRIM(COALESCE(titles->>'fa', '')) <> ''
          AND BTRIM(COALESCE(descriptions->>'en', '')) <> ''
          AND BTRIM(COALESCE(descriptions->>'fa', '')) <> ''
        )
      );
  END IF;
END
$$;
