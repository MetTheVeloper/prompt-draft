# Milestone 17 — Phase 17E: Snapshot export + platform closure

Status: `PLANNED / NOT STARTED`

Branch: `feature/docker-local-api`

Phase 17E is the final Milestone 17 phase. It begins only after Phase 17D's post-fix `pnpm generate` succeeds and 17D is marked `DONE / LOCALLY VERIFIED`.

## Goal

Close the gap between the now-authoritative PostgreSQL/Arvan Archive and the static deploy fallback.

Current primary path:

```text
PostgreSQL
  -> /api/archive list/detail
  -> /prompts

/manage/archive
  -> browser image preparation
  -> backend
  -> Arvan Object Storage
  -> prompt_archive_images
```

Current fallback is still based on the pre-platform static snapshot:

```text
public/data/prompts.json
public/prompts/<telegram-message-id>/...
```

Phase 17E makes that fallback generated/repeatable instead of manually-maintained legacy state.

## Required work

### 1. Archive snapshot exporter

Add a repeatable command that exports the current published Archive from PostgreSQL into the static fallback contract.

Preferred command shape:

```text
pnpm archive:snapshot
```

The exporter must:

```text
read published Archive items from PostgreSQL
preserve localized title.en/title.fa
preserve Telegram IDs and URLs
preserve prompt body
preserve dates
preserve model fields
preserve canonical tags
preserve variants
preserve image ordering
emit deterministic output
avoid hand-edit requirements
```

The exported runtime contract should be normalized and match the API DTO semantics as closely as practical. The old `titleKey`-based format should no longer be the long-term generated format.

### 2. Fallback compatibility

Update `usePromptArchive()` fallback parsing so the generated normalized snapshot is the canonical fallback format.

A temporary reader for the old V2 JSON may remain only if needed for migration/backward compatibility; it should not remain the format new exports generate.

Fallback must continue to obey the existing security/product rule:

```text
network / timeout / 5xx / unusable response -> fallback allowed
401 / 403 -> fallback forbidden
```

### 3. Managed media fallback strategy

New managed Archive media now lives on Arvan. A static fallback snapshot must deliberately handle those images.

Preferred resilient option to evaluate:

```text
snapshot command
  -> reads managed image URLs
  -> mirrors required fallback image assets into public/prompts/<telegram-id>/...
  -> snapshot JSON points at the local mirrored paths
```

This keeps the fallback independent from both Prompt Draft backend and Arvan availability.

If a different strategy is selected, document the tradeoff explicitly; do not silently call remote CDN URLs a fully-local fallback.

### 4. Legacy media migration decision

Phase 17D verified cloud-backed media for new/managed Archive entries but did not bulk-migrate every legacy `public/prompts` image into Arvan.

Phase 17E must make an explicit decision:

```text
A. bulk-migrate legacy media to Arvan while retaining local mirrored fallback
or
B. keep legacy media local on the server path and use Arvan only for newly-managed media
```

Do not delete the existing local legacy assets during this decision.

If bulk migration is implemented, it must be rerunnable/idempotent and preserve:

```text
item/image ordering
existing image counts
full vs thumbnail semantics
fallback local files
```

### 5. Snapshot parity report

The generated fallback must be compared against authoritative published DB state.

At minimum verify:

```text
published item count
Telegram IDs
EN/FA titles
prompt bodies
published dates
model fields
tags
variants
image counts
image ordering
```

The export should fail non-zero on parity/validation failure rather than silently producing a partial deploy snapshot.

### 6. Final failure-mode verification

Verify all three states:

```text
backend online
  -> source=api

backend unavailable/recoverable failure
  -> source=fallback
  -> current exported data still visible

401/403
  -> no fallback downgrade
```

A newly-created managed/published item must be present in the generated fallback after snapshot generation.

### 7. Final localization + Manage verification

Confirm:

```text
EN UI
FA UI
/manage/archive
/manage/archive?edit=<telegram-id>
Prompt card admin Edit FAB
normal-user denial
```

### 8. Final documentation sync

At Milestone closure update at least:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

Phase documents remain the detailed implementation history.

### 9. Release invariant

Final command:

```text
pnpm generate
```

Milestone 17 is `DONE` only after the user runs the final verification and explicitly confirms it.

## Phase 17E non-goals

Do not expand closure into unrelated product features such as:

```text
Telegram bot ingestion
Telegram scraping
public submissions
likes/favorites/comments
AI tag generation
new search engine technology
presigned browser uploads unless a demonstrated scaling need exists
CDN purge automation when immutable URLs already avoid it
```

## Start checklist

Before implementation, inspect:

```text
public/data/prompts.json
public/prompts/
app/types/promptArchive.ts
app/composables/usePromptArchive.ts
backend/src/archive.mjs
backend/src/archiveStorage.mjs
backend/src/import-prompt-archive.mjs
prompt_archive_items
prompt_archive_images
prompt_archive_tags
```

Then confirm the normalized snapshot schema and managed-media mirroring strategy before writing the exporter.
