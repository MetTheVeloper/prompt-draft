# Backend Implementation Plan

## Architecture baseline

Milestones 1 through 7 are complete and locally verified.

Current verified platform path:

```text
static Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> validation + normalization
  -> PostgreSQL and private backend services
  -> Docker named volumes
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable implementation conventions live in:

```text
docs/backend/API_GUIDE.md
```

## Completed reference implementation — Wizard runs

The Wizard-run flow remains the first fully verified append-only backend example:

```text
real Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> cursor-paginated summary API
  -> full detail API
  -> typed frontend boundary
  -> /history + query-based detail
```

It proved Docker networking, CORS, validation, PostgreSQL persistence, named-volume durability, client/server contracts, static routing, and UI recovery behavior.

Wizard runs are append-only historical resources. Editable drafts intentionally use stable resource identities and upsert/sync semantics instead.

## Schema workflow

The development schema runner discovers all files matching:

```text
backend/sql/NNN_*.sql
```

and applies them in lexical order.

Current files:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_create_auth.sql
004_scope_prompt_drafts_to_users.sql
```

New development schema changes should use new numbered files rather than rewriting applied schema history.

A production-grade migration framework remains deferred.

# Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

## Product contract

The `/create` page remains local-first. Authentication is optional and only enables account-bound Cloud behavior.

```text
anonymous user
  -> local draft system continues normally

logged-in user
  -> same local draft system
  -> optional/manual Cloud Save
  -> dirty-aware autosync
  -> account-owned Cloud collection
  -> recovery across browser/device contexts
```

## Local draft contract

Existing local collection remains:

```text
PromptDraftCollection version 1
  activeDraftId
  drafts: PromptDraftRecord[]
```

Each record keeps its stable client-owned id:

```text
draft-<timestamp>-<random>
```

The local editor still saves with its existing short debounce. Cloud sync does not replace this path.

## Authentication architecture

### Tables

Auth schema provides account/session storage.

Conceptually:

```text
users
  id UUID
  username/email identity
  password hash material
  created_at

auth_sessions
  token_hash
  user_id
  expires_at
  created_at
```

### Security contract

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage (current explicit product decision)
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

IP identity and MD5 password storage are explicitly not used.

### Auth API

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

The login UI uses a two-step flow:

```text
username or email
  -> POST /api/auth/identify
  -> existing account: password login
  -> missing account: password + confirmation registration
```

Current password rule:

```text
minimum 8 characters
at least one English letter
at least one number
```

### Frontend auth boundary

`useAuth()` is the shared client boundary for:

```text
token
user
isLoggedIn
initialize
identify
login
register
logout
```

Header behavior:

```text
anonymous -> blue login FAB -> /login
logged in -> primary profile FAB -> global menu component
```

The profile menu exposes current account information and logout.

## Cloud Draft server ownership

`004_scope_prompt_drafts_to_users.sql` makes Cloud Draft resources account-scoped.

A Cloud Draft is identified by the tuple:

```text
(user_id, draft_id)
```

The same local `draft-*` id can therefore never expose or overwrite another user's resource.

Legacy pre-auth Cloud Draft rows without trustworthy ownership are intentionally not treated as account data.

## Cloud Draft schema

Queryable metadata remains separate from the canonical draft snapshot:

```text
user_id
draft_id
title
created_at
client_updated_at
server_updated_at
revision
snapshot JSONB
```

`revision` increments on successful updates and is available for future optimistic-conflict enforcement.

Collection ordering uses client update time plus draft id as deterministic tie-breaker.

## Cloud Draft API

All Cloud Draft endpoints require a valid bearer session.

```text
PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
```

Unauthenticated requests return `401 Authentication required`.

### PUT semantics

Repeated saves for one account + draft id update the same logical resource:

```text
first PUT  -> INSERT
later PUT  -> UPDATE same row
              revision = revision + 1
```

The write payload contains normalized draft metadata and snapshot state. Server code never trusts client ownership; `user_id` comes from the authenticated session.

### Detail semantics

```text
GET /api/drafts/:id
existing owned id -> 200
missing/unowned id -> not exposed as another user's data
invalid id -> validation error
```

### Collection semantics

```text
GET /api/drafts?limit=...&cursor=...
```

returns only drafts owned by the authenticated user, newest client-updated first, with cursor pagination.

