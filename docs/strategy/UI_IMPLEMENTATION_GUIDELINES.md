# UI Implementation Guidelines — Theme-First, Component-First

Status: **PROJECT-WIDE OPERATIONAL RULE**

Date: 2026-09-10

This document defines the default implementation rules for all Prompt Draft UI work. It is project-wide and applies across milestones, branches, pages, components, refactors, and screenshot-driven implementation.

The goal is to preserve Prompt Draft's existing theme system, utility system, color system, `el-*` component system, global interaction primitives, and established page patterns while keeping custom CSS as close to zero as practical.

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
-> existing global interaction systems (modal/menu/tooltip/etc.)
-> existing theme/color CSS variables
-> minimal scoped CSS only for behavior/layout not expressible above
```

Do not jump directly to handwritten HTML/CSS when the component system, utility system, or existing global interaction primitives already express the requirement.

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
el-switch
el-divider
el-avatar
el-modal / global modal system
other existing el-* primitives
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

The goal is not literal copy/paste. The goal is semantic consistency with the existing system **and reuse of the same component APIs**.

A new `/manage/**` surface should look correct in both Light and Dark themes without needing page-specific theme overrides.

## 9. Form-control rule

Prefer Prompt Draft form components over hand-styled native controls.

Use:

```text
el-text-field
el-dropdown
el-multi-select
el-switch
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
3. inspect the actual component API/source when needed instead of assuming generic Vue/HTML prop names;
4. inspect available utility classes before adding CSS;
5. inspect existing global systems for modals, menus, tooltips, feedback, and related interaction patterns;
6. use semantic theme/color tokens, never screenshot-derived white/black;
7. omit `color` props when default `normal` is correct;
8. add scoped CSS only for the remaining structural/behavioral gap;
9. verify no unnecessary native controls or raw colors were introduced;
10. verify Light and Dark theme behavior before acceptance.

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

Also check for avoidable native controls:

```text
<input>
<textarea>
<select>
<button>
```

when a Prompt Draft primitive already exists for the same role.

The same principle applies to arbitrary raw colors or page-local styling patterns that duplicate an existing semantic theme token or component capability.

## 14. Assistant operating requirement

For every future Prompt Draft UI implementation, including in a new chat:

```text
Prompt Draft UI system > generic web primitives
Theme system > screenshot pixel appearance
Component system > custom HTML/CSS
Component props > custom CSS
Utilities > custom CSS
Global modal/menu systems > bespoke dialogs/menus
Theme tokens > raw colors
normal/default > explicit white/black
minimal scoped CSS > page-local styling systems
```

The assistant must not infer white/black styling from Light/Dark screenshots. It must preserve the project's semantic theme behavior and existing UI primitives by default.

This rule remains active unless the founder explicitly requests a fixed-color or custom-primitive exception for a specific UI element.

## 15. Treat the Prompt Draft UI stack as one integrated design system

The project UI is not merely a color palette. It is an integrated stack consisting of:

```text
el-* components
component props and defaults
layout semantics (rules/gap/padding/radius/border/background)
utility classes
theme/color tokens and alpha variants
global modal system
global menu/dropdown system
tooltip/feedback patterns
icon system
localization/direction behavior
responsive conventions
accepted page composition patterns
```

A correct implementation should compose these layers rather than recreate any one of them locally.

For example, a new card should normally be expressed through `el-flex` props, text through `el-text`, input through `el-text-field`, action through `el-button`, and selection through `el-dropdown`. It should **not** be a native `div + label + input + button` bundle with a new page-local CSS mini-framework.

The objective is not simply visual similarity. The objective is to inherit all the behavior already encoded by the system: Light/Dark theme, typography, spacing, hover/focus states, disabled states, responsive behavior, RTL/LTR support, and future global design changes.

## 16. Component APIs are part of the source of truth

Do not assume that Prompt Draft components use generic HTML or third-party prop names.

Before using an unfamiliar `el-*` primitive, inspect its current implementation or a nearby accepted usage. Examples include project-specific contracts such as:

```text
el-button -> disable, mode, color, type, icon, label, tooltip, p, radius, ...
el-flex   -> rules, gap, p, radius, br, bc, bg, ...
el-text   -> color, size, weight, type, localize, ...
el-text-field -> modelValue, type, rows, actions, disabled, readonly, ...
el-dropdown -> modelValue, items, item mappings, icon, disabled, ...
```

The exact source code wins over assumptions.

This prevents two classes of bug:

```text
visual inconsistency caused by bypassing component defaults
runtime/build bugs caused by using the wrong prop/event contract
```

Accepted adjacent code such as `/manage/archive` and `/manage/users` is both a visual reference and an API-usage reference.

## 17. Reuse global interaction systems instead of building local ones

When a workflow needs a modal, menu, tooltip, confirmation, selection dialog, or related global interaction, inspect and reuse the existing project system first.

Preferred pattern:

```text
useModal / global modal components
useMenu / el-dropdown / global menu
el-tooltip / existing feedback primitives
```

Avoid:

```text
page-local fixed overlays
handmade dialog backdrops
one-off dropdown implementations
one-off tooltip CSS
custom z-index stacks
```

A feature-specific modal body component is fine when the workflow is unique, but the modal shell, lifecycle, actions, sizing, backdrop, escape behavior, and theme should come from the global system.

The same rule applies to reusable workflows such as media selection: if multiple product surfaces need the same interaction, prefer one reusable project component/workflow rather than multiple feature-specific implementations.

## 18. Native DOM is an implementation detail, not the default UI layer

Some native elements remain legitimate when they are not acting as project UI primitives. Examples:

```text
a required v-html render sink for already-sanitized rich text
an image/video/canvas element whose browser behavior is itself the feature
an accessibility/semantic container for which no project primitive is appropriate
a browser-only input capability not covered by the component system
```

These exceptions do not justify hand-building ordinary controls or typography.

Rule of thumb:

```text
if the user perceives it as a Prompt Draft control/surface/text primitive -> prefer el-* / project system
if it is a low-level browser render sink or capability -> native DOM may be appropriate
```

Even native exceptions must inherit theme and layout behavior from the surrounding Prompt Draft components.

## 19. Utility classes and component props should absorb ordinary layout CSS

The project already includes reusable utilities for common layout and behavior, including patterns such as:

```text
w100 / h100
fw
ofh / overflow helpers
cursor/pointer helpers
direction helpers
spacing/radius/border classes generated by the utility system
semantic text/background utility classes
```

Before adding a scoped CSS declaration for width, flex wrapping, overflow, alignment, direction, spacing, ordinary radius, ordinary border, or semantic colors, check whether a component prop or existing utility already covers it.

Scoped CSS should increasingly become limited to truly component-specific presentation such as rich-text descendant selectors, unusual responsive geometry, pseudo-elements, and browser quirks.

## 20. Page-local UI systems are prohibited by default

Do not create a parallel visual/component vocabulary inside one feature.

Examples of patterns to avoid:

```text
.manage-feature-panel + local panel CSS when el-flex props cover it
.manage-feature-input + custom field styling when el-text-field exists
.manage-feature-button + native button CSS when el-button exists
custom status colors when project semantic colors exist
custom tabs when el-button/el-menu patterns cover the interaction
custom modal shell when global modal exists
```

When a genuinely reusable capability is missing, prefer adding or extracting a reusable project component that follows the existing system rather than burying a new primitive inside one page.

For high-risk or newly introduced UI surfaces, focused source regression tests may enforce these invariants (for example, preventing avoidable native controls, raw colors, or page-local styling systems from returning).
