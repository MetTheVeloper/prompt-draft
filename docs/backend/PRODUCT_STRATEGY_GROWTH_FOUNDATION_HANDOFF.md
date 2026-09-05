# Prompt Draft — Product Strategy / Growth Foundation Capability Handoff

Last audited: 2026-09-06

Branch: `feature/docker-local-api`

Audited branch tip before this documentation commit:

```text
d93cd40adac66c95d3a7b3d33270b14521f1650f
Fold create UI consolidation into docker branch
```

Final implementation milestone checkpoint recorded by the Docker/backend milestone program:

```text
4c67b045abead7e2eb3d7cdc29865859a86ecf6b
Milestones 1–20 complete / locally verified
```

This document is the strategy-branch handoff and capability inventory for the product state at the end of `feature/docker-local-api`, including the later Create/Manage UI consolidation folded into this branch.

Its purpose is to prevent Product Strategy, Growth Foundation, Commercialization, Creator, Marketplace, Referral and Credit/Economy work from rediscovering or rebuilding systems that already exist.

## Evidence and interpretation rules

This document was written from the current branch code and canonical backend documentation, not from product brainstorming.

Status vocabulary used here:

- **COMPLETE** — implemented and documented as locally verified.
- **FOUNDATION** — real persisted/reusable infrastructure exists, but the larger product concept is not complete.
- **NOT PRESENT** — no implementation was found in the audited branch and it must not be treated as an existing feature.
- **DEFERRED** — explicitly left for later work by an existing milestone.

Important terminology:

> The current XP/score system is an append-only reward ledger. It is **not yet a spendable credit wallet or commercial balance system**.

Likewise:

> Prompt Archive promotion is a real admin-curation flow, but it is **not yet a marketplace listing, sale, creator payout, or ownership-transfer system**.

---

# 1. Baseline exact project state

## Branch and completion status

Current branch:

```text
feature/docker-local-api
```

Verified milestone state:

```text
Milestones 1–16: COMPLETE / locally verified
Milestone 17 — Prompt Archive Platform: COMPLETE / locally verified
Milestone 18 — User Avatar Foundation: COMPLETE / locally verified
Milestone 19 — Public User Profiles + Cover Media: COMPLETE / locally verified
Milestone 20 — Profile Showcase, Draft Media & Archive Promotion: COMPLETE / locally verified
  Phase 20A — Profile UX + username profile alias: COMPLETE
  Phase 20B — Draft preview media + workflow + soft delete: COMPLETE
  Phase 20C — Archive promotion + moderation: COMPLETE
```

No Milestone 21 is selected by this branch.

The branch was also documentation-audited and the Create/Manage UI consolidation was subsequently folded into it. The consolidation adds list projections and UI wiring; it does not replace the Milestone 20 backend architecture.

## Final migration

Current SQL history ends at:

```text
019_archive_user_draft_promotion.sql
```

Applied migration history must not be rewritten. The next schema change must be:

```text
020_*.sql
```

## Build / generate state

Static generation remains a release invariant:

```text
pnpm generate
```

The final Milestone 20 acceptance included a successful `pnpm generate`.

Root generation script:

```text
nuxt generate && tsx scripts/generate-offline-manifest.ts
```

Known accepted non-blocking warnings at closure:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Local verification state

The Docker milestone program marks work `DONE` only after local behavior verification by the user.

Final verified closure included, among other earlier milestone tests:

```text
Auth/session behavior
Cloud Draft persistence/sync
roles/permissions and Manage access
XP ledger and referral rewards
Prompt Archive import/read/manage/media
Arvan object storage behavior
public profile privacy
avatar/cover persistence
Draft preview media
Draft soft delete / anti-resurrection
Archive promotion
moderation soft delete
admin audit events
Archive snapshot parity
pnpm generate
```

Final Archive snapshot proof recorded by the branch:

```text
PARITY_OK
publishedItemCount = 102
snapshotItemCount = 102
mismatchCount = 0
schemaVersion = 3
```

## Docker/local architecture

Current runtime architecture:

```text
static-generated Nuxt frontend
  -> browser HTTP/CORS
  -> independent Node API :4000
  -> validation / authentication / authorization
  -> PostgreSQL
  -> backend-only integrations
  -> Arvan/S3-compatible Object Storage for managed media
```

`compose.yaml` defines:

### `api`

```text
build: ./backend
port: 4000
DB: db:5432
translator: http://translator:5000
CORS: local frontend on :3030
Arvan/S3 configuration from environment variables
archive snapshot source/output mounts
```

### `db`

```text
postgres:17-alpine
named volume: prompt_draft_pgdata
```

### `translator`

```text
libretranslate/libretranslate:v1.9.6
en/fa only
5000-character limit
healthcheck
named model volume: prompt_draft_translation_models
```

The frontend does not depend on Nuxt server API routes for these product capabilities. Direct browser calls use the public API base and CORS.

## Main backend paths

```text
backend/src/index.mjs                 # Node HTTP entry point
backend/src/auth.mjs                  # Auth/session/profile completion routing
backend/src/authorization.mjs         # roles + permission resolver
backend/src/cloudDrafts.mjs           # account-owned Cloud Draft API
backend/src/draftMedia.mjs            # Draft preview media
backend/src/userProfile.mjs           # public-safe profile + Draft summaries
backend/src/userAvatar.mjs            # avatar API/storage
backend/src/userCover.mjs             # cover API/storage
backend/src/userScore.mjs             # XP ledger service
backend/src/referrals.mjs             # referral read model
backend/src/archive.mjs               # public Archive reads
backend/src/adminArchive*.mjs         # Manage Archive + media
backend/src/archivePromotion.mjs      # Draft -> Archive promotion/moderation
backend/src/adminUsers.mjs            # admin user management
backend/src/adminDashboard.mjs        # operational dashboard metrics
backend/src/archiveStorage.mjs        # shared S3-compatible storage adapter
backend/src/database.mjs              # DB boundary / projections
backend/src/create-schema.mjs         # numbered SQL application
backend/sql/                          # migration history
```

## Main frontend paths relevant to future strategy work

```text
app/pages/create.vue
app/components/create/DraftCloudSyncButton.vue
app/pages/user.vue
app/pages/manage.vue
app/pages/manage/dashboard.vue
app/pages/manage/users.vue
app/pages/manage/archive.vue
app/config/manage.ts
app/composables/useAuth.ts
app/composables/usePromptDraftApi.ts
app/composables/useUserProfileApi.ts
app/composables/useProfileRequirements.ts
app/components/el/avatar.vue
```

The project also has shared Global Menu and Global Modal systems. Future product surfaces should extend those rather than creating isolated menu/modal stacks.

---

# 2. User / Account System

Status: **COMPLETE as an account/auth foundation; verification and account lifecycle expansion remain incomplete.**

## Signup and login

