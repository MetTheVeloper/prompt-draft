# Milestone 21.5 — Phase 4B.5 Public Surface Hardening

Status: **DONE / 4B.5A-4B.5D FOUNDER VERIFIED / PHASE 4B ACCEPTED**

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

This document is now the closed parent source of truth for the accepted Phase 4B.5 hardening work.

---

## 1. Final checkpoint

```text
4B.1 backend public projection       -> DONE / FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route    -> DONE / FOUNDER-LOCAL VERIFIED
4B.3 Public Prompt SEO metadata      -> DONE / FOUNDER-LOCAL VERIFIED
4B.4 public-link migration           -> DONE / FOUNDER-LOCAL VERIFIED
post-4B.4 interaction polish         -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A localized descriptions         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation     -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5C Discovery visual layer         -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5D final regression / acceptance  -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
Phase 21.5.4B                        -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Founder explicit acceptance was received on 2026-09-08 after all final gates passed.

---

## 2. Accepted security and routing boundaries

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
source Draft/user identity unless a later accepted Creator policy introduces public attribution
storage keys
unlock state
balance/Goin
authenticated viewer state
permissions
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

Published Archive state is protected by application validation plus the database localization constraint introduced in the accepted 4B.5A rollout.

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

Public and protected surfaces share the same presentation language while continuing to use separate data sources and permissions.

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
DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Final aggregate gate:

```text
pnpm test:phase4b-final
```

Founder final run:

```text
SEO contracts                         -> 5/5 PASS
Public Prompt browser/SSR DTO         -> 6/6 PASS
Public Prompt SEO                     -> 4/4 PASS
Localized Public Prompt description   -> 3/3 PASS
Shared Prompt presentation            -> 4/4 PASS
Public Discovery visual layer         -> 3/3 PASS
Public Prompt link migration          -> 3/3 PASS
Interaction polish                    -> 4/4 PASS
Strict locale-routing audit           -> PASS / 447 source files / zero hazards
```

Backend regression:

```text
docker compose exec api npm run test:public-prompt                -> PASS
docker compose exec api npm run test:archive-description-input    -> PASS
docker compose exec api npm run test:archive-published-localization -> PASS
```

Production-like staging-connected health:

```text
frontend    healthy
api         healthy
db          healthy
translator  healthy
cloudflared up
```

Automated real-staging smoke:

```text
pnpm smoke:phase4b-final

public Prompt API: 200
invalid public Prompt API: 404
protected Archive detail API: 401
EN Public Prompt SSR: 200
FA Public Prompt SSR: 200
EN Discovery SSR: 200
FA Discovery SSR: 200
PASS
```

Canonical Discovery smoke fixture:

```text
portrait-photography
```

The smoke runner explicitly refuses to target `prompt-draft.ir`.

Founder manual browser smoke also passed for public/protected behavior, history back navigation, Telegram linking, Discovery cinema, light/dark readability and protected unlock/copy/economy continuity.

---

## 7. Acceptance result

Acceptance equation satisfied:

```text
4B.5A PASS
+ 4B.5B PASS
+ 4B.5C PASS
+ 4B.5D automated/backend/build/staging/manual PASS
+ founder explicit acceptance: "Phase 4B accepted"
= Phase 21.5.4B ACCEPTED
```

No Phase 4B acceptance condition remains open.

---

## 8. Next action

Phase 21.5.4C may now begin.

```text
NEXT -> 21.5.4C Public Creator + Indexability Policy
```

Before implementation, re-read:

```text
docs/strategy/STATUS.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
```

4C must inherit the accepted 4A/4B rules rather than weakening or duplicating them.

---

## 9. Deferred work beyond 4B

```text
Public Creator identity/attribution -> 4C
sitemap/indexability rollout -> 4D
Blog -> 4E
production prompt-draft.ir cutover -> later accepted deployment phase
```

Phase 4B does not pre-decide 4C Creator quality thresholds and does not change the stable production domain.