This collection endpoint is what enables discovery on a browser/device that has no local list of draft ids.

## Typed frontend boundary

Cloud Draft API types live under:

```text
app/types/draftSyncApi.ts
```

`usePromptDraftApi()` owns API URL construction and exposes the draft read/write methods. UI components do not manually construct backend URLs.

## Account-scoped sync metadata

Canonical draft JSON remains unchanged.

Cloud metadata is stored separately under:

```text
prompt-draft:create-editor:cloud-sync:v2
```

The metadata is partitioned by authenticated `userId` so switching accounts in one browser does not make one account's Cloud state authoritative for another.

Per-draft metadata contains:

```text
fingerprint
syncedAt
revision
```

## Dirty detection and autosync

The sync fingerprint is based on meaningful content:

```text
id
title
PromptDraftState
```

It deliberately excludes incidental local timestamps.

Autosync runs every two minutes and uploads only dirty drafts already associated with the current account. Unchanged drafts are skipped.

A manual Cloud Save FAB beside Drafts can establish/refresh the active draft's Cloud copy immediately.

Failure semantics remain local-first:

```text
backend unavailable
  -> local save still works
  -> Cloud status reports failure/dirty state
  -> later manual/autosync retry can recover
```

No server failure deletes or blocks local work.

## Multi-device recovery lifecycle

For a logged-in `/create` entry/refresh, Cloud recovery is explicit:

```text
/create mount
  -> auth.initialize()
  -> GET /api/drafts
  -> fetch account Cloud Draft pages
  -> read local PromptDraftCollection
  -> merge by stable draft id
  -> newer updatedAt wins for matching ids
  -> preserve local-only drafts
  -> prepend newly discovered remote drafts
  -> persist merged collection to localStorage
  -> refresh Drafts menu/editor collection
```

The restore call lives in the mounted Cloud Sync control lifecycle so discovery always occurs on real `/create` entry rather than relying on an invisible bridge that may fail to mount.

This behavior was verified bidirectionally between normal and Incognito browser contexts using the same account.

## Drafts-menu Cloud state

The Drafts dropdown derives presentation from the same account-scoped local sync metadata and does not issue extra API requests just to draw icons.

```text
cloud_done / green
  -> local fingerprint matches last successful Cloud save

cloud_upload / orange
  -> Cloud version exists but current local content is dirty

cloud_off / normal
  -> no Cloud association for current account, or anonymous mode
```

## Static-generation invariant

Milestone 6 release verification includes:

```text
pnpm generate
```

The user confirmed a successful static build after Auth + Cloud Draft integration. The generated route set includes at least:

```text
/create
/login
/history
/wizard/portrait
```

Warnings about duplicated imports, sourcemaps, and chunk size remain non-blocking existing build warnings; generation completed successfully.

# Milestone 6 phases — ALL DONE

## Phase 0 — reusable API playbook + Cloud Draft contract: DONE

Verified reusable API conventions and stable editable-resource semantics.

## Phase 1 — schema + backend Cloud Draft write/read: DONE

Verified numbered schema application, account-owned persistence, repeated upsert behavior, and revision increments.

## Phase 2 — Auth Foundation: DONE

Verified registration, logout, existing-account login, optional-auth product behavior, header controls, profile menu, and session hydration.

## Phase 3 — account-scoped collection + recovery: DONE

Verified `GET /api/drafts`, ownership scoping, merge behavior, preservation of local-only drafts, and bidirectional same-account recovery across browser contexts.

## Phase 4 — sync-state UX + final static verification: DONE

Verified Cloud Save placement/state, Drafts-menu Cloud status icons, local-first failure model, and successful `pnpm generate`.

# Milestone 7 — COMPLETE: Server-side Translation

## Product/architecture contract

Translation remains usable without authentication and is implemented as a backend capability rather than a Nuxt server-route dependency.

```text
static Nuxt TextField
  -> NUXT_PUBLIC_API_BASE
  -> Prompt Draft Node API :4000
  -> Docker-private LibreTranslate :5000
  -> translation result
```

The browser never calls LibreTranslate directly and port `5000` is not published to the host as an application API.

## Docker translator service

Compose provides:

```text
translator image       -> libretranslate/libretranslate:v1.9.6
loaded languages       -> en,fa
model volume           -> prompt_draft_translation_models
internal service URL   -> http://translator:5000
backend env            -> TRANSLATION_BASE_URL
translation timeout    -> long request timeout
status timeout         -> short independent health timeout
```