Implemented endpoints:

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/profile/complete
```

Identity input supports:

```text
username
email
```

Persisted account identity may be:

```text
username only
email only
username + email
```

At least one identity must exist.

Username normalization:

```text
lowercase
3–64 characters
[a-z0-9._-]
```

Email is normalized to lowercase and validated at the API boundary.

## Password security

Implemented:

```text
Node scrypt
random 16-byte salt
raw password never stored
```

## Session model

Implemented:

```text
random 32-byte bearer token returned to client
SHA-256 hash of token stored in auth_sessions
30-day session TTL
expired sessions rejected
suspended accounts rejected by session lookup
```

A suspended account cannot authenticate through an otherwise valid stored session because the backend joins the session to a user whose `status` must be `active`.

## Progressive identity/profile completion

Migration:

```text
008_progressive_user_profile.sql
```

Reusable backend profile state reports:

```text
supportedFields
completedFields
missingFields
```

Current supported progressive fields are only:

```text
username
email
```

`POST /api/auth/profile/complete` may fill a missing username/email. It does **not** act as a general account-settings mutation endpoint.

Rules:

```text
existing non-empty identity cannot be changed by this endpoint
re-submitting same value may be a no-op
unique collision -> 409 PROFILE_FIELD_TAKEN
attempt to replace existing identity -> 409 PROFILE_FIELD_LOCKED
```

Reusable frontend gates already exist for missing profile fields, including an email requirement flow used by Global Output Copy.

That email requirement is a UX/product gate, not a security boundary for already-rendered prompt text.

## Avatar

Status: **COMPLETE**.

Endpoints:

```text
GET    /api/profile/avatar
POST   /api/profile/avatar
DELETE /api/profile/avatar
```

Input preparation contract:

```text
JPEG/PNG/WebP source
center crop
exact 400x400 WebP
quality 0.60
```

Backend validates actual WebP structure/dimensions.

Storage:

```text
avatars/<USER_UUID>/<IMMUTABLE_AVATAR_UUID>.webp
```

Fallback order in reusable `el-avatar`:

```text
image -> initials -> person icon
```

## Cover

Status: **COMPLETE**.

Endpoints:

```text
GET    /api/profile/cover
POST   /api/profile/cover
DELETE /api/profile/cover
```

Preparation:

```text
full: max edge 2048, WebP 0.60, no upscale
thumbnail: max edge 640, WebP 0.72, no upscale
source aspect ratio preserved
```

Storage:

```text
covers/<USER_UUID>/<IMMUTABLE_COVER_UUID>/full.webp
covers/<USER_UUID>/<IMMUTABLE_COVER_UUID>/thumb.webp
```

Replacement uploads new immutable objects, persists the new DB state, then best-effort cleans old objects. Removal clears authoritative DB state and best-effort cleans storage.

## Public profile metadata currently available

Public-safe profile data includes:

```text
id
username | null
avatarUrl | null
cover | null
createdAt
totalXp
publicDraftCount
```

Owner can additionally receive owner-only summary information such as total active Draft count.

## Account roles

Persisted roles:

```text
user
admin
super_admin
```

See the authorization section below for exact mapping.

## Account states

Implemented status values used by current management/auth behavior:

```text
active
suspended
```

Suspension revokes current sessions and blocks future use of stored sessions until account status is restored.

## Verification status

**NOT PRESENT:**

```text
email verification
phone number storage
phone verification
KYC/identity verification
verified-creator badge system
```

An email may exist on the account, but that must not be interpreted as a verified email address.

## Ownership rules

Implemented:

- Cloud Drafts are scoped to `user_id`.
- Private Cloud Draft API reads/writes are owner-only.
- Public profile reads use a separate public-safe projection and do not weaken private Draft ownership.
- Avatar/cover self-service endpoints operate on the authenticated user.
- Public Draft publication mutation includes both authenticated user ID and Draft ID.

## User deletion

**NOT PRESENT as a current product flow:** no self-service account deletion endpoint was found in the audited API/docs.

Therefore do not design retention or marketplace ownership semantics on an assumed account-deletion behavior. If account deletion is introduced later, its cascade/retention policy must be designed explicitly around Draft tombstones, Archive provenance, XP events, referrals, media and audit history.

---

# 3. Roles & Authorization

Status: **COMPLETE reusable authorization foundation.**

Authoritative module:

```text
backend/src/authorization.mjs
```

## Roles

```text
user
admin
super_admin
```

## Permission vocabulary currently defined

```text
dashboard.view
system.metrics.view
users.view
users.manage
drafts.view_all
drafts.delete_any
system.settings.manage
collage.view
archive.view
archive.manage
```

## Current role mapping

### `user`

```text
no privileged Manage permissions
```

### `admin`

Actual backend mapping:

```text
dashboard.view
system.metrics.view
users.view
collage.view
archive.view
archive.manage
```

Important consequence: `admin` can view users and manage Archive, but the current role mapping does **not** grant `users.manage` or `drafts.delete_any`.

### `super_admin`

```text
*
```

Wildcard satisfies all permissions.

## Backend enforcement

The backend helper resolves permissions from persisted role and `hasPermission()` is used by privileged routes.

Security rule for future features:

```text
1. UI visibility/disabled state
2. frontend route middleware
3. backend permission guard — authoritative security boundary
```

Only layer 3 is a real security boundary.

## Current admin implications

```text
Admin:
  dashboard/metrics access
  user list/detail read access
  Archive read/manage
  public Draft -> Archive promotion

Super Admin:
  all Admin capabilities
  user-management mutations via users.manage
  arbitrary Draft moderation delete via drafts.delete_any
  every other currently defined permission through wildcard
