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
SELECT
  gen_random_uuid(),
  prompt_drafts.user_id,
  'draft_created',
  50,
  'prompt_draft',
  prompt_drafts.draft_id,
  'draft_created:v1:' || md5(prompt_drafts.draft_id),
  jsonb_build_object('origin', 'migration_backfill'),
  prompt_drafts.created_at
FROM prompt_drafts
ON CONFLICT (user_id, idempotency_key) DO NOTHING;
