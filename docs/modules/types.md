# Module Types

## Purpose

`types.ts` defines the shared TypeScript contract for the Prompt Draft module system.

Every module file in `app/modules/*.module.ts` depends on this file, either directly or indirectly. It defines what a module is, what fields can exist inside a module, how options are shaped, how presets work, how UI metadata is described, and how compiled prompt output should be configured.

This file should answer questions like:

- What is the standard shape of a prompt module?
- What field types are supported?
- What values can fields store?
- How should select and multi-select options be structured?
- How do module groups, presets, and compile settings work?
- How does compatibility metadata work between fields?

Use this file as the source of truth before adding a new module or extending an existing module.

---

## Source File

```txt
app/modules/types.ts
```

Recommended documentation location:

```txt
docs/modules/types.md
```

---

## Role in the Module System

The module system is schema-driven. Each module exports an object that satisfies the `PromptKeyModule` interface.

That means most module behavior is defined as structured data instead of hardcoded UI logic.

A normal module usually contains:

```ts
{
  key,
  icon,
  groups,
  fields,
  presets,
  compile,
}
```

`types.ts` defines the expected shape of all of these parts.

---

## Main Exported Types

| Type / Interface | Purpose |
|---|---|
| `ModuleFieldWidth` | Width values for simple field layout. |
| `ModuleFieldOptionLayout` | Defines whether options are rendered normally or as categorized groups. |
| `ModuleFieldCompatibilityMode` | Defines how compatibility behavior is applied. |
| `ModuleOptionCompatibility` | Describes preferred, supported, discouraged, and warning metadata for an option. |
| `ModuleFieldCompatibilityConfig` | Describes field-level compatibility behavior and dependency. |
| `ModuleFieldOption` | Base structure for options used by select-like fields. |
| `ModuleFieldType` | Union of all supported field value types. |
| `ModuleFieldValue` | Union of all values a field can store. |
| `ModuleValues` | Record of field ids to field values. |
| `ModuleOption` | Extended field option that may include ordering. |
| `ModuleFieldUi` | Older or lighter UI metadata shape. |
| `ModuleFieldUiConfig` | Main UI configuration object used by module fields. |
| `ModuleField` | Full field definition inside a module. |
| `ModuleGroup` | UI group definition inside a module. |
| `ModulePreset` | Saved combination of module field values. |
| `ModuleCompileConfig` | Rules for compiling field values into prompt text. |
| `PromptKeyModule` | The complete module contract. |

---

## Field Widths

```ts
export type ModuleFieldWidth = "half" | "full";
```

This type defines simple width behavior for field layout.

The newer `ModuleFieldUiConfig.width` also supports:

```ts
'full' | 'half' | 'third'
```

When building new modules, prefer the width values already used by existing module files and UI components.

---

## Option Layout

```ts
export type ModuleFieldOptionLayout = "default" | "categorized";
```

This controls how option lists are presented in the UI.

| Value | Purpose |
|---|---|
| `default` | Normal flat option list. |
| `categorized` | Grouped option list using option category metadata. |

Use `categorized` when an option list is long or conceptually divided into families.

Examples in the current system:

- Style mediums
- Background styles
- Camera options
- Deformation options
- Effects options
- Texture materials

---

## Compatibility System

The module system supports soft compatibility hints between fields.

This is used when one field depends on another field, such as:

- `surface` depending on `material`
- `detailLevel` depending on `material`
- `imperfections` depending on `material`
- `visualTreatment` depending on `medium`
- `finish` depending on `medium`

### Compatibility Mode

```ts
export type ModuleFieldCompatibilityMode = "sort-and-hint";
```

Currently, the system supports a soft guidance mode.

`sort-and-hint` means incompatible or less suitable options should not be blocked. Instead, they can be sorted lower or shown with hints.

This is important because creative prompt design often benefits from unusual combinations.

### Option Compatibility

```ts
export type ModuleOptionCompatibility = {
  preferredTags?: string[];
  supportedTags?: string[];
  discouragedTags?: string[];
  warningKey?: string;
};
```