```

## UI-only vs backend-enforced distinction

Backend-enforced examples:

```text
Cloud Draft ownership
Draft visibility mutation ownership
public/private profile filtering
Manage user read/mutation permissions
Archive view/manage permissions
Draft moderation permission
promotion permission
last-super-admin safety rules
suspended-account authentication rejection
```

UX/product-only gate example:

```text
email requirement before copying already-rendered Global Output
```

Do not mistake a hidden button, disabled control, route middleware, or email modal for authoritative authorization unless the backend resource independently enforces it.

---

# 4. Admin / Management System

Status: **COMPLETE core Manage workspace with Users, Dashboard and Archive; no generic commercial back office yet.**

Canonical routes:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Manage section registry:

```text
app/config/manage.ts
```

Shared patterns:

```text
permission-filtered section registry
manage-entry middleware
authorization middleware
typed API clients
Global Menu
Global Modal
EN/FA localization
static generation compatibility
```

## 4.1 User management

### Read endpoints

```text
GET /api/admin/users
GET /api/admin/users/:id
```

Permission:

```text
users.view
```

List capabilities:

```text
server-side username/email search
role filter
cursor/keyset pagination
manual refresh
purpose-built summary projection
```

Current row/detail projections include account identity, avatar, role/status, active session count, Draft counts and richer admin information. The consolidation pass also added avatar display and expanded detail projection.

### Mutation endpoints

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Permission:

```text
users.manage
```

Because current `admin` mapping does not include `users.manage`, these mutations are effectively Super-Admin-only unless role mapping changes later.

Backend safety rules:

```text
self-mutation blocked
non-super-admin cannot manage super-admin
non-super-admin cannot promote to super_admin
last active super_admin cannot be downgraded
last active super_admin cannot be suspended
```

Audit events are written for privileged user mutations.

### Important retention behavior of Reset Cloud Data

`reset-cloud-data` is **not** the normal Draft soft-delete path. It currently hard-deletes the target user's `prompt_drafts` rows and records the count in `admin_audit_log`.

This distinction matters for future retention/compliance design.

## 4.2 Dashboard / operational metrics

Endpoint:

```text
GET /api/admin/dashboard/summary
```

Permission:

```text
system.metrics.view
```

Current metrics:

```text
Total users
Active accounts
Suspended accounts
New users today
Active sessions
Cloud drafts
Drafts updated today
Admin actions today
```

These are operational aggregates over persisted platform state, not a product analytics warehouse.

## 4.3 Prompt Archive management

Read permission:

```text
archive.view
```

Mutation permission:

```text
archive.manage
```

Core endpoints:

```text
GET  /api/admin/archive
POST /api/admin/archive
GET  /api/admin/archive/:archiveItemUuid
PUT  /api/admin/archive/:archiveItemUuid
GET  /api/admin/archive/tags
POST /api/admin/archive/:archiveItemUuid/draft
POST /api/admin/archive/:archiveItemUuid/publish
POST /api/admin/archive/:archiveItemUuid/archive
GET  /api/admin/archive/public/:publicId
GET  /api/admin/archive/telegram/:telegramMessageId   # compatibility lookup
```

Archive media family, all requiring `archive.manage`:

```text
/api/admin/archive/:archiveItemUuid/images
/api/admin/archive/:archiveItemUuid/images/order
/api/admin/archive/:archiveItemUuid/images/:imageUuid
```

Supported capabilities:

```text
server-side search
status/model filters
cursor pagination
create/edit managed content
EN/FA titles
canonical tags
Draft/Published/Archived states
prepared full + thumbnail WebP media
media add/delete/reorder
explicit publish
stable public ID lookup
admin audit events
```

The consolidation pass added a small preview thumbnail to Archive list rows through the list projection, avoiding one detail request per row.

Known limitation: this is Prompt Archive content management, not a generic product catalog, pricing, purchase, payout, or merchant system.

## 4.4 Moderation

Implemented moderation capability:

```text
drafts.delete_any
```

Endpoint:

```text
DELETE /api/admin/archive/source-draft/:userId/:draftId
```

Current role behavior:

```text
super_admin -> allowed through wildcard
admin       -> not allowed by current mapping
```

Moderation reuses the Draft tombstone rather than hard-deleting the source Draft.

Audit event:

```text
draft.moderation_delete
```

## 4.5 Promotion

Implemented curated promotion:

```text
public user Draft -> new Prompt Archive item in Draft state
```

Permission:

```text
archive.manage
```

Endpoints:

```text
GET  /api/admin/archive/source-draft/:userId/:draftId
GET  /api/admin/archive/source-draft/:userId/:draftId/images/:imageId
POST /api/admin/archive/promote-draft
```

Duplicate source promotion is rejected through persisted provenance uniqueness.

Audit event:

```text
archive.promote_user_draft
```

Promotion is never automatic publication.

## 4.6 Media management

Existing backend-managed media domains:

```text
Archive full/thumbnail images
User avatars
User covers
Cloud Draft preview images
```

All use the existing S3-compatible/Arvan storage substrate and backend-only credentials.

## 4.7 Credits / XP management

**NOT PRESENT:** there is no admin XP adjustment endpoint/UI and no credit back-office screen.

The underlying score ledger supports signed non-zero point events, so an audited admin adjustment can be added later without replacing the ledger.

## 4.8 Referral administration

**NOT PRESENT:** no admin referral dashboard, campaign manager, invite list, abuse-review queue, maturity/clawback UI, or referral-rule editor exists.

## 4.9 Audit/history

`admin_audit_log` is a real persisted audit primitive for privileged changes.

It is not a complete product activity stream. Do not use it as a substitute for future analytics/event tracking.

---

# 5. Credit / Points / Economy Foundation

Status: **FOUNDATION — strong XP ledger exists; spendable Credit Economy does not yet exist.**

This is one of the most important reuse points for the commercialization branch.

## Authoritative score storage

There is no mutable `users.score` balance source of truth.

Authoritative table:

```text
user_score_events
```

Fields:

```text
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

Current total XP is derived as:

```sql
SUM(user_score_events.points)
```

## Idempotency

Key invariant:

```text
UNIQUE (user_id, idempotency_key)
```

The same logical event cannot award twice when all producers use the same deterministic key.

This is already used for identity rewards, Draft creation and referral rewards.

## Current reward events

### Account creation

```text
event_type: account_created
reward: +1000 XP
```

### Email added

```text
event_type: profile_email_added
reward: +1000 XP
```

### First Cloud Draft creation/save

```text
event_type: draft_created
reward: +50 XP once per logical Draft
source_type: prompt_draft
source_id: draftId
```

Repeated autosaves/edits of the same Draft do not repeat the reward.

### Referral — referred user

```text
event_type: referral_joined
reward: +500 XP
source_type: referral
```

### Referral — referrer

```text
event_type: referral_reward
reward: +1000 XP
source_type: referral
```

## Explicitly not rewarded today

```text
routine Draft edits/saves
Draft visibility toggle
Draft Share action
Archive promotion
copy/download
views
Wizard completion
```

The previously considered `+10 XP` on Draft edit/save was explicitly dropped because it would encourage farming and score inflation.

## Signup examples

```text
username-only signup                 -> 1000 XP
username-only + later email          -> 2000 XP
email signup                         -> 2000 XP
username signup with valid referral  -> 1500 XP
email signup with valid referral     -> 2500 XP
referrer per accepted referral       -> +1000 XP
new Cloud Draft first server save    -> +50 XP
```

## Duplicate prevention / self-healing

Identity rewards are protected by both DB-trigger behavior and backend service calls converging on the same idempotency keys.

Draft creation reward is attempted after successful Draft persistence. Gamification failure does not fail the primary Draft save; later saves/auth refresh can retry the same idempotent award.

Referral reward events are created from the persisted referral relationship and are transactionally tied to the referral insert behavior.

## Backend service to reuse

```text
backend/src/userScore.mjs
```

Reusable methods include:

```text
awardUserScoreEvent(...)
ensureUserScoreMilestones(user)
awardCloudDraftCreatedScore(userId, draftId)
getUserScoreState(userId)
createUserScoreState(user)
```

Current named rules include:

```text
ACCOUNT_CREATED
PROFILE_EMAIL_ADDED
DRAFT_CREATED
```

Future Growth/Credit work should extend `awardUserScoreEvent()` with explicit event semantics and deterministic idempotency keys instead of creating another ledger.

## Negative points

The ledger schema intentionally supports positive and negative non-zero integer `points`.

However:

- no current producer performs commercial debits/spending;
- no wallet balance guard prevents the derived XP total from going below zero;
- no reservation/hold/refund concept exists;
- no money/credit exchange rate exists.

Therefore negative-capable ledger rows are a **schema capability**, not a finished debit economy.

## Admin adjustment

**NOT PRESENT:** no admin score adjustment endpoint or UI.

## Transaction history UI/API

The transaction history exists in PostgreSQL as ledger rows, but **no user-facing score-history API/UI is currently part of the product contract**.

## What can be reused for a future Credit Economy

Already solved:

```text
append-only event model
per-user ledger relationship
event type/reason
signed amount field
source type/source id provenance
metadata payload
created timestamp
idempotency key
duplicate prevention
read-model total calculation
backend award helper
Auth score projection
retry-safe event production
```

Still required before calling it a Credit Economy:

```text
semantic decision: XP vs spendable credits vs separate currencies
debit/spend rules
non-negative or overdraft policy
purchase/reservation/refund semantics
admin adjustment API + audit
user transaction-history API/UI
fraud/abuse policies
commercial pricing/exchange rules
possibly cached balance/read model at scale
```

Do not create a parallel `credits` counter merely because the product starts charging for actions. First decide whether spendable credits extend `user_score_events` or require a deliberately separate currency ledger with a clear relationship to XP.

---

# 6. Referral / Invite Foundation

Status: **COMPLETE simple persisted referral flow; FOUNDATION for growth campaigns/anti-abuse.**

Migration:

```text
012_create_referrals.sql
```

Table:

