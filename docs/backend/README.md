# Prompt Draft Backend

This directory is the source of truth for backend, Docker, authorization, Cloud, translation, History, progressive profile, XP/score, referrals, and Manage integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft keeps its static-generation frontend workflow while the backend runs separately and can later deploy independently.

## Current verified architecture

```text
static Nuxt frontend
  -> direct browser HTTP
  -> Docker API :4000
  -> Node HTTP server
  -> validation / auth / authorization
  -> PostgreSQL
  -> optional private backend services
  -> Docker named volumes
```

Important invariants:

```text
pnpm generate must keep working
browser CORS is part of the API contract
backend authorization is authoritative
local product state must not be destroyed by backend failure
new schema changes use numbered SQL files
important product events use explicit idempotency semantics
```

## Reusable development guides

General API work:

```text
docs/backend/API_GUIDE.md
```

Manage/admin workspace work:

```text
docs/backend/MANAGE_GUIDE.md
```

## Milestones 1–5 — COMPLETE: Backend / Wizard-run reference path

Established and verified:

```text
Docker networking
browser CORS
PostgreSQL persistence
named-volume durability
typed frontend contracts
Wizard-run persistence
cursor pagination
static-safe History routing
recoverable failure semantics
```

Reference flow:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> paginated History API
  -> /history
  -> /history?run=<uuid>
```

## Milestone 6 — COMPLETE: Auth Foundation + Cloud Draft Sync

Optional authentication and account-owned Cloud Drafts are verified.

```text
anonymous
  -> local Draft workflow remains available

logged in
  -> local-first Draft workflow
  -> account-owned Cloud save
  -> dirty-aware autosync
  -> Cloud collection/recovery
  -> same-account multi-device merge
```

Auth API:

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Cloud Draft API:

```text
PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
```

Passwords use Node `scrypt` with a random salt. Raw passwords are never stored. Browser sessions use random bearer tokens and PostgreSQL stores only their SHA-256 hashes.

## Milestone 7 — COMPLETE: Server-side Translation

Translation is a backend capability:

```text
static Nuxt TextField
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
```

API:

```text
GET /api/translate/status
POST /api/translate
```

The backend owns validation, dependency health, timeout/error behavior, and stable failure semantics. Variable tokens such as `{person}` are protected across translation.

## Milestone 8 — COMPLETE: Authorization / Roles Foundation

Persisted roles:

```text
user
admin
super_admin
```

Authorization is enforced at three layers:

```text
UI visibility
frontend route guard
backend permission guard (authoritative)
```

## Milestones 9–12 — COMPLETE: Manage Foundation

Canonical management workspace:

```text
/manage
/manage/dashboard
/manage/users
```

Verified foundation:

```text
permission-aware shell and section registry
users.view read model
server-side user search/filter/cursor pagination
users.manage mutations
self/super-admin mutation safety
admin_audit_log
Dashboard persisted-data metrics
Global Menu + Global Modal patterns
EN/FA localization
static generation
```

Manage is **CLOSED FOR NOW**. Future Manage work starts from `docs/backend/MANAGE_GUIDE.md` and the relevant Milestone 9–12 document.

## Milestone 13 — COMPLETE: History Workflow

Verified current behavior:

```text
History removed from global Header navigation
Drafts menu is the product entry to /history
History list/detail use the EL component system
History compiled prompt works in light/dark themes
Stored Snapshot remains persisted but is not exposed in the product UI
Edit in Create creates a new editable local Draft from snapshot.finalDraft
Wizard-run historical rows remain immutable
```

Detailed milestone:

```text
docs/backend/MILESTONE_13_HISTORY_WORKFLOW.md
```

## Milestone 14 — COMPLETE: Progressive User Profile Foundation

Accounts can progressively hold:

```text
username only
email only
username + email
```

API:

```text
POST /api/auth/profile/complete
```

Auth responses expose:

```text
profile.supportedFields
profile.completedFields
profile.missingFields
```

Reusable requirement layers:

```text
backend/src/profileRequirements.mjs
app/composables/useProfileRequirements.ts
app/composables/useEmailRequirement.ts
ProfileRequirementModal.vue
EmailRequirementModal.vue
```

The first verified feature gate requires email before Global Output Copy and resumes the original action after profile completion.

Detailed milestone:

```text
docs/backend/MILESTONE_14_PROGRESSIVE_USER_PROFILE.md
```

## Milestone 15 — COMPLETE: XP / Score Event Ledger Foundation

The authoritative score model is an append-only ledger:

```text
user_score_events
```

Implemented rewards:

```text
account created       -> +1000 XP exactly once
email added           -> +1000 XP exactly once
Cloud Draft created   ->   +50 XP exactly once per Draft
```

Key invariant:

```text
UNIQUE (user_id, idempotency_key)
```

The current total is derived from ledger events rather than a mutable `users.score` source of truth.

Frontend/Auth integration exposes current score and refreshes it authoritatively when needed. Missing pre-hydration score state does not render a false zero.

Product decision:

```text
Draft edit/save XP -> intentionally dropped
```

Routine edits/autosaves will not be rewarded. Future XP should correspond to clearer product achievements with stable idempotency semantics.

Detailed milestone:

```text
docs/backend/MILESTONE_15_SCORE_LEDGER.md
```

## Milestone 16 — IN PROGRESS: Referral Foundation

The current referral implementation uses an existing username as the referral input instead of introducing generated codes.

Registration accepts an optional:

```text
referralUsername
```

Persisted relationship:

```text
referrals
  referrer_user_id
  referred_user_id
  referral_username_used
