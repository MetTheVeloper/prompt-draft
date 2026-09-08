# Milestone 21.5 — Phase 4B Verification Ledger

Status: **IN PROGRESS / 4B.1 FOUNDER-LOCAL VERIFIED / 4B.2 FOUNDER-LOCAL VERIFIED / 4B.3 FOUNDER-LOCAL VERIFIED / 4B.4 IMPLEMENTED / LOCAL VERIFY NEXT / NOT ACCEPTED**

Date: 2026-09-08

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
4B.1 backend public read model            DONE / FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route         DONE / FOUNDER-LOCAL VERIFIED
4B.3 SEO metadata                         DONE / FOUNDER-LOCAL VERIFIED
4B.4 public-link migration                IMPLEMENTED / LOCAL VERIFY NEXT
4B.5 final founder/staging verification   NOT STARTED
```

Canonical public routes:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product/API routes remain:

```text
/prompts?id=<id>
GET /api/archive/:id
```

---

## 3. 4B.1 Backend public read model — VERIFIED

Endpoint:

```text
GET /api/public/prompts/:id
```

Public DTO allowlist:

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

Forbidden public content:

```text
Prompt body
variants
sourceTitle
sourceUserId
sourceDraftId
storage keys
unlock state
balance/Goin
permissions
viewer/account state
private Draft payloads
```

Database invariant:

```text
items.public_id = requested id
AND items.status = 'published'
```

The public query does not SELECT `prompt`, `variants`, source Draft payloads, storage keys, economy state or account state.

### Automated contract verification

Assistant-side isolated contract run:

```text
publicPrompt.test.mjs
8 tests
8 pass
0 fail
```

### Founder Docker/API verification

Founder rebuilt/ran the real API container and executed:

```text
docker compose exec api npm run test:public-prompt
```

Verified again on 2026-09-08:

```text
8 tests
8 pass
0 fail
```

Real published fixture:

```text
public id: 9003
EN title: From Grassias
FA title: از گراسیاس
availableLocales: en, fa
model: gpt-image-1
public image projection present
```

Observed public response property names:

```text
id
title
availableLocales
publishedAt
tags
model
images
```

Founder runtime HTTP results verified again on 2026-09-08:

```text
GET /api/public/prompts/9003      -> 200
GET /api/public/prompts/0         -> 404
GET /api/public/prompts/999999999 -> 404
GET /api/archive/9003 unauthenticated -> 401
```

Conclusion:

```text
4B.1 BACKEND PUBLIC READ MODEL -> FOUNDER-LOCAL VERIFIED
```

Draft/archived behavior remains structurally enforced by the published-only query and should still be exercised with explicit fixtures when available during final staging verification.

---

## 4. 4B.2 Nuxt Public Prompt SSR route — VERIFIED

Implementation files:

```text
app/composables/usePublicPrompt.ts
app/pages/prompt/[id].vue
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
scripts/public-prompt-client-contract.test.ts
package.json
```

Implemented behavior:

```text
/prompt/:id                 -> dynamic SSR Public Prompt page
/fa/prompt/:id              -> Nuxt i18n localized SSR route
server data origin          -> NUXT_API_BASE_INTERNAL
browser data origin         -> NUXT_PUBLIC_API_BASE
invalid/noncanonical id     -> real 404
public API 404              -> real Nuxt 404
unavailable localization    -> real Nuxt 404
upstream failure            -> 502 instead of fake empty 200
route identity change       -> page remount by fullPath
```

Client/SSR response validation requires the exact sanitized public contract again before rendering.

The page renders only localized public title, publication date, public numeric id, model metadata, tags, preview media and localized public UI copy.

Protected CTA remains separate:

```text
Public Prompt page
  -> /prompts?id=<id>
  -> existing protected product flow
