# Milestone 21.5 — Phase 4B.5A Description Cutover Checkpoint

Status: **IMPLEMENTED / BACKFILL FOUNDER-LOCAL VERIFIED / CUTOVER VERIFICATION NEXT / NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

Founder-approved content record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_BACKFILL_APPROVAL.md
backend/data/prompt-archive-descriptions.v1.json
```

---

## 1. Founder-verified data checkpoint

Founder-local execution completed the approved staging/test cleanup and description backfill.

Verified outcomes:

```text
#9002 removed
#9003 removed
associated test unlock/storage cleanup completed
founder-approved EN/FA description manifest applied
100 published Archive rows updated
post-backfill inventory publishedCount = 100
100 unique published public IDs
100/100 description.en non-empty
100/100 description.fa non-empty
9002 absent
9003 absent
```

The post-backfill inventory was supplied by the founder and reviewed on 2026-09-08.

The PowerShell `stdout -> Set-Content` export path visibly mojibakes non-ASCII characters in the exported artifact. The corruption pattern round-trips deterministically back to the expected UTF-8 strings, including Persian copy and characters such as `×` and `–`. This is treated as an export-shell encoding artifact, not evidence of corrupted canonical description content in the database.

---

## 2. Enforcement cutover

Migration:

```text
backend/sql/026_prompt_archive_published_localization_constraint.sql
```

Published rows now require complete authoritative presentation content:

```text
title.en
title.fa
description.en
description.fa
```

The constraint is conditional on:

```text
status = 'published'
```

so draft/archived lifecycle remains compatible with incomplete historical working data.

Application enforcement also exists at the Admin API boundary:

```text
POST /api/admin/archive/:id/publish
```

Before the publish mutation, the API checks persisted localized title + description and returns a validation response when localization is incomplete.

Admin create/update description validation is no longer backward-optional after the approved backfill.

---

## 3. Public read-model cutover

Public endpoint remains:

```text
GET /api/public/prompts/:id
```

The only new intended public field is:

```ts
description: {
  en?: string
  fa?: string
}
```

The public SQL now selects:

```text
items.descriptions AS description
```

and still does not select protected Prompt content.

Locale availability is now based on complete presentation content:

```text
available locale = non-empty localized title + non-empty localized description
```

Incomplete locales are not advertised and no fallback localization is synthesized.

Protected exclusions remain unchanged:

```text
prompt
variants
sourceTitle/source Draft identity
storage keys
unlock state
balance/economy
permissions/viewer state
```

---

## 4. Frontend / SEO cutover

`PublicPrompt` browser/SSR normalization now requires localized descriptions and exact agreement between:

```text
title locales
description locales
availableLocales
```

Public Prompt route:

```text
/prompt/:id
/fa/prompt/:id
```

uses the authored localized description as the single source for:

```text
visible hero description
meta description
og:description
twitter:description
CreativeWork.description
```

The previous generic implementation-facing `growth.publicPrompt.description` copy is no longer used by the Public Prompt page.

---

## 5. Tests added/updated

Backend:

```text
test:archive-description-input
test:archive-published-localization
test:public-prompt
```

Frontend/contracts:

```text
test:public-prompt-web
test:public-prompt-seo
test:public-prompt-description
```

Regression gates remain required:

```text
test:public-prompt-links
test:interaction-polish
seo:audit-routes:strict
production-like build/runtime
```

---

## 6. Required founder-local verification next

Apply the new migration and rebuild staging code, then run:

```text
docker compose exec api node src/create-schema.mjs

docker compose exec api npm run test:archive-description-input
docker compose exec api npm run test:archive-published-localization
docker compose exec api npm run test:public-prompt

pnpm test:public-prompt-web
pnpm test:public-prompt-seo
pnpm test:public-prompt-description
pnpm test:public-prompt-links
pnpm test:interaction-polish
pnpm seo:audit-routes:strict
```

Staging smoke must confirm on at least one EN/FA Prompt pair:

```text
/api/public/prompts/:id returns description.en + description.fa
/prompt/:id shows authored English description
/fa/prompt/:id shows authored Persian description
meta/OG/Twitter description uses the same authored localized copy
CreativeWork.description uses the same authored localized copy
canonical/hreflang/x-default unchanged
Open full prompt still routes to protected localized /prompts?id=:id
no protected Prompt/variant/storage/economy/viewer data leaks
NUXT_PUBLIC_NOINDEX remains authoritative on grassic.ir
```

Do not start 4B.5B until this cutover verification is complete.

---

## 7. Current state

```text
4B.5A storage/admin authoring        -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A founder-reviewed backfill      -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A publish enforcement            -> IMPLEMENTED / VERIFY NEXT
4B.5A public DTO + locale contract   -> IMPLEMENTED / VERIFY NEXT
4B.5A visible copy + SEO cutover     -> IMPLEMENTED / VERIFY NEXT
4B.5A overall                        -> IN PROGRESS / FINAL VERIFICATION NEXT
4B.5B                                -> NOT STARTED
Phase 4B                             -> NOT ACCEPTED
```
