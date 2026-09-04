CREATE TABLE IF NOT EXISTS prompt_archive_metadata (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  schema_version INTEGER NOT NULL,
  channel TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  model_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(model_history) = 'array')
);

CREATE TABLE IF NOT EXISTS prompt_archive_items (
  id UUID PRIMARY KEY,
  telegram_message_id INTEGER UNIQUE NOT NULL CHECK (telegram_message_id > 0),
  channel TEXT NOT NULL,
  titles JSONB NOT NULL,
  legacy_title_key TEXT,
  source_title TEXT,
  telegram_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  prompt TEXT NOT NULL,
  preview_model TEXT NOT NULL,
  optimized_for TEXT[] NOT NULL DEFAULT '{}',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  source_kind TEXT NOT NULL DEFAULT 'managed',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(titles) = 'object'),
  CHECK (NULLIF(BTRIM(titles ->> 'en'), '') IS NOT NULL),
  CHECK (NULLIF(BTRIM(titles ->> 'fa'), '') IS NOT NULL),
  CHECK (jsonb_typeof(variants) = 'array'),
  CHECK (status IN ('draft', 'published', 'archived')),
  CHECK (source_kind IN ('managed', 'legacy_json'))
);

CREATE INDEX IF NOT EXISTS prompt_archive_items_published_at_idx
  ON prompt_archive_items (published_at DESC, telegram_message_id DESC);

CREATE INDEX IF NOT EXISTS prompt_archive_items_status_published_at_idx
  ON prompt_archive_items (status, published_at DESC, telegram_message_id DESC);

CREATE TABLE IF NOT EXISTS prompt_archive_images (
  id UUID PRIMARY KEY,
  archive_item_id UUID NOT NULL REFERENCES prompt_archive_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  source_path TEXT,
  storage_key TEXT,
  full_url TEXT,
  thumbnail_url TEXT,
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  thumbnail_width INTEGER CHECK (thumbnail_width IS NULL OR thumbnail_width > 0),
  thumbnail_height INTEGER CHECK (thumbnail_height IS NULL OR thumbnail_height > 0),
  mime_type TEXT,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  thumbnail_size_bytes BIGINT CHECK (thumbnail_size_bytes IS NULL OR thumbnail_size_bytes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (archive_item_id, position)
);

CREATE INDEX IF NOT EXISTS prompt_archive_images_item_idx
  ON prompt_archive_images (archive_item_id, position);

CREATE TABLE IF NOT EXISTS prompt_archive_tags (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'managed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (slug = LOWER(slug)),
  CHECK (slug = BTRIM(slug)),
  CHECK (slug <> ''),
  CHECK (source_kind IN ('managed', 'legacy_json'))
);

CREATE TABLE IF NOT EXISTS prompt_archive_item_tags (
  archive_item_id UUID NOT NULL REFERENCES prompt_archive_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES prompt_archive_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (archive_item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS prompt_archive_item_tags_tag_idx
  ON prompt_archive_item_tags (tag_id, archive_item_id);
