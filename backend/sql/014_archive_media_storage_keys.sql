ALTER TABLE prompt_archive_images
  ADD COLUMN IF NOT EXISTS thumbnail_storage_key TEXT;

CREATE INDEX IF NOT EXISTS prompt_archive_images_storage_key_idx
  ON prompt_archive_images (storage_key)
  WHERE storage_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS prompt_archive_images_thumbnail_storage_key_idx
  ON prompt_archive_images (thumbnail_storage_key)
  WHERE thumbnail_storage_key IS NOT NULL;
