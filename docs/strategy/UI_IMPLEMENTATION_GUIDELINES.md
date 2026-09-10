# UI Implementation Guidelines — Theme-First, Component-First

Status: **PROJECT-WIDE OPERATIONAL RULE**

Date: 2026-09-10

This document defines the default implementation rules for all Prompt Draft UI work. It is project-wide and applies across milestones, branches, pages, components, refactors, and screenshot-driven implementation.

The goal is to preserve Prompt Draft's existing theme system, utility system, color system, and `el-*` component system while keeping custom CSS as close to zero as practical.

## 1. Core rule: screenshots are not the color source of truth

A screenshot may be captured in Light theme, Dark theme, or any future theme. It is evidence for:

```text
layout
spacing
hierarchy
content
state
interaction
relative emphasis
```

It is **not** evidence that a visible light area should become hard-coded white or that a visible dark area should become hard-coded black.

Never infer raw foreground/background colors from a screenshot when Prompt Draft already has a theme token or component semantic for the same role.

When screenshots from different themes are supplied, interpret them as different renderings of the same semantic UI, not as separate color specifications.

## 2. Source-of-truth order for UI implementation

For every UI element, use this order of preference:

```text
existing Prompt Draft el-* component
-> existing component props
-> existing project utility classes
-> existing theme/color CSS variables
-> minimal scoped CSS only for behavior/layout not expressible above
```

Do not jump directly to handwritten CSS when the component system or utility system already expresses the requirement.

Before creating new UI primitives or CSS, inspect adjacent accepted surfaces, especially existing `/manage/**` pages, for the project-native pattern.

## 3. Component-first requirement

Prompt Draft already has a flexible `el-*` component system. Prefer it over native HTML plus custom styling whenever the component exists for the job.

Typical examples include:

```text
el-flex
el-grid
el-text
el-icon
el-button
el-text-field
el-dropdown
el-multi-select
el-divider
el-avatar
```

Examples of the intended style:

```vue
<el-flex
  rules="csc"
  class="w100"
  bg="surface"
  :radius="14"
  :br="1"
  bc="normal15"
>
  <el-text :size="12">Primary text</el-text>
  <el-text color="normal55" :size="11">Secondary text</el-text>
</el-flex>
```

Use native `input`, `textarea`, `select`, `button`, or custom wrappers only when there is a concrete behavior or browser capability not already covered by the project component system.

When a native control is genuinely necessary, it must still inherit Prompt Draft theme semantics through project variables/utilities; it must not introduce a separate visual system.

## 4. Default text color is `normal`

The normal theme text color is the default semantic foreground.

For `el-*` components that expose a `color` prop, the default is normally `normal`. Therefore:

```text
if normal/default text is intended -> omit the color prop
if reduced emphasis is intended     -> use normalXX, e.g. normal55
if semantic state is intended       -> use the semantic project color
```

Preferred:

```vue
<el-text>Normal text</el-text>
<el-text color="normal55">Secondary text</el-text>
<el-button icon="refresh" mode="flat" />
```

Avoid redundant declarations such as `color="normal"` unless they materially clarify or override a surrounding context.

Do not use `white`, `black`, `#fff`, `#000`, `rgb(255 255 255 ...)`, `rgb(0 0 0 ...)`, or equivalent raw grayscale values as substitutes for `normal`/`normalXX`.

## 5. Theme/color system is authoritative

Use Prompt Draft semantic colors and alpha variants instead of raw colors.

Common patterns:

```text
normal / normalXX  -> text, muted text, neutral borders and neutral fills
surface            -> surfaces/cards/panels
background         -> page/background semantics
prim / primXX      -> primary emphasis
red / redXX        -> errors/destructive states
green / greenXX    -> success/published states
orange / orangeXX  -> warnings/draft states
blue / blueXX      -> informational states
```

For CSS that genuinely must be written, use theme variables:

```css
color: var(--normalText);
border-color: var(--normalText15);
background: var(--normalText5);
```

Prefer project alpha tokens such as `normal5`, `normal10`, `normal15`, `normal55`, etc. over handwritten RGBA approximations.

Use `currentColor` / `color-mix(...)` only when a token or component semantic cannot express the required derived visual behavior cleanly.

## 6. White and black are explicit-contrast exceptions only

Hard-coded or explicit white/black is allowed only when the design intentionally requires a fixed contrast color over a known fixed visual background where theme inheritance would be incorrect.

Examples that may justify an exception:

