# Milestone 17 — Phase 17B: Server read APIs + fallback repository

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

Phase 17A is complete and locally verified. Phase 17B is not DONE until the user verifies the server path, recoverable fallback behavior, access behavior, and a final successful `pnpm generate`.

## Scope implemented

Phase 17B moves Prompt Archive reads behind a normalized server-first repository while retaining the current local JSON/images as a recoverable fallback.

Implemented:

```text
backend/src/archive.mjs
backend/src/index.mjs -> Archive route dispatch
app/types/promptArchive.ts -> normalized list/detail DTOs
app/composables/usePromptArchive.ts -> API-first repository + local fallback adapter
app/pages/prompts.vue -> server-side query flow
app/components/prompts/PromptItem.vue -> normalized card DTO
app/components/prompts/PromptDetail.vue -> normalized detail DTO
```

Intentionally not implemented in this phase:

```text
/manage/archive
Archive mutation APIs
Archive admin list
image-processing utility extraction
Archive image-manager UI
Object Storage / ArvanCloud
fallback snapshot export command
removal of current public/data/prompts.json
```

## Product read authorization

The existing `/prompts` product gate remains:

```text
authenticated account
+ email present on account
```

The backend Archive read endpoints independently enforce the same requirement:

```text
no valid session -> 401
valid session without email -> 403 PROFILE_REQUIREMENT
valid session with email -> Archive read allowed
```

This makes the Phase 17B no-auth-fallback invariant authoritative rather than UI-only.

The `archive.view` / `archive.manage` permissions introduced in Phase 17A are reserved for the future Manage Archive workspace. They are not required for normal product Archive reads.

## Read API contract

### GET /api/archive

Supported query parameters:

```text
limit    default 24, max 100
cursor   opaque base64url keyset cursor
search   max 200 characters
model    dall-e | gpt-image-1
tag      canonical lowercase tag slug
sort     newest | oldest
```

Only `status = published` rows are returned.

Search is performed server-side across:

```text
Telegram message id
English title
Persian title
source title
prompt body
tag slugs
```

List response is card-oriented and deliberately omits full prompt bodies and full image arrays:

```text
id                        Telegram message id
title                     { en, fa }
publishedAt
telegramUrl
model.previewGeneratedWith
model.optimizedFor[]
tags[]
coverImage                 { position, fullUrl, thumbnailUrl } | null
imageCount
totalCount
hasMore
nextCursor
availableTags[]
```

Image delivery preference is provider-neutral:

```text
fullUrl      -> full_url, otherwise legacy source_path
thumbnailUrl -> thumbnail_url, otherwise full_url, otherwise legacy source_path
```

This lets Phase 17B read current imported local paths while remaining compatible with later managed/cloud images.

### GET /api/archive/:telegramMessageId

Only published items are visible.

Detail adds:

```text
sourceTitle
prompt
all ordered images
variants
previousItem
nextItem
```

Previous/next items contain only Telegram message id + localized title, enough to preserve the current detail-navigation UX without loading the entire Archive.

## Cursor semantics

List pagination is keyset-based using:

```text
publishedAt
telegram message id
```

The frontend fallback adapter uses the same cursor payload shape. This is deliberate: a page loaded from PostgreSQL can continue through the local snapshot if a later recoverable read fails, without inventing a second pagination model.

## Normalized frontend contracts

Runtime Prompt Archive UI no longer consumes `titleKey` or raw image string arrays.

Normalized types include:

```text
PromptArchiveLocalizedTitle
PromptArchiveImage
PromptArchiveListItem
PromptArchiveDetailItem
PromptArchiveNavigationItem
PromptArchiveListResponse
PromptArchiveDetailResponse
```

The old V2 JSON types remain only as legacy fallback input.

The UI consumes one normalized shape whether the source is:

```text
api
fallback
```

Localized titles are rendered directly from Archive content:

```text
title.en
title.fa
```

The current legacy fallback adapter temporarily resolves `titleKey` from the existing EN/FA locale objects, then immediately normalizes it into the same localized-title DTO.

## Server-first repository + fallback rules

Primary path:

```text
/prompts
  -> usePromptArchive()
  -> GET /api/archive or GET /api/archive/:id
  -> validate/normalize response
  -> normalized DTO
  -> UI
```

