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

Milestone 5 History / Read API + UX is closed.

## Reusable API playbook — ADDED

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It captures resource-first API design, numbered SQL schema files, parameterized DB access, CORS, typed frontend boundaries, local-first failure semantics, direct UI verification, and `pnpm generate` as a release invariant.

## Milestone 6 — IN PROGRESS: Cloud Draft Sync

Goal:

```text
existing /create local drafts
  -> remain local-first
  -> dirty-aware server sync
  -> manual FAB + 2-minute autosync
  -> durable PostgreSQL prompt_drafts rows
  -> eventually user-owned cloud drafts
```

Existing local source remains:

```text
prompt-draft:create-editor:drafts:v1
```

Cloud sync metadata remains separate:

```text
prompt-draft:create-editor:cloud-sync:v1
```

Implemented before the auth dependency was introduced:

```text
backend/sql/002_create_prompt_drafts.sql
PUT /api/drafts/:id
GET /api/drafts/:id
app/types/draftSyncApi.ts
app/components/create/DraftCloudSyncButton.vue
manual save FAB beside Drafts
dirty/syncing/synced/failed states
2-minute dirty-aware autosync
```

The user locally confirmed that the real `/create` Cloud Save control sends the server write successfully and requested/verified its placement beside the Drafts control.

### Cloud Draft next dependency

A server-side draft list and recovery flow must be scoped to a real account. IP address ownership and password-only identity shortcuts were explicitly rejected because IP is not a stable user identity and those approaches would recreate authentication poorly.

Cloud Draft ownership/list/rehydration is therefore paused until the Auth Foundation below is locally verified.

## Auth Foundation — IN PROGRESS

Authentication is optional at the product level. Anonymous users must continue to use Prompt Draft normally. Signing in enables account-bound capabilities such as future Cloud Draft ownership and multi-device recovery.

### Auth security contract

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage (explicit product decision)
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

MD5 and IP-based identity are not used.

### Auth schema/API — AWAITING USER VERIFICATION

Implemented:

```text
backend/sql/003_create_auth.sql
  -> users
  -> auth_sessions

backend/src/auth.mjs
  -> POST /api/auth/identify
  -> POST /api/auth/register
  -> POST /api/auth/login
  -> GET  /api/auth/me
  -> POST /api/auth/logout

backend/src/index.mjs
  -> auth router integration
  -> Authorization allowed by browser CORS
```

Identifier contract:

```text
email
OR
3-64 character username using English letters/numbers/._-
```

Password contract:

```text
8-200 characters
at least one English letter
at least one number
```

The identify endpoint intentionally reveals whether an account exists because the approved UX chooses login vs registration after the first identifier step.

### Frontend Auth — AWAITING USER VERIFICATION

Implemented:

```text
app/types/auth.ts
app/composables/useAuth.ts
app/pages/login.vue
app/components/auth/AuthProfileMenu.vue
app/components/Header.vue
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
nuxt.config.ts
```

Expected flow:

```text
anonymous
  -> blue login FAB in main header
  -> /login
  -> username/email identify
  -> existing account: password -> login
  -> new account: password + repeat -> register
  -> token stored locally
  -> /api/auth/me hydrates shared auth state

logged in
  -> prim profile FAB between language and More/menu
  -> global menu custom AuthProfileMenu
  -> account details
  -> sign out
```

`useAuth()` is the shared product boundary for token, current user, initialization, `isLoggedIn`, identify, login, registration, and logout.

`/login` is explicitly included in static prerender routes.

### Auth verification still required

Do not mark Auth Foundation DONE until the user locally verifies:

```text
1. numbered schema applies 003_create_auth.sql
2. anonymous app remains usable
3. anonymous header shows blue Login FAB
4. unknown identifier enters registration step
5. weak/mismatched password is rejected in UI
6. valid registration returns a token and signs in
7. refresh restores account through local token + /api/auth/me
8. profile FAB opens the custom global menu
9. logout clears session and returns header to anonymous state
10. existing identifier takes the login branch
11. wrong password shows an inline error
12. correct password logs in again
13. pnpm generate succeeds and includes /login
```

## After Auth verification

Resume Cloud Draft Sync with account ownership:

```text
prompt_drafts.user_id
protected/account-scoped Cloud Draft writes
GET /api/drafts for current user
merge/hydrate localStorage on /create
multi-device draft recovery
convert /history from Wizard runs to Draft History
remove History from primary header navigation
add History entry inside the Drafts menu
```

Exact local/server merge and conflict policy must be frozen before implementation. Multi-device conflict resolution beyond a simple deterministic policy remains separate work.

## Current intentional debt / deferred work

- Cloud Draft account ownership/list/rehydration (next after Auth verification);
- production auth rate limiting / abuse controls;
- email verification;
- password reset/recovery;
- OAuth/social login;
- multi-device merge/conflict resolution;
- optimistic revision conflict enforcement;
- server-side draft delete semantics;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify the optional Auth Foundation end to end from schema -> `/login` -> header/profile menu -> logout/login -> static generation.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