```text
referrals
  id
  referrer_user_id
  referred_user_id
  referral_username_used
  created_at
```

Key constraints:

```text
referrer_user_id -> users.id
referred_user_id -> users.id
UNIQUE (referred_user_id)
CHECK (referrer_user_id <> referred_user_id)
```

A referred account has at most one referrer. A referrer may refer many users.

## Referral identifier

The existing username is the referral code/input.

There is **no separate generated referral-code system**.

## Flow

Referral is registration-only:

```text
POST /api/auth/register
  optional referralUsername
  -> normalize with username rules
  -> case-insensitive lookup
  -> require active referrer
  -> reject direct self-reference
  -> atomically create user + referral relationship
  -> DB trigger writes both XP events
```

The relationship is stored by UUID. `referral_username_used` is an audit snapshot only, so later username changes would not break the relationship.

## Reward integration

```text
referred user: +500 XP
referrer:      +1000 XP
```

The XP events have deterministic referral-based idempotency keys.

## Current referral read model

`backend/src/referrals.mjs` exposes the referred-user count for the current user.

Auth payload includes:

```text
referrals.referredCount
```

Profile Menu displays this authoritative count.

## Current validation/error contract

Stable errors include:

```text
REFERRAL_USERNAME_INVALID
REFERRAL_USERNAME_NOT_FOUND
REFERRAL_SELF_REFERENCE
```

Invalid requested referral does not silently disappear; registration is rejected.

## Current anti-abuse

Implemented:

```text
active referrer required
case-insensitive canonical lookup
one referrer per account
direct self-referral blocked
invalid/nonexistent referrer rejected
relation and rewards persisted atomically
idempotent score events
```

Not implemented:

```text
multi-account/device abuse detection
IP/device fingerprint rules
email/phone verification eligibility
reward maturity window
reward clawbacks
campaign caps
fraud scoring
```

## Explicitly deferred referral features

```text
random/generated referral codes
referral links and URL prefill
referral-code display surface
invitee list UI
referral dashboard/ranking
admin referral tooling
campaign-specific reward rules
reward maturity/clawback
advanced anti-abuse
```

Strategy implication: extend the existing UUID relationship and XP ledger. Do not create a second invite relationship table unless a new concept is genuinely different from referral attribution.

---

# 7. Draft System

Status: **COMPLETE Cloud Draft/local-first foundation with media, public visibility and soft deletion.**

## Local-first model

The Create editor has a browser-local Draft collection. Cloud persistence is an authenticated extension of that working state.

The current Create synchronization layer uses:

```text
localStorage collection
stable Draft IDs
content fingerprints
sync-entry metadata
dirty/syncing/synced/error states
server restore/merge
manual and background sync through the same write path
```

Autosync interval in the current Create sync component is 120 seconds, while fingerprint checks avoid unnecessary unchanged writes.

## Anonymous / incognito behavior

Anonymous users can work with local browser state.

There is **no anonymous server-owned Cloud Draft identity**. Cloud list/restore/save operations require authentication.

Consequences:

- different browser profiles/incognito sessions do not share localStorage by themselves;
- account login is the bridge to server-backed cross-session/device Cloud Draft state;
- local work should remain usable if a cloud operation fails.

## Cloud Draft ownership

`prompt_drafts` is scoped to `user_id`.

Private Cloud Draft endpoints operate on the authenticated user's rows. A client cannot use the private Draft API to retrieve another user's full editor snapshot.

## Stable ID and write semantics

Draft ID is client-owned/stable and supports idempotent upsert:

```text
PUT /api/drafts/:id
```

This is deliberately different from server-created append-only history resources.

## Snapshot

Current Draft snapshot version:

```text
version = 1
```

Persisted editor state includes:

```text
selectedModuleKeys
moduleValues
modulePanelStates
promptSettings
outputFormat: modular | natural | json
```

## Main Draft endpoints

```text
GET    /api/drafts
GET    /api/drafts/:id
PUT    /api/drafts/:id
DELETE /api/drafts/:id
POST   /api/drafts/:id/visibility
```

List uses cursor pagination.

## Revision / synchronization

Server Draft records expose revision/server update metadata. The client keeps sync entries and fingerprints and merges server/local Draft state during restore.

The architecture is local-first, not blind server-overwrite-first.

## Draft visibility

States:

```text
private
public
```

Default:

```text
private
```

Owner mutation:

```text
POST /api/drafts/:draftId/visibility
```

The SQL mutation includes both authenticated `user_id` and requested Draft ID.

First publication records `published_at`. Returning private does not erase the historical first-publication timestamp.

The final Create UI exposes Public/Private state directly and can change it with the shared switch/control flow.

## Draft preview media

Migration:

```text
017_cloud_draft_preview_media.sql
```

Relational table:

```text
prompt_draft_images
```

Contract:

```text
up to 8 images per Draft
JPEG/PNG/WebP source
WebP quality 0.60
preserve source pixel dimensions
no crop
no resize
position 0 = primary/card preview
```

Storage:

```text
draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

Owner endpoints:

```text
GET    /api/drafts/:draftId/images
POST   /api/drafts/:draftId/images
DELETE /api/drafts/:draftId/images/:imageId
POST   /api/drafts/:draftId/images/:imageId/primary
```

The central Preview Manager supports multi-image add, arbitrary primary selection and delete confirmation.

## Soft delete

Migration:

```text
018_soft_delete_prompt_drafts.sql
```

Tombstone:

```text
deleted_at IS NULL     -> active
deleted_at IS NOT NULL -> deleted
```

Normal Draft reads, profile reads, counts and cloud restore exclude tombstones.

A stale client cannot resurrect a tombstoned Draft through normal PUT; backend returns:

```text
409 DRAFT_DELETED
```

## Restore

**NOT PRESENT:** no Draft-restore/undelete endpoint is part of the current product contract.

## Hard deletion

Normal owner delete is soft.

Important exception:

```text
POST /api/admin/users/:id/reset-cloud-data
```

currently hard-deletes target-user `prompt_drafts` rows. This is an administrative reset path, not normal product deletion.

## Sharing

There is a client-facing Share action in the Draft/Create action vocabulary.

**NOT PRESENT as backend resource:** no persisted share-link/share-token entity, share counter, public share page, share attribution record or Share XP reward was found in this branch.

Do not equate “public Draft” with a dedicated share-link system.

## Profile showcase

`/user` uses lightweight Draft summaries. Owner receives all active own summaries; visitor receives only active public summaries.

Cards can include preview images and expose owner workflows through the shared action menu.

## Promotion into Archive

A public active user Draft can be promoted by an authorized Archive manager.

Promotion creates an independent Archive item with source provenance and independently owned copied media. It is not a move; the source Draft remains its own resource unless separately moderated/deleted.

## Draft relationship summary

```text
users
  1 -> N prompt_drafts

prompt_drafts
  1 -> N prompt_draft_images
  visibility -> public profile eligibility
  deleted_at -> active/tombstoned

public active prompt_draft
  -> optional admin promotion
  -> prompt_archive_items provenance via source_user_id + source_draft_id
  -> Archive-owned media copy
