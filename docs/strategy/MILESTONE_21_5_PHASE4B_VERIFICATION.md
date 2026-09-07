# Milestone 21.5 — Phase 4B Verification Ledger

Status: **IN PROGRESS / DESIGN LOCKED / IMPLEMENTATION STARTED / NOT ACCEPTED**

Date: 2026-09-07

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
```

---

## 1. Acceptance rule

Phase 21.5.4B must not be marked accepted until:

```text
implementation complete
+ automated verification PASS
+ founder local/staging smoke PASS
+ founder explicit acceptance
```

Automated PASS alone is not acceptance.

---

## 2. Current implementation state

```text
4B architecture audit                     DONE
4B architecture/design proposal           DONE / FOUNDER AGREED
4B source-of-truth contract               DONE
4B.1 backend public read model            IN PROGRESS
4B.2 Nuxt Public Prompt SSR route         NOT STARTED
4B.3 SEO metadata                         NOT STARTED
4B.4 public-link migration                NOT STARTED
4B.5 founder verification                 NOT STARTED
```

Current canonical public route:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product route remains:

```text
/prompts?id=<id>
```

Protected API remains:

```text
GET /api/archive/:id
```

---

## 3. 4B.1 Backend contract gates

Required endpoint:

```text
GET /api/public/prompts/:id
```

Required behavior:

```text
published numeric public id -> 200
missing id                  -> 404
Archive draft               -> 404
Archive archived            -> 404
invalid id                  -> unavailable / safe client error semantics
non-GET                     -> 405
```

Required DTO allowlist:

```text
id
localized title
availableLocales
publishedAt
tags
model.previewGeneratedWith
model.optimizedFor
images.position
images.fullUrl
images.thumbnailUrl
```

Forbidden serialized fields/content:

```text
prompt
variants
sourceTitle
sourceUserId
sourceDraftId
storageKey
thumbnailStorageKey
unlock state
balance/Goin
permissions
viewer/account state
private Draft payloads
```

Critical implementation invariant:

```text
The public database query itself must not SELECT prompt or variants.
```

### Automated verification

```text
[ ] published item contract test
[ ] missing item test
[ ] draft item test
[ ] archived item test
[ ] invalid id test
[ ] non-GET 405 test
[ ] exact/allowlisted response shape test
[ ] protected-body sentinel leakage regression test
[ ] protected variants sentinel leakage regression test
[ ] storage key leakage regression test
[ ] GET /api/archive/:id protection regression
```

---

## 4. 4B.2 SSR route gates

```text
[ ] /prompt/:id is SSR-enabled
[ ] /fa/prompt/:id is SSR-enabled
[ ] server reads use NUXT_API_BASE_INTERNAL
[ ] browser/public origin remains NUXT_PUBLIC_API_BASE
[ ] published EN route -> 200
[ ] published FA route -> 200 when authoritative FA exists
[ ] invalid/missing/non-public route -> real 404
[ ] unavailable locale -> real 404
[ ] no protected Prompt body in initial HTML
[ ] no variants in initial HTML
[ ] no private/account/economy data in initial HTML
```

---

## 5. 4B.3 SEO gates

```text
[ ] usePublicSeo reused
[ ] EN self-canonical
[ ] FA self-canonical
[ ] reciprocal hreflang only for authoritative available locales
[ ] x-default -> English when authoritative English exists
[ ] no fake localized fallback page
[ ] OG title locale-aware
[ ] OG image uses first valid public preview image
[ ] CreativeWork structured data uses sanitized public fields only
[ ] protected Prompt body never enters description/JSON-LD/meta
[ ] staging NUXT_PUBLIC_NOINDEX=true wins
[ ] server X-Robots-Tag policy remains intact
```

---

## 6. 4B.4 Internal-link gates

```text
[ ] public Discovery card links to publicPromptPath(id)
[ ] other modified acquisition surfaces use canonical public Prompt route helper
[ ] Public Prompt product CTA may link to /prompts?id=<id>
[ ] /prompts?id=<id> behavior unchanged
[ ] locale-safe navigation preserved
```

---

## 7. Build / regression gates

Target automated commands will be recorded once implementation is wired.

Minimum expected gate set:

```text
[ ] Phase 4B public Prompt contract tests PASS
[ ] pnpm test:seo-contracts PASS
[ ] pnpm seo:audit-routes:strict PASS
[ ] pnpm build PASS
```

Any new targeted test command added by 4B must be documented here and in `package.json`.

---

## 8. Founder local/staging smoke

To be executed only after implementation/automated verification is complete.

### Public API

```text
[ ] published id 200
[ ] missing id 404
[ ] draft id 404
[ ] archived id 404
[ ] response contains no protected fields
[ ] api.grassic.ir path works as expected
```

### EN public Prompt

```text
[ ] grassic.ir/prompt/<published-id> 200
[ ] localized EN title visible in raw SSR HTML
[ ] canonical correct
[ ] hreflang correct
[ ] OG/Twitter metadata correct
[ ] JSON-LD truthful
[ ] staging robots noindex protection present
```

### FA public Prompt

```text
[ ] grassic.ir/fa/prompt/<published-id> 200
[ ] localized FA title visible in raw SSR HTML
[ ] html lang/dir correct
[ ] self-canonical correct
[ ] reciprocal hreflang correct
[ ] staging robots noindex protection present
```

### Protected regression

```text
[ ] unauthenticated GET /api/archive/:id remains denied
[ ] /prompts?id=<id> remains auth/email gated
[ ] protected Prompt body remains available only through protected product flow
[ ] unlock/Goin behavior unchanged
```

### Production safety

```text
[ ] prompt-draft.ir remains untouched during 4B staging work
```

---

## 9. Verification evidence log

No acceptance evidence recorded yet.

Current state:

```text
DESIGN LOCKED
IMPLEMENTATION STARTED
FOUNDER SMOKE NOT RUN
NOT ACCEPTED
```

Implementation commits and PASS evidence must be appended here as work proceeds.
