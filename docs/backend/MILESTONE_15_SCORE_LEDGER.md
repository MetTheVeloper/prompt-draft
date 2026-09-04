# Milestone 15 — XP / Score Event Ledger Foundation

Status: **IN PROGRESS — implementation extended, local verification pending**

This milestone establishes an append-only, idempotent XP ledger that future gamification and behavioral rewards can build on without treating a mutable `users.score` column as the source of truth.

## Product semantics

Current implemented rules:

```text
account created       +1000 XP
email added           +1000 XP
Cloud Draft created      +50 XP
```

Therefore:

```text
username-only signup                  -> 1000 XP
username-only signup + later email    -> 2000 XP
email signup                           -> 2000 XP
first Cloud save of a new Draft       -> +50 XP once for that Draft
later saves of the same Draft         -> +0 creation XP
```

Existing accounts and existing Cloud Drafts are backfilled to the same semantics when the migrations run.

## Schema

Base ledger migration:

```text
backend/sql/009_user_score_events.sql
```

Primary ledger:

```text
user_score_events
  id
  user_id
  event_type
  points
  source_type
  source_id
  idempotency_key
  metadata
  created_at
```

Key invariant:

```text
UNIQUE (user_id, idempotency_key)
```

A retry, race, repeated API call, or duplicated event producer cannot award the same logical event twice when it uses the same idempotency key.

`points` intentionally supports both positive and negative non-zero integers so future corrections or penalties do not require a schema redesign.

## Existing-user and Draft backfill

`009_user_score_events.sql` creates deterministic ledger rows for current accounts:

```text
account_created:v1
profile_email_added:v1   (only when email already exists)
```

`011_score_cloud_draft_creation.sql` creates one deterministic creation reward for every Cloud Draft already present when the migration runs:

```text
draft_created:v1:<draftId>
```

All backfill inserts use the same idempotency keys as runtime awarding and are rerunnable.

## Identity-event database guarantee

Migration:

```text
backend/sql/010_score_identity_triggers.sql
```

Database triggers guarantee the two foundational identity-derived rewards at the `users` mutation boundary:

```text
users INSERT
  -> account_created

users UPDATE email NULL -> non-NULL
  -> profile_email_added
```

Email-based registration is also healed immediately by the backend score service, which sees the email on the newly created user and ensures the same idempotent `profile_email_added:v1` event.

The database triggers and backend service converge on the same ledger/idempotency keys. This gives identity milestones crash/retry safety without creating duplicate XP.

## Reusable backend score service

Module:

```text
backend/src/userScore.mjs
```

Main API:

```text
awardUserScoreEvent(...)
ensureUserScoreMilestones(user)
awardCloudDraftCreatedScore(userId, draftId)
getUserScoreState(userId)
createUserScoreState(user)
```

Current named rules:

```text
USER_SCORE_RULES.ACCOUNT_CREATED
USER_SCORE_RULES.PROFILE_EMAIL_ADDED
USER_SCORE_RULES.DRAFT_CREATED
```

Draft creation uses:

```text
event_type      = draft_created
points          = 50
source_type     = prompt_draft
source_id       = <draftId>
idempotency_key = draft_created:v1:<draftId>
```

The Cloud Draft save path attempts this award after every successful server save. Because the idempotency key is stable per user/Draft, only the first logical creation can add the 50 XP. Later autosaves, retries, and multi-device saves converge to the same event.

Gamification failure does not fail the primary Draft save. A later save or Auth refresh can retry/heal the idempotent score event.

Future product events should use `awardUserScoreEvent()` with event-specific idempotency keys.

Planned examples:

```text
draft changed/saved  +10
draft shared         +10
wizard completed     TBD
referral joined      TBD
streak               TBD
```

## Auth read model

All primary Auth responses include:

```json
{
  "score": {
    "totalXp": 2050,
    "eventCount": 3
  }
}
```

Covered responses:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/profile/complete
```

Before returning the read model, the backend idempotently ensures the baseline account/email milestones. This provides a self-healing path if an earlier runtime award was interrupted.

Cloud Draft `PUT /api/drafts/:id` also returns the refreshed `score` state when score processing succeeds.

## Frontend Auth state

`useAuth()` exposes:

```text
score
totalXp
refreshAuthorizationState()
applyScoreState(score)
```

Cloud Draft saves feed returned score state back into `useAuth()` through the typed API boundary, so a newly awarded +50 can update the in-memory profile score without logout/reload.

Profile Menu also performs a lightweight `/api/auth/me` refresh when opened. This prevents stale or pre-rollout Auth state from presenting a false `0 XP`, and also picks up score changes made from another device/session.

## Why there is no `users.score` source of truth

The current XP total is derived from:

```sql
SUM(user_score_events.points)
```

This preserves:

```text
why the score changed
when it changed
which product event caused it
idempotency history
future negative corrections
future leaderboard/audit possibilities
```

A cached/read-model total may be added later if leaderboard scale requires it, but the ledger remains authoritative.

## Explicitly out of scope

Not yet implemented:

```text
draft update/save XP
draft share XP
leaderboard / global rank
levels / badges / streaks
admin score adjustment UI
score history UI
score-rule management UI
```

## Verification required before DONE

Already locally observed during this milestone:

```text
identity ledger rows are persisted correctly
account_created is +1000
profile_email_added is +1000
email completion moves the tested account to 2000 XP
repeated Auth reads did not create duplicate identity rows
```

Still verify after the latest hardening/extension:

```text
1. migration 011 applies successfully
2. username-only account displays 1000 XP immediately when Profile Menu opens
3. existing Cloud Drafts receive exactly one +50 draft_created backfill each
4. creating/syncing one new Cloud Draft adds exactly +50 XP
5. saving/editing that same Draft again does not add another +50
6. retry/refresh/login does not duplicate draft_created
7. creating a second distinct Cloud Draft adds another +50
8. ledger source_type/source_id/idempotency_key identify the Draft correctly
9. Docker restart preserves XP
10. EN/FA Profile Menu formatting works
11. final pnpm generate succeeds
```

Do not mark Milestone 15 DONE until the user explicitly confirms local verification.