```

---

# 8. Prompt Archive / Public Content Foundation

Status: **COMPLETE curated Archive platform; strong FOUNDATION for a future marketplace/catalog layer.**

## Authoritative runtime source

```text
PostgreSQL
```

The static JSON catalog is now a generated fallback, not the authoritative mutable source.

## Core relational model

```text
prompt_archive_metadata
prompt_archive_items
prompt_archive_images
prompt_archive_tags
prompt_archive_item_tags
```

## Public read API

```text
GET /api/archive
GET /api/archive/:publicId
```

List capability includes:

```text
server-side search
model filtering
tag filtering
ordering
cursor pagination
list/detail split
```

`/prompts` consumes this API first and can fall back to the generated static snapshot on recoverable backend failure.

Authentication/authorization failures are not treated as reasons to bypass access rules through fallback.

## Status/publication model

Archive item states:

```text
draft
published
archived
```

This is not the same as per-owner private/public Cloud Draft visibility.

Only explicitly published Archive content belongs in the public catalog/snapshot path.

## Stable public identity

After migration 019:

```text
public_id = stable required numeric public route identity
```

Existing Telegram-backed rows retain compatible public IDs.

Telegram metadata is optional:

```text
telegram_message_id nullable
telegram_url nullable
```

**NOT PRESENT:** no slug-based Archive route/SEO slug system exists today. Future strategy work must not assume a `slug` field already exists.

## Source kinds

Current source kinds include:

```text
legacy_json
managed
user_draft
```

## Legacy import

The legacy importer is a bootstrap/migration tool.

Verified import foundation included:

```text
100 source items imported
23 canonical tags
276 image rows
idempotent mapping
localized EN/FA titles
variant parity
```

Managed rows are protected from later legacy-import overwrite. The importer is not intended to be a permanent two-way sync engine.

## Titles/localization

Dynamic Archive content owns its titles:

```text
titles.en
titles.fa
```

New managed content should not depend on source-code i18n keys for its title.

## Tags

Canonical tags are first-class relational data:

```text
prompt_archive_tags
prompt_archive_item_tags
```

This is a reusable taxonomy primitive for future discovery/marketplace work.

## Archive media

Full image:

```text
max edge 2048
WebP quality 0.60
no upscale
```

Thumbnail:

```text
max edge 640
WebP quality 0.72
no upscale
```

Managed immutable storage:

```text
archive/<ARCHIVE_ITEM_UUID>/<IMAGE_UUID>/full.webp
archive/<ARCHIVE_ITEM_UUID>/<IMAGE_UUID>/thumb.webp
```

Visual reorder changes DB positions rather than object identity.

Current managed Archive code supports up to 100 images per Archive item.

## Static fallback snapshot

Command:

```text
pnpm archive:snapshot
```

Output:

```text
public/data/prompts.json
schemaVersion = 3
```

Managed cloud media is mirrored under:

```text
public/prompts/_snapshot/...
```

Legacy local media remains on existing static paths.

The snapshot is a published-catalog fallback, not a full backup of Draft/Archived Manage state.

## User-Draft promotion

Migration:

```text
019_archive_user_draft_promotion.sql
```

Provenance:

```text
source_user_id
source_draft_id
source_kind = user_draft
```

Duplicate promotion from the same source Draft is protected by persisted uniqueness.

Promoted media is re-prepared/copied into Archive-owned storage. Therefore later source Draft moderation does not break the Archive item.

## Marketplace-relevant capabilities already present

Reusable:

```text
stable public content identity
published/draft/archived lifecycle
localized titles
prompt payload
model metadata
canonical tags
multiple images
list/detail API
search/filter/pagination
admin curation
source provenance
public profile identity
user-owned public source Drafts
independent promoted copy
moderation audit
static fallback export
```

Still not a marketplace:

```text
no price
no currency
no checkout
no order
no purchase entitlement
no license model
no creator payout
no revenue split
no seller onboarding
no product SKU/listing entity
no reviews/ratings
no sales/download counters
no generalized ownership transfer
```

---

# 9. Profile / Creator Foundation

Status: **COMPLETE public profile/showcase foundation; Creator business identity remains FOUNDATION.**

## Public routes

```text
/user?id=<USER_UUID>
/user?un=<username>
```

UUID is canonical identity.

Username alias resolution:

```text
GET /api/users/resolve?username=<username>
```

Resolver returns only public-safe UUID + username and only resolves active accounts.

## Public profile API

```text
GET /api/users/:userId/profile
GET /api/users/:userId/drafts
```

Visitor privacy is backend-enforced.

Visitor gets:

```text
active public Draft summaries only
```

Owner gets:

```text
all active own public + private Draft summaries
```

Public profile never uses email as a display fallback for a missing username.

## Existing creator-facing presentation

Current `/user` supports:

```text
full-screen cover hero
foreground avatar
creator identity hierarchy
member age
XP display
public Draft count
owner total Draft count
Saved Draft showcase
image-first Draft cards
primary preview + second-image hover crossfade
owner action menu
public/private visibility control
Preview Manager
```

## Profile Menu

Existing reusable profile controls include:

```text
avatar choose/change/remove
cover controls
nested Global Menu support
Manage entry where authorized
View profile
Sign out
XP/member-age presentation
invited-users count
```

## Creator media

Already reusable:

```text
avatar pipeline
cover pipeline
Draft preview media
Archive media pipeline
```

## Bio and extended creator metadata

**NOT PRESENT:** no creator bio field/API was found in the audited branch.

Also not present as current creator-profile primitives:

```text
external/social links
creator categories
verified creator state
creator payout account
creator storefront settings
creator pricing defaults
creator revenue stats
creator subscription/follow system
```

## Owned content

Real ownership today:

```text
user -> Cloud Drafts
```

A promoted Archive item keeps source provenance, but its content/media becomes an independent Archive-owned copy. Do not treat Archive promotion as current creator ownership of a marketplace listing.

## Reuse value for future Creator Profile

The future Creator profile should extend:

```text
UUID identity
username alias
public-safe profile projection
avatar/cover
public Draft visibility
showcase cards
profile media pipeline
shared action menu/modal
XP/referral read models
```

rather than replacing `/user` with a parallel account/profile system.

---

# 10. Content / Product Primitives currently present

This section deliberately distinguishes real primitives from strategic concepts.

| Concept | Current state | Reusable implementation |
| --- | --- | --- |
| Prompt | **PRESENT** | Compiled Draft output and Prompt Archive `prompt` content |
| Draft | **PRESENT** | User-owned editable local/cloud resource with visibility/media/revision |
| Prompt Archive item | **PRESENT** | Curated public content record with lifecycle/tags/media/provenance |
| Template | **FRONTEND/PRODUCT LOGIC EXISTS; no audited backend marketplace entity** | Prompt template tests/code exist, but no generic persisted commercial Template model is established by this backend branch |
| Workflow | **FOUNDATION ONLY** | Wizard/session/run infrastructure exists; no generic commercial Workflow listing/entity |
| Wizard run/history | **PRESENT** | Durable server-created historical `wizard_runs` snapshots |
| Remix | **NOT PRESENT as persisted product entity** | No explicit Remix resource/API found |
| Product/SKU | **NOT PRESENT** | No generic product catalog/listing/pricing entity |
| Category | **NOT PRESENT as first-class generic table** | Archive model filters and canonical tags exist instead |
| Tag | **PRESENT** | Canonical `prompt_archive_tags` + join table |
| Collection | **NOT PRESENT as generic user/content collection** | No collection entity/API found |
| Lineage | **PARTIAL FOUNDATION** | `source_user_id + source_draft_id` records Draft -> Archive promotion provenance; no generalized remix lineage graph |
| Public creator | **PRESENT FOUNDATION** | `/user`, username resolver, avatar/cover, public Drafts |
| Media asset | **PRESENT in domain-specific forms** | Archive/Draft/profile storage pipelines; no generic DAM asset table |

Strategy rule: do not rename a partial primitive into a “finished marketplace” feature. Reuse what exists, then add the missing business semantics explicitly.

---

# 11. Analytics / Events

Status: **FOUNDATION fragments exist; real behavioral/product analytics are NOT PRESENT.**

## Persisted event-like systems that do exist

### XP ledger

```text
user_score_events
```

Purpose:

```text
reward provenance / score history / idempotency
```

It is per-user and source-aware, but it only records reward-producing product milestones, not arbitrary behavior.

### Admin audit log

```text
admin_audit_log
```

Purpose:

```text
privileged mutation accountability
```

Examples include user admin changes, Archive mutations, promotion and moderation.

### Wizard run history

```text
wizard_runs
```

Purpose:

```text
persist completed/historical Wizard run output + snapshot
```

It should not automatically be interpreted as an analytics event stream.

### Admin dashboard aggregates

Current dashboard derives operational counts from live persisted data, including users, sessions, Drafts and audit actions.

## Not currently tracked as a verified analytics system

```text
view count
prompt copy count
Draft share count
download count
conversion funnel
session/product usage event stream
feature exposure
retention cohorts
anonymous visitor identity
anonymous behavioral event history
creator product performance
marketplace impressions/clicks/purchases
```

## Anonymous analytics

**NOT PRESENT:** no verified anonymous event/identity model was found.

## Consent/training analytics metadata

**NOT PRESENT:** no marketing consent, analytics consent or model-training consent system was established in the audited milestones.

Strategy implication: if Product Strategy needs analytics, design it as a separate event/measurement vertical slice. Do not overload `admin_audit_log` or `user_score_events` into purposes they were not built to serve.

---

# 12. Data Ownership / Retention Behavior

This section describes current implementation behavior, not a final legal policy.

## User-controlled/currently account-owned data

```text
Cloud Draft active state
Draft public/private visibility
Draft preview media
avatar
cover
```

Users can remove avatar/cover and normal Draft delete is soft.

## Draft soft delete

Normal owner delete and moderator delete use:

```text
prompt_drafts.deleted_at
```

The row remains in PostgreSQL but disappears from normal active reads/counters/profile/cloud restore.

A stale client cannot resurrect the tombstone with normal PUT.

## Draft restore

**NOT PRESENT:** current product has no restore endpoint, despite retaining the tombstoned row.

## Administrative hard delete

`reset-cloud-data` currently executes a hard delete of the target user's `prompt_drafts` rows.

Therefore the system presently has two very different deletion semantics:

```text
normal owner/moderation delete -> tombstone retention
admin Reset Cloud Data         -> hard delete Draft rows
```

Future commercialization/privacy work should rationalize this deliberately rather than assuming one universal deletion policy.

## Promoted Archive retention

Promotion creates an independent Archive record and copies/re-prepares media into Archive-owned object keys.

Therefore:

```text
source Draft can later be soft-deleted/moderated
promoted Archive item remains intact
Archive media remains intact
source provenance remains on Archive row
```

This is already a form of platform-retained curated content behavior.

## XP history

`user_score_events` is append-only reward history and is not deleted when a Draft is merely tombstoned.

A Draft creation reward may therefore outlive the Draft's active visibility.

## Referral history

`referrals` is a persisted UUID relationship with a username snapshot and reward events.

No user-facing “remove my referrer” flow exists.

## Admin audit history

Privileged actions persist in `admin_audit_log`.

No general user-facing audit-history deletion workflow exists.

## Avatar/cover object lifecycle

Replacement/removal updates DB state and performs best-effort storage cleanup. The database is authoritative; object cleanup failure is handled separately rather than exposing storage credentials/client ownership.

## Archive snapshot retention

`public/data/prompts.json` contains published Archive snapshot data only. It is not the authoritative full Archive backup and does not preserve all Manage Draft/Archived state.

## Account deletion retention

Because no current self-service user deletion flow is implemented, final cascade/retention semantics for:

```text
users
referrals
XP events
audit logs
Draft tombstones
promoted Archive provenance
profile media
```

must be designed before account deletion is introduced. Do not infer a policy that does not yet exist.

---

# 13. API Inventory

This is a practical capability inventory, not a copy of every handler branch.

## Auth

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/profile/complete
```

