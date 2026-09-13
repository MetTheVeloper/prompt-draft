-- Campaign Engine V1 — reward grant contract alignment
-- Follow-up to migration 029. Rerunnable and backward-compatible with existing CE1 rows.

ALTER TABLE campaign_reward_grants
  ADD COLUMN IF NOT EXISTS qualification_key TEXT,
  ADD COLUMN IF NOT EXISTS reward_type TEXT,
  ADD COLUMN IF NOT EXISTS qualification JSONB,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

UPDATE campaign_reward_grants
SET qualification_key = 'campaign_completion'
WHERE qualification_key IS NULL
   OR btrim(qualification_key) = '';

UPDATE campaign_reward_grants
SET reward_type = 'goin'
WHERE reward_type IS NULL
   OR btrim(reward_type) = '';

UPDATE campaign_reward_grants
SET qualification = '{}'::jsonb
WHERE qualification IS NULL;

UPDATE campaign_reward_grants
SET failed_at = COALESCE(failed_at, updated_at, created_at)
WHERE status = 'failed'
  AND failed_at IS NULL;

ALTER TABLE campaign_reward_grants
  ALTER COLUMN qualification_key SET NOT NULL,
  ALTER COLUMN reward_type SET NOT NULL,
  ALTER COLUMN qualification SET DEFAULT '{}'::jsonb,
  ALTER COLUMN qualification SET NOT NULL;

ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_status_check;

ALTER TABLE campaign_reward_grants
  ADD CONSTRAINT campaign_reward_grants_status_check CHECK (
    status IN ('pending','granted','failed','cancelled','exhausted','disqualified')
  );

ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_reward_type_check;

ALTER TABLE campaign_reward_grants
  ADD CONSTRAINT campaign_reward_grants_reward_type_check CHECK (
    reward_type = 'goin'
  );

ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_qualification_key_check;

ALTER TABLE campaign_reward_grants
  ADD CONSTRAINT campaign_reward_grants_qualification_key_check CHECK (
    char_length(btrim(qualification_key)) BETWEEN 1 AND 500
  );

-- Migration 029 accidentally enforced only one reward-definition grant for an
-- entire participation. V1 qualification_key is the retry-safe identity that
-- permits legitimate repeated rewards such as daily wheel/game outcomes.
--
-- PostgreSQL auto-generated the original two-column UNIQUE constraint with the
-- 63-byte identifier below. The earlier follow-up attempted to drop a longer
-- guessed name, which PostgreSQL truncated differently and therefore left the
-- legacy constraint active on existing databases.
ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_participation_id_reward_definition_i_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_reward_grants_qualification_unique'
      AND conrelid = 'campaign_reward_grants'::regclass
  ) THEN
    ALTER TABLE campaign_reward_grants
      ADD CONSTRAINT campaign_reward_grants_qualification_unique
      UNIQUE (participation_id, reward_definition_id, qualification_key);
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_reward_grants_economy_event_uidx
  ON campaign_reward_grants (economy_event_id)
  WHERE economy_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaign_reward_grants_campaign_status_created_idx
  ON campaign_reward_grants (campaign_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS campaign_reward_grants_version_reward_status_idx
  ON campaign_reward_grants (campaign_version_id, reward_definition_id, status);

CREATE INDEX IF NOT EXISTS campaign_reward_grants_user_created_idx
  ON campaign_reward_grants (user_id, created_at DESC);

-- Match the V1 retention contract: deleting a user-owned participation may
-- cascade its grant rows, while a removed Economy row leaves reconciliation
-- metadata intact with a nullable economy link.
ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_participation_id_fkey;

ALTER TABLE campaign_reward_grants
  ADD CONSTRAINT campaign_reward_grants_participation_id_fkey
  FOREIGN KEY (participation_id)
  REFERENCES campaign_participations(id)
  ON DELETE CASCADE;

ALTER TABLE campaign_reward_grants
  DROP CONSTRAINT IF EXISTS campaign_reward_grants_economy_event_id_fkey;

ALTER TABLE campaign_reward_grants
  ADD CONSTRAINT campaign_reward_grants_economy_event_id_fkey
  FOREIGN KEY (economy_event_id)
  REFERENCES user_economy_events(id)
  ON DELETE SET NULL;
