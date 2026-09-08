# Milestone 21.5 — Phase 4B.5 Public Surface Hardening

Status: **IN PROGRESS / 4B.5A ACCEPTED / 4B.5B+4B.5C IMPLEMENTED / FOUNDER VERIFICATION NEXT / PHASE 4B NOT ACCEPTED**

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
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_CUTOVER.md
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5C_DISCOVERY_VISUAL_LAYER.md
```

This document is the current continuation source of truth for the final hardening work before Phase 4B acceptance.

---

## 1. Current verified checkpoint

The following are accepted regression requirements:

```text
4B.1 backend public projection       -> FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route    -> FOUNDER-LOCAL VERIFIED
4B.3 Public Prompt SEO metadata      -> FOUNDER-LOCAL VERIFIED
4B.4 public-link migration           -> FOUNDER-LOCAL VERIFIED
post-4B.4 interaction polish         -> FOUNDER-LOCAL VERIFIED
4B.5A localized descriptions         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
Phase 4B acceptance                  -> NOT ACCEPTED
```

4B.5A verification established:

```text
100/100 published Archive rows have founder-reviewed EN/FA descriptions
migration 026 publish-localization constraint applied
Admin create/update requires EN/FA descriptions
Admin publish requires complete EN/FA title + description
Public Prompt DTO exposes localized description only as the new public field
availableLocales requires complete title + description
Public Prompt SQL still does not SELECT prompt or variants
visible Public Prompt description uses authored localized content
meta/OG/Twitter/CreativeWork.description use the same authored source
EN/FA browser smoke PASS
production-like Cloudflare stack build/start PASS
backend description/public Prompt tests PASS
frontend Public Prompt/SEO/link/interaction tests PASS
strict route audit PASS, 445 files, zero hazards
```

Canonical 4B.5A acceptance record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_CUTOVER.md
```

4B.5B and 4B.5C are implemented but remain pending final founder-local visual/runtime verification before 4B.5D begins.

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
/prompts?id=<id>             -> protected product/auth/unlock/economy surface
```

Public Prompt projection may contain only intentionally public presentation data. The following remain explicitly forbidden from the public read model and shared public props:

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

No fake fallback localization is allowed.

Do not reopen this contract during later hardening unless a verified regression requires it.

---

## 4. 4B.5B — Shared Prompt Presentation Shell

Status:

```text
IMPLEMENTED / FINAL BACK-FIX RE-VERIFICATION NEXT
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
```

### Objective

Remove duplicated visual structure between:

```text
Public Prompt      /prompt/:id
Protected Product  /prompts?id=<id>
```

without merging their routes, data sources, authorization or product behavior.

### Hard boundary

```text
/prompt/:id
  -> public sanitized DTO
  -> SSR/indexable acquisition surface

/prompts?id=<id>
  -> protected detail API/product state
  -> auth/email/unlock/economy behavior
```

The public page must never consume protected detail data just because the visual shell is shared.

### Implemented presentation responsibility

The shared layer owns only presentation concepts equivalent to:

```text
PromptPresentation
├── cinema / preview-media background
├── localized title
├── localized description
├── tags
├── public-safe id / publication date / model metadata
├── optional public-safe Telegram post metadata
├── shared responsive LTR/RTL layout
├── slot/composition: primary actions
├── slot/composition: secondary actions
├── slot/composition: navigation/footer
└── slot/composition: route-specific extended content
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

Those remain only in protected-page state/children/slots.

### Implemented visual behavior

```text
public/protected preview images
  -> shared cinema presentation
  -> deterministic first image SSR-visible
  -> ClientOnly visual-slider enhancement for additional previews
```

Founder visual polish additionally established:

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

The authored description from 4B.5A remains visible and remains the SEO source of truth.

---

## 5. 4B.5C — Public Discovery Visual Layer

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION NEXT
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5C_DISCOVERY_VISUAL_LAYER.md
```

The existing `/discover/:slug` information architecture, routing, SEO and curated Prompt grid are preserved while adding the media-rich acquisition quality expected from Home/Public Prompt.

Implemented behavior:

```text
hero -> el-flex type="section"
hero height -> application viewport below header
hero media -> only already-public category cover previews
first category preview -> deterministic SSR <img>
multiple previews -> ClientOnly visual-slider enhancement
slider canvas -> scoped absolute to hero, not fixed over page scroll
hero heading flex -> rules="ccs"
collection heading flex -> rules="ccs"
```

Preserved:

```text
canonical /discover/:slug and /fa/discover/:slug
existing title/description/CTA hierarchy
existing curated Prompt grid/cards
localized Public Prompt links
current canonical/hreflang behavior
real 404/canonical redirect behavior
```

No protected Prompt body, variants, economy, permission, storage or viewer data enters the Discovery page.

---

## 6. 4B.5D — Final regression and founder acceptance

Status:

```text
NOT STARTED
```

Do not start 4C until 4B.5A–4B.5C are implemented and verified.

Minimum automated regression set:

```text
backend public Prompt contract tests
Public Prompt browser/SSR contract tests
Public Prompt SEO tests
localized-description contract tests
public-link migration tests
interaction-polish tests
SEO route contracts
strict locale-routing audit
shared-presentation boundary/regression tests
Discovery visual-layer contract tests
production-like pnpm stack build/start
```

Required protected regression:

```text
/prompts?id=<id> still auth/email/unlock gated
GET /api/archive/:id still protected
unlock/copy/economy behavior unchanged
protected-only actions/navigation unchanged
shared presentation does not leak protected state into public payloads/props
```

Required Public Prompt staging smoke:

```text
EN /prompt/:id
FA /fa/prompt/:id
localized title + authored description
preview-media cinema/background
canonical/hreflang/x-default
meta/OG/Twitter description from authored description
CreativeWork.description from authored description
no serialized private-key leakage
Open full prompt -> protected localized /prompts?id=<id>
back control -> browser history, not hardcoded route
```

Required Discovery staging smoke:

```text
EN/FA Discovery hero uses public category media
SSR first image remains visible
client slider stays scoped to hero
hero text remains readable
hero/collection alignment uses founder-approved ccs rules
category/card routes remain correct
Public Prompt links remain localized
SEO/canonical behavior unchanged
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
+ 4B.5D automated/runtime/staging PASS
+ founder explicit acceptance
= Phase 21.5.4B ACCEPTED
```

---

## 7. Immediate next action

```text
Founder-local re-verification of:
1. final 4B.5B browser-history back behavior
2. 4B.5C Discovery visual layer
```

Run the focused automated gates, production-like frontend build/start and EN/FA staging visual smoke.

If both slices pass founder verification, begin 4B.5D final regression / acceptance.

Do not start 4C before 4B.5D is complete and explicitly accepted.

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
