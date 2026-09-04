# Milestone 17 — Phase 17E: Snapshot export + platform closure

Status: `DONE / LOCALLY VERIFIED`

Branch: `feature/docker-local-api`

Verified: 2026-09-04

Phase 17E is the final Milestone 17 phase. It closes the gap between the authoritative PostgreSQL/Arvan Archive and the static deploy fallback.

## Final architecture

Primary path:

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

Generated fallback path:

```text
PostgreSQL published Archive
  -> pnpm archive:snapshot
  -> public/data/prompts.json schemaVersion 3
  -> local fallback media
  -> /prompts fallback reader
```

## Snapshot command

Root command:

```text
pnpm archive:snapshot
```

Backend exporter:

```text
backend/src/export-prompt-archive-snapshot.mjs
```

The exporter writes through the dedicated snapshot output mount and does not require the application to manually edit the fallback JSON.

## V3 snapshot contract

Generated file:

```text
public/data/prompts.json
```

Schema:

```text
schemaVersion = 3
```

Localized titles are stored directly:

```text
title.en
title.fa
```

The fallback therefore does not depend on runtime i18n title keys.

The V3 reader remains backward-compatible with legacy V2 data where required.

## Media strategy

Final decision:

```text
legacy Archive media
  -> stays on existing local public/prompts paths

managed Arvan media
  -> cloud URL is primary runtime media
  -> mirrored into public/prompts/_snapshot for fallback
```

Managed mirror paths are stable and local to the generated fallback namespace.

The exporter does not delete the previous usable mirror before a new export succeeds. Stale mirrored files are pruned only after successful export/parity completion.

This phase intentionally does not bulk-migrate the existing legacy image library to Arvan solely for uniformity.

## Bootstrap compatibility

The Archive importer accepts the new V3 snapshot shape so a fresh database can still bootstrap published Archive catalog state from the generated snapshot.

Important boundary:

```text
snapshot = published catalog fallback/bootstrap
snapshot != complete Manage backup
```

Draft/Archived management state is not expected to be reconstructed from the static snapshot.

Managed takeover safeguards remain active so future bootstrap/import behavior cannot overwrite managed content silently.

## Parity gate

The exporter compares published PostgreSQL state with the generated snapshot and fails when required content diverges.

Final locally verified run:

```json
{
  "archiveSnapshot": "PARITY_OK",
  "ok": true,
  "publishedItemCount": 101,
  "snapshotItemCount": 101,
  "mismatchCount": 0,
  "schemaVersion": 3,
  "mirroredManagedImageCount": 2,
  "legacyMediaStrategy": "local-assets-retained"
}
```

Counts above describe the verification-time catalog and may change as Archive content changes. The invariant is parity, not the hard-coded count.

## Fallback verification

The user locally verified the final failure mode:

```text
API running
  -> /prompts source = api

API stopped
  -> recoverable API request fails
  -> /prompts source = fallback
  -> V3 snapshot renders successfully
```

The page exposed:

```text
data-archive-source = fallback
```

Managed media was available through the local snapshot mirror rather than requiring Arvan during fallback rendering.

## Release verification

The user also confirmed successful:

```text
pnpm generate
```

after Phase 17E.

## Completion

Phase 17E is complete and Milestone 17 is closed.

See final milestone source of truth:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```
