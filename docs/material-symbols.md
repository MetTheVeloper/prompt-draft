# Material Symbols icon system

Prompt Draft uses **Material Symbols** as its single application icon system. All UI icon rendering is centralized through `<el-icon />`; consumers should never render Material Symbols font classes directly.

The three Material Symbols variable fonts are self-hosted under:

```text
public/fonts/material-symbols/
├── material-symbols-outlined.woff2
├── material-symbols-rounded.woff2
└── material-symbols-sharp.woff2
```

They are declared in `app/assets/css/material-symbols.css` and loaded by `nuxt.config.ts`. No Google Fonts CDN request is required at runtime. Because Prompt Draft's offline manifest includes the generated public output, the fonts are also part of the offline package.

## `<el-icon />` API

`app/components/el/Icon.vue` is the only official renderer.

```ts
icon: string
size?: number
color?: string
badge?: string | number
mode?: string // deprecated compatibility prop; renderer is always Material Symbols
variant?: 'outlined' | 'rounded' | 'sharp'
weight?: number
fill?: boolean | 0 | 1
grade?: number
opticalSize?: number
```

Defaults:

```ts
variant = 'rounded'
weight = 400
fill = 0
grade = 0
opticalSize = size
```

When `size` is omitted, the existing Prompt Draft `dimension(...)` / global-size behavior remains the source of the icon box size.

The legacy `mode` prop remains accepted so older consumers do not crash, but it no longer selects a renderer. New code should omit `mode` and use `variant` when a different Material Symbols family is required.

## Basic usage

```vue
<el-icon
  icon="settings"
  :size="20"
  color="normal"
/>
```

Filled rounded symbol:

```vue
<el-icon
  icon="favorite"
  variant="rounded"
  :fill="true"
  :weight="500"
  :size="24"
/>
```

Sharp symbol with custom grade and optical size:

```vue
<el-icon
  icon="tune"
  variant="sharp"
  :grade="100"
  :optical-size="32"
  :size="32"
/>
```

## Material Symbols variable axes

`<el-icon />` controls the official axes through `font-variation-settings` and clamps values to the supported ranges:

| Prop | Axis | Range | Purpose |
| --- | --- | --- | --- |
| `fill` | `FILL` | `0–1` | Outline vs. filled glyph |
| `weight` | `wght` | `100–700` | Stroke weight |
| `grade` | `GRAD` | `-50–200` | Fine visual emphasis without changing layout width |
| `opticalSize` | `opsz` | `20–48` | Optical tuning for display size |

## Theme color

`color` continues to use Prompt Draft theme-token classes such as:

```vue
<el-icon icon="delete" color="red" />
<el-icon icon="info" color="blue" />
<el-icon icon="settings" color="normal" />
```

Do not replace theme tokens with hardcoded hex colors inside icon consumers.

## Badge behavior

Badge rendering now lives directly inside `<el-icon />`:

```vue
<el-icon icon="notifications" :badge="3" />
```

Badge positioning uses logical CSS (`inset-inline-end`) and the DOM writing direction, so it follows RTL/LTR without checking a specific locale code.

## Accessibility

Icons are decorative by default and `<el-icon />` renders them with `aria-hidden="true"`. Interactive controls such as `<el-button />`, tooltips, menu labels, and accessible action text remain responsible for describing the action.

## Choosing icon names

Use the official Material Symbols ligature name directly in source. There is intentionally **no permanent Vuesax alias map**.

Prefer semantic meaning over visual/name similarity. For example, an old icon called `message-question` became `help` in the Guide context, while image-related actions were mapped according to their actual action rather than their Vuesax name.

Important migration examples:

| Legacy identifier | Material Symbol | Typical context |
| --- | --- | --- |
| `magicpen` | `auto_fix_high` | Create / magic editing |
| `message-question` | `help` | Guide / help |
| `gallery` | `photo_library` | Image collections / gallery |
| `gallery-add` | `add_photo_alternate` | Add image |
| `send-2` | `send` | Send / Telegram action |
| `trash` | `delete` | Delete action |
| `close-circle` | `cancel` | Cancel / close action |
| `tick-circle` | `check_circle` | Confirm action |
| `setting-2` | `tune` | Configuration controls |
| `refresh-2` | `refresh` | Reset / refresh |
| `color-swatch` | `palette` | Color palette module |
| `forward-item` | `transform` | Deformation module |
| `magic-star` | `auto_awesome` | Effects / enhancement |
| `shield-tick` | `verified_user` | Preserve / protection |
| `note-text` | `description` | Draft / document content |
| `copy` | `content_copy` | Copy action |
| `clipboard` | `content_paste` | Paste action |
| `more-vertical` | `more_vert` | Overflow menu |
| `share-1` | `share` | Share action |
| `receive-square` | `download` | Download action |

A single legacy identifier did not always map globally when context required a different meaning. For example, the old import/export-shaped icon on the active-draft download action is now `download`, while JSON import uses `upload_file`.

## Adding new icons

1. Choose an official Material Symbols ligature name.
2. Pass it to the existing icon API (`<el-icon>`, `<el-button icon>`, `<el-text icon>`, menu/config `icon` fields, etc.).
3. Do not edit font files, generate an icon font, add an alias to `<el-icon />`, or add a CDN dependency.
4. Use `variant`, `fill`, `weight`, `grade`, or `opticalSize` only when the default rounded/400 style is not appropriate.

This keeps the icon path simple:

```text
self-hosted Material Symbols variable fonts
                 ↓
             <el-icon />
                 ↓
      buttons / text / menus / UI
```
