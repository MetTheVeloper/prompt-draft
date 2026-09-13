-- CE4.5 / TG1 — shared Telegram publishing foundation
--
-- Source-neutral publication persistence. Prompt Archive and Campaign adapters
-- attach later; neither source row is the authoritative publication ledger.

CREATE TABLE IF NOT EXISTS telegram_publications (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_version TEXT,
  destination_chat_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  last_error_message TEXT,
  last_attempt_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT telegram_publications_idempotency_nonempty
    CHECK (BTRIM(idempotency_key) <> ''),
  CONSTRAINT telegram_publications_source_type_check
    CHECK (source_type IN ('manual', 'prompt_archive', 'campaign')),
  CONSTRAINT telegram_publications_source_identity_check
    CHECK (
      (source_type = 'manual' AND source_id IS NULL)
      OR
      (source_type <> 'manual' AND source_id IS NOT NULL AND BTRIM(source_id) <> '')
    ),
  CONSTRAINT telegram_publications_destination_nonempty
    CHECK (BTRIM(destination_chat_id) <> ''),
  CONSTRAINT telegram_publications_payload_object
    CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT telegram_publications_payload_hash_check
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT telegram_publications_status_check
    CHECK (status IN ('created', 'publishing', 'published', 'failed', 'delivery_unknown')),
  CONSTRAINT telegram_publications_attempt_count_check
    CHECK (attempt_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS telegram_publications_idempotency_uidx
  ON telegram_publications (idempotency_key);

CREATE INDEX IF NOT EXISTS telegram_publications_source_idx
  ON telegram_publications (source_type, source_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS telegram_publications_status_created_idx
  ON telegram_publications (status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS telegram_publication_attempts (
  id UUID PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES telegram_publications(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'started',
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  CONSTRAINT telegram_publication_attempts_number_check
    CHECK (attempt_number > 0),
  CONSTRAINT telegram_publication_attempts_status_check
    CHECK (status IN ('started', 'succeeded', 'failed', 'delivery_unknown')),
  CONSTRAINT telegram_publication_attempts_details_object
    CHECK (jsonb_typeof(details) = 'object'),
  CONSTRAINT telegram_publication_attempts_publication_number_unique
    UNIQUE (publication_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS telegram_publication_attempts_publication_idx
  ON telegram_publication_attempts (publication_id, attempt_number DESC);

CREATE TABLE IF NOT EXISTS telegram_publication_messages (
  id UUID PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES telegram_publications(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES telegram_publication_attempts(id) ON DELETE SET NULL,
  ordinal INTEGER NOT NULL,
  role TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  telegram_url TEXT,
  media_group_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT telegram_publication_messages_ordinal_check
    CHECK (ordinal >= 0),
  CONSTRAINT telegram_publication_messages_role_check
    CHECK (role IN ('content', 'cta')),
  CONSTRAINT telegram_publication_messages_chat_nonempty
    CHECK (BTRIM(telegram_chat_id) <> ''),
  CONSTRAINT telegram_publication_messages_message_id_check
    CHECK (telegram_message_id > 0),
  CONSTRAINT telegram_publication_messages_publication_ordinal_unique
    UNIQUE (publication_id, ordinal),
  CONSTRAINT telegram_publication_messages_telegram_identity_unique
    UNIQUE (telegram_chat_id, telegram_message_id)
);

CREATE INDEX IF NOT EXISTS telegram_publication_messages_publication_idx
  ON telegram_publication_messages (publication_id, ordinal ASC);
