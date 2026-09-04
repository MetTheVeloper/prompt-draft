# Milestone 17 — Phase 17B: Server read APIs + fallback repository

Status: `DONE / USER-VERIFIED LOCALLY`

Branch: `feature/docker-local-api`

Phase 17A was completed and locally verified first. Phase 17B then moved Prompt Archive reads behind a normalized API-first repository while retaining the current local JSON/images as a recoverable fallback.

The user explicitly accepted and closed Phase 17B on 2026-09-04 after local browser verification of the API-backed list, server-side filtering/search behavior, and backend-offline fallback behavior.

A fresh standalone `pnpm generate` output was not pasted specifically after the Phase 17B browser checks; static generation remains a release invariant and is required again by the Phase 17C/final Milestone gates.

## Implemented scope

```text
backend/src/archive.mjs
backend/src/index.mjs -> Archive route dispatch
app/types/promptArchive.ts -> normalized list/detail DTOs
app/composables/usePromptArchive.ts -> API-first repository + local fallback adapter
app/pages/prompts.vue -> server-side query flow
app/components/prompts/PromptItem.vue -> normalized card DTO
app/components/prompts/PromptDetail.vue -> normalized detail DTO
```

Not part of 17B:

```text
/manage/archive
Archive mutations
local image preparation
Object Storage / ArvanCloud
fallback snapshot export
```

## Product read authorization

The product Archive requires:

```text
authenticated account
+ email present on account
```

The backend independently enforces:

```text
no valid session -> 401
valid session without email -> 403 PROFILE_REQUIREMENT
valid session with email -> Archive read allowed
```

Local fallback is never used to bypass an authoritative 401/403/other non-5xx HTTP decision.

## Read API

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

Search runs server-side across Telegram id, EN/FA title, source title, prompt body, and tag slugs.

List responses are card-oriented and omit full prompt bodies/full image arrays.

### GET /api/archive/:telegramMessageId

Returns the published item detail with localized title, full prompt, ordered images, variants, Telegram metadata, and previous/next navigation summaries.

## Cursor model

Pagination uses keyset ordering based on:

```text
publishedAt
telegram message id
```

The local fallback adapter uses the same cursor payload shape so a later recoverable API failure can continue the current Archive query without introducing another pagination model.

## Normalized frontend boundary

Runtime UI consumes localized titles and normalized image objects rather than the legacy `titleKey` / raw string-array representation.

The current V2 JSON shape remains only as fallback input and is immediately adapted into the same DTO used by API responses.

## Fallback policy

Recoverable fallback triggers include:

```text
network failure
request timeout
5xx Archive response
invalid JSON
2xx response that fails the normalized DTO contract
```

Fallback source remains:

```text
public/data/prompts.json
public/prompts/<telegram-message-id>/*
```

No fallback for:

```text
400
401
403
404
other authoritative non-5xx responses
```

A full browser reload while the whole API is offline is not treated as offline authentication; the valid test is to initialize the SPA session first and then interrupt Archive API availability.

## Local verification recorded

The user demonstrated/confirmed:

```text
anonymous GET /api/archive -> HTTP 401 Authentication required
normal /prompts session reads through /api/archive
100 imported prompts visible through server path
changing model/tag filters triggers new API requests with correct results
search triggers server request with correct result
backend-offline Archive request fails recoverably
public/data/prompts.json is then requested and UI continues rendering from fallback
```

The user described the API/filter behavior as working without errors and explicitly declared the phase closed.

## Next phase

```text
Phase 17C — Manage Archive + local image preparation
```

Phase 17C introduces permission-aware management, draft-first mutations, audit entries, canonical tag selection, and provider-neutral local WebP preparation. Cloud upload remains Phase 17D.
