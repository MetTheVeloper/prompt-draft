-- Campaign Engine V1 — CE1 Foundation
-- Rerunnable schema foundation. Published campaign versions are DB-immutable.

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  internal_name TEXT NOT NULL,
  draft_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_revision BIGINT NOT NULL DEFAULT 1 CHECK (draft_revision >= 1),
  current_published_version_id UUID NULL,
  paused_at TIMESTAMPTZ NULL,
  manually_ended_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaigns_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) <= 100),
  CONSTRAINT campaigns_internal_name_check CHECK (char_length(btrim(internal_name)) BETWEEN 1 AND 160)
);

CREATE TABLE IF NOT EXISTS campaign_versions (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  schema_version TEXT NOT NULL,
  definition JSONB NOT NULL,
  definition_hash TEXT NOT NULL,
  publish_idempotency_key TEXT NOT NULL,
  published_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, version_number),
  UNIQUE (campaign_id, publish_idempotency_key),
  UNIQUE (campaign_id, id),
  CONSTRAINT campaign_versions_schema_check CHECK (schema_version = 'campaign.v1'),
  CONSTRAINT campaign_versions_hash_check CHECK (definition_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT campaign_versions_publish_key_check CHECK (char_length(btrim(publish_idempotency_key)) BETWEEN 1 AND 240)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_current_published_version_fk'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_current_published_version_fk
      FOREIGN KEY (current_published_version_id)
      REFERENCES campaign_versions(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS campaign_versions_campaign_number_idx
  ON campaign_versions (campaign_id, version_number DESC);
CREATE INDEX IF NOT EXISTS campaign_versions_published_idx
  ON campaign_versions (published_at DESC);

CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL,
  campaign_version_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  attribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_progress_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  qualified_at TIMESTAMPTZ NULL,
  rewarded_at TIMESTAMPTZ NULL,
  disqualified_at TIMESTAMPTZ NULL,
  expired_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id),
  FOREIGN KEY (campaign_id, campaign_version_id)
    REFERENCES campaign_versions(campaign_id, id) ON DELETE RESTRICT,
  CONSTRAINT campaign_participations_status_check CHECK (
    status IN ('started','in_progress','completed','qualified','rewarded','disqualified','expired','reward_failed')
  )
);

CREATE INDEX IF NOT EXISTS campaign_participations_campaign_started_idx
  ON campaign_participations (campaign_id, started_at DESC);
CREATE INDEX IF NOT EXISTS campaign_participations_campaign_status_idx
  ON campaign_participations (campaign_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS campaign_participations_user_started_idx
  ON campaign_participations (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS campaign_participations_version_status_idx
  ON campaign_participations (campaign_version_id, status);

CREATE TABLE IF NOT EXISTS campaign_actions (
  id UUID PRIMARY KEY,
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE,
  mechanic_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepted BOOLEAN NOT NULL,
  rejection_code TEXT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participation_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS campaign_actions_participation_received_idx
  ON campaign_actions (participation_id, received_at DESC);

CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT,
  participation_id UUID NULL REFERENCES campaign_participations(id) ON DELETE CASCADE,
  mechanic_id TEXT NULL,
  event_name TEXT NOT NULL,
  source_action_id UUID NULL REFERENCES campaign_actions(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaign_events_campaign_name_created_idx
  ON campaign_events (campaign_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_events_participation_created_idx
  ON campaign_events (participation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_mechanic_states (
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE,
  mechanic_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participation_id, mechanic_id)
);

CREATE TABLE IF NOT EXISTS campaign_attempts (
  id UUID PRIMARY KEY,
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE,
  mechanic_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  attempt_index INTEGER NOT NULL CHECK (attempt_index > 0),
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  private_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  submitted_at TIMESTAMPTZ NULL,
  resolved_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  UNIQUE (participation_id, mechanic_id, idempotency_key),
  UNIQUE (participation_id, mechanic_id, period_key, attempt_index),
  CONSTRAINT campaign_attempts_status_check CHECK (
    status IN ('reserved','started','submitted','resolved','expired','rejected')
  )
);

CREATE TABLE IF NOT EXISTS campaign_reward_budgets (
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT,
  reward_definition_id TEXT NOT NULL,
  max_amount BIGINT NOT NULL CHECK (max_amount >= 0),
  committed_amount BIGINT NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  granted_amount BIGINT NOT NULL DEFAULT 0 CHECK (granted_amount >= 0),
  grant_count BIGINT NOT NULL DEFAULT 0 CHECK (grant_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_version_id, reward_definition_id),
  CHECK (granted_amount <= committed_amount),
  CHECK (committed_amount <= max_amount)
);

CREATE TABLE IF NOT EXISTS campaign_reward_grants (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT,
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_definition_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  idempotency_key TEXT NOT NULL,
  economy_event_id UUID NULL REFERENCES user_economy_events(id) ON DELETE RESTRICT,
  failure_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_at TIMESTAMPTZ NULL,
  UNIQUE (participation_id, reward_definition_id),
  UNIQUE (campaign_version_id, idempotency_key),
  CONSTRAINT campaign_reward_grants_status_check CHECK (status IN ('pending','granted','failed','cancelled'))
);

CREATE TABLE IF NOT EXISTS campaign_promotion_user_states (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE CASCADE,
  promotion_id TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismiss_until TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, campaign_version_id, promotion_id)
);

CREATE OR REPLACE FUNCTION reject_campaign_version_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'published campaign versions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_versions_immutable_update ON campaign_versions;
CREATE TRIGGER campaign_versions_immutable_update
BEFORE UPDATE ON campaign_versions
FOR EACH ROW EXECUTE FUNCTION reject_campaign_version_mutation();

DROP TRIGGER IF EXISTS campaign_versions_immutable_delete ON campaign_versions;
CREATE TRIGGER campaign_versions_immutable_delete
BEFORE DELETE ON campaign_versions
FOR EACH ROW EXECUTE FUNCTION reject_campaign_version_mutation();
