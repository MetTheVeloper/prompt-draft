# Backend Implementation Baseline

## Architecture baseline

Milestones 1 through 15 are complete and locally verified.

Current platform path:

```text
static Nuxt frontend
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> validation / auth / authorization
  -> PostgreSQL and private backend services
  -> Docker named volumes
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable conventions:

```text
docs/backend/API_GUIDE.md
  -> general API/backend vertical slices

docs/backend/MANAGE_GUIDE.md
  -> permission-aware Manage/admin features
```

## Schema workflow

The development schema runner discovers files matching:

```text
backend/sql/NNN_*.sql
```

and applies them in lexical order.

Current schema files:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_create_auth.sql
004_scope_prompt_drafts_to_users.sql
005_add_user_roles.sql
006_add_admin_user_indexes.sql
007_add_user_status_and_admin_audit.sql
008_progressive_user_profile.sql
009_user_score_events.sql
010_score_identity_triggers.sql
011_score_cloud_draft_creation.sql
```

New development schema changes use new numbered files rather than rewriting applied history. A production migration framework remains deferred.

# Completed platform references

## Milestones 1–5 — Docker/PostgreSQL + Wizard runs

Verified reference path:

```text
real Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> cursor-paginated summary API
  -> full detail API
  -> typed frontend boundary
```

This established Docker networking, CORS, validation, named-volume persistence, typed API contracts, keyset pagination, static-safe routing, and recoverable failure behavior.

## Milestone 6 — Auth + account-owned Cloud Drafts

Authentication remains optional.

```text
anonymous
  -> local Draft workflow

logged in
  -> local Draft workflow
  -> account-owned Cloud Save
  -> dirty-aware autosync
  -> Cloud recovery/merge
```

Security baseline:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random bearer token
DB session storage   -> SHA-256 token hash only
session lifetime     -> 30 days
```

Cloud Drafts remain local-first and use stable client-owned draft IDs.

## Milestone 7 — Server-side Translation

```text
static Nuxt TextField
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
```

The backend owns validation, dependency health, timeout/error semantics, and translation status. Variable tokens are protected/restored around translation.

## Milestone 8 — Authorization / Roles

Persisted roles:

```text
user
admin
super_admin
```

Frontend permission helpers come from the server-resolved permission payload and shared constants.

Three-layer enforcement remains mandatory for privileged features:

```text
1. conditional UI
2. frontend route authorization
3. backend permission guard
```

# Completed Manage implementation — Milestones 9–12

Canonical routes:

```text
/manage
/manage/dashboard
/manage/users
```

The verified Manage implementation includes:

```text
permission-aware shell and section registry
users.view read APIs
server-side username/email search
role filter + cursor pagination
users.manage explicit mutation endpoints
self/super-admin safety rules
admin_audit_log
Dashboard persisted-data summary
Global Menu / Global Modal interaction patterns
EN/FA Manage localization
static-generation coverage
```

Manage remains closed for now. Future Manage work starts from `docs/backend/MANAGE_GUIDE.md`.

# Milestone 13 — History workflow

Current History product path:

```text
Drafts menu
  -> /history
  -> paginated Wizard-run summaries
  -> /history?run=<id>
