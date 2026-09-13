-- Expiring / Promotional Goin V1
--
-- Extends the existing append-only user_economy_events ledger without creating
-- a second wallet or mutable balance column.
--
-- Positive credit events may optionally expire. Debits consume active expiring
-- credits first (FEFO) through append-only allocation rows; any remainder is
-- implicitly funded by the permanent Goin pool. Historical credits remain
-- permanent because expires_at defaults to NULL.

ALTER TABLE user_economy_events
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_economy_events_expiry_credit_only_check'
  ) THEN
    ALTER TABLE user_economy_events
      ADD CONSTRAINT user_economy_events_expiry_credit_only_check
      CHECK (
        expires_at IS NULL
        OR (
          unit_delta > 0
          AND expires_at > created_at
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_economy_events_user_expiry_idx
  ON user_economy_events (user_id, expires_at, created_at, id)
  WHERE expires_at IS NOT NULL AND unit_delta > 0;

CREATE TABLE IF NOT EXISTS user_economy_expiring_credit_allocations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  debit_event_id UUID NOT NULL REFERENCES user_economy_events(id) ON DELETE CASCADE,
  credit_event_id UUID NOT NULL REFERENCES user_economy_events(id) ON DELETE CASCADE,
  unit_amount BIGINT NOT NULL CHECK (unit_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (debit_event_id, credit_event_id),
  CHECK (debit_event_id <> credit_event_id)
);

CREATE INDEX IF NOT EXISTS user_economy_expiring_allocations_credit_idx
  ON user_economy_expiring_credit_allocations (credit_event_id);

CREATE INDEX IF NOT EXISTS user_economy_expiring_allocations_user_created_idx
  ON user_economy_expiring_credit_allocations (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION validate_user_economy_expiring_allocation()
RETURNS trigger AS $$
DECLARE
  debit_row RECORD;
  credit_row RECORD;
  debit_allocated BIGINT;
  credit_allocated BIGINT;
BEGIN
  -- Serialize allocation mutations on the same canonical per-user lock used by
  -- Economy credit/debit operations. This keeps the DB invariant safe even if
  -- a future caller inserts allocations outside the current service helper.
  PERFORM id
  FROM users
  WHERE id = NEW.user_id
  FOR UPDATE;

  SELECT user_id, unit_delta, created_at
  INTO debit_row
  FROM user_economy_events
  WHERE id = NEW.debit_event_id
  FOR UPDATE;

  IF debit_row IS NULL THEN
    RAISE EXCEPTION 'economy debit event does not exist';
  END IF;

  SELECT user_id, unit_delta, expires_at, created_at
  INTO credit_row
  FROM user_economy_events
  WHERE id = NEW.credit_event_id
  FOR UPDATE;

  IF credit_row IS NULL THEN
    RAISE EXCEPTION 'economy credit event does not exist';
  END IF;

  IF debit_row.user_id <> NEW.user_id OR credit_row.user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'economy allocation events must belong to the same user';
  END IF;

  IF debit_row.unit_delta >= 0 THEN
    RAISE EXCEPTION 'economy allocation debit_event_id must reference a debit';
  END IF;

  IF credit_row.unit_delta <= 0 OR credit_row.expires_at IS NULL THEN
    RAISE EXCEPTION 'economy allocation credit_event_id must reference an expiring credit';
  END IF;

  IF credit_row.expires_at <= debit_row.created_at THEN
    RAISE EXCEPTION 'expired Goin cannot fund a debit';
  END IF;

  SELECT COALESCE(SUM(unit_amount), 0)::bigint
  INTO debit_allocated
  FROM user_economy_expiring_credit_allocations
  WHERE debit_event_id = NEW.debit_event_id;

  IF debit_allocated + NEW.unit_amount > ABS(debit_row.unit_delta) THEN
    RAISE EXCEPTION 'economy debit allocation exceeds debit amount';
  END IF;

  SELECT COALESCE(SUM(unit_amount), 0)::bigint
  INTO credit_allocated
  FROM user_economy_expiring_credit_allocations
  WHERE credit_event_id = NEW.credit_event_id;

  IF credit_allocated + NEW.unit_amount > credit_row.unit_delta THEN
    RAISE EXCEPTION 'economy credit allocation exceeds credit amount';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_economy_expiring_allocation_validate
  ON user_economy_expiring_credit_allocations;

CREATE TRIGGER user_economy_expiring_allocation_validate
BEFORE INSERT ON user_economy_expiring_credit_allocations
FOR EACH ROW
EXECUTE FUNCTION validate_user_economy_expiring_allocation();

CREATE OR REPLACE FUNCTION reject_user_economy_expiring_allocation_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'economy expiring credit allocations are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_economy_expiring_allocation_immutable_update
  ON user_economy_expiring_credit_allocations;
CREATE TRIGGER user_economy_expiring_allocation_immutable_update
BEFORE UPDATE ON user_economy_expiring_credit_allocations
FOR EACH ROW
EXECUTE FUNCTION reject_user_economy_expiring_allocation_mutation();

-- Deliberately do not reject DELETE at DB level. The table is append-only through
-- service code, but its foreign keys use ON DELETE CASCADE so account deletion
-- can still follow the existing users -> economy ledger deletion contract.

-- Dynamic read model for operator/global balance reads. Expired unconsumed Goin
-- becomes unavailable at its deadline even if no background settlement job ran.
CREATE OR REPLACE VIEW user_economy_balance_state AS
WITH allocation_totals AS (
  SELECT
    credit_event_id,
    COALESCE(SUM(unit_amount), 0)::bigint AS allocated
  FROM user_economy_expiring_credit_allocations
  GROUP BY credit_event_id
),
ledger AS (
  SELECT
    user_id,
    COALESCE(SUM(unit_delta), 0)::bigint AS raw_balance,
    COALESCE(SUM(unit_delta) FILTER (WHERE unit_delta > 0), 0)::bigint AS lifetime_issued,
    COALESCE(-SUM(unit_delta) FILTER (WHERE unit_delta < 0), 0)::bigint AS lifetime_spent,
    COUNT(*)::bigint AS transaction_count
  FROM user_economy_events
  GROUP BY user_id
),
expiring AS (
  SELECT
    event.user_id,
    event.expires_at,
    GREATEST(
      event.unit_delta - COALESCE(allocation_totals.allocated, 0),
      0
    )::bigint AS remaining
  FROM user_economy_events AS event
  LEFT JOIN allocation_totals
    ON allocation_totals.credit_event_id = event.id
  WHERE event.unit_delta > 0
    AND event.expires_at IS NOT NULL
),
expiry_by_user AS (
  SELECT
    user_id,
    COALESCE(SUM(remaining) FILTER (WHERE expires_at > NOW()), 0)::bigint AS expiring_balance,
    COALESCE(SUM(remaining) FILTER (WHERE expires_at <= NOW()), 0)::bigint AS lifetime_expired,
    MIN(expires_at) FILTER (
      WHERE expires_at > NOW()
        AND remaining > 0
    ) AS next_expiry_at
  FROM expiring
  GROUP BY user_id
)
SELECT
  ledger.user_id,
  (
    ledger.raw_balance - COALESCE(expiry_by_user.lifetime_expired, 0)
  )::bigint AS balance,
  (
    ledger.raw_balance
    - COALESCE(expiry_by_user.lifetime_expired, 0)
    - COALESCE(expiry_by_user.expiring_balance, 0)
  )::bigint AS permanent_balance,
  COALESCE(expiry_by_user.expiring_balance, 0)::bigint AS expiring_balance,
  ledger.lifetime_issued,
  ledger.lifetime_spent,
  COALESCE(expiry_by_user.lifetime_expired, 0)::bigint AS lifetime_expired,
  ledger.transaction_count,
  expiry_by_user.next_expiry_at
FROM ledger
LEFT JOIN expiry_by_user USING (user_id);
