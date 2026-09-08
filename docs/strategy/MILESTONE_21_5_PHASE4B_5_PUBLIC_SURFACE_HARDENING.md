# Milestone 21.5 — Phase 4B.5 Public Surface Hardening

Status: **PLANNED / FOUNDER AGREED / IMPLEMENTATION NEXT / NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent architecture:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
```

Verification history:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
```

This document is the current continuation source of truth for the final hardening work before Phase 4B acceptance.

---

## 1. Why 4B.5 is expanded before acceptance

4B.1–4B.4 established and verified the public Prompt data boundary, SSR route, SEO metadata and acquisition-link migration.

Before final acceptance, founder review identified three product-surface gaps that belong to the same Public Prompt architecture rather than a separate milestone:

```text
1. Public Prompt copy is implementation/process copy instead of Prompt-specific content.
2. /prompt/:id and protected /prompts?id=<id> duplicate closely related visual presentation.
3. /discover/:slug has the correct structure but lacks the media/cinema presentation expected from a primary acquisition surface.
```

The first item changes the public Prompt contract itself. Closing 4B first and immediately reopening its DTO/schema/SEO contract in a new milestone would create an artificial acceptance boundary.

Therefore 4B.5 is expanded into narrow hardening slices, followed by the original final verification/acceptance gate.

---

## 2. Verified checkpoint before hardening

The following remain verified and must not regress:

```text
4B.1 backend public projection       -> FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route    -> FOUNDER-LOCAL VERIFIED
4B.3 Public Prompt SEO metadata      -> FOUNDER-LOCAL VERIFIED
4B.4 public-link migration           -> FOUNDER-LOCAL VERIFIED
Phase 4B acceptance                  -> NOT ACCEPTED
```

Post-4B.4 interaction polish was also founder-verified on 2026-09-08:

```text
Prompt Archive card body click -> localized protected /prompts?id=<id>
owner /user Draft card click -> existing three-dot point menu at click position
Home category header -> localized /discover/:slug
Home Prompt body -> localized /prompt/:id
Home controls retain independent behavior
Home previous/next arrows follow active LTR/RTL direction
pnpm test:interaction-polish -> 4/4 PASS
pnpm test:public-prompt-links -> 3/3 PASS
pnpm seo:audit-routes:strict -> PASS, 445 files, zero routing hazards
production-like pnpm stack build -> PASS
```

These behaviors are regression requirements for the remaining work.

---

## 3. 4B.5A — Localized Public Prompt Description Contract

### Objective

Replace generic implementation-facing Public Prompt copy with authoritative Prompt-specific localized descriptions that are suitable for both visible presentation and SEO metadata.

### Public domain contract

Target public DTO addition:

```ts
description: {
  en?: string
  fa?: string
}
```

The description is intentionally public presentation content.

It is **not** derived from or copied from the protected Prompt body.

### Single source of truth

The localized description is the canonical content source for:

```text
visible Public Prompt description
<meta name="description">
og:description
twitter:description
CreativeWork.description
```

A small deterministic SEO sanitizer/length normalizer may be applied at render time if required, but V1 must not introduce a separate uncontrolled `seoDescription` content field.

### Admin authoring

The Archive create/edit management surface must add localized Description inputs beside the localized Title inputs:

```text
Title EN *
Title FA *
Description EN *
Description FA *
```

For any locale treated as authoritative/available, both title and description must be present and valid.

Current Archive workflows normally require both EN and FA; the implementation should preserve that product rule unless an explicit locale-policy change is made later.

### Existing data / migration sequence

Do not make a destructive strict-schema change before existing published rows are handled.

Required implementation sequence:

```text
1. inspect current Archive schema, create/edit validation and migration head
2. allocate the next migration number only after branch inspection
3. add localized description storage in a backward-safe form
4. add Admin create/edit inputs and validation
5. backfill current published Archive data with founder-reviewed EN/FA descriptions
6. make publish/update validation require complete localized presentation content
7. add description to the public read-model allowlist
8. update frontend PublicPrompt type/normalizer
9. update visible Public Prompt copy and SEO projection
10. add contract/backfill/leakage tests
```

If database-level NOT NULL enforcement is desirable, it must happen only after backfill is complete and compatible with draft lifecycle semantics. Application-level publish validation remains required either way.

### Locale availability

Public locale availability must represent complete authoritative localized presentation content, not a title-only shell.

Conceptually:

```text
locale available
  = valid localized title
  + valid localized description
```

No fake fallback localization is allowed.

### Security invariant

Description becomes a new explicit public field, but every existing protected exclusion remains unchanged:

```text
no Prompt body
no variants
no source Draft payload
no storage keys
no unlock/economy/account state
```

---

## 4. 4B.5B — Shared Prompt Presentation Shell

### Objective

Remove duplicated visual structure between:

```text
Public Prompt      /prompt/:id
Protected Product  /prompts?id=<id>
```

without merging their routes, data sources or authorization models.

### Hard boundary

The shared layer is **presentation only**.

```text
/prompt/:id
  -> public sanitized DTO
  -> SSR/indexable acquisition surface

/prompts?id=<id>
  -> protected detail API/product state
  -> auth/email/unlock/economy behavior
```

The public page must never consume protected detail data just because the visual shell is shared.

### Target component shape

The exact component name may be chosen during implementation, but the intended responsibility is equivalent to:

