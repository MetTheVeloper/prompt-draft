-- Milestone 21.5 Phase 4C.1 — Creator Profile Foundation
--
-- Creator is intentionally NOT a users.role value. This migration adds
-- normalized extended-profile storage, a controlled localized skills taxonomy,
-- max-5 ordered profile links, and Creator lifecycle state/history.
--
-- The taxonomy tables are deliberately not seeded here. The founder-reviewed
-- initial skill inventory is a later content checkpoint.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  screen_name_en TEXT,
  screen_name_fa TEXT,
  bio_en TEXT,
  bio_fa TEXT,
  article_en TEXT,
  article_fa TEXT,
  birthday DATE,
  location_text TEXT,
  location_source TEXT,
  location_provider_place_id TEXT,
  location_country_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_screen_name_en_length_check
    CHECK (screen_name_en IS NULL OR CHAR_LENGTH(screen_name_en) <= 160),
  CONSTRAINT user_profiles_screen_name_fa_length_check
    CHECK (screen_name_fa IS NULL OR CHAR_LENGTH(screen_name_fa) <= 160),
  CONSTRAINT user_profiles_bio_en_length_check
    CHECK (bio_en IS NULL OR CHAR_LENGTH(bio_en) <= 2000),
  CONSTRAINT user_profiles_bio_fa_length_check
    CHECK (bio_fa IS NULL OR CHAR_LENGTH(bio_fa) <= 2000),
  CONSTRAINT user_profiles_article_en_length_check
    CHECK (article_en IS NULL OR CHAR_LENGTH(article_en) <= 100000),
  CONSTRAINT user_profiles_article_fa_length_check
    CHECK (article_fa IS NULL OR CHAR_LENGTH(article_fa) <= 100000),
  CONSTRAINT user_profiles_location_text_length_check
    CHECK (location_text IS NULL OR CHAR_LENGTH(location_text) <= 255),
  CONSTRAINT user_profiles_location_source_check
    CHECK (location_source IS NULL OR location_source IN ('suggestion', 'custom')),
  CONSTRAINT user_profiles_location_provider_place_id_length_check
    CHECK (
      location_provider_place_id IS NULL
      OR CHAR_LENGTH(location_provider_place_id) <= 512
    ),
  CONSTRAINT user_profiles_location_country_code_check
    CHECK (
      location_country_code IS NULL
      OR location_country_code ~ '^[A-Z]{2}$'
    )
);

CREATE TABLE IF NOT EXISTS profile_skill_categories (
  slug TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_skill_categories_slug_check
    CHECK (
      CHAR_LENGTH(slug) BETWEEN 1 AND 64
      AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  CONSTRAINT profile_skill_categories_title_en_check
    CHECK (BTRIM(title_en) <> '' AND CHAR_LENGTH(title_en) <= 160),
  CONSTRAINT profile_skill_categories_title_fa_check
    CHECK (BTRIM(title_fa) <> '' AND CHAR_LENGTH(title_fa) <= 160),
  CONSTRAINT profile_skill_categories_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE TABLE IF NOT EXISTS profile_skills (
  slug TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL
    REFERENCES profile_skill_categories(slug) ON DELETE RESTRICT,
  title_en TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_skills_slug_check
    CHECK (
      CHAR_LENGTH(slug) BETWEEN 1 AND 96
      AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  CONSTRAINT profile_skills_title_en_check
    CHECK (BTRIM(title_en) <> '' AND CHAR_LENGTH(title_en) <= 160),
  CONSTRAINT profile_skills_title_fa_check
    CHECK (BTRIM(title_fa) <> '' AND CHAR_LENGTH(title_fa) <= 160),
  CONSTRAINT profile_skills_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS profile_skills_category_active_sort_idx
  ON profile_skills (category_slug, active, sort_order, slug);

CREATE TABLE IF NOT EXISTS user_profile_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_slug TEXT NOT NULL REFERENCES profile_skills(slug) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_slug)
);

CREATE INDEX IF NOT EXISTS user_profile_skills_skill_user_idx
  ON user_profile_skills (skill_slug, user_id);

CREATE TABLE IF NOT EXISTS user_profile_links (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  position SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_profile_links_type_check
    CHECK (type IN (
      'website',
      'github',
      'linkedin',
      'instagram',
      'telegram',
      'x',
      'youtube',
      'other'
    )),
  CONSTRAINT user_profile_links_url_check
    CHECK (BTRIM(url) <> '' AND CHAR_LENGTH(url) <= 2048),
  CONSTRAINT user_profile_links_label_check
    CHECK (label IS NULL OR CHAR_LENGTH(label) <= 160),
  CONSTRAINT user_profile_links_position_check
    CHECK (position BETWEEN 0 AND 4),
  CONSTRAINT user_profile_links_user_position_unique
    UNIQUE (user_id, position)
);

CREATE INDEX IF NOT EXISTS user_profile_links_user_position_idx
  ON user_profile_links (user_id, position);

CREATE TABLE IF NOT EXISTS creator_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_accounts_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  CONSTRAINT creator_accounts_review_note_length_check
    CHECK (review_note IS NULL OR CHAR_LENGTH(review_note) <= 2000)
);

CREATE INDEX IF NOT EXISTS creator_accounts_status_requested_idx
  ON creator_accounts (status, requested_at DESC, user_id);

CREATE TABLE IF NOT EXISTS creator_account_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_account_events_type_check
    CHECK (event_type IN (
      'requested',
      'approved',
      'rejected',
      'suspended',
      'unsuspended',
      'reapplied'
    ))
);

CREATE INDEX IF NOT EXISTS creator_account_events_user_created_idx
  ON creator_account_events (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS creator_account_events_actor_created_idx
  ON creator_account_events (actor_user_id, created_at DESC, id DESC)
  WHERE actor_user_id IS NOT NULL;

-- Lifecycle history is append-only while the account exists. We intentionally
-- allow DELETE so a users(id) ON DELETE CASCADE can still remove account data.
CREATE OR REPLACE FUNCTION prevent_creator_account_event_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'creator_account_events are append-only';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'creator_account_events_prevent_update'
  ) THEN
    CREATE TRIGGER creator_account_events_prevent_update
      BEFORE UPDATE ON creator_account_events
      FOR EACH ROW
      EXECUTE FUNCTION prevent_creator_account_event_update();
  END IF;
END
$$;
