# Milestone 21.5 — Phase 4B.5B Shared Prompt Presentation

Status: **DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE**

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

Final acceptance successor:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
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

## 2. Shared presentation shell

Canonical shared component:

```text
app/components/prompts/PromptPresentation.vue
```

Root alias:

```text
app/components/PromptPresentation.vue
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
optional Telegram message metadata used only for the public channel badge
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

## 3. SSR-safe cinema behavior

The existing `visual-slider` remains the client enhancement for multi-image Prompt cinema.

Because the slider is canvas/mount-driven, `PromptPresentation` first emits a deterministic real image in SSR:

```text
first preview -> SSR <img>
additional previews -> ClientOnly visual-slider enhancement
```

With no preview image, the shell renders a deterministic visual fallback.

---

## 4. Public Prompt integration

`app/pages/prompt/[id].vue` uses only:

```text
usePublicPrompt()
GET /api/public/prompts/:id
sanitized public DTO
```

It does not call protected detail/unlock/economy APIs.

Preserved public semantics:

```text
authored localized description
canonical / hreflang / x-default
meta / OG / Twitter description
CreativeWork.description
Open full prompt -> localized protected /prompts?id=<id>
```

Founder visual review added one optional public-safe field:

```text
telegramMessageId: number | null
```

It comes from `prompt_archive_items.telegram_message_id`, not from public Prompt id inference.

When present, the shared badge links to:

```text
https://t.me/prompt-draft/{telegramMessageId}
```

in a new tab.

No protected Prompt body, variants, source Draft metadata, storage keys, unlock state, economy state, permissions or viewer data were added to the public projection.

---

## 5. Protected Prompt integration

`app/components/prompts/PromptDetail.vue` uses the same presentation shell while retaining protected ownership of:

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

Protected Archive detail supplies the same authored localized description through its own protected contract and remains authenticated + email-gated.

Legacy/static fallback snapshots do not synthesize a description.

---

## 6. Founder-approved theme/navigation polish

Final founder visual review established:

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

Neither back button hardcodes Home/catalog destinations.

---

## 7. Boundary regression contract

Automated gate:

```text
pnpm test:prompt-presentation
```

It verifies:

- root alias resolves the shared component.
- shared presentation emits an SSR image.
- shared presentation contains no unlock/economy/auth/variant/product state.
- Public Prompt uses `usePublicPrompt()` only.
- protected Prompt keeps product state outside the shell.
- protected Archive detail supplies authored description through its protected contract.
- fallback does not invent description localization.
- overlay/badges use theme-safe tokens.
- Telegram badge URL is canonical/new-tab.
- Public Prompt layout is full-bleed.
- both Prompt back controls use `router.back()` with `color="normal"`.
- back direction is `arrow_back` LTR / `arrow_forward` RTL.
- neither back control contains a hardcoded route target.

Public Prompt backend/client tests additionally guard optional `telegramMessageId` inside the explicit public allowlist while protected columns remain excluded.

---

## 8. Founder verification — 2026-09-08

Founder browser/runtime review confirmed:

```text
Public + protected pages render the shared presentation language
SSR Prompt image is present
EN/FA presentation is correct
localized authored descriptions render correctly
light/dark theme synchronization is correct
Prompt/model/Telegram badges follow approved theme semantics
Telegram badge/link behavior is correct when metadata exists
Public Prompt is full-bleed
Public + protected back controls use browser history and correct locale direction
protected unlock/copy/economy controls remain protected
```

This visual slice is complete. Its contracts remain part of 4B.5D final regression.

---

## 9. Current state

```text
4B.5A localized descriptions          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation      -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5C Discovery visual layer          -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5D final regression / acceptance   -> IN PROGRESS
Phase 21.5.4B                         -> NOT ACCEPTED
```

Proceed only through the 4B.5D final regression/acceptance record before starting 4C.