Recoverable fallback triggers:

```text
network failure
request timeout
5xx Archive API response
invalid JSON response
2xx response that fails the normalized Archive contract
```

Fallback source:

```text
public/data/prompts.json
public/prompts/<telegram-message-id>/*
```

Hard failures that do NOT fall back:

```text
401
403
400
404
other authoritative non-5xx HTTP failures
```

The critical invariant is that local public JSON can improve availability but can never bypass an authoritative access decision.

Archive API requests use a 5-second client timeout.

## /prompts behavior

List behavior is now server-driven:

```text
initial 24-item page
search -> API query
model filter -> API query
tag filter -> API query
sort -> API query
Load more -> cursor API query
```

The frontend no longer downloads every prompt body merely to render the list.

The detail route remains compatible with the existing URL form:

```text
/prompts?id=<telegram-message-id>
```

The detail UI fetches only that item and its navigation neighbors.

For local verification, the list root exposes the resolved read source as:

```text
data-archive-source="api"
data-archive-source="fallback"
```

This is diagnostic state only; it does not change the product UI.

## Existing static fallback limitation

A full browser refresh while the entire API is offline cannot re-establish an authenticated session because `useAuth()` itself validates the stored token against the backend. The Archive fallback therefore must not be interpreted as offline authentication.

Correct fallback verification is:

```text
1. initialize/login while API is available
2. open /prompts successfully
3. stop API while the SPA session remains initialized
4. trigger a new Archive read (search/filter/sort/detail/load-more)
5. verify fallback snapshot is used
```

This preserves the security boundary: fallback covers Archive read availability, not authentication availability.

## Local verification gate

### 1. Rebuild API

From repository root:

```powershell
docker compose up -d --build db api
```

No new SQL migration is introduced by Phase 17B. Existing Phase 17A schema/import data must remain present.

### 2. Anonymous API denial

```powershell
curl.exe -i http://127.0.0.1:4000/api/archive
```

Expected:

```text
HTTP/1.1 401 Unauthorized
```

No local fallback is involved at the backend boundary.

### 3. Normal API path in browser

Use an account that already has email, open `/prompts`, and inspect Network.

Expected first Archive request resembles:

```text
GET /api/archive?limit=24&sort=newest
200
```

In DevTools console:

```js
document.querySelector('.prompts-page')?.dataset.archiveSource
```

Expected:

```text
api
```

Verify:

```text
initial cards render
100 total items are reported with current imported data
search creates server request and returns correct matches
model filter creates server request
tag filter creates server request
newest/oldest create server requests
Load more appends the next cursor page without duplicates
```

### 4. Detail path

Open representative items, including:

```text
/prompts?id=511
/prompts?id=419
```

Expected Network request:

```text
GET /api/archive/511
GET /api/archive/419
```

Verify:

```text
localized title
images
prompt body
Telegram action
previous/next navigation
variant UI for message 419
```

### 5. Recoverable fallback

Keep the browser session and `/prompts` SPA open, then stop API:

```powershell
docker compose stop api
```

Without reloading the whole application, change search/filter/sort or navigate to another Prompt detail.

Expected:

```text
Archive API request fails at network layer
repository reads public/data/prompts.json
UI remains functional
list source becomes fallback
```

For list view, verify in console:

```js
document.querySelector('.prompts-page')?.dataset.archiveSource
```

Expected:

```text
fallback
```

Restart API afterward:

```powershell
docker compose start api
```

### 6. 401/403 must never downgrade to fallback

Anonymous browser access remains blocked by the existing `/prompts` gate, and direct anonymous API access must remain `401`.

For an authenticated username-only account, the existing Email Requirement state must remain visible and Archive content must not become available through local fallback. If the Archive endpoint is called with that account token directly, it must return `403 PROFILE_REQUIREMENT`.

### 7. Release invariant

Run:

```powershell
pnpm generate
```

Phase 17B remains `IMPLEMENTED / AWAITING LOCAL VERIFICATION` until all required behavior above is confirmed by the user.

## Next phase after verification

Only after Phase 17B is locally verified:

```text
Phase 17C — Manage Archive + local image preparation
```

That phase adds `/manage/archive`, permission-aware admin reads/mutations, canonical tag selection, and reusable local image preparation. Object Storage remains later scope.