| Property | Purpose |
|---|---|
| `preferredTags` | Tags that make the option a strong match. |
| `supportedTags` | Tags that make the option acceptable. |
| `discouragedTags` | Tags that make the option less suitable. |
| `warningKey` | i18n key for a warning or hint message. |

This metadata belongs to individual options.

### Field Compatibility Config

```ts
export type ModuleFieldCompatibilityConfig = {
  dependsOn: string;
  mode: ModuleFieldCompatibilityMode;
};
```

| Property | Purpose |
|---|---|
| `dependsOn` | The field id this field should compare against. |
| `mode` | The compatibility behavior to apply. |

This metadata belongs to the field UI config.

---

## ModuleFieldOption

```ts
export type ModuleFieldOption = {
  value: string;
  promptText?: string;
  disabled?: boolean;
  tags?: string[];

  category?: string;
  categoryLabel?: string;
  categoryLabelKey?: string;

  compatibility?: ModuleOptionCompatibility;
};
```

This is the base shape for select-like options.

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable id. |
| `promptText` | Text fragment used when compiling prompt output. |
| `disabled` | Allows an option to exist but not be selectable. |
| `tags` | Semantic tags for search, filtering, compatibility, or future logic. |
| `category` | Machine-readable category id. |
| `categoryLabel` | Human-readable category label. |
| `categoryLabelKey` | i18n key for the category label. |
| `compatibility` | Soft compatibility metadata for this option. |

### Option Value Rules

Use stable `snake_case` values whenever possible.

Good values:

```txt
soft_diffused
cinematic_contrast
gold_black_luxury
smooth_vinyl
```

Avoid values that are too long, too vague, or likely to change.

---

## ModuleFieldType

```ts
export type ModuleFieldType =
  | 'text'
  | 'textarea'
  | 'colorAssignments'
  | 'select'
  | 'multiSelect'
  | 'checkbox'
  | 'color'
  | 'number'
  | 'range'
```

This type defines the supported field kinds.

| Type | Typical Use |
|---|---|
| `text` | Short custom text input. |
| `textarea` | Longer custom details or override text. |
| `colorAssignments` | Custom palette assignment UI. |
| `select` | Single-choice option list. |
| `multiSelect` | Multiple-choice option list. |
| `checkbox` | Boolean toggle. |
| `color` | Color picker or color value. |
| `number` | Numeric input. |
| `range` | Slider-style numeric input. |

Most current modules mainly use:

- `select`
- `multiSelect`
- `textarea`
- `color`
- `colorAssignments`

---

## ModuleFieldValue and ModuleValues

```ts
export type ModuleFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined

export type ModuleValues = Record<string, ModuleFieldValue>
```

A field can store one of these values:

| Value Type | Used By |
|---|---|
| `string` | Selects, text fields, color fields, textarea fields. |
| `number` | Number or range fields. |
| `boolean` | Checkbox fields. |
| `string[]` | Multi-select and assignment-like fields. |
| `null` / `undefined` | Empty or unset values. |

`ModuleValues` is the object shape used by module presets and active user state.

Example:

```ts
{
  material: "vinyl",
  surface: "smooth",
  imperfections: ["clean_finish"]
}
```

---

## ModuleOption

```ts
export interface ModuleOption extends ModuleFieldOption {
  order?: number;
}
```

`ModuleOption` extends `ModuleFieldOption` and adds optional ordering.

Use `order` when the display order cannot be handled cleanly by array position alone or when future sorting logic may need stable ordering metadata.

---

## UI Configuration

There are two UI-related shapes in `types.ts`.

### ModuleFieldUi

```ts
export type ModuleFieldUi = {
  component?: "select" | "segmented" | "textarea" | "input";
  searchable?: boolean;
  clearable?: boolean;
  width?: ModuleFieldWidth;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;

  optionLayout?: ModuleFieldOptionLayout;
};
```

This appears to be a lighter or older UI metadata type.

### ModuleFieldUiConfig