```

### Founder local verification

Web contract verified again on 2026-09-08:

```text
pnpm test:public-prompt-web
4 tests
4 pass
0 fail
```

Production-like project-owned stack command:

```text
pnpm stack
```

Verified 2026-09-08 result:

```text
Docker frontend build -> PASS
Nuxt client build     -> PASS
Nuxt SSR build        -> PASS
Nitro server build    -> PASS
frontend              -> healthy
api                    -> healthy
db                     -> healthy
translator             -> healthy
```

Founder HTTP results:

```text
GET /prompt/9003                 -> 200
GET /fa/prompt/9003              -> 200
GET /prompt/0                    -> 404
GET /prompt/999999999            -> 404
GET /fa/prompt/999999999         -> 404
```

Staging-safety header observed on local production-like responses:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

SSR evidence:

```text
EN html lang/dir -> en-US / ltr
FA html lang/dir -> fa-IR / rtl
EN SSR title content -> From Grassias
FA SSR localization -> authoritative FA payload rendered
EN protected CTA -> /prompts?id=9003
FA protected CTA -> /fa/prompts?id=9003
```

The serialized Nuxt payload contained only the public DTO shape:

```text
id
title
availableLocales
publishedAt
tags
model
images
```

### Leakage-check correction

The first broad smoke pattern searched for the plain word `variants`. That word legitimately appears in localized explanatory UI copy saying protected content stays in the protected product flow, so `Select-String` returned the whole HTML document. This was a smoke-test false positive, not data leakage.

Future raw-HTML leakage checks search for serialized private **keys**, not narrative words:

```text
"sourceDraftId":
"sourceUserId":
"storageKey":
"thumbnailStorageKey":
"variants":
"balance":
"permissions":
"viewer":
"prompt":
```

Founder key-based verification on 2026-09-08:

```text
EN private-key matches -> 0
FA private-key matches -> 0
```

Conclusion:

```text
4B.2 NUXT PUBLIC PROMPT SSR ROUTE -> FOUNDER-LOCAL VERIFIED
```

---

## 5. Localization audit policy

Repository-wide localization debt is not a Phase 4B gate.

Observed commands:

```text
pnpm locale:check
  -> strict global parity audit
  -> non-zero because inherited repository-wide missing/extra locale keys exist

pnpm locale:audit:hardcoded
  -> repository-wide hardcoded candidate scan
  -> 594 candidates in the current repository baseline
```

Therefore neither command can be interpreted as a zero-finding 4B acceptance gate without a stored baseline/diff mechanism.

4B-specific localization confidence comes from localized `growth.publicPrompt.*` keys, Nuxt build success, EN/FA SSR route success, correct html lang/dir and no fallback localization presented as authoritative content.

---

## 6. 4B.3 Public Prompt SEO metadata — VERIFIED

Implementation files:

```text
app/utils/publicPromptSeo.ts
scripts/public-prompt-seo.test.ts
app/pages/prompt/[id].vue
package.json
```

Implemented behavior:

```text
usePublicSeo reused
canonical base route comes from publicPromptPath(id)
EN route self-canonical
FA route self-canonical
alternateLocales comes only from prompt.availableLocales
x-default uses English when authoritative English exists
OG/Twitter title is localized Public Prompt title
OG/Twitter description uses localized public-only copy
OG image uses first public preview image
image fallback uses /pwa-512x512.png
CreativeWork JSON-LD uses public-only fields
JSON-LD omitted when siteUrl/canonical absolute URL cannot be formed
creator/author deliberately absent until 4C
```

CreativeWork allowlist:

```text
@context
@type = CreativeWork
name
url
description
datePublished
inLanguage
image
keywords
isPartOf
```

Explicit JSON-LD exclusions:

```text
Prompt body
variants
sourceTitle
sourceDraftId/sourceUserId
storage keys
unlock state
balance/Goin
permissions
viewer/account state
creator/author until 4C
```

### Founder local verification — 2026-09-08

Automated gates:

```text
pnpm test:public-prompt-seo -> 4/4 PASS
pnpm test:seo-contracts     -> 5/5 PASS
pnpm seo:audit-routes:strict -> PASS, 443 files, zero locale-routing hazards
```

Production-like build/runtime:

```text
pnpm stack -> PASS
Nuxt client build -> PASS
Nuxt SSR build -> PASS
Nitro build -> PASS
final pnpm stack:status -> frontend/api/db/translator healthy
```

Observed SEO/runtime gates:

```text
EN canonical -> https://grassic.ir/prompt/9003
FA canonical -> https://grassic.ir/fa/prompt/9003
hreflang en-US -> present
hreflang fa-IR -> present
x-default -> present / English canonical
OG image -> present
Twitter image -> present
CreativeWork JSON-LD EN -> present
CreativeWork JSON-LD FA -> present
serialized private-key leakage -> 0 EN / 0 FA
X-Robots-Tag staging noindex -> present
```

### PowerShell encoding note

The first title smoke consumed `curl.exe` stdout directly in Windows PowerShell and produced mojibake (`·` became `┬╖`, Persian UTF-8 bytes were mis-decoded). This was a test-harness encoding issue, not an application SEO regression.

The final check saved curl response bytes to files and read them explicitly as UTF-8. Result:

```text
EN actual title   -> From Grassias · Prompt Draft
EN expected title -> From Grassias · Prompt Draft
EN exact match    -> true

FA actual title   -> از گراسیاس · Prompt Draft
FA expected title -> از گراسیاس · Prompt Draft
FA exact match    -> true

