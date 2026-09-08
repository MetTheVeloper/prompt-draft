# Milestone 21.5 Phase 4B.5A — Description Backfill Approval Record

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Status:

```text
FOUNDER CONTENT APPROVED
EXECUTION TOOLING READY
DATABASE BACKFILL PENDING FOUNDER-LOCAL RUN
PUBLIC CUTOVER NOT STARTED
PHASE 4B NOT ACCEPTED
```

## Approved content

The canonical founder-approved description manifest is:

```text
backend/data/prompt-archive-descriptions.v1.json
```

Manifest properties:

```text
approved production-ready published items: 100
localized fields per item: en + fa
description source: founder-reviewed public presentation metadata only
protected Prompt body used: NO
protected variants used: NO
manifest SHA-256: b4c3279b7e9496e018c85f66e4c7debe90b8b7e6510a84e1d2df56285b3d75a3
```

The approved descriptions were authored from the safe published inventory only:

```text
public numeric id
localized title
public tags
public preview URL
publication metadata
```

No protected Prompt body or variants were used to author the public descriptions.

## Founder-approved staging/test cleanup

The two published staging/test Archive items below are explicitly excluded from the canonical manifest and approved for deletion:

```text
#9002  English title guard: TEST
#9003  English title guard: From Grassias
```

The cleanup runner:

```text
npm run archive:prune-description-test-items
```

must fail closed unless both exact public IDs are still published and still have the expected English titles.

Database cleanup intentionally:

```text
deletes the two Archive rows
lets Archive image/tag FKs cascade
deletes generic prompt_archive_item unlock records for public ids 9002/9003
preserves source Drafts
preserves users
preserves historical economy ledger events
```

Persisted Archive storage objects referenced by `storage_key` / `thumbnail_storage_key` are deleted after the database transaction. If external object deletion fails, the runner reports the detached object keys explicitly; the Archive rows remain deleted and no broken database references are retained.

## Approved backfill execution

After the two staging/test rows are removed, the founder-approved backfill command is:

```text
npm run archive:backfill-approved-descriptions
```

The existing backfill guard requires an exact match between the current published public IDs and the 100 manifest IDs before any description update occurs.

Backfill remains transactional and updates only:

```text
prompt_archive_items.descriptions
```

It does not select or derive content from:

```text
prompt
variants
source Draft content
```

## Required verification before public cutover

After cleanup + backfill:

1. Re-export the published description inventory.
2. Confirm published count = 100.
3. Confirm 9002 and 9003 are absent.
4. Confirm every remaining published row has non-empty EN and FA descriptions.
5. Re-run description/backfill/public-prompt regression tests.
6. Only then proceed to strict published-localization enforcement and public DTO/UI/SEO cutover.

4B.5A is not complete and Phase 4B is not accepted until those later gates are satisfied.
