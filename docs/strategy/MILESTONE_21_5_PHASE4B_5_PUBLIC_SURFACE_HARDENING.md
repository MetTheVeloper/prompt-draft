# Milestone 21.5 — Phase 4B.5 Public Surface Hardening

Status: **IN PROGRESS / 4B.5A ACCEPTED / 4B.5B NEXT / PHASE 4B NOT ACCEPTED**

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

Do not reopen this contract during 4B.5B unless a verified regression requires it.

---

## 4. 4B.5B — Shared Prompt Presentation Shell

Status:

```text
NEXT
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

### Target presentation responsibility

The exact component name may be chosen during implementation, but the shared layer should own only presentation concepts equivalent to:

```text
PromptPresentation
├── cinema / preview-media background
├── localized title
├── localized description
├── tags
├── public-safe id / publication date / model metadata
├── shared responsive LTR/RTL layout
├── slot/composition: primary actions
├── slot/composition: secondary actions
├── slot/composition: navigation/footer
└── slot/composition: route-specific extended content
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

Those belong only to protected-page state/children/slots.

### Visual direction

Reuse the existing protected Prompt cinema/background language rather than maintaining two separate hero systems.

Preferred media behavior:

```text
public preview images
  -> shared/reusable cinema presentation where SSR-safe
  -> deterministic first public image remains SSR-visible fallback
  -> client enhancement may animate/slide additional previews
```

The accepted authored description from 4B.5A must remain visible and remain the SEO source of truth.

### Route-specific behavior to preserve

Protected-only examples:

```text
unlock/copy controls
protected catalog navigation
protected Prompt exploration/content
viewer/economy state
Telegram/product actions where already applicable
```

Public-only examples:

```text
Open full prompt CTA -> localized protected /prompts?id=<id>
public acquisition semantics
public SEO semantics
```

### 4B.5B audit-before-write requirement

Before changing presentation code, inspect:

```text
app/pages/prompt/[id].vue
protected /prompts detail composition
existing PromptDetail / cinema / slider components
public preview image data shape
protected preview image data shape
SSR safety of existing media primitives
LTR/RTL behavior
mobile/tablet/desktop layouts
route-specific action/control ownership
```

The first implementation pass should identify the smallest presentation-only extraction that preserves both data boundaries.

---

## 5. 4B.5C — Public Discovery Visual Layer

Status:

```text
NOT STARTED
```

Keep the existing `/discover/:slug` information architecture, routing, SEO and curated Prompt grid while adding the media-rich acquisition quality expected from Home/Public Prompt.

Preserve:

```text
canonical /discover/:slug and /fa/discover/:slug
existing title/description/CTA hierarchy
existing curated Prompt grid/cards
localized Public Prompt links
current canonical/hreflang behavior
real 404/canonical redirect behavior
```

Use only already-public preview media.

If the existing cinema/slider primitive is client-heavy, SSR must still emit a deterministic first-image fallback before progressive enhancement.

Preserve EN LTR, FA RTL, readable contrast, responsive layout and accessibility semantics.

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
Discovery visual-layer contract tests where practical
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
```

Required Discovery staging smoke:

```text
EN/FA Discovery hero uses public category media
hero text remains readable
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
Start 4B.5B — Shared Prompt Presentation Shell.
```

Audit first, then implement the smallest presentation-only shared shell. Preserve 4B.5A data/SEO contracts and all protected authorization/economy behavior.

Do not start 4B.5C until 4B.5B is implemented and founder-verified.

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