Auth responses can include:

```text
user
profile completion state
resolved permissions
score read model
referral read model
```

## Users / public identity

```text
GET /api/users/resolve?username=<username>
GET /api/users/:userId/profile
GET /api/users/:userId/drafts?limit=&cursor=
```

Public read projection is privacy-safe; visitor private Drafts/email/session data are excluded.

## Drafts

```text
GET    /api/drafts
GET    /api/drafts/:id
PUT    /api/drafts/:id
DELETE /api/drafts/:id
POST   /api/drafts/:id/visibility
```

Authenticated account-owned API.

## Draft media

```text
GET    /api/drafts/:draftId/images
POST   /api/drafts/:draftId/images
DELETE /api/drafts/:draftId/images/:imageId
POST   /api/drafts/:draftId/images/:imageId/primary
```

## Profile media

```text
GET    /api/profile/avatar
POST   /api/profile/avatar
DELETE /api/profile/avatar

GET    /api/profile/cover
POST   /api/profile/cover
DELETE /api/profile/cover
```

## Prompt Archive public reads

```text
GET /api/archive
GET /api/archive/:publicId
```

Server-side search/filter/order/cursor support lives in this Archive platform.

## Admin / Manage — users

```text
GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

## Admin / Manage — dashboard

```text
GET /api/admin/dashboard/summary
```

## Admin / Manage — Archive

```text
GET  /api/admin/archive
POST /api/admin/archive
GET  /api/admin/archive/tags
GET  /api/admin/archive/:archiveItemUuid
PUT  /api/admin/archive/:archiveItemUuid
POST /api/admin/archive/:archiveItemUuid/draft
POST /api/admin/archive/:archiveItemUuid/publish
POST /api/admin/archive/:archiveItemUuid/archive
GET  /api/admin/archive/public/:publicId
GET  /api/admin/archive/telegram/:telegramMessageId
```

Archive media routes:

```text
/api/admin/archive/:archiveItemUuid/images
/api/admin/archive/:archiveItemUuid/images/order
/api/admin/archive/:archiveItemUuid/images/:imageUuid
```

## Promotion / moderation

```text
GET    /api/admin/archive/source-draft/:userId/:draftId
GET    /api/admin/archive/source-draft/:userId/:draftId/images/:imageId
POST   /api/admin/archive/promote-draft
DELETE /api/admin/archive/source-draft/:userId/:draftId
```

## Credits / XP

**No dedicated public credit/wallet endpoint exists.**

Current score is projected through Auth responses and can be returned after a Draft save. The server-side reusable API is an internal module (`userScore.mjs`), not a commercial wallet HTTP service.

## Referral

Referral creation is integrated into:

```text
POST /api/auth/register
  referralUsername?: string
```

Referral count is integrated into the Auth read model.

**No separate referral campaign/invite-management HTTP API exists.**

## Share

**No dedicated server share-link/share-token API exists.**

## Wizard history

Implemented historical resource family includes:

```text
POST /api/wizard-runs
GET  /api/wizard-runs
GET  /api/wizard-runs/:runUuid
```

## Translation/system utility

```text
GET  /api/hello
GET  /api/db-check
GET  /api/translate/status
POST /api/translate
```

---

# 14. Database Inventory

The goal here is architecture orientation, not a schema dump.

## Migration history

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
013_prompt_archive_foundation.sql
014_archive_media_storage_keys.sql
015_user_avatar.sql
016_public_user_profiles.sql
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
019_archive_user_draft_promotion.sql
```

