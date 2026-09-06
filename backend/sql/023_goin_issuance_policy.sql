-- Milestone 21E — Goin Issuance V1
--
-- Founder-approved V1 supply policy:
--   account_created       -> 10 goin
--   profile_email_added   -> 10 goin
--   referral_joined       -> 10 goin
--   referral_reward       -> 20 goin
--   draft_created         -> 0 goin (XP-only for now)
--
-- Important rerun invariant:
-- historical backfill below uses the frozen V1 literals rather than the
-- mutable economy_settings values. Reapplying schema after an operator changes
-- future issuance therefore cannot retroactively reprice historical rewards.

INSERT INTO economy_settings (setting_key, integer_value)
VALUES
  ('goin_issuance_rule_version', 1),
  ('goin_issue_account_created', 10),
  ('goin_issue_profile_email_added', 10),
  ('goin_issue_referral_joined', 10),
  ('goin_issue_referral_reward', 20),
  ('goin_issue_draft_created', 0)
ON CONFLICT (setting_key) DO NOTHING;

-- Deterministically backfill only reward types that issue goin in V1.
-- draft_created intentionally remains XP-only and therefore creates no row.
INSERT INTO user_economy_events (
  id,
  user_id,
  event_type,
  unit_delta,
  source_type,
  source_id,
  source_score_event_id,
  idempotency_key,
  metadata,
  created_at
)
SELECT
  md5(score.id || ':goin_issuance:v1')::uuid,
  score.user_id,
  'score_reward_issued',
  CASE score.event_type
    WHEN 'account_created' THEN 10
    WHEN 'profile_email_added' THEN 10
    WHEN 'referral_joined' THEN 10
    WHEN 'referral_reward' THEN 20
  END::bigint,
  'score_event',
  score.id,
  score.id,
  'score_event:goin:v1:' || score.id,
  jsonb_build_object(
    'ruleVersion', 1,
    'policyKey', CASE score.event_type
      WHEN 'account_created' THEN 'goin_issue_account_created'
      WHEN 'profile_email_added' THEN 'goin_issue_profile_email_added'
      WHEN 'referral_joined' THEN 'goin_issue_referral_joined'
      WHEN 'referral_reward' THEN 'goin_issue_referral_reward'
    END,
    'scoreEventType', score.event_type,
    'scorePoints', score.points,
    'origin', 'migration_023_backfill',
    'backfill', true
  ),
  score.created_at
FROM user_score_events AS score
WHERE score.event_type IN (
  'account_created',
  'profile_email_added',
  'referral_joined',
  'referral_reward'
)
ON CONFLICT (user_id, idempotency_key) DO NOTHING;

CREATE OR REPLACE FUNCTION issue_goin_for_score_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  issuance_setting_key TEXT;
  issuance_amount BIGINT;
  issuance_rule_version BIGINT;
BEGIN
  issuance_setting_key := CASE NEW.event_type
    WHEN 'account_created' THEN 'goin_issue_account_created'
    WHEN 'profile_email_added' THEN 'goin_issue_profile_email_added'
    WHEN 'referral_joined' THEN 'goin_issue_referral_joined'
    WHEN 'referral_reward' THEN 'goin_issue_referral_reward'
    WHEN 'draft_created' THEN 'goin_issue_draft_created'
    ELSE NULL
  END;

  IF issuance_setting_key IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT integer_value
  INTO issuance_amount
  FROM economy_settings
  WHERE setting_key = issuance_setting_key
  LIMIT 1;

  IF COALESCE(issuance_amount, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT integer_value
  INTO issuance_rule_version
  FROM economy_settings
  WHERE setting_key = 'goin_issuance_rule_version'
  LIMIT 1;

  -- Serialize all economy mutations for one user on the same canonical row
  -- used by backend debit operations.
  PERFORM id
  FROM users
  WHERE id = NEW.user_id
  FOR UPDATE;

  INSERT INTO user_economy_events (
    id,
    user_id,
    event_type,
    unit_delta,
    source_type,
    source_id,
    source_score_event_id,
    idempotency_key,
    metadata,
    created_at
  )
  VALUES (
    md5(NEW.id || ':goin_issuance:v1')::uuid,
    NEW.user_id,
    'score_reward_issued',
    issuance_amount,
    'score_event',
    NEW.id,
    NEW.id,
    'score_event:goin:v1:' || NEW.id,
    jsonb_build_object(
      'ruleVersion', COALESCE(issuance_rule_version, 1),
      'policyKey', issuance_setting_key,
      'scoreEventType', NEW.event_type,
      'scorePoints', NEW.points,
      'origin', 'score_event_trigger',
      'backfill', false
    ),
    NEW.created_at
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_score_events_goin_issuance ON user_score_events;

CREATE TRIGGER user_score_events_goin_issuance
AFTER INSERT ON user_score_events
FOR EACH ROW
EXECUTE FUNCTION issue_goin_for_score_event();
