# Backend Implementation Baseline

## Architecture baseline

Milestones 1 through 16 are complete and locally verified.

Milestone 17 — Prompt Archive Platform — is selected and planned, but implementation has not started.

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
012_create_referrals.sql
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

The verified role/permission baseline now also includes `collage.view` for admins, while super-admin retains `*`.

# Completed Manage implementation — Milestones 9–12

Canonical routes before the selected Archive extension:

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

Future Manage work starts from `docs/backend/MANAGE_GUIDE.md` and extends the existing shell rather than recreating it.

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
referrals
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

The same reusable email gate now protects the Prompt Archive product surface: `/prompts` remains navigable, but archive content requires an authenticated account with email. Missing access uses the `promptArchive` requirement source and a persistent blocked state.

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

## Current verified rewards

```text
account_created       +1000 XP
profile_email_added   +1000 XP
draft_created           +50 XP
referral_joined         +500 XP
referral_reward        +1000 XP
```

Draft creation is one reward per user/Draft regardless of autosave, retry, or multi-device repetition. Referral rewards are bound to the persisted referral UUID.

Relevant modules/migrations:

```text
backend/sql/009_user_score_events.sql
backend/sql/010_score_identity_triggers.sql
backend/sql/011_score_cloud_draft_creation.sql
backend/sql/012_create_referrals.sql
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

# Milestone 16 — Referral Foundation

Status:

```text
complete
locally verified
final pnpm generate verified
```

## Referral identity model

No generated referral code exists in the current design.

The user's existing username is the referral input used during registration:

```text
referralUsername = existing username
```

The persisted relationship never depends on the username after creation:

```text
referrals.referrer_user_id -> users.id
referrals.referred_user_id -> users.id
```

`referral_username_used` preserves the normalized username entered during signup as audit/provenance data.

## Referral relation invariants

Migration:

```text
backend/sql/012_create_referrals.sql
```

Core constraints:

```text
UNIQUE (referred_user_id)
CHECK (referrer_user_id <> referred_user_id)
foreign keys to users(id)
```

Product rules enforced by the registration backend:

```text
referral is optional
referral can only be attached during account creation
username lookup is case-insensitive
referrer must exist
referrer must be active
direct username self-referral is rejected
invalid or unavailable referral aborts account creation
```

One referrer can have many referred users; one referred account can have at most one referrer.

## Referral-aware registration contract

Existing endpoint:

```text
POST /api/auth/register
```

Optional input:

```text
referralUsername
```

Stable referral errors:

```text
REFERRAL_USERNAME_INVALID
REFERRAL_USERNAME_NOT_FOUND
REFERRAL_SELF_REFERENCE
```

When referral is present, account and referral creation use one PostgreSQL data-modifying CTE:

```text
eligible_referrer
  -> inserted_user
  -> inserted_referral
```

The referrer is rechecked for active status inside the write statement. A failed referral write cannot leave the requested account created by that statement without its referral relation.

Session creation remains the existing Auth post-registration step and is outside this referral relation statement.

## Referral XP events

A database trigger on `referrals` creates both ledger events as part of the successful referral insert:

```text
referred user
  referral_joined  +500 XP

referrer
  referral_reward  +1000 XP
```

Both use:

```text
source_type = referral
source_id   = referral UUID
```

Per-user idempotency keys bind the reward to the referral UUID.

Verified signup totals:

```text
username-only + referral -> 1500 XP
email signup + referral  -> 2500 XP
```

Do not create a second mutable referral score field. The existing `user_score_events` ledger remains authoritative.

## Frontend registration contract

`app/pages/login.vue` shows the optional referral username field only in the account-creation step, directly after Repeat Password.

`useAuth().register()` accepts:

```ts
register(identifier, password, {
  referralUsername,
})
```

Referral validation errors are mapped to localized EN/FA registration copy.

## Referral read model

Referral count is authoritative from the persisted relation:

```text
referrals.referredCount
  = COUNT(referrals WHERE referrer_user_id = current user)
```

Primary Auth responses expose this count. `useAuth()` keeps it in dedicated referral state, and Profile Menu renders the localized `Invited users / کاربران دعوت‌شده` row.

Opening Profile Menu refreshes `/api/auth/me`, so the visible referral count is refreshed from backend state rather than maintained as a client-side counter.

## Explicitly deferred referral work

Do not fold these into Milestone 16 automatically:

```text
random/generated referral codes
referral links / URL prefill
referral list/profile UI
leaderboard or referral ranking
admin referral tooling
phone/email verification eligibility
multi-account/device anti-abuse
reward maturity delays / clawbacks
campaign-specific referral policies
```

These can extend the persisted referral foundation later.

# Verified Prompt/Collage access + error baseline

The frontend immediately preceding Milestone 17 has been locally verified with successful static generation:

```text
/prompts route/link remains available to anonymous users
archive content requires login + email
missing access opens Email Requirement modal with from = promptArchive
closing requirement keeps the user on /prompts with blocked CTA
blocked state includes Prompt Draft on Telegram action
/collage uses collage.view permission and is admin/super-admin only under current mapping
dedicated 403/404 EL-system error page with Home + Telegram actions
```

# Milestone 17 — Prompt Archive Platform

Status:

```text
selected
planned
not started
```

Detailed source of truth:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

## Current Archive source baseline

Current runtime source:

```text
public/data/prompts.json
```

Current local images:

```text
public/prompts/<telegram-message-id>/...
```

Current runtime loader:

```text
app/composables/usePromptArchive.ts
```

Current title model:

```text
item.titleKey -> t(item.titleKey)
```

Current list behavior loads the whole JSON payload and filters/sorts in the browser.

## Milestone 17 target boundary

The target architecture is:

```text
PostgreSQL Archive source of truth
  -> server list/detail API
  -> server-first /prompts repository
  -> normalized DTO
  -> local JSON/images fallback on recoverable backend failure