```ts
export interface ModuleFieldUiConfig {
  component?: 'input' | 'textarea' | 'select' | 'multiSelect' | 'segmented' | 'checkbox' | 'slider' | 'color' | 'colorAssignments'
  placeholder?: string
  rows?: number
  width?: 'full' | 'half' | 'third'
  clearable?: boolean
  searchable?: boolean
  multiple?: boolean
  min?: number
  max?: number
  step?: number

  optionLayout?: ModuleFieldOptionLayout
  compatibility?: ModuleFieldCompatibilityConfig
}
```

This is the richer UI configuration used by module fields.

| Property | Purpose |
|---|---|
| `component` | UI component that should render the field. |
| `placeholder` | Placeholder text or i18n-driven placeholder behavior. |
| `rows` | Textarea row count. |
| `width` | Layout width. |
| `clearable` | Whether the value can be cleared. |
| `searchable` | Whether option search is enabled. |
| `multiple` | Whether multiple selections are allowed. |
| `min` / `max` / `step` | Numeric or slider settings. |
| `optionLayout` | Flat or categorized option layout. |
| `compatibility` | Field-level compatibility behavior. |

When creating new modules, use `ModuleFieldUiConfig` through the field's `ui` property.

---

## ModuleField

```ts
export interface ModuleField {
  id: string
  type: ModuleFieldType
  default?: ModuleFieldValue
  group?: string
  order?: number
  options?: ModuleOption[]
  isOverride?: boolean
  promptText?: string
  ui?: ModuleFieldUiConfig
}
```

This is the core structure for defining a field inside a module.

| Property | Purpose |
|---|---|
| `id` | Stable field id. Usually matches the key in the module's `fields` object. |
| `type` | Field data type. |
| `default` | Initial value when the module is enabled or reset. |
| `group` | Group id where this field appears. |
| `order` | Field display order inside the group. |
| `options` | Options for select-like fields. |
| `isOverride` | Marks the field as the override field. |
| `promptText` | Optional direct prompt text for simple fields. |
| `ui` | UI rendering metadata. |

### Field ID Rule

The field object key and the field `id` should match.

Good:

```ts
fields: {
  lightingStyle: {
    id: "lightingStyle",
    ...
  }
}
```

This keeps state, presets, validation, and UI behavior predictable.

---

## ModuleGroup

```ts
export interface ModuleGroup {
  id: string
  order?: number
  defaultOpen?: boolean
}
```

Groups organize fields inside a module.

| Property | Purpose |
|---|---|
| `id` | Stable group id. |
| `order` | Display order of the group. |
| `defaultOpen` | Whether the group starts expanded in the UI. |

Common group patterns across current modules:

```txt
core
advanced
override
```

Texture uses more specific groups:

```txt
material
surface
advanced
override
```

Style uses:

```txt
core
modifiers
advanced
override
```

---

## ModulePreset

```ts
export interface ModulePreset {
  id: string
  order?: number
  values: ModuleValues
}
```

A preset is a reusable set of field values.

| Property | Purpose |
|---|---|
| `id` | Stable preset id. |
| `order` | Preset display order. |
| `values` | Field values applied by the preset. |

Example structure:

```ts
{
  id: "smooth_vinyl",
  order: 1,
  values: {
    material: "vinyl",
    surface: "smooth",
    detailLevel: "subtle",
    imperfections: ["clean_finish"]
  }
}
```

Use presets when a module has useful repeatable combinations of fields.

Do not use presets for one-off examples that will not be reused.

---

## ModuleCompileConfig

```ts
export interface ModuleCompileConfig {
  separator?: string
  removeDuplicates?: boolean
  ignoreEmpty?: boolean
  overrideField?: string
}
```

Compile config controls how field values are converted into prompt text.

| Property | Purpose |
|---|---|
| `separator` | String used to join compiled field fragments. |
| `removeDuplicates` | Removes duplicate prompt fragments. |
| `ignoreEmpty` | Skips empty values. |
| `overrideField` | Field id that replaces normal output when filled. |

Most current modules use:

```ts
compile: {
  separator: ", ",
  removeDuplicates: true,
  ignoreEmpty: true,
  overrideField: "customText",
}
```

This makes each module output modular prompt fragments while still allowing a full manual override.

---

## PromptKeyModule

