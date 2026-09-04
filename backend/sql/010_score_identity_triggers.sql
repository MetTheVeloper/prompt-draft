CREATE OR REPLACE FUNCTION ensure_identity_score_events()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
      NEW.id::text || ':account_created:v1',
      NEW.id,
      'account_created',
      1000,
      'account',
      NEW.id::text,
      'account_created:v1',
      '{"ruleVersion":1,"origin":"users_trigger"}'::jsonb,
      NEW.created_at
    )
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;

    IF NEW.email IS NOT NULL THEN
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
        NEW.id::text || ':profile_email_added:v1',
        NEW.id,
        'profile_email_added',
        1000,
        'profile_field',
        'email',
        'profile_email_added:v1',
        '{"ruleVersion":1,"origin":"users_trigger"}'::jsonb,
        NEW.created_at
      )
      ON CONFLICT (user_id, idempotency_key) DO NOTHING;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.email IS NULL
     AND NEW.email IS NOT NULL THEN
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
      NEW.id::text || ':profile_email_added:v1',
      NEW.id,
      'profile_email_added',
      1000,
      'profile_field',
      'email',
      'profile_email_added:v1',
      '{"ruleVersion":1,"origin":"users_trigger"}'::jsonb,
      NOW()
    )
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_identity_score_events ON users;

CREATE TRIGGER users_identity_score_events
AFTER INSERT OR UPDATE OF email ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_identity_score_events();