```text
PromptPresentation
├── cinema / preview-media background
├── localized title
├── localized description
├── tags
├── id / publication date / model metadata
├── shared responsive LTR/RTL layout
├── slot: primary actions
├── slot: secondary actions
├── slot: navigation / footer
└── slot: extended protected/public content
```

The shared component must remain unaware of:

```text
balance
unlock state
permissions
authenticated viewer
protected Prompt body
variants
```

Those belong in the protected page slots/children.

### Visual direction

Reuse the existing protected Prompt cinema/background language rather than maintaining two near-identical hero systems.

Preferred media behavior:

```text
public preview images
  -> existing reusable cinema/slider primitive where SSR-safe
  -> first public image provides SSR-visible visual fallback
  -> client enhancement may animate/slide additional previews
```

Public Prompt should no longer read like an engineering status report. It should present the Prompt as a real acquisition/product preview using its authored description.

### Route-specific content

Examples of protected-only behavior:

```text
unlock/copy controls
previous/next protected catalog navigation
protected Prompt exploration/content
viewer/economy state
```

Examples of public-only behavior:

```text
Open full prompt CTA -> localized protected /prompts?id=<id>
public-safe acquisition copy/structure
public SEO semantics
```

Slots/composition should preserve these differences without duplicating the shared visual shell.

---

## 5. 4B.5C — Public Discovery Visual Layer

### Objective

Keep the existing `/discover/:slug` information architecture and SEO structure, but give the public Discovery hero the same media-rich acquisition quality expected from Home and Prompt presentation.

### Preserve current structure

Do not redesign the route contract or card acquisition behavior in this slice.

Preserve:

```text
canonical /discover/:slug and /fa/discover/:slug
existing title/description/CTA hierarchy
existing curated Prompt grid/cards
Public Prompt acquisition links
current SEO/canonical/hreflang behavior
real 404/canonical redirect behavior
```

### Media background

Use public preview media from Prompts belonging to the active Discovery category as the visual source.

Target behavior:

```text
category public preview images
  -> cinema/background media layer
  -> readable overlay/gradient/grain
  -> existing hero content above it
```

The implementation should first audit whether the existing slider/cinema primitive is SSR-safe. If it is client-heavy, SSR must still emit a deterministic first-image background/fallback and then progressively enhance after hydration.

Only already-public preview URLs may be used.

### RTL/LTR and accessibility

The visual layer must preserve:

```text
EN LTR
FA RTL
readable contrast
responsive layout
meaningful image alt/decorative semantics as appropriate
no navigation regression
```

---

## 6. 4B.5D — Final regression and founder acceptance

The original final 4B verification gate moves here.

Do not start 4C until 4B.5A–4B.5C are implemented and verified.

### Required automated coverage

At minimum:

```text
backend public Prompt contract tests
Public Prompt browser/SSR contract tests
Public Prompt SEO tests
public-link migration tests
interaction-polish tests
SEO route contracts
strict locale-routing audit
new localized-description contract tests
new shared-presentation boundary/regression tests
new Discovery visual-layer contract tests where practical
production-like pnpm stack build/start
```

### Required data/content checks

```text
existing published Archive items have valid founder-reviewed EN/FA descriptions
Admin create/edit requires localized descriptions according to locale policy
Public API returns description and still excludes protected fields
availableLocales cannot advertise incomplete localized presentation content
```

### Required Public Prompt staging smoke

```text
EN /prompt/:id
FA /fa/prompt/:id
localized title + description
preview-media cinema/background
canonical/hreflang/x-default
meta/OG/Twitter description from authored description
CreativeWork.description from authored description
first public image/social image behavior
no serialized private-key leakage
Open full prompt -> protected localized /prompts?id=<id>
```

### Required protected Prompt regression

```text
/prompts?id=<id> still auth/email/unlock gated
GET /api/archive/:id still protected
unlock/copy/economy behavior unchanged
protected-only navigation/actions unchanged
shared presentation does not leak protected state into public props/payloads
```

### Required Discovery staging smoke

```text
EN/FA Discovery hero uses public category media
hero text remains readable
category/card routes remain correct
Public Prompt links remain localized
SEO/canonical behavior unchanged
```

### Environment safety

```text
https://grassic.ir       -> staging verification target
https://api.grassic.ir   -> staging browser API target
prompt-draft.ir          -> MUST remain untouched
NUXT_PUBLIC_NOINDEX=true -> must remain authoritative during staging
```

### Final transition

```text
4B.5A PASS
+ 4B.5B PASS
+ 4B.5C PASS
+ 4B.5D automated/runtime/staging PASS
+ founder explicit acceptance
= Phase 21.5.4B ACCEPTED
```

---

## 7. Immediate next action

Start with **4B.5A only**.

First implementation pass must audit before writing:

```text
Archive schema and current migration head
Archive create/update backend validation
/manage Archive create/edit localized title fields
Archive public list/detail mappers
current publicPrompt.mjs projection
usePublicPrompt.ts normalizer/type
publicPromptSeo.ts description flow
current published Archive rows requiring backfill
```

Then write a narrow implementation plan for 4B.5A and execute it in small commits with tests.

Do not begin the shared presentation refactor until the description contract and existing-data migration/backfill path are understood and stable.

---

## 8. Non-goals / deferred work

Still deferred beyond 4B:

```text
Public Creator identity/attribution -> 4C
sitemap/indexability rollout -> 4D
Blog -> 4E
production prompt-draft.ir cutover -> later accepted deployment phase
```

The 4B.5 hardening work must not pre-decide 4C Creator policy or weaken any existing public/protected boundary.