Next migration:

```text
020_*.sql
```

## Important tables / data domains

### `wizard_runs` — migration 001

Purpose:

```text
append-only/historical Wizard output + normalized snapshot
```

Uses server-created UUID identity.

### `prompt_drafts` — migrations 002, 004, 011, 016, 018

Purpose:

```text
account-owned editable Cloud Draft state
```

Important architecture:

```text
scoped by user_id
client-stable draft_id
snapshot JSON/editor state
revision/server update metadata
private/public visibility
published_at
soft-delete deleted_at
owner/visibility/update query support
```

### `users` — migrations 003, 005, 007, 008, 015, 016

Purpose:

```text
account identity + role/status + profile media state
```

Important constraints/behavior:

```text
at least username or email
case-insensitive unique identity indexes
role
active/suspended status
updated_at
avatar storage metadata
cover storage metadata
```

### `auth_sessions` — migration 003

Purpose:

```text
bearer-session persistence
```

Stores hashed token rather than raw bearer token and an expiry timestamp.

### `admin_audit_log` — migration 007

Purpose:

```text
privileged mutation audit trail
```

Carries actor/target/action/metadata/timestamp semantics where relevant.

### `user_score_events` — migrations 009–011 plus referral trigger integration in 012

Purpose:

```text
append-only XP/reward ledger
```

Important invariant:

```text
UNIQUE (user_id, idempotency_key)
```

`points` supports signed non-zero integer events.

### `referrals` — migration 012

Purpose:

```text
persist referrer -> referred account attribution
```

Important invariants:

```text
UNIQUE (referred_user_id)
referrer != referred
UUID relationship survives username display changes
```

### `prompt_archive_metadata` — migration 013

Purpose:

```text
Archive-level metadata/import foundation
```

### `prompt_archive_items` — migrations 013, 019

Purpose:

```text
curated Prompt Archive content + lifecycle + provenance
```

Important fields/semantics:

```text
UUID primary identity
stable numeric public_id
draft/published/archived status
localized titles
prompt
model metadata
variants/source metadata
optional Telegram linkage
source_kind
source_user_id/source_draft_id provenance
```

Migration 019 provides stable public IDs independent from optional Telegram identity and duplicate user-Draft promotion protection.

### `prompt_archive_images` — migrations 013, 014

Purpose:

```text
ordered Archive media + local/cloud storage metadata
```

Supports full/thumbnail object identity and dimensions/size metadata.

### `prompt_archive_tags` + `prompt_archive_item_tags` — migration 013

Purpose:

```text
canonical Archive taxonomy + many-to-many item tagging
```

### `prompt_draft_images` — migration 017

Purpose:

```text
ordered user Draft preview media
```

Relationship includes user/Draft identity and ordered primary-preview semantics.

## Index/query patterns worth preserving

The platform already uses:

```text
case-insensitive identity uniqueness
admin user indexes
owner + visibility + update indexes for profile Draft reads
stable keyset/cursor pagination
Archive timestamp+UUID pagination
profile Draft update+Draft-ID pagination
```

Future growth work should extend these read models intentionally rather than loading entire tables and filtering in the browser.

## Migration mechanism limitation

The current numbered SQL runner is a development migration mechanism. Existing docs explicitly distinguish this from a future production-grade migration framework.

Do not rewrite applied numbered files; add new migrations.

---

# 15. Reusable Infrastructure

The following systems are strategic assets. Future branches should extend them before inventing replacements.

## Authentication/session system

Reuse:

```text
scrypt password hashing
bearer session token pattern
hashed DB session token
/api/auth/me authorization refresh
active/suspended account boundary
```

## Permission system

Reuse:

```text
roles -> permissions resolver
hasPermission()
frontend can(permission)
authorization middleware
Manage section permission registry
backend guard as authoritative layer
```

## Progressive profile requirement system

Reuse:

```text
profileRequirements.mjs
useProfileRequirements
ProfileRequirementModal
useEmailRequirement
EmailRequirementModal
```

Do not create one-off “please enter email” flows for every Growth feature.

## Global Menu / Global Modal

Reuse the central menu/modal infrastructure, including nested Global Menu behavior and stacked modal confirmation.

Do not create page-local competing overlay managers for Growth/Creator/Marketplace actions.

## EL component/design system

Reuse shared components such as:

```text
el-flex
el-grid
el-text
el-button
el-text-field
el-dropdown
el-divider
el-avatar
```

## Typed frontend API boundary

New product requests should go through shared typed composables/types rather than direct ad-hoc `$fetch` from individual components.

## API conventions

Reuse:

```text
independent Node API
browser CORS/preflight
JSON Content-Type checks
HTTP boundary validation
structured errors
401 vs 403 distinction
parameterized PostgreSQL queries
list/detail projections
cursor pagination
```

## Local-first mutation/sync pattern

Reuse Draft principles where relevant:

```text
local state remains usable
stable resource identity
idempotent PUT when client owns identity
content fingerprint
observable dirty/syncing/synced/failed states
server failure must not erase valid local work
```

## XP/event ledger

Reuse `user_score_events` and `userScore.mjs` for new reward events unless Product Strategy intentionally defines a separate currency with different accounting rules.

New rewards must define:

```text
meaningful product event
stable source
signed amount
stable idempotency key
retry behavior
```

## Referral relationship

Reuse persisted UUID referral attribution and do not create a second “invite owner” relation for the same concept.

Campaigns/links/anti-abuse can be layered on the current relation.

## Media pipeline / storage

Reuse:

```text
backend-only Arvan/S3 adapter
immutable object keys
DB authoritative metadata
browser preparation where established
backend WebP/dimension/size validation
best-effort cleanup
Archive full/thumb contract
avatar contract
cover contract
Draft preview contract
```

Do not expose S3 credentials to the frontend.

## Archive platform

Reuse:

```text
stable publicId
Archive lifecycle
canonical tags
localized content
media
search/filter/pagination
source_kind/provenance
snapshot exporter
admin audit
```

A Marketplace should be an extension around these primitives only where the semantics match; it should not duplicate Prompt storage/catalog merely to add commerce.

## Profile/creator identity

Reuse `/user`, UUID identity, username resolver, avatar/cover, public-safe read model and Draft showcase.

## Admin/Manage workspace

Reuse the existing shell, registry, route middleware, permission model, Global Menu/Modal, audit log and typed APIs.

Do not build a second admin console for Growth/Credits/Marketplace.

## Docker/local environment

Reuse the existing `api` + `db` + `translator` composition and environment-variable model. Add services only when the new capability genuinely requires them.

## Numbered SQL migrations

Reuse current lexical `backend/sql/NNN_*.sql` workflow. Next migration is 020.

## `DO NOT REBUILD THESE SYSTEMS`

```text
DO NOT rebuild authentication/session storage.
DO NOT rebuild roles/permissions as a parallel role-check system.
DO NOT rebuild a second Manage/admin shell.
DO NOT rebuild Global Menu or Global Modal for strategy features.
DO NOT rebuild profile identity; extend /user and current public-safe profile APIs.
DO NOT rebuild avatar/cover/media upload infrastructure.
DO NOT build another Prompt catalog before evaluating Prompt Archive as the catalog foundation.
DO NOT build another tag taxonomy before evaluating prompt_archive_tags.
DO NOT build another Draft persistence service; extend account-owned Cloud Drafts.
DO NOT build another reward counter; audit user_score_events first.
DO NOT build another referral attribution relation; extend referrals first.
DO NOT build another Draft -> curated-content provenance model; extend source_user_id/source_draft_id first.
DO NOT bypass typed API clients with scattered component fetches.
DO NOT rewrite applied migrations 001–019.
DO NOT make frontend-only permission checks the security boundary.
```

