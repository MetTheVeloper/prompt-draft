# Milestone 21.5 — Phase 4B Verification Ledger

Status: **IN PROGRESS / 4B.1 FOUNDER-LOCAL VERIFIED / 4B.2 IMPLEMENTED / LOCAL VERIFY NEXT / NOT ACCEPTED**

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
4B.1 backend public read model            DONE / FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route         IMPLEMENTED / LOCAL VERIFY NEXT
4B.3 SEO metadata                         NOT STARTED
4B.4 public-link migration                NOT STARTED
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

### Founder Docker/API verification — 2026-09-07

Founder rebuilt the real API container and ran:

```text
docker compose exec api npm run test:public-prompt
```

Result:

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

No protected fields were present in the returned projection.

Founder runtime HTTP results:

```text
GET /api/public/prompts/9003      -> 200
GET /api/public/prompts/0         -> 404
GET /api/public/prompts/999999999 -> 404
GET /api/archive/9003 unauthenticated -> 401
```

Protected regression result:

```text
{"ok":false,"message":"Authentication required"}
```

Conclusion:

```text
4B.1 BACKEND PUBLIC READ MODEL -> FOUNDER-LOCAL VERIFIED
```

Draft/archived behavior remains structurally enforced by the published-only query and should still be exercised with explicit fixtures when available during final staging verification.

---

## 4. 4B.2 Nuxt Public Prompt SSR route — IMPLEMENTED

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

The page renders only:

```text
localized public title
publication date
public numeric id
public model metadata
public tags
public preview media
localized public UI copy
```

The page intentionally does not render or request:

```text
Prompt body
variants
unlock state
balance
permissions
private Drafts
account/session state
```

Protected CTA remains separate:

```text
Public Prompt page
  -> /prompts?id=<id>
  -> existing protected product flow
```

Target web-contract command:

```text
pnpm test:public-prompt-web
```

### Localization audit note

`pnpm locale:check` is **not** a Phase 4B acceptance gate. The command runs the repository-wide localization audit with `--strict`, and the audit intentionally exits non-zero when *any* existing EN/FA parity debt or extra FA key exists. The current repository has inherited localization parity debt unrelated to this slice, so using the strict global command would make an otherwise-valid 4B slice unacceptably dependent on unrelated cleanup.

For 4B, localization-specific regression checking uses:

```text
pnpm locale:audit:hardcoded
```

with the expected result:

```text
Hardcoded candidates: 0
```

The mirrored EN/FA `growth.publicPrompt.*` keys are additionally exercised by the Nuxt build/runtime and localized route smoke.

### Build/runtime command policy

Prefer project-owned package scripts over ad-hoc Docker commands.

Canonical local production-like build/start command:

```text
pnpm stack
```

This runs:

```text
docker compose up -d --build
```

The frontend Dockerfile runs `pnpm build` inside the production builder with the repository's accepted 4 GB Node heap setting, then starts the Nitro runtime. This is the preferred 4B build/runtime gate over a separate host-shell `pnpm build`.

Operational helpers:

```text
pnpm stack:status
pnpm stack:logs
pnpm frontend:logs
```

### 4B.2 local verification gates

```text
[x] pnpm test:public-prompt-web PASS — founder result 4/4 on 2026-09-07
[x] repository localization audit reported Hardcoded candidates: 0 on 2026-09-07
[ ] pnpm stack build/start PASS
[ ] pnpm stack:status shows healthy frontend/api/db/translator
[ ] /prompt/9003 -> 200
[ ] /fa/prompt/9003 -> 200
[ ] EN raw HTML contains "From Grassias"
[ ] FA raw HTML contains "از گراسیاس"
[ ] /prompt/0 -> 404
[ ] /prompt/999999999 -> 404
[ ] /fa/prompt/999999999 -> 404
[ ] no protected Prompt body/variants/private state in raw HTML
[ ] protected CTA still enters /prompts?id=9003 gated flow
```

No 4B.2 founder PASS is recorded until the remaining runtime gates are run on the founder checkout/runtime.

---

## 5. 4B.3 SEO gates — NOT STARTED

Target behavior:

```text
usePublicSeo reused
EN self-canonical
FA self-canonical
reciprocal hreflang only for authoritative locales
x-default -> English when English exists
no fake locale fallback
locale-aware OG title
first public preview image used for OG image
CreativeWork JSON-LD from sanitized fields only
protected Prompt body never enters meta/JSON-LD
staging global noindex remains authoritative
```

---

## 6. 4B.4 Public-link migration — NOT STARTED

Target behavior:

```text
Discovery public cards -> publicPromptPath(id)
other public acquisition surfaces -> canonical public Prompt route
Public Prompt product CTA -> /prompts?id=<id>
/prompts?id=<id> protected behavior unchanged
locale-safe navigation preserved
```

---

## 7. Final regression / staging gates

Minimum automated/runtime set before final 4B acceptance:

```text
backend npm run test:public-prompt PASS
pnpm test:public-prompt-web PASS
pnpm test:seo-contracts PASS
pnpm seo:audit-routes:strict PASS
pnpm locale:audit:hardcoded -> Hardcoded candidates: 0
pnpm stack -> production-like Docker build/start PASS
pnpm stack:status -> required services healthy
```

A separate host-shell `pnpm build` is optional because `pnpm stack` already executes the accepted Dockerfile production build, including `pnpm build`, under the configured builder memory contract.

Founder staging smoke must confirm:

```text
public API 200/404 semantics
EN/FA SSR route semantics
canonical/hreflang/OG/JSON-LD after 4B.3
staging robots/noindex protection
public-link migration after 4B.4
GET /api/archive/:id remains protected
/prompts?id=<id> remains auth/email/unlock gated
prompt-draft.ir remains untouched
```

---

## 8. Evidence log

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

Founder 4B.2 partial verification — 2026-09-07:

```text
pnpm test:public-prompt-web -> PASS 4/4
repository-wide localization audit -> Hardcoded candidates: 0
pnpm locale:check -> expected non-zero due inherited repository-wide parity debt; removed as 4B gate
```

Current state:

```text
4B.1 FOUNDER-LOCAL VERIFIED
4B.2 IMPLEMENTED / PARTIAL LOCAL VERIFY / RUNTIME SMOKE NEXT
4B.3 NOT STARTED
4B.4 NOT STARTED
PHASE 4B NOT ACCEPTED
```
