# Milestone 21 — UI Polish Closure Pass

Status: **IMPLEMENTATION COMPLETE / AWAITING FINAL LOCAL VERIFICATION**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

## Purpose

Milestone 21A–21F are functionally complete and locally verified. This final pass tightens the Growth Foundation presentation without reopening Marketplace scope or changing the accepted XP/Goin, Prompt unlock, analytics, or permission semantics.

## Implemented polish

### 1. Shared Goin presentation primitive

Added the founder-provided Goin asset:

```text
public/icons/goin.svg
```

Added reusable component:

```text
app/components/economy/GoinAmount.vue
```

Contract:

```text
value
size
weight
color
```

The component uses the shared UI system and renders the Goin symbol together with theme-aware text. It is now the preferred presentation primitive anywhere a user-facing Goin amount is shown.

### 2. Private Profile Menu hierarchy

The private Profile Menu now treats spendable Goin as the higher-priority balance signal:

```text
username + Goin amount
XP moved to a separate information row
redundant Goin Balance row removed
```

A full-width orange Goin explainer action was added. It opens through the project-wide modal system rather than introducing a second modal implementation.

Reusable modal entry point:

```text
app/composables/useGoinInfoModal.ts
```

Modal content:

```text
app/components/economy/GoinInfoModal.vue
```

The modal explains:

```text
current private Goin balance
current earn rules
current Prompt Archive first-copy spend rule
current simulation reference value
simulation / non-fiat warning
```

The values are read from the authoritative Economy policy rather than duplicated as frontend constants.

### 3. Economy policy metadata for user UX

`GET /api/economy` now returns the authenticated user's private economy state plus the current read-only policy metadata required by the Goin explainer:

```text
reference value
issuance rule version + current issuance amounts
sink rule version + Prompt Archive unlock cost
```

This is a presentation-supporting read contract only.

It does **not** change:

```text
ledger authority
atomic debit behavior
unlock pricing authority
XP semantics
admin write permissions
fiat/cash-out semantics
```

No migration was added.

### 4. Growth Manage information density and visualization

`/manage/growth` now uses `useScreen()` instead of a page-local window-width system.

The root Growth flex alignment was corrected to the intended `rules="ccs"`.

The two tabular data groups now have chart-first visualization while preserving table views:

```text
Daily signals -> chart by default / table optional
Popular Prompt tags -> chart by default / table optional
```

Both visualization panels are placed above numeric summary cards.

Desktop/wide layout now behaves like an effective 8-column summary layout:

```text
2 metric groups per row
4 cards inside each group
```

Laptop and smaller breakpoints retain the less-dense existing structure.

Goin circulation values use the shared Goin amount component.

### 5. Economy Manage Goin amount

The Prompt unlock summary in `/manage/economy` renders its Goin value through the shared Goin amount presentation primitive used by `ManageMetricCard`.

### 6. Prompt unlock/copy feedback

Prompt Archive Copy behavior remains unchanged, but its presentation is clearer:

```text
locked / checking / unlocked / error feedback has a state icon
successful unlocked feedback text remains theme-normal instead of green
Copy button state remains independent from the explanatory text color
```

No repeated charge behavior changed.

### 7. Prompt Archive list theme alignment

`/prompts` list surface was strengthened from:

```text
surface10
```

to:

```text
surface80
```

Prompt card tags now use the theme-aware neutral marker contract:

```text
marker="normal"
color="invert"
```

Prompt card border behavior matches the existing Draft-card interaction pattern:

```text
default -> normal15
hover   -> normal50
```

Prompt cards were also refactored to follow the Home discovery visual logic for neutral overlays, fallback gradients, and text contrast rather than relying on fixed black/white neutral styling.

### 8. `/user` Draft-card theme alignment

User Draft cards now use the same theme-aware visual direction as Home discovery and Prompt Archive cards:

```text
theme-aware neutral shade gradients
theme-aware fallback background
theme-aware title/meta text
normal/invert neutral output-format marker
semantic visibility marker with theme-normal text
surface-aware action pill
existing normal15 -> normal50 border hover behavior preserved
```

The card-level presentation no longer depends on fixed white text over fixed black neutral overlays.

## Shared presentation decisions

The following are deliberate reusable decisions, not one-off screenshot patches:

```text
Goin amount -> EconomyGoinAmount
Goin education -> useGoinInfoModal()
Growth charts -> ManageGrowthVisuals
Manage numeric summary cards -> ManageMetricCard
Prompt/User image-card neutral contrast -> Home discovery theme-token logic
responsive Manage density -> useScreen()
```

## Non-goals preserved

```text
no new behavioral analytics event
no new Growth metric
no new economy transaction type
no change to XP/reputation semantics
no change to Prompt unlock charge semantics
no migration 025
no fiat purchase/cash-out/payout
no Marketplace Product/Order implementation
no redesign of the global Manage shell
```

## Theme / localization rules

```text
use existing theme tokens/components
preserve Light/Dark behavior
preserve EN/FA + RTL
prefer normal/theme-aware text colors
semantic colors only where they communicate state
avoid deriving fixed white/black neutral presentation from screenshots
```

## Final local verification gate

Pull the completed polish implementation:

```powershell
git pull
docker compose up -d --build api
pnpm generate
```

Then visually smoke-test:

```text
/manage/growth
  - chart is default for both visualization panels
  - table toggles still work
  - desktop/wide shows two 4-card groups per row
  - laptop/smaller retains the lower-density structure
  - EN/FA
  - Light/Dark

/manage/economy
  - Prompt unlock summary shows Goin asset + amount

Profile Menu
  - Goin is next to username
  - XP is a separate row
  - no duplicate Goin balance row
  - orange Goin explainer button opens the central modal
  - modal values match current Super-Admin Economy settings

/prompts?id=<published-id>
  - locked Copy state remains correct
  - first Copy still charges only once
  - unlocked feedback text is normal-colored and has a state icon

/prompts
  - surface80 content layer
  - neutral/invert tags
  - border hover works
  - cards remain readable in Light/Dark

/user
  - Draft cards remain readable in Light/Dark
  - neutral overlays/markers follow the same theme-aware direction as Home and /prompts
  - hover and secondary-preview transitions remain intact
```

Milestone 21 should be marked fully closed only after this final local build and visual smoke pass is accepted.
