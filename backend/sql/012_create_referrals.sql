CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_username_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referrals_referred_user_unique UNIQUE (referred_user_id),
  CONSTRAINT referrals_not_self CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_created_idx
  ON referrals (referrer_user_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION award_referral_score_events()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_score_events (
    id,
    user_id,
    event_type,
    points,
    source_type,
    source_id,
    idempotency_key,
    metadata,
    created_at
  )
  VALUES (
    NEW.id::text || ':joined:v1',
    NEW.referred_user_id,
    'referral_joined',
    500,
    'referral',
    NEW.id::text,
    'referral_joined:v1:' || NEW.id::text,
    jsonb_build_object(
      'ruleVersion', 1,
      'origin', 'referrals_trigger',
      'referrerUserId', NEW.referrer_user_id,
      'referralUsernameUsed', NEW.referral_username_used
    ),
    NEW.created_at
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  INSERT INTO user_score_events (
    id,
    user_id,
    event_type,
    points,
    source_type,
    source_id,
    idempotency_key,
    metadata,
    created_at
  )
  VALUES (
    NEW.id::text || ':reward:v1',
    NEW.referrer_user_id,
    'referral_reward',
    1000,
    'referral',
    NEW.id::text,
    'referral_reward:v1:' || NEW.id::text,
    jsonb_build_object(
      'ruleVersion', 1,
      'origin', 'referrals_trigger',
      'referredUserId', NEW.referred_user_id,
      'referralUsernameUsed', NEW.referral_username_used
    ),
    NEW.created_at
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_score_events ON referrals;

CREATE TRIGGER referrals_score_events
AFTER INSERT ON referrals
FOR EACH ROW
EXECUTE FUNCTION award_referral_score_events();
