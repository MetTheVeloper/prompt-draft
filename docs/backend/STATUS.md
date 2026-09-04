# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

Verified platform path:

```text
static Nuxt frontend
  -> direct browser CORS
  -> Docker Node API :4000
  -> PostgreSQL
  -> named-volume durability
```

Milestone 5 History / Read API + UX remains available as the completed reference implementation.

## Reusable API playbook — COMPLETE

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It captures resource-first API design, numbered SQL schema files, parameterized DB access, HTTP validation/CORS, typed frontend boundaries, local-first failure semantics, direct UI verification, and `pnpm generate` as a release invariant.

## Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

Goal achieved:

```text
existing /create local drafts
  -> remain local-first
  -> optional authenticated account ownership
  -> manual Cloud Save + dirty-aware autosync
  -> durable PostgreSQL prompt_drafts rows
  -> same-account multi-device recovery
  -> per-draft Cloud status in Drafts menu
```

Authentication is optional at the product level. Anonymous users can continue using Prompt Draft normally; signing in enables account-bound Cloud Draft behavior.

Implemented backend/schema:

```text
backend/sql/002_create_prompt_drafts.sql
backend/sql/003_create_auth.sql
backend/sql/004_scope_prompt_drafts_to_users.sql

POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
```

Implemented frontend behavior:

```text
useAuth() shared auth boundary
/login two-step identify -> login/register flow
header login/profile controls
profile menu + logout
manual Cloud Save FAB beside Drafts
2-minute dirty-aware autosync
account-scoped sync metadata v2
GET /api/drafts on logged-in /create entry/refresh
Cloud/local deterministic merge
preserve local-only drafts
same-account multi-device recovery
Drafts-menu Cloud state icons
```

Drafts menu status contract:

```text
cloud_done / green
  -> current local fingerprint matches saved Cloud version

cloud_upload / orange
  -> Cloud version exists for this account but local changes are dirty

cloud_off / normal
  -> local-only for this account, or anonymous mode
```

Locally verified by the user:

```text
account registration
logout
existing-account login
header auth/profile behavior
Cloud Save writes successfully
Cloud Save FAB placement beside Drafts
prompt_drafts.user_id matches authenticated users.id
repeated writes update the same draft and increment revision
same-account Incognito/main-browser writes reach PostgreSQL
logged-in /create issues GET /api/drafts on entry/refresh
Cloud Drafts created/synced in one browser context recover in the other
local-only drafts survive Cloud merge
Drafts-menu offline/synced/dirty status presentation works
pnpm generate succeeds
/login, /create and /history are included in the static prerender output
```

Auth security contract:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage (explicit current product decision)
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

MD5 and IP-based identity are not used.

## Milestone 7 — IN PROGRESS: Server-side Translation

Goal:

```text
static Nuxt text-field action
  -> Prompt Draft API :4000
  -> private Docker-network LibreTranslate service
  -> Persian/English translation response
```

Product boundary:

- translation remains available to anonymous users;
- the browser must never call LibreTranslate directly;
- LibreTranslate port `5000` stays internal to Docker Compose;
- backend dependency failure returns a stable `503` rather than crashing the API;
- existing prompt-variable protection/restoration remains a frontend responsibility;
- static generation remains mandatory.

### Phase 1 — DONE: Docker translator + backend API

Locally verified by the user on 2026-09-04:

```text
translator container pulls and starts successfully
translator reaches Docker healthy state
GET /api/translate/status transitions to available:true after model startup
en + fa languages are exposed
POST /api/translate returns Persian -> English translation
alternatives are returned
backend returns 503 while translator is still unavailable during startup
```

Implemented contract:

```text
translator service -> libretranslate/libretranslate:v1.9.6
models              -> en,fa only
model persistence   -> prompt_draft_translation_models named volume
backend upstream    -> TRANSLATION_BASE_URL=http://translator:5000

GET  /api/translate/status
POST /api/translate
```

`POST /api/translate` defaults:

```text
source       -> auto
target       -> en
alternatives -> 3
max text     -> 5000 characters
```

### Phase 2 — AWAITING USER VERIFICATION: typed frontend migration

Implemented:

```text
app/types/translationApi.ts
usePromptDraftApi.getTranslationStatus()
usePromptDraftApi.translatePrompt()
usePromptTranslation routes through NUXT_PUBLIC_API_BASE -> backend :4000
shared cached translation health state (30-second TTL)
translation composables check service status on client setup
translation calls are gated by backend health
existing variable token protection/restoration preserved
existing translation alternatives/result modal preserved
```

The legacy Nuxt `server/api/translate.post.ts` still exists during Phase 2, but the prompt translation composable no longer calls it.

### Phase 3 — NOT STARTED: retire Nuxt translation proxy + final UI/regression

Planned:

```text
remove server/api/translate.post.ts
wire visible Translate action disabled/enabled state to real backend health
verify translator unavailable/recovery behavior in the menu
verify anonymous translation
verify pnpm generate
update milestone docs and close Milestone 7
```

## Current intentional debt / deferred work

- convert `/history` from Wizard-run History to Draft History when that product work is selected;
- remove History from primary header navigation and add the relevant History entry to the Drafts menu as previously agreed;
- server-side Cloud Draft delete semantics;
- advanced multi-device conflict resolution beyond deterministic `updatedAt` merge;
- optimistic revision conflict enforcement;
- production auth rate limiting / abuse controls;
- translation rate limiting / abuse controls before public production exposure;
- email verification;
- password reset/recovery;
- OAuth/social login;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify Milestone 7 Phase 2 from the real text-field Translate action. Do not mark Phase 2 `DONE` until the user confirms browser requests go directly to backend `:4000` and the existing translation UI still works.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
