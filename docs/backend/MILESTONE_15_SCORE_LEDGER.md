# Milestone 15 — XP / Score Event Ledger Foundation

Status: **IN PROGRESS — implementation complete, local verification pending**

This milestone establishes an append-only, idempotent XP ledger that future gamification and behavioral rewards can build on without treating a mutable `users.score` column as the source of truth.

## Product semantics

Current rules:

```text
account created       +1000 XP
email added           +1000 XP
```

Therefore:

```text
username-only signup                  -> 1000 XP
username-only signup + later email    -> 2000 XP
email signup                           -> 2000 XP
```

Existing accounts are backfilled to the same semantics when the migration runs.

## Schema

Migration:

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

## Existing-user backfill

`009_user_score_events.sql` creates deterministic ledger rows for current accounts:

```text
account_created:v1
profile_email_added:v1   (only when email already exists)
```

Backfill inserts use the same idempotency keys as runtime awarding and are rerunnable.

## Identity-event database guarantee

Migration:

```text
backend/sql/010_score_identity_triggers.sql
```

The `users_identity_score_events` trigger guarantees the two foundational identity-derived rewards at the database mutation boundary:

```text
users INSERT
  -> account_created
  -> profile_email_added when signup already contains email

users UPDATE email NULL -> non-NULL
  -> profile_email_added
```

The trigger and backend service both converge on the same ledger/idempotency keys. This gives identity milestones crash/retry safety without creating duplicate XP.

## Reusable backend score service

Module:

```text
backend/src/userScore.mjs
```

Main API:

```text
awardUserScoreEvent(...)
ensureUserScoreMilestones(user)
getUserScoreState(userId)
createUserScoreState(user)
```

Current named rules:

```text
USER_SCORE_RULES.ACCOUNT_CREATED
USER_SCORE_RULES.PROFILE_EMAIL_ADDED
```

Future product events should use `awardUserScoreEvent()` with event-specific idempotency keys.

Examples planned for later milestones:

```text
draft created        +50
draft changed/saved  +10
draft shared         +10
wizard completed     TBD
referral joined      TBD
streak               TBD
```

The values above are product candidates, not yet implemented in this milestone except the two identity rules.

## Auth read model

All primary Auth responses now include:

```json
{
  "score": {
    "totalXp": 2000,
    "eventCount": 2
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

## Frontend Auth state

`useAuth()` now exposes:

```text
score
totalXp
```

Profile Menu displays localized XP using the current locale's number formatting.

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
draft create XP
draft update/save XP
draft share XP
leaderboard / global rank
levels / badges / streaks
admin score adjustment UI
score history UI
score-rule management UI
```

## Verification required before DONE

The user must verify locally:

```text
1. migrations 009 and 010 apply successfully
2. existing username-only account shows 1000 XP
3. existing account with email shows 2000 XP
4. new username-only registration starts at 1000 XP
5. adding email through the existing Email Requirement Modal immediately changes XP to 2000
6. repeating profile-complete / refreshing / logging in does not add XP again
7. new email-based registration starts at 2000 XP
8. ledger rows show distinct account_created and profile_email_added events
9. Docker restart preserves XP
10. EN/FA Profile Menu formatting works
11. final pnpm generate succeeds
```

Do not mark Milestone 15 DONE until the user explicitly confirms local verification.
