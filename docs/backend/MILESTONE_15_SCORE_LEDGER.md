# Milestone 15 — XP / Score Event Ledger Foundation

Status: **DONE — locally verified and explicitly accepted by the user on 2026-09-04**

This milestone establishes an append-only, idempotent XP ledger that future gamification and behavioral rewards can build on without treating a mutable `users.score` column as the source of truth.

## Product semantics

Implemented rules:

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

`011_score_cloud_draft_creation.sql` creates one deterministic creation reward for every Cloud Draft already present when the migration runs.

The Draft id remains visible as `source_id`. The idempotency key uses a bounded deterministic MD5 digest of the Draft id so even the maximum supported Draft id length cannot violate the ledger's idempotency-key length constraint:

```text
source_id       = <draftId>
idempotency_key = draft_created:v1:<md5(draftId)>
```

All backfill inserts use the same idempotency-key algorithm as runtime awarding and are rerunnable.

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
idempotency_key = draft_created:v1:<md5(draftId)>
```

The Cloud Draft save path attempts this award after every successful server save. Because the idempotency key is stable per user/Draft, only the first logical creation can add the 50 XP. Later autosaves, retries, and multi-device saves converge to the same event.

Gamification failure does not fail the primary Draft save. A later save of the same Draft retries the idempotent award. Auth/Profile refresh reloads the current persisted score read model once events exist.

Future product rewards should use `awardUserScoreEvent()` with event-specific idempotency keys and should be attached to meaningful product milestones rather than routine autosave activity.

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

Before returning the read model, the backend idempotently ensures the baseline account/email milestones. This provides a self-healing path if an earlier identity award was interrupted.

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

Profile Menu performs a lightweight `/api/auth/me` refresh when opened. Missing score state is represented as unknown rather than a false zero, so pre-rollout/stale state displays `—` until the authoritative read completes. The refresh also picks up score changes made from another device/session.

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

## Product decision: no Draft edit/save XP

The previously-considered reward:

```text
draft changed/saved -> +10 XP
```

is intentionally dropped. Routine edits/autosaves are not a meaningful enough milestone and would create unnecessary farming pressure and score inflation.

Future XP should instead reward clearer achievements or product milestones. Draft share XP is not part of this milestone and is not scheduled as the immediate follow-up.

## Explicitly out of scope / deferred

```text
additional XP triggers
leaderboard / global rank
levels / badges / streaks
referrals and referral rewards
admin score adjustment UI
score history UI
score-rule management UI
behavioral analytics/event persistence
```

## Verification / completion record

Locally observed and accepted:

```text
identity ledger rows persist correctly
account_created is +1000
profile_email_added is +1000
email completion updates the account score correctly
no duplicate identity rewards appear on repeated reads/actions
username-only score presentation no longer depends on adding email
Cloud Draft creation awards +50
repeated edits/saves of the same Draft do not duplicate creation XP
score behavior is working end-to-end in the local Docker-backed environment
```

On 2026-09-04 the user explicitly confirmed the behavior is working and requested Milestone 15 be marked complete.

## Result

Milestone 15 is **DONE**.

The XP ledger is now a reusable platform primitive. New rewards should be introduced only when there is a product-worthy event with a clear, stable idempotency definition.
