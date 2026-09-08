# Milestone 21.5 — Phase 4B.5A Description Cutover Checkpoint

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS 4B.5A SLICE**

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

## 1. Accepted data checkpoint

Founder-local execution completed the approved staging/test cleanup and localized-description backfill.

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

The PowerShell `stdout -> Set-Content` export path visibly mojibakes non-ASCII characters in the exported artifact. The corruption pattern round-trips deterministically back to the expected UTF-8 strings, including Persian copy and characters such as `×` and `–`. Browser verification confirmed the canonical Persian content renders correctly, so this remains classified as an export-shell encoding artifact rather than corrupted database content.

---

## 2. Accepted enforcement cutover

Migration:

```text
backend/sql/026_prompt_archive_published_localization_constraint.sql
```

Published rows require complete authoritative presentation content:

```text
title.en
title.fa
description.en
description.fa
```

The database constraint is conditional on:

```text
status = 'published'
```

so draft/archived lifecycle remains compatible with incomplete working data.

Application-level enforcement also exists at the Admin API publish boundary. Admin create/update description validation is no longer backward-optional after the founder-approved backfill.

Founder-local migration verification:

```text
Database schema applied: 026_prompt_archive_published_localization_constraint.sql
```

---

## 3. Accepted public read-model cutover

Public endpoint remains:

```text
GET /api/public/prompts/:id
```

The explicit public projection now includes:

```ts
description: {
  en?: string
  fa?: string
}
```

The public SQL selects localized descriptions while preserving the hard security invariant:

```text
no SELECT of protected Prompt body
no SELECT of variants
no source Draft payload
no storage keys
no unlock/economy/account state
```

Locale availability now means complete authoritative presentation content:

```text
available locale
  = non-empty localized title
  + non-empty localized description
```

No fallback localization is synthesized.

---

## 4. Accepted frontend / SEO cutover

Public Prompt routes:

```text
/prompt/:id
/fa/prompt/:id
```

now use the founder-authored localized description as the single source of truth for:

```text
visible Public Prompt description
meta description
og:description
twitter:description
CreativeWork.description
```

The previous generic implementation-facing Public Prompt description copy is no longer the rendered description source.

Founder browser verification confirmed both EN and FA authored descriptions render correctly on the Public Prompt route.

The protected CTA remains route-separated and continues to target the localized protected product route:

```text
/prompts?id=:id
/fa/prompts?id=:id
```

---

## 5. Founder-local verification evidence

Production-like Cloudflare stack rebuild/start:

```text
frontend build -> PASS
API build -> PASS
db -> healthy
translator -> healthy
api -> healthy
frontend -> healthy
cloudflared -> started
```

Expected build warnings remained non-blocking and unrelated to 4B.5A:

```text
duplicated compilePromptOutput import warning
large minified chunk warnings
sourcemap warning from module-preload-polyfill
```

Backend verification:

```text
docker compose exec api npm run test:archive-description-input
  -> PASS

docker compose exec api npm run test:archive-published-localization
  -> 3/3 PASS

docker compose exec api npm run test:public-prompt
  -> 9/9 PASS
```

Frontend / contract verification:

```text
pnpm test:public-prompt-web
  -> 5/5 PASS

pnpm test:public-prompt-seo
  -> 4/4 PASS

pnpm test:public-prompt-description
  -> 3/3 PASS

pnpm test:public-prompt-links
  -> 3/3 PASS

pnpm test:interaction-polish
  -> 4/4 PASS

pnpm seo:audit-routes:strict
  -> PASS, 445 source files, zero locale-routing hazards
```

Visual founder smoke:

```text
EN Public Prompt authored title + description -> PASS
FA Public Prompt authored title + description -> PASS
Persian rendering / direction -> PASS
protected Prompt product route remains visually/functionally separate -> PASS
```

---

## 6. 4B.5A acceptance decision

```text
4B.5A storage/admin authoring        -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A founder-reviewed backfill      -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A publish enforcement            -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A public DTO + locale contract   -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A visible copy + SEO cutover     -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A overall                        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
```

This acceptance closes only **4B.5A**.

It does **not** accept Phase 21.5.4B as a whole.

---

## 7. Next slice

```text
4B.5B Shared Prompt Presentation Shell -> NEXT
4B.5C Public Discovery Visual Layer     -> NOT STARTED
4B.5D Final Regression / Acceptance     -> NOT STARTED
Phase 21.5.4B                           -> NOT ACCEPTED
```

4B.5B must preserve all accepted 4B.5A contracts and the existing public/protected data-source boundary.