```

Fallback is for network/timeout/5xx/unusable response conditions, not for 401/403.

The local JSON becomes a snapshot/export fallback, not the long-term manually-edited primary catalog.

## Archive localization rule

Dynamic Archive titles live with Archive content:

```text
title.en
title.fa
```

Do not make new managed Archive rows depend on source-code i18n keys.

Existing `prompts.items.<id>.title` keys are migration input only. The import utility resolves current EN/FA values and creates normalized localized records.

## Archive tags rule

Build a canonical tag catalog from the DISTINCT union of all current JSON `tags[]` values.

Target durable model:

```text
prompt_archive_tags
prompt_archive_item_tags
```

`/manage/archive` uses the existing `el-multi-select` for canonical tag selection. Avoid uncontrolled spelling/casing variants.

## Archive image-preparation rule

Reuse the existing browser canvas converter core, but extract low-level processing away from `ImageBatchConverter.vue` into a reusable utility/service.

Current reusable primitives include:

```text
createImageBitmap decode + HTMLImageElement fallback
Canvas 2D render
canvas.toBlob()
WebP quality export
object URL lifecycle
multi-file drag/drop patterns
```

Archive-specific accepted input is intentionally limited to:

```text
jpg/jpeg
png
webp
```

Archive image manager UX:

```text
file picker
multiple files
drag/drop
clipboard paste
preview
remove
reorder
```

Per image, prepare locally before cloud upload exists:

```text
full WebP
  quality = 0.6 mandatory
  aspect ratio preserved
  no upscaling
  bounded/resized for archive delivery

thumbnail WebP
  smaller dimensions
  aspect ratio preserved
  no upscaling
```

Suggested dimensions to evaluate with real Archive images:

```text
full max edge 2048px
thumbnail max edge 640px
```

These dimensions are not yet verified product constants. The full WebP quality of 0.6 is explicit scope.

The prepared client object should expose full/thumbnail Blobs plus dimensions/size/preview state so a later storage adapter can upload them without redesigning Manage.

## Manage Archive rule

Milestone 17 explicitly reopens the existing Manage workspace for:

```text
/manage/archive
```

Follow `MANAGE_GUIDE.md`.

Recommended permissions:

```text
archive.view
archive.manage
```

Initial role mapping may grant both to admin and super_admin.

Use the existing `MANAGE_SECTIONS` registry, authorization middleware, typed API boundary, EN/FA Manage copy and `admin_audit_log` mutation pattern.

Initial content form includes:

```text
Telegram message id
English title
Persian title
publishedAt
prompt
preview model
optimizedFor
tags via el-multi-select
optional source title/caption
images via Archive image manager
status = draft | published | archived
```

Prefer explicit Publish over automatically exposing partially-complete rows.

## Cloud media rule

Object Storage/CDN integration follows local image preparation and DB/read/manage verification.

Credentials must remain backend-only.

At cloud-storage implementation time, verify the current ArvanCloud Object Storage API and choose provider-appropriate direct/presigned versus backend-proxied upload. Keep provider-specific code behind a storage adapter rather than inside Archive UI.

Existing `public/prompts` media remains available for fallback until the fallback strategy is deliberately changed later.

## Implementation phase order

```text
17A data/schema/import parity
17B server read APIs + local fallback repository
17C /manage/archive + local image preparation
17D Object Storage/CDN
17E snapshot export + closure
```

Do not jump directly to 17D.

# Static-generation contract

Nuxt remains:

```text
ssr: false
Nitro preset: static
```

New backend features must preserve static frontend generation unless the architecture is deliberately changed in a separate decision.

`pnpm generate` remains a release invariant.

The future `/manage/archive` static route must be added to prerender coverage as required by the existing Manage static route contract.

# Current platform resource boundaries

Keep product concepts separate:

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

referrals
  -> referrer_user_id -> referred_user_id relationship

prompt_archive_*
  -> channel Prompt Archive content, tags and media metadata
```

Recommended future resources should remain separate rather than becoming arbitrary nullable columns or generic JSON on `users`:

```text
user_events
  -> trustworthy behavioral analytics/event persistence

user_consents
  -> marketing / analytics / model-training purpose records

contacts / verification
  -> phone and verified contact semantics
```

# Current next action

Start Milestone 17 Phase 17A in a new chat.

Before code changes, read:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

Then inspect the current JSON/i18n/archive UI, converter core, `el-multi-select`, Manage registry and backend admin patterns. Confirm import/schema semantics first; cloud storage is not the starting phase.