```

The username is only the lookup/audit value. The durable relationship uses user UUIDs.

Current reward semantics:

```text
referred user -> +500 XP
referrer      -> +1000 XP
```

Integrity rules:

```text
one referrer per referred account
direct self-referral rejected
referrer must exist and be active
case-insensitive username resolution
invalid/unavailable referral aborts signup
user + referral relationship created atomically in one PostgreSQL write statement
referral insert produces both XP ledger events through a DB trigger
```

The `/login` registration step exposes the optional referral field after Repeat Password and localizes it in EN/FA.

Milestone 16 remains **IN PROGRESS** until the user locally verifies the registration/reward/persistence behavior and final `pnpm generate`.

Detailed milestone:

```text
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
```

## Current SQL history

Development schema files run in lexical order:

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
012_create_referrals.sql
```

New development schema changes should use a new numbered file rather than rewriting applied history. A production-grade migration framework remains deferred.

## Current next-step queue

Milestone 16 is the active backend milestone. Do not start a later candidate until it is closed.

Deferred areas include:

```text
referral links / invite-list UI / anti-abuse eligibility rules
user_events analytics foundation
site/page-view/activity metrics
translation usage metrics
user consent records
phone/contact verification
email verification / password recovery / OAuth
additional meaningful XP events / leaderboard / levels / badges / streaks
account deletion / destructive account lifecycle
admin audit-log UI
/manage/system
/manage/content
stronger Cloud Draft conflict handling
production rate limiting
production migration framework
production deployment / secrets / domain / HTTPS
Redis
```

Do not start deferred work automatically. The user chooses the next feature after the current milestone is verified.

## Documentation workflow

```text
README.md
  -> current architecture and milestone overview

IMPLEMENTATION.md
  -> concrete implementation baseline and extension rules

STATUS.md
  -> verified current state and next-chat handoff

API_GUIDE.md
  -> reusable backend/API vertical-slice playbook

MANAGE_GUIDE.md
  -> reusable Manage/admin workspace playbook

MILESTONE_*.md
  -> detailed source-of-truth record for each completed/in-progress feature milestone
```

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms it. Code creation alone is not sufficient.

For a new chat, start with:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md` only if the next feature touches Manage/admin work