Model persistence prevents normal container recreation from forcing a model re-download.

The translator service has a Docker healthcheck. During initial boot/model loading, backend health may correctly report unavailable; once the service becomes ready, the same status endpoint reports availability without backend restart.

## Backend Translation API

```text
GET /api/translate/status
POST /api/translate
```

`POST /api/translate` accepts:

```text
text          required string, max 5000 chars
source        auto | fa | en; default auto
target        fa | en; default en
alternatives  integer 0..5; default 3
```

Backend responsibilities:

```text
validate request
normalize defaults
call LibreTranslate over Docker network
normalize upstream response
return stable JSON
return 503 when translator is unavailable
keep API process alive when dependency fails
```

`GET /api/translate/status` queries LibreTranslate language availability and returns:

```text
ok
available
languages[]
```

Health checking uses a shorter timeout than a real translation call so opening a TextField menu does not block for the full translation timeout when the translator is down.

## Typed frontend translation boundary

Types live in:

```text
app/types/translationApi.ts
```

`usePromptDraftApi()` exposes:

```text
getTranslationStatus()
translatePrompt(input)
```

Both use the configured public API base. The frontend no longer relies on a Nuxt server endpoint for translation.

## Prompt translation composable

`usePromptTranslation()` owns translation-specific client behavior:

```text
shared cached service availability
status refresh
translation loading/error state
variable token protection/restoration
translation alternatives normalization
backend translation call
```

Translation availability is shared across component instances rather than issuing an uncontrolled health request from every field.

## Variable token safety

Prompt variables are protected before translation:

```text
{person}
  -> temporary PDVAR... placeholder
  -> translation request
  -> restore placeholder back to {person}
```

Restoration tolerates modest translator changes to placeholder punctuation/spacing so prompt variable semantics survive.

This was locally verified with `{person}` inside Persian source text.

## TextField health UX

The visible Translate action is tied to real backend health.

Each action-menu/context-menu opening forces a fresh status check, then the menu derives availability from the shared health state:

```text
editable non-empty field + translator healthy
  -> Translate enabled

translator unavailable
  -> Translate disabled

translator restarts and becomes healthy
  -> reopen menu
  -> fresh check
  -> Translate enabled again
```

No full page refresh is required for service recovery.

## Legacy proxy retirement

The previous Nuxt route:

```text
server/api/translate.post.ts
```

was removed after the direct backend path was locally verified.

This preserves the project invariant that production product APIs do not depend on Nuxt server routes in the static frontend deployment.

## Milestone 7 local verification

The user verified:

```text
Docker image pull and translator startup
healthy container state
en/fa language availability
backend status transition from unavailable to available during startup
Persian -> English translation
multiple alternatives
stable 503 while dependency unavailable
real TextField translation via backend :4000
no use of localhost:3030 /api/translate
translation selection modal behavior
{person} token preservation
translator stop -> Translate disabled
translator start/healthy -> Translate re-enabled without page refresh
translation works after recovery
anonymous translation remains allowed
pnpm generate succeeds
12 static routes are prerendered
```

Existing build warnings about duplicated imports, sourcemaps and large chunks remain non-blocking; generation completed successfully.

# Milestone 7 phases — ALL DONE

## Phase 1 — Docker translator + backend API: DONE

Verified Docker-private LibreTranslate, persistent models, status endpoint, translation endpoint, startup unavailability and successful translation.

## Phase 2 — typed frontend migration: DONE

Verified direct frontend-to-backend translation, existing translation modal behavior and variable token safety.

## Phase 3 — proxy retirement + health UX + final regression: DONE

Verified legacy Nuxt proxy removal, health-driven action availability, stop/start recovery without refresh, anonymous behavior and final `pnpm generate`.

# Deferred follow-up work

These are intentionally not required for completed Milestones 6 or 7:

```text
convert current Wizard-run /history to Draft History
move the relevant History entry into the Drafts menu
server-side Cloud Draft delete semantics
advanced multi-device conflict UI/policy
optimistic revision rejection
production auth rate limiting / abuse controls
translation rate limiting / abuse controls
email verification
password reset/recovery
OAuth/social login
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

Do not start any deferred item automatically. The next product feature is chosen by the user.
