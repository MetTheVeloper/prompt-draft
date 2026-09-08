# Milestone 21.5 — Phase 4B.5B Shared Prompt Presentation

Status: **IMPLEMENTED / FOUNDER VERIFICATION NEXT / NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

Accepted prerequisite:

```text
4B.5A Localized Public Prompt Description Contract
-> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
```

---

## 1. Objective

4B.5B removes duplicated Prompt hero/cinema presentation between:

```text
Public Prompt      /prompt/:id
Protected Product  /prompts?id=<id>
```

without merging routes, read models, authorization or product state.

The shared component is presentation-only.

---

## 2. Audit findings

Before implementation:

- `app/pages/prompt/[id].vue` owned a separate public hero implementation.
- `app/components/prompts/PromptDetail.vue` mixed cinema/background rendering with protected Prompt body, variants, unlock/copy, economy feedback, Telegram actions and protected navigation.
- `app/components/visual/slider.vue` is canvas/client-enhanced and starts rendering only after mount, so it cannot provide deterministic SSR media on its own.
- protected `/api/archive/:id` remained the authoritative protected detail source and did not expose the authored localized description to the protected frontend contract.

The implementation therefore does **not** share `PromptDetail.vue` itself and does **not** make the public page consume protected detail data.

---

## 3. Shared presentation shell

New component:

```text
app/components/prompts/PromptPresentation.vue
```

Presentation props are limited to public/presentation concepts:

```text
localized title
localized description
public/archive numeric id
publication date
model label
tags
preview media
active locale
optional eyebrow / preview-count copy
```

Route-specific behavior is composed through slots:

```text
topbar-leading
meta
actions
status
scroll-cue
```

The component has no knowledge of:

```text
protected Prompt body
variants
unlock state
balance / Goin
permissions
authenticated viewer
product authorization
```

---

## 4. SSR-safe cinema behavior

The existing `visual-slider` remains the client enhancement for multi-image Prompt cinema.

Because the slider is canvas/mount-driven, `PromptPresentation` first emits a deterministic real image in SSR:

```text
first preview -> SSR <img>
additional previews -> ClientOnly visual-slider enhancement
```

When there is no preview image, the presentation shell renders a deterministic visual fallback.

This keeps Public Prompt request-time HTML media-capable without requiring browser canvas execution.

---

## 5. Public Prompt integration

`app/pages/prompt/[id].vue` now renders `PromptPresentation` while preserving its existing public-only data path:

```text
usePublicPrompt()
GET /api/public/prompts/:id
sanitized public DTO
```

The public page does not call `usePromptArchive()`, `/api/archive/:id`, unlock APIs or economy state.

Preserved public semantics:

```text
authored localized description
canonical / hreflang / x-default
meta / OG / Twitter description
CreativeWork.description
Open full prompt -> localized protected /prompts?id=<id>
```

The previous duplicate engineering-style Public Prompt hero/body presentation has been replaced by the shared cinema shell.

---

## 6. Protected Prompt integration

`app/components/prompts/PromptDetail.vue` now uses the same `PromptPresentation` shell for hero/cinema presentation.

Protected logic remains owned by `PromptDetail.vue` and its existing composables:

```text
usePromptArchiveUnlock()
Prompt body
variants
unlock + copy
Goin/economy feedback
Telegram action
protected previous/next navigation
protected Prompt content section
```

The protected page does not cross-fetch `usePublicPrompt()`.

To provide the same founder-authored localized description through the protected data source, protected Archive detail now includes:

```text
items.descriptions AS description
```

in `GET /api/archive/:id`.

This does not weaken authorization because the detail route remains authenticated + email-gated.

`usePromptArchive.ts` normalizes the localized description from the protected response. Legacy/static fallback snapshots do not synthesize a description; they explicitly use `description: null`.

---

## 7. Boundary regression contract

New test:

```text
pnpm test:prompt-presentation
```

Source contract:

```text
scripts/prompt-presentation-contract.test.ts
```

It verifies that:

- shared presentation emits an SSR image before ClientOnly slider enhancement.
- shared presentation contains no unlock/economy/auth/variant/product state.
- Public Prompt uses `usePublicPrompt()` and does not cross into protected APIs/state.
- protected Prompt keeps protected product state outside the shell.
- protected Archive detail supplies authored description through its own protected contract.
- fallback does not invent description localization.

---

## 8. Diff boundary

Implementation diff from the accepted 4B.5A checkpoint is intentionally limited to:

```text
app/components/prompts/PromptPresentation.vue
app/components/prompts/PromptDetail.vue
app/pages/prompt/[id].vue
app/composables/usePromptArchive.ts
app/types/promptArchive.ts
backend/src/archive.mjs
scripts/prompt-presentation-contract.test.ts
package.json
```

No unlock/economy/auth implementation file was changed.

No public Prompt backend projection was widened in 4B.5B.

No 4B.5C Discovery implementation has started.

---

## 9. Founder verification required

Automated gates:

```text
pnpm test:prompt-presentation
pnpm test:public-prompt-web
pnpm test:public-prompt-seo
pnpm test:public-prompt-description
pnpm test:public-prompt-links
pnpm test:interaction-polish
pnpm seo:audit-routes:strict

docker compose exec api npm run test:public-prompt
```

Production-like gate:

```text
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

Staging visual smoke should compare the same Prompt on:

```text
https://grassic.ir/prompt/511
https://grassic.ir/fa/prompt/511
https://grassic.ir/prompts?id=511
https://grassic.ir/fa/prompts?id=511
```

Required outcomes:

```text
Public + protected hero/cinema share the same presentation language.
First public preview is present in SSR-visible presentation.
EN remains LTR; FA remains RTL.
Localized authored description appears correctly.
Public CTA still enters protected localized /prompts?id=:id.
Protected route still requires auth/email.
Unlock/copy/Goin behavior remains protected and functional.
Prompt body + variants remain available only on protected detail.
Protected previous/next navigation remains functional.
Public page never serializes protected Prompt/variant/economy/viewer data.
Staging NUXT_PUBLIC_NOINDEX remains authoritative.
```

---

## 10. Current state

```text
4B.5A localized descriptions          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation      -> IMPLEMENTED / FOUNDER VERIFICATION NEXT
4B.5C Discovery visual layer          -> NOT STARTED
4B.5D final regression / acceptance   -> NOT STARTED
Phase 21.5.4B                         -> NOT ACCEPTED
```

Do not start 4B.5C until this slice passes founder-local verification.
