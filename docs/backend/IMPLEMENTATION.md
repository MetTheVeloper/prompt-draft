# Backend Implementation Baseline

## Architecture baseline

Milestones 1 through 13 are complete and locally verified. Milestone 14 is implemented and awaiting local verification.

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

Current backend mapping:

```text
user
  -> []

admin
  -> dashboard.view
  -> system.metrics.view
  -> users.view

super_admin
  -> *
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

The user locally verified the History workflow and final `pnpm generate`.

# Milestone 14 — Progressive User Profile Foundation

Status:

```text
implementation present
local verification pending
```

## Identity invariant

Before Milestone 14, `users` required exactly one identity:

```text
username XOR email
```

Migration `008_progressive_user_profile.sql` changes this to:

```text
username OR email must exist
```

Valid states are now:

```text
username only
email only
username + email
```

`users.updated_at` is now a first-class timestamp for account/profile mutation.

Existing case-insensitive unique indexes remain in place:

```text
LOWER(username) WHERE username IS NOT NULL
LOWER(email) WHERE email IS NOT NULL
```

## Auth read model

`AuthUser` now includes:

```text
id
username
email
role
status
createdAt
updatedAt
```

Auth session/read responses also include:

```text
profile.supportedFields
profile.completedFields
profile.missingFields
```

Current supported progressive fields:

```text
username
email
```

Backend derivation lives in:

```text
backend/src/profileRequirements.mjs
```

That module also owns reusable missing-field and `PROFILE_REQUIREMENT` payload helpers for future feature gates.

## Progressive completion endpoint

API:

```text
POST /api/auth/profile/complete
requires bearer auth
```

This is deliberately an explicit completion command rather than a generic account-settings PATCH.

Semantics:

```text
fills only fields that are currently missing
existing saved identity values are not renamed/replaced
same already-saved value is an idempotent no-op
username/email normalization matches auth registration/login
unique conflicts are enforced before write and again by DB unique indexes
```

Stable errors:

```text
400 PROFILE_VALIDATION
409 PROFILE_FIELD_TAKEN
409 PROFILE_FIELD_LOCKED
401 Authentication required
```

Successful response returns:

```text
user
profile
permissions
```

and the frontend replaces its in-memory Auth state immediately.

## Frontend requirement contract

`useAuth()` exposes:

```text
profile
missingProfileFields
hasProfileField(field)
completeProfile(input)
```

Reusable product gating lives in:

```text
app/composables/useProfileRequirements.ts
```

Main methods:

```text
getMissingProfileFields(fields)
isProfileSatisfied(fields)
requireProfileFields(fields, options)
completeMissingIdentity(options)
```

Future feature example:

```text
requireProfileFields(["email"], {
  onCompleted: continueFeature,
})
```

If the requirement is already satisfied, the continuation can run immediately. Otherwise a shared Global Modal requests only the missing field(s).

## Progressive completion UI

Reusable component:

```text
app/components/auth/ProfileRequirementModal.vue
```

The first real entry point is the Profile Menu:

```text
missing username/email
  -> Complete profile button visible
  -> Global Modal
  -> authoritative completion API
  -> Auth state refresh
  -> completion button disappears after all current fields exist
```

The UI is localized in both EN and FA.

## Deliberate non-goals for Milestone 14

Do not add these into the same milestone:

```text
phone/contact persistence
email/phone verification
identity rename/change account settings
marketing/analytics/model-training consent
XP/score ledger
leaderboard/ranking
referral graph/codes
behavioral event tracking
```

Those should extend the foundation as separate product resources and vertical slices.

# Static-generation contract

Nuxt remains:

```text
ssr: false
Nitro preset: static
```

The progressive-profile feature adds no new route and must preserve existing prerender behavior.

`pnpm generate` remains a release invariant.

# Verification for Milestone 14

Required before DONE:

```text
username-only existing account still signs in
email-only account still signs in
Profile Menu exposes Complete profile only when needed
username-only account can add unique email
email-only account can add unique username
Auth/Profile Menu refresh immediately after completion
completed account can sign in through either identifier
invalid value rejected
unique collision rejected
existing identity replacement rejected
EN/FA UI verified
container/backend restart retains profile completion
pnpm generate succeeds
```

Do not mark Milestone 14 DONE from code creation alone.

# How to extend the user-data platform next

The progressive identity foundation is intentionally narrow.

Recommended later resource boundaries:

```text
contacts / verification
  -> phone and verified contact semantics

user_consents
  -> marketing / analytics / model-training purpose records

user_score_events
  -> append-only XP ledger, not users.score as the source of truth

referrals
  -> referrer_user_id -> referred_user_id relationships

user_events
  -> trustworthy behavioral analytics/event persistence
```

Do not collapse these future concerns into arbitrary nullable columns or an unvalidated generic JSON blob on `users`.