```

The list/detail UI uses the EL component system.

Historical Wizard rows remain immutable. `Edit in Create` reads `snapshot.finalDraft`, creates a new local `PromptDraftRecord` with a new draft id, makes that draft active, and navigates to `/create`.

The stored Wizard snapshot remains backend data but is no longer exposed as a raw product UI block.

# Milestone 14 — Progressive User Profile Foundation

## Identity invariant

Valid user identity states are:

```text
username only
email only
username + email
```

At least one identity must exist.

Case-insensitive unique indexes remain authoritative for username/email uniqueness.

## Auth read model

Auth session/read responses include:

```text
user
profile.supportedFields
profile.completedFields
profile.missingFields
permissions
score
```

Current progressive fields:

```text
username
email
```

Backend profile derivation and requirement helpers live in:

```text
backend/src/profileRequirements.mjs
```

## Progressive completion endpoint

API:

```text
POST /api/auth/profile/complete
requires bearer auth
```

Semantics:

```text
fills only currently-missing fields
existing identity values are not renamed/replaced
same already-saved value is an idempotent no-op
normalization matches auth registration/login
unique conflicts remain DB-authoritative
```

## Frontend requirement contract

Reusable product gating lives in:

```text
app/composables/useProfileRequirements.ts
app/composables/useEmailRequirement.ts
```

The verified first real gate is Global Output Copy requiring email. The shared completion flow resumes the requested feature after profile completion.

# Milestone 15 — XP / Score Event Ledger Foundation

## Ledger model

Score is authoritative in:

```text
user_score_events
```

Current total:

```sql
SUM(user_score_events.points)
```

Do not introduce a mutable `users.score` field as the authoritative source of truth.

Ledger invariant:

```text
UNIQUE (user_id, idempotency_key)
```

Every future reward producer must define a stable logical event and deterministic idempotency key.

## Current rewards

```text
account_created       +1000 XP
profile_email_added   +1000 XP
draft_created           +50 XP
```

Draft creation is one reward per user/Draft regardless of autosave, retry, or multi-device repetition.

Relevant modules/migrations:

```text
backend/sql/009_user_score_events.sql
backend/sql/010_score_identity_triggers.sql
backend/sql/011_score_cloud_draft_creation.sql
backend/src/userScore.mjs
```

## Auth/frontend score contract

Primary Auth responses expose:

```text
score.totalXp
score.eventCount
```

`useAuth()` exposes current score state and helpers to refresh/apply authoritative score updates.

Cloud Draft save may return refreshed score after awarding first-create XP.

Profile Menu refreshes `/api/auth/me` when opened so stale sessions/device state do not leave the visible score outdated. Unknown pre-hydration score state must not be rendered as a false zero.

## Product decision: no routine save XP

Do not reward routine Draft edits/autosaves.

The previously-considered rule:

```text
draft changed/saved -> +10 XP
```

was explicitly dropped after Milestone 15 verification.

Future XP triggers should correspond to meaningful achievements or product milestones and must have clear anti-farming/idempotency semantics.

# Static-generation contract

Nuxt remains:

```text
ssr: false
Nitro preset: static
```

New backend features must preserve static frontend generation unless the architecture is deliberately changed in a separate decision.

`pnpm generate` remains a release invariant.

# How to extend the platform next

Current reusable resource boundaries are intentionally separated:

```text
users / auth / profile
  -> identity and access

prompt_drafts
  -> account-owned Cloud Draft state

wizard_runs
  -> historical Wizard execution records

admin_audit_log
  -> privileged mutation audit trail

user_score_events
  -> append-only XP ledger
```

Recommended future resources should remain separate rather than becoming arbitrary nullable columns or generic JSON on `users`:

```text
referrals
  -> referrer_user_id -> referred_user_id relationships + referral codes

user_events
  -> trustworthy behavioral analytics/event persistence

user_consents
  -> marketing / analytics / model-training purpose records

contacts / verification
  -> phone and verified contact semantics
```

## Recommended next milestone candidate

The current recommended next vertical slice is:

```text
Milestone 16 — Referral Foundation
```

Suggested narrow scope:

```text
persisted referral code ownership
resolve a referral code to a user
persist one referrer -> referred-user relationship per new account
prevent self-referral
prevent duplicate/re-parented referral relationships
preserve account creation when referral processing fails safely where appropriate
define future referral XP as a separate idempotent score event, not necessarily in the first slice
```

This direction reuses the completed Auth and XP foundations and provides a more meaningful future reward trigger than routine Draft activity.

Alternative next directions remain:

```text
Analytics foundation
Consent foundation
Account deletion/lifecycle
Production hardening
Contacts/verification
```

Do not start a deferred resource automatically. Confirm the product direction with the user first.