EN body contains authoritative API title -> true
FA body contains authoritative API title -> true
```

Conclusion:

```text
4B.3 PUBLIC PROMPT SEO METADATA -> FOUNDER-LOCAL VERIFIED
```

---

## 7. 4B.4 Public-link migration — IMPLEMENTED

Audit scope distinguishes Prompt-detail acquisition links from valid generic product/catalog links.

Generic `/prompts` navigation remains valid and is intentionally unchanged. Only public acquisition links that point at a specific Prompt are migrated to the canonical Public Prompt route.

Audited detail entry points requiring migration:

```text
app/components/discover/PublicDiscoveryCard.vue
app/components/home/HomeDiscoverySection.vue
```

Implemented behavior:

```text
Discovery View Prompt -> localePath(publicPromptPath(id))
Home showcase View Prompt -> localePath(publicPromptPath(id))
EN acquisition detail -> /prompt/:id
FA acquisition detail -> /fa/prompt/:id
Public Prompt Open full prompt CTA -> remains /prompts?id=<id>
Protected product flow -> unchanged
Generic /prompts catalog links -> unchanged
```

Regression contract:

```text
scripts/public-prompt-link-migration.test.ts
pnpm test:public-prompt-links
```

The contract locks both acquisition components to `publicPromptPath` + `useLocalePath`, rejects direct `/prompts?id=` links in those components, and asserts that the Public Prompt page itself retains the protected `/prompts` + id query CTA.

### 4B.4 local verification gates

```text
[ ] pnpm test:public-prompt-links PASS
[ ] pnpm test:seo-contracts PASS
[ ] pnpm seo:audit-routes:strict PASS
[ ] pnpm stack PASS with 4B.4 code
[ ] EN Discovery detail CTA resolves to /prompt/<id>
[ ] FA Discovery detail CTA resolves to /fa/prompt/<id>
[ ] EN Home detail CTA resolves to /prompt/<id>
[ ] FA Home detail CTA resolves to /fa/prompt/<id>
[ ] Public Prompt full-detail CTA still resolves to /prompts?id=<id> (localized FA equivalent allowed)
[ ] protected product/API behavior remains unchanged
```

No 4B.4 founder PASS is recorded until these gates are executed on the founder checkout/runtime.

---

## 8. Final regression / staging gates

Minimum automated/runtime set before final 4B acceptance:

```text
backend npm run test:public-prompt PASS
pnpm test:public-prompt-web PASS
pnpm test:public-prompt-seo PASS
pnpm test:public-prompt-links PASS
pnpm test:seo-contracts PASS
pnpm seo:audit-routes:strict PASS
pnpm stack -> production-like Docker build/start PASS
```

Repository-wide localization audits remain advisory for 4B until a baseline/diff gate exists.

Founder staging smoke must confirm:

```text
public API 200/404 semantics
EN/FA SSR route semantics
canonical/hreflang/OG/JSON-LD
staging robots/noindex protection
public-link migration
GET /api/archive/:id remains protected
/prompts?id=<id> remains auth/email/unlock gated
prompt-draft.ir remains untouched
```

---

## 9. Evidence log

Architecture / documentation:

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
```

4B.2 implementation:

```text
76d9d109419407bb5d9c444d7422dcc89353ba23
  feat: add public prompt SSR reader

cb0c13224e595ba9fc0c8ed3303bf045342b580b
  feat: add public prompt SSR route

2009b1c84b9e992d45b076a25eed0a83c3bfe301
  feat: localize public prompt page

abd2432b04802dd88246e3eb342c0bb035d30490
  feat: localize Persian public prompt page

a913bbe6ae7a3ad05953b0bfc04a72f5fd5e8300
  test: cover public prompt client contract

c67a3e24d89c5d1bf70e29b53286e7a2ae18c050
  test: add public prompt web contract command

be104d7b24701c64332dd8ae41b91340e5c821f8
  fix: remount public prompt on route identity change
```

4B.3 implementation:

```text
cdfdc821cab9ed5ad0c1df265cef65f578d8a216
  feat: add public prompt SEO projection helper

3e1cbc9251decc40a42896fa15f4c6bd22ab7620
  test: cover public prompt SEO projection

84b963fdf3596303ee0935aac17932a795c8db9e
  feat: add public prompt SEO metadata

7f5a62a43bb96eb5ff1a7d93b26d155d8daec929
  test: add public prompt SEO contract command
```

4B.4 implementation:

```text
5e11ce712d960b590cc9285b6888b1e4c2172aa9
  feat: route discovery cards to public prompts

fae0fca593bfff808407e13a6d28527051a540bd
  feat: route home showcase to public prompts

cacdfb777d4a64bd7810d565b50f84c91e842a80
  test: lock public prompt acquisition links

ca4b8a2608dd8d2b2eb033ae7dc189c9802d6b83
  test: add public prompt link migration command
```

Current state:

```text
4B.1 FOUNDER-LOCAL VERIFIED
4B.2 FOUNDER-LOCAL VERIFIED
4B.3 FOUNDER-LOCAL VERIFIED
4B.4 IMPLEMENTED / LOCAL VERIFY NEXT
4B.5 NOT STARTED
PHASE 4B NOT ACCEPTED
```