---

# 16. Known Gaps

## Complete and reusable today

```text
Dockerized Node API + PostgreSQL local foundation
static Nuxt compatibility
Auth/login/session
username/email identities
progressive profile completion
roles/permissions
Manage shell
Manage Users read + Super-Admin mutation paths
Manage Dashboard operational metrics
Cloud Draft sync/persistence
Draft visibility
Draft preview media
Draft soft delete/anti-resurrection
public profile by UUID/username
avatar + cover
creator-style Draft showcase
append-only idempotent XP ledger
working referral relationship + rewards
Prompt Archive relational platform
canonical tags
Archive media
Archive Manage lifecycle
legacy import
static Archive fallback snapshot
public Draft -> Archive promotion
moderation
admin audit
```

## Real foundations that are not complete product systems

```text
XP ledger -> foundation for Credit Economy, not a wallet
referrals -> foundation for growth campaigns, anti-abuse still basic
/user -> foundation for Creator identity/storefront
Prompt Archive -> foundation for marketplace/catalog, no commerce
Draft promotion provenance -> partial lineage foundation
admin_audit_log -> audit primitive, not analytics
Wizard history -> durable workflow history primitive, not generic marketplace Workflow
```

## Not present today

```text
spendable credit wallet
credit purchase/top-up
credit debit/hold/refund rules
admin credit adjustment
user score transaction history UI
payments
prices
orders
checkout
purchase entitlements
licenses
seller payouts
revenue share
subscriptions
marketplace SKU/Product entity
reviews/ratings
creator bio
creator social links
verified creator system
creator followers/subscriptions
generic Collection entity
generic Category table
generic Remix entity
generalized lineage graph
Draft restore/undelete API
server-persisted share links/tokens
share/copy/view/download counters
behavioral analytics event pipeline
anonymous analytics identity
email verification
phone identity/verification
account self-delete flow
production-grade migration framework
```

## Intentionally deferred by existing work

Referral milestone explicitly deferred:

```text
generated referral codes
referral links/prefill
invite list/dashboard
admin referral tooling
advanced anti-abuse
maturity/clawback
campaign rules
```

XP milestone explicitly deferred:

```text
leaderboards
levels/badges/streaks
admin score adjustment UI
score history UI
score-rule management UI
behavioral analytics
```

Profile milestone deferred broader identity/account settings such as identity rename/change and verification.

No Milestone 21 was selected in `feature/docker-local-api`; commercialization work should begin with an audit/design branch, not by assuming the next backend feature.

---

# 17. Handoff for Product Strategy / Growth Foundation

This is the operational handoff for the next branch.

## Capabilities already usable for Growth Foundation

```text
low-friction username/email account creation
progressive identity completion
email requirement gate pattern
public username identity
public profile/showcase
XP reward/event ledger
referral attribution + reward events
invited-user count
public/private Draft visibility
curated promotion path
admin permissions/audit
operational dashboard metrics
```

## Capabilities already usable for Credit Economy design

Already present:

```text
append-only per-user ledger
signed points
reason/event type
source type/id
metadata
idempotency key
retry-safe event producers
aggregate total XP read model
reward events for account/email/Draft/referral
```

Do **not** begin the strategy branch by adding `users.credit_balance` or a second transaction table.

First decide:

1. Is commercial Credit the same currency as XP or a separate one?
2. If separate, can the existing ledger pattern be generalized/reused without corrupting XP semantics?
3. What debit, non-negative, refund, reservation and admin-adjustment rules are required?
4. Which events are rewards vs spend vs purchased value?

Only then choose the next schema.

## Capabilities already usable for Referral growth

Already present:

```text
username referral input
registration-only attribution
UUID referrer/referred relation
one-referrer constraint
active-referrer check
self-referral rejection
atomic referral + reward creation
referred/referrer XP events
referredCount read model
```

Next referral work should layer links, campaigns, maturity and anti-abuse on top of this relation rather than replacing it.

## Capabilities already usable for Creator/Profile strategy

Already present:

```text
canonical UUID creator identity
public username alias
public-safe profile endpoint
avatar
cover
member age
XP
public Draft count
Draft showcase
preview media
public/private ownership boundary
shared action menu/modal
```

The missing Creator layer is mainly business/profile metadata and commerce semantics, not identity infrastructure.

## Capabilities already usable for Marketplace foundation

Already present:

```text
Prompt Archive catalog
stable numeric public content ID
localized titles
prompt payload
model metadata
canonical tags
images/thumbnails
search/filter/pagination
lifecycle draft/published/archived
admin curation
public user Draft source
source user/Draft provenance
unique promotion protection
independent Archive-owned promoted media
public creator profile
moderation permission/audit
static fallback snapshot
```

This is enough to prototype marketplace taxonomy, creator attribution and listing strategy without first rebuilding content storage.

Missing marketplace essentials remain pricing, listing ownership semantics, purchase/license/entitlement, payment, payout/revenue share, ratings/reviews and commercial analytics.

## First files to read in the next strategy branch

Mandatory baseline:

```text
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
```

For economy/referrals:

```text
docs/backend/MILESTONE_14_PROGRESSIVE_USER_PROFILE.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
backend/src/userScore.mjs
backend/src/referrals.mjs
backend/src/auth.mjs
backend/sql/009_user_score_events.sql
backend/sql/010_score_identity_triggers.sql
backend/sql/011_score_cloud_draft_creation.sql
backend/sql/012_create_referrals.sql
```

For Archive/Marketplace:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
backend/src/archive.mjs
backend/src/adminArchive.mjs
backend/src/adminArchiveMedia.mjs
backend/src/archivePromotion.mjs
backend/sql/013_prompt_archive_foundation.sql
backend/sql/014_archive_media_storage_keys.sql
backend/sql/019_archive_user_draft_promotion.sql
```

For Creator/Profile/Drafts:

```text
docs/backend/MILESTONE_18_USER_AVATAR.md
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
app/pages/user.vue
app/components/create/DraftCloudSyncButton.vue
backend/src/userProfile.mjs
backend/src/cloudDrafts.mjs
backend/src/draftMedia.mjs
backend/src/userAvatar.mjs
backend/src/userCover.mjs
backend/sql/016_public_user_profiles.sql
backend/sql/017_cloud_draft_preview_media.sql
backend/sql/018_soft_delete_prompt_drafts.sql
```

For authorization/admin extensions:

```text
backend/src/authorization.mjs
backend/src/adminUsers.mjs
backend/src/adminDashboard.mjs
app/config/manage.ts
docs/backend/MANAGE_GUIDE.md
```

## Strategy-branch operating rule

**Before designing any new Growth, Credit, Creator, Referral or Marketplace feature, perform an existing-capability audit against this document and the implementation files above.**

The sequence should be:

```text
1. identify the desired product behavior
2. locate the closest existing resource/capability
3. verify current code/schema/API behavior
4. classify the gap: extension vs genuinely new primitive
5. extend the existing system when semantics match
6. create a new system only when the existing primitive would become semantically incorrect
7. preserve authorization, audit, media, migration and static-generation invariants
```

Core principle:

> **Audit existing capability first. Build only the real gap. Do not create parallel systems for problems Prompt Draft has already solved.**