```ts
export interface PromptKeyModule {
  key: string
  icon?: string
  groups?: Record<string, ModuleGroup>
  fields: Record<string, ModuleField>
  presets?: Record<string, ModulePreset>
  compile?: ModuleCompileConfig
}
```

This is the complete module contract.

| Property | Purpose |
|---|---|
| `key` | Stable module id used across registry, UI, state, i18n, and compiler. |
| `icon` | Optional UI icon name. |
| `groups` | Optional group definitions. |
| `fields` | Required field definitions. |
| `presets` | Optional preset definitions. |
| `compile` | Optional compile behavior configuration. |

Every module should satisfy this interface.

Example:

```ts
export const CameraModule: PromptKeyModule = {
  key: "camera",
  icon: "camera",
  groups,
  fields,
  compile,
}
```

Some modules may use:

```ts
export const StyleModule = {
  ...
} satisfies PromptKeyModule
```

Both patterns are valid as long as the module conforms to `PromptKeyModule`.

---

## Standard Module Pattern

A typical simple module follows this structure:

```ts
import type { PromptKeyModule } from './types'

const key = 'moduleName'

const optionList = [
  {
    value: 'example_option',
    category: 'general',
    categoryLabel: 'General',
    promptText: 'example prompt text',
    tags: ['example'],
  },
]

export const ExampleModule: PromptKeyModule = {
  key,
  icon: 'icon-name',
  groups: {
    core: { id: 'core', order: 1, defaultOpen: true },
    advanced: { id: 'advanced', order: 2 },
    override: { id: 'override', order: 3 },
  },
  fields: {
    exampleStyle: {
      id: 'exampleStyle',
      type: 'select',
      group: 'core',
      order: 1,
      options: optionList,
      ui: {
        component: 'select',
        searchable: true,
        clearable: true,
        width: 'full',
        optionLayout: 'categorized',
      },
    },
    extraDetails: {
      id: 'extraDetails',
      type: 'textarea',
      group: 'advanced',
      order: 1,
      ui: {
        component: 'textarea',
        rows: 3,
        width: 'full',
      },
    },
    customText: {
      id: 'customText',
      type: 'textarea',
      group: 'override',
      order: 1,
      isOverride: true,
      ui: {
        component: 'textarea',
        rows: 4,
        width: 'full',
      },
    },
  },
  compile: {
    separator: ', ',
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: 'customText',
  },
}
```

---

## Rules for Adding New Types

Only extend `types.ts` when the change is needed by more than one module or by the shared module engine.

Good reasons to update `types.ts`:

- Adding a new reusable field type.
- Adding a new UI component type.
- Adding a new compatibility behavior.
- Adding a new shared metadata property used by multiple modules.
- Changing the compile system contract.
- Adding a new shared concept that the module UI, compiler, and validation need to understand.

Avoid updating `types.ts` for one-off module-specific needs. In those cases, prefer module-local option tags, `extraDetails`, or a custom field convention inside that module.

---

## i18n Notes

`types.ts` does not define i18n keys directly, but its structure affects where i18n keys are needed.

Common i18n areas affected by this file:

```txt
modules.{moduleKey}.title
modules.{moduleKey}.description
modules.{moduleKey}.groups.*
modules.{moduleKey}.fields.*
modules.{moduleKey}.options.*
modules.{moduleKey}.presets.*
modules.{moduleKey}.warnings.*
```

When adding new field types, UI components, compatibility warnings, groups, or options, check both English and Persian locale files.

---

## Design Rule of Thumb

`types.ts` should stay generic.

It should define the shared module contract, not the behavior of one specific module.

A good type addition helps multiple modules.

A bad type addition exists only because one option in one module needed a special case.

---

## Checklist for Future Changes

Before editing `types.ts`, check:

- The change is needed by shared module logic, not only one module.
- The new type is generic and reusable.
- Existing modules still satisfy `PromptKeyModule`.
- Existing field values remain valid.
- UI components can support the new field or config.
- Compiler logic can safely handle the new value shape.
- Presets and draft state remain compatible.
- i18n impact has been checked.
- No unnecessary breaking changes are introduced.