```text
white text permanently over a dark photo/image overlay
black text permanently over a known light branded swatch
fixed contrast glyph inside a media badge whose background is itself fixed
```

This is an exception, not a default styling technique.

Before using white or black, the implementer must be able to answer:

```text
Why must this element remain the same fixed contrast color in both Light and Dark theme?
```

If the answer is merely "the screenshot looked white/dark", the usage is invalid.

## 7. CSS budget: near zero by default

Custom scoped CSS should be treated as the last layer, not the first.

Good reasons for scoped CSS include:

```text
complex responsive grid geometry unavailable through existing props/utilities
special overflow behavior
editor/preview prose selectors
pseudo-elements
third-party/native browser quirks
highly specific interaction states not exposed by an existing component
```

Poor reasons include:

```text
setting text color
setting ordinary surface/background color
ordinary borders
padding/gap already supported by components/utilities
standard flex/grid composition
button styling already supported by el-button
text-field styling already supported by el-text-field
```

When CSS is necessary, prefer structural CSS and keep color semantics in existing variables.

## 8. Existing `/manage/**` surfaces are the primary reference for new Manage UI

New Manage surfaces must first audit neighboring accepted Manage pages before inventing local styling.

Current patterns include:

```vue
<el-flex bg="surface" :radius="14" :br="1" bc="normal15" />
<el-text color="normal55" />
<el-text color="normal45" />
<el-button color="prim" />
<el-text color="red" />
<el-text :color="statusColor(...)" />
```

The goal is not literal copy/paste. The goal is semantic consistency with the existing system.

A new `/manage/**` surface should look correct in both Light and Dark themes without needing page-specific theme overrides.

## 9. Form-control rule

Prefer Prompt Draft form components over hand-styled native controls.

Use:

```text
el-text-field
el-dropdown
el-multi-select
other existing el-* form primitives
```

before building custom `<input>`, `<textarea>`, or `<select>` styling.

If native controls are necessary, inherit the global form system and add only the minimum missing behavior. Do not recreate the complete field visual style locally.

## 10. Semantic color beats visual imitation

Color selection must describe meaning, not screenshot pixels.

Examples:

```text
published/success -> green
warning/draft     -> orange
destructive/error -> red
informational     -> blue
primary action    -> prim
neutral/default   -> normal
secondary text    -> normalXX
surface           -> surface
```

Do not use raw hex/RGB values for semantic status colors when project tokens already exist.

## 11. Theme verification requirement

Any meaningful new or changed UI surface must be visually checked in both Light and Dark themes before acceptance when practical.

The purpose is not to tune two separate designs. It is to verify that one semantic implementation correctly follows both themes.

At minimum inspect:

```text
primary text
secondary text
surfaces
borders
inputs
buttons
hover/focus states
empty/loading/error states
status colors
preview/editor areas
```

A Light-theme screenshot and a Dark-theme screenshot should not result in separate hard-coded style branches unless product behavior explicitly calls for theme-specific design.

## 12. Implementation audit before writing UI code

For every UI task, especially screenshot-driven tasks:

1. identify the closest existing accepted page/component;
2. inspect existing `el-*` primitives that can implement the UI;
3. inspect available utility classes before adding CSS;
4. use semantic theme/color tokens, never screenshot-derived white/black;
5. omit `color` props when default `normal` is correct;
6. add scoped CSS only for the remaining structural/behavioral gap;
7. verify no unnecessary raw colors were introduced;
8. verify Light and Dark theme behavior before acceptance.

## 13. Review checklist / anti-regression rule

Before considering UI implementation complete, check changed UI files for:

```text
#fff / #ffffff / white
#000 / #000000 / black
rgb(255 ...)
rgba(255 ...)
rgb(0 ...)
rgba(0 ...)
```

Each occurrence must either:

```text
be removed in favor of the Prompt Draft system
```

or:

```text
have a genuine explicit fixed-contrast reason
```

The same principle applies to arbitrary raw colors that duplicate an existing semantic theme token.

## 14. Assistant operating requirement

For every future Prompt Draft UI implementation, including in a new chat:

```text
Theme system > screenshot pixel appearance
Component system > custom HTML/CSS
Component props > custom CSS
Utilities > custom CSS
Theme tokens > raw colors
normal/default > explicit white/black
minimal scoped CSS > page-local styling systems
```

The assistant must not infer white/black styling from Light/Dark screenshots. It must preserve the project's semantic theme behavior and existing UI primitives by default.

This rule remains active unless the founder explicitly requests a fixed-color exception for a specific UI element.
