# Milestone 21.5 — Phase 4B.5 Public Surface Hardening

Status: **IN PROGRESS / 4B.5A-4B.5C FOUNDER VERIFIED / 4B.5D FINAL VERIFICATION IN PROGRESS / PHASE 4B NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent architecture:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
```

Verification / hardening records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_CUTOVER.md
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5C_DISCOVERY_VISUAL_LAYER.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

This document remains the parent continuation source of truth for final Phase 4B acceptance.

---

## 1. Current checkpoint

```text
4B.1 backend public projection       -> FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route    -> FOUNDER-LOCAL VERIFIED
4B.3 Public Prompt SEO metadata      -> FOUNDER-LOCAL VERIFIED
4B.4 public-link migration           -> FOUNDER-LOCAL VERIFIED
post-4B.4 interaction polish         -> FOUNDER-LOCAL VERIFIED
4B.5A localized descriptions         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation     -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5C Discovery visual layer         -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5D final regression / acceptance  -> IN PROGRESS
Phase 4B acceptance                  -> NOT ACCEPTED
```

4B.5D is now the only remaining gate before explicit founder acceptance.

---

## 2. Hard security and routing boundaries inherited forward

Canonical public Prompt routes:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product routes remain:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

Backend boundary remains:

```text
GET /api/public/prompts/:id -> public sanitized read model
GET /api/archive/:id        -> authenticated + email gate
/prompts?id=<id>             -> protected auth/unlock/economy product surface
```

Public Prompt projection may contain only intentionally public presentation data.

Explicitly forbidden from the public read model/shared public props:

```text
protected Prompt body
variants
sourceTitle/source Draft payload
source Draft/user identity
storage keys
unlock state
balance/Goin
authenticated viewer state
permissions
creator attribution until 4C
```

The public database query itself must not SELECT `prompt` or `variants`.

Sharing visual presentation must never merge public and protected data sources.

---

## 3. 4B.5A — Localized Public Prompt Description Contract

Status:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
```

Accepted contract:

```ts
description: {
  en?: string
  fa?: string
}
```

Accepted single source of truth:

```text
visible Public Prompt description
meta description
og:description
twitter:description
CreativeWork.description
```

Locale availability means:

```text
valid localized title + valid localized description
```

100/100 published Archive rows were backfilled with founder-reviewed EN/FA descriptions before strict publish enforcement/public cutover.

No fake fallback localization is allowed.

---

## 4. 4B.5B — Shared Prompt Presentation Shell

Status:

```text
DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
```

The shared layer owns presentation only:

```text
PromptPresentation
├── SSR-safe preview/cinema background
├── localized title
├── localized authored description
├── tags
├── public-safe id/date/model metadata
├── optional public-safe Telegram post metadata
├── responsive LTR/RTL presentation
└── route-specific slots/actions/content
```

The shared component remains unaware of:

```text
balance
unlock state
permissions
authenticated viewer
protected Prompt body
variants
```

Founder-approved final polish:

```text
theme-aware overlay -> var(--themeSurface)
description/meta -> normal theme text
Prompt tags -> surface + normal
model badge -> surface + normal
Telegram badge -> blue + white + canonical new-tab URL
Public Prompt default layout padding -> zero
back icons -> arrow_back LTR / arrow_forward RTL
back action -> router.back() on both public and protected Prompt heroes
back button color -> normal
```

---

## 5. 4B.5C — Public Discovery Visual Layer

Status:

```text
DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5C_DISCOVERY_VISUAL_LAYER.md
```

Founder-approved behavior:

```text
hero -> el-flex type="section"
hero height -> content-sized, not viewport-height
Discovery default layout padding -> zero
hero media -> only already-public category cover previews
first category preview -> deterministic SSR <img>
multiple previews -> ClientOnly visual-slider enhancement
SSR fallback image removed after multi-image cinema mount
slider canvas -> absolute/scoped to hero, not fixed over page scroll
hero media -> poa t0 r0 b0 l0 equivalent
hero heading flex -> rules="ccs"
collection heading flex -> rules="ccs"
```

Preserved:

```text
canonical /discover/:slug and /fa/discover/:slug
existing category SEO semantics
curated PublicDiscoveryCard grid
localized Public Prompt links
real 404/canonical redirect behavior
```

No protected Prompt body, variants, economy, permission, storage or viewer data enters Discovery.

---

## 6. 4B.5D — Final Regression / Founder Acceptance

Status:

```text
IN PROGRESS / FINAL FOUNDER VERIFICATION NEXT
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Aggregate frontend/SEO/routing/presentation/discovery gate:

```text
pnpm test:phase4b-final
```

Backend regression:

```text
docker compose exec api npm run test:public-prompt
docker compose exec api npm run test:archive-description-input
docker compose exec api npm run test:archive-published-localization
```

Production-like staging-connected rebuild/health:

```text
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

Automated real-staging smoke:

```text
pnpm smoke:phase4b-final -- 511 portraits-photography
```

Required manual founder browser smoke:

```text
Public Prompt EN/FA visual/runtime
Public -> protected Open full prompt transition
protected auth/email/unlock/copy/economy behavior unchanged
browser-history back behavior EN/FA
Telegram badge/link behavior when metadata exists
Discovery EN/FA content-sized single-layer cinema
light/dark theme readability
```

Environment safety:

```text
https://grassic.ir       -> staging verification target
https://api.grassic.ir   -> staging browser API target
prompt-draft.ir          -> MUST remain untouched
NUXT_PUBLIC_NOINDEX=true -> must remain authoritative during staging
```

Final transition:

```text
4B.5A PASS
+ 4B.5B PASS
+ 4B.5C PASS
+ 4B.5D automated/backend/build/staging/manual PASS
+ founder explicit acceptance
= Phase 21.5.4B ACCEPTED
```

---

## 7. Immediate next action

Run 4B.5D only.

Do not start 4C until:

```text
pnpm test:phase4b-final PASS
backend final regression PASS
Cloudflare production-like build/health PASS
pnpm smoke:phase4b-final PASS
protected authenticated browser smoke PASS
founder explicit acceptance
```

After founder acceptance, update:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/STATUS.md
```

Then Phase 21.5.4C may begin.

---

## 8. Non-goals / deferred work

Still deferred beyond 4B:

```text
Public Creator identity/attribution -> 4C
sitemap/indexability rollout -> 4D
Blog -> 4E
production prompt-draft.ir cutover -> later accepted deployment phase
```

4B.5D must not pre-decide 4C Creator policy or weaken existing public/protected boundaries.
