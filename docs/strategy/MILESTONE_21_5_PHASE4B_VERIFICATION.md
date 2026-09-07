# Milestone 21.5 — Phase 4B Verification Ledger

Status: **IN PROGRESS / DESIGN LOCKED / 4B.1 IMPLEMENTED / LOCAL VERIFY NEXT / NOT ACCEPTED**

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
4B.1 backend public read model            IMPLEMENTED / LOCAL VERIFY NEXT
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

Implemented endpoint:

```text
GET /api/public/prompts/:id
```

Implemented behavior contract:

```text
published numeric public id -> 200
missing/non-public id       -> 404
invalid id                  -> 404 without DB read
non-GET                     -> 405 + Allow: GET
```

Implemented DTO allowlist:

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
protected Prompt body
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
The public database query itself does not SELECT prompt or variants.
The public database query requires items.status='published'.
```

Implementation files:

```text
backend/src/publicPrompt.mjs
backend/src/publicPrompt.test.mjs
backend/src/index.mjs
backend/package.json
```

Target test command:

```text
cd backend
npm run test:public-prompt
```

or in the rebuilt API container:

```text
docker compose exec api npm run test:public-prompt
```

### Assistant-side isolated contract verification

The exact committed `publicPrompt.mjs` and `publicPrompt.test.mjs` blobs were re-read from GitHub, syntax-checked and executed in an isolated Node test harness with `queryDatabase` replaced by a stub so no production/private database was accessed.

Result:

```text
node --test publicPrompt.test.mjs
8 tests
8 pass
0 fail
```

Covered in this isolated PASS:

```text
explicit DTO allowlist
locale availability without fallback
published-only SQL condition
SQL protected-column exclusions
protected-body sentinel stripping
variant sentinel stripping
storage-key sentinel stripping
published handler 200 contract
missing/non-public 404 contract
invalid-id 404 without DB read
non-GET 405 + Allow: GET
unrelated-route non-claim behavior
```

This PASS validates the isolated read-model/handler contract only. It does **not** replace the founder Docker/API smoke or real database-state verification.

The protected Archive implementation was re-read after 4B.1 changes and remains on blob:

```text
backend/src/archive.mjs
fbe652401ab33bbb8e3f8cc2788f4537972eee90
```

Its existing unauthenticated `401` and missing-email `403` gate still precedes `GET /api/archive/:id` detail handling.

### Founder/container automated verification

Still pending on the real checkout/container:

```text
[ ] backend npm run test:public-prompt PASS in rebuilt API environment
[ ] published real item contract PASS
[ ] missing/non-public real item 404 PASS
[ ] invalid id PASS
[ ] non-GET 405 PASS
[ ] exact/allowlisted response shape PASS
[ ] GET /api/archive/:id protection regression PASS
```

Draft/archived public behavior is enforced by the single `items.status='published'` query condition; real-state smoke should still verify both states where test fixtures are available.

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

Minimum expected gate set:

```text
[ ] backend npm run test:public-prompt PASS in founder/container environment
[ ] pnpm test:seo-contracts PASS
[ ] pnpm seo:audit-routes:strict PASS
[ ] pnpm build PASS
```

No founder/runtime automated result may be inferred from isolated implementation testing alone.

---

## 8. Founder local/staging smoke

To be executed progressively as each slice becomes runnable.

### 4B.1 Public API smoke

```text
[ ] rebuilt API container is healthy
[ ] published id 200
[ ] missing id 404
[ ] draft id 404 when fixture available
[ ] archived id 404 when fixture available
[ ] invalid id 404
[ ] response contains no protected fields/content
[ ] api.grassic.ir endpoint works as expected after staging rebuild
```

### EN public Prompt — after 4B.2/4B.3

```text
[ ] grassic.ir/prompt/<published-id> 200
[ ] localized EN title visible in raw SSR HTML
[ ] canonical correct
[ ] hreflang correct
[ ] OG/Twitter metadata correct
[ ] JSON-LD truthful
[ ] staging robots noindex protection present
```

### FA public Prompt — after 4B.2/4B.3

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

## 9. Implementation evidence log

Architecture/documentation:

```text
2a9a58eacc371ee96dc1b073c582d00093f69293
  docs: lock Phase 4B public prompt architecture

8902ab959e6b95513a3e7d3d4e60a55dbc76180f
  docs: add Phase 4B verification ledger
```

4B.1 backend implementation:

```text
97a0f7a2251f9e43d6a98fe07f0b43bb9c3ead16
  feat: add sanitized public prompt read model

76664e61af26cbcf112fb6c609667d202d3afee2
  test: cover public prompt projection boundary

89c146eb54ac5874194e7fa1980bd1663a83859a
  feat: route public prompt endpoint

f6a60f17e69f046d9bf3392dbd688b09edc7967a
  test: add public prompt contract command

1c1cc903c4e3e8b0e2f824f38c17ef3e0ea7e1a9
  docs: record Phase 4B backend slice progress
```

Assistant-side isolated verification:

```text
publicPrompt contract test -> PASS 8/8
protected archive blob     -> unchanged fbe652401ab33bbb8e3f8cc2788f4537972eee90
```

Current verification state:

```text
DESIGN LOCKED
4B.1 IMPLEMENTED
ISOLATED CONTRACT TEST PASS 8/8
FOUNDER/CONTAINER TEST PENDING
FOUNDER API SMOKE PENDING
4B.2 NOT STARTED
NOT ACCEPTED
```

Do not advance to accepted status until the documented founder verification gates are satisfied.
