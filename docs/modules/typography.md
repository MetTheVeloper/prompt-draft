# Typography Module

## Purpose

The Typography module defines visible text layout inside the generated prompt.

It is responsible for describing text groups, individual text layers, typography hierarchy, placement, writing direction, alignment, spacing, font style, font size, font weight, and text accuracy rules.

This module is mainly useful for outputs such as:

* music covers
* posters
* advertising banners
* event flyers
* social media artworks
* product posters
* typographic compositions
* album artwork
* editorial graphic layouts

The Typography module should answer questions like:

* What exact text should appear in the image?
* How many text groups should the artwork contain?
* Where should each text group be placed?
* Should text blocks be arranged as a row or a column?
* What is the visual hierarchy between title, subtitle, artist name, footer text, price, date, badge text, or call-to-action?
* What font style, size, and weight should each visible text layer use?
* How strictly should the model render the exact written text?

The Typography module should describe visible text and typography layout. It should not define the full image style, color palette, camera, background, subject, lighting, pose, or material system unless the text instruction directly depends on them.

---

## Source File

```txt
app/modules/typography.module.ts
```

Recommended documentation location:

```txt
docs/modules/typography.md
```

Related custom UI components:

```txt
app/components/modules/panel/TextGroupsField.vue
app/components/modules/panel/TextGroupCard.vue
app/components/modules/panel/TextBlockCard.vue
```

Related shared type and compiler files:

```txt
app/modules/types.ts
app/utils/compileModules.ts
```

---

## Module Identity

```ts
key: "typography"
icon: "text"
```

The `key` is used across the module registry, UI state, draft values, i18n keys, compiled prompt output, and module lookup behavior.

The `icon` visually represents the module in the UI.

---

## High-Level Structure

The Typography module follows the standard `PromptKeyModule` shape:

```ts
export const TypographyModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

Unlike many simpler modules, Typography uses a nested custom field type:

```ts
type: "textGroups"
```

This custom field stores an array of typography groups. Each group contains its own layout settings and an array of text blocks.

The nested structure is important because real poster and cover layouts often contain multiple independent text zones, for example:

* a centered title group
* a bottom footer group
* a corner badge group
* a side caption group
* an event information group
* a product price group

---

## Groups

The Typography module uses three UI groups:

| Group      | Role                                                  |
| ---------- | ----------------------------------------------------- |
| `core`     | Main text group builder.                              |
| `advanced` | Text accuracy and optional additive typography notes. |
| `override` | Full manual replacement for the module output.        |

General pattern:

* `core` contains the structured `textGroups` builder.
* `advanced` controls global text rendering behavior and optional typography notes.
* `override` allows a fully custom typography instruction.

---

## Fields Overview

| Field          |         Type | Group      | Role                                                  |
| -------------- | -----------: | ---------- | ----------------------------------------------------- |
| `textGroups`   | `textGroups` | `core`     | Main structured typography group builder.             |
| `textAccuracy` |       select | `advanced` | Controls how strictly quoted text should be rendered. |
| `extraDetails` |     textarea | `advanced` | Adds optional typography-level notes.                 |
| `customText`   |     textarea | `override` | Replaces the generated typography output when filled. |

---

## Field Logic

### `textGroups`

`textGroups` is the main field of this module.

It uses the custom field type:

```ts
type: "textGroups"
```

and the UI component:

```ts
component: "textGroups"
```

Its default value is an empty array:

```ts
default: []
```

This means the module starts with no typography output until the user adds at least one text group with at least one non-empty text block.

Use this field when the image should contain visible text.

Good examples:

* a music cover with title and artist name
* a poster with event title, date, location, and footer details
* a product banner with product name, price, discount, and call-to-action
* a typographic background made of repeated title text
* a social media artwork with headline and caption
* a campaign poster with slogan and badge text

Avoid using this field for:

* image subject description
* background description
* lighting setup
* camera and lens behavior
* color palette
* non-text graphic elements
* pose or expression
* material and texture, unless specifically describing text surface or lettering treatment

---

## Nested Data Structure

The Typography module stores text content in a nested structure:

```ts
typography: {
  textGroups: [
    {
      id: "text_group_...",
      groupName: "{text_group_1}",
      groupPurpose: "music_cover_info",
      customGroupPurpose: "",
      positionPreset: "center",
      customPositionDescription: "",
      direction: "column",
      writingDirection: "ltr",
      alignment: "center",
      distribution: "compact",
      texts: [
        {
          id: "text_...",
          layerName: "{text_1}",
          text: "MORE THAN HUMAN",
          purpose: "main_title",
          customPurpose: "",
          fontStyle: "handwritten",
          customFontStyle: "",
          fontSize: "large",
          customFontSize: "",
          fontWeight: "black",
          customFontWeight: "",
          additionalDescription: ""
        }
      ],
      additionalDescription: ""
    }
  ],
  textAccuracy: "exact"
}
```

The field is nested for two reasons:

1. Text layouts often contain several independent zones.
2. Each visible text layer needs its own purpose, size, style, and weight.

---

## Text Group Structure

Each text group represents one typography layout unit.

A group can be understood as a visual container for one or more text blocks.

Example:

```ts
{
  groupName: "{text_group_1}",
  groupPurpose: "music_cover_info",
  positionPreset: "center",
  direction: "column",
  writingDirection: "ltr",
  alignment: "center",
  distribution: "compact",
  texts: [...]
}
```

### Group Properties

| Property                    | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `id`                        | Internal stable id for UI rendering.                            |
| `groupName`                 | Auto-generated visible reference such as `{text_group_1}`.      |
| `groupPurpose`              | Describes the role of the group.                                |
| `customGroupPurpose`        | Custom group role when `groupPurpose` is `custom`.              |
| `positionPreset`            | Preset placement of the whole group.                            |
| `customPositionDescription` | Custom placement when `positionPreset` is `custom`.             |
| `direction`                 | Controls whether text blocks are arranged as `row` or `column`. |
| `writingDirection`          | Controls text writing direction.                                |
| `alignment`                 | Controls visual alignment inside the group.                     |
| `distribution`              | Controls spacing behavior between text blocks.                  |
| `texts`                     | Array of visible text blocks.                                   |
| `additionalDescription`     | Non-visible styling or layout note for the group.               |

---

## Text Block Structure

Each text block represents one visible text layer.

A text block should contain only the text that is intended to be rendered visibly in the final image.

Example:

```ts
{
  layerName: "{text_1}",
  text: "MORE THAN HUMAN",
  purpose: "main_title",
  fontStyle: "handwritten",
  fontSize: "large",
  fontWeight: "black",
  additionalDescription: "slightly distressed printed edges"
}
```

### Text Block Properties

| Property                | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `id`                    | Internal stable id for UI rendering.                        |
| `layerName`             | Auto-generated visible reference such as `{text_1}`.        |
| `text`                  | Exact visible text content. Required for meaningful output. |
| `purpose`               | Describes the text layer role.                              |
| `customPurpose`         | Custom text role when `purpose` is `custom`.                |
| `fontStyle`             | Typography or lettering style.                              |
| `customFontStyle`       | Custom font style when `fontStyle` is `custom`.             |
| `fontSize`              | Relative text size.                                         |
| `customFontSize`        | Custom text size when `fontSize` is `custom`.               |
| `fontWeight`            | Font weight or visual heaviness.                            |
| `customFontWeight`      | Custom font weight when `fontWeight` is `custom`.           |
| `additionalDescription` | Non-visible styling note for this text layer.               |

---

## Auto-Generated Layer Names

The UI automatically assigns group and text layer references:

```txt
{text_group_1}
{text_group_2}
{text_1}
{text_2}
{text_3}
```

These names help the compiled prompt describe layout and allow other modules to target typography elements.

Example:

```txt
apply deformation only to {text_group_1}
```

or:

```txt
use gold color for {text_1}
```

The layer names should be displayed in the UI but should not be directly edited by the user.

Current behavior can renumber groups and text blocks after add/remove actions. This is acceptable for the current module. If future cross-module references become more advanced, keep internal stable `id` values separate from display layer names.

---

## Group Purpose Options

`groupPurpose` describes the role of the whole typography group.

Current useful group purposes include:

| Value                    | Meaning                        |
| ------------------------ | ------------------------------ |
| `poster_header`          | Main poster header area.       |
| `poster_footer`          | Poster footer area.            |
| `product_info`           | Product information area.      |
| `event_info`             | Event information area.        |
| `music_cover_info`       | Music cover information area.  |
| `advertising_copy`       | Advertising copy area.         |
| `badge_cluster`          | Badge or label cluster.        |
| `side_caption`           | Side caption area.             |
| `typographic_background` | Background typography element. |
| `credits_area`           | Credits area.                  |
| `custom`                 | User-defined purpose.          |

A group purpose should describe why the whole text group exists.

For example, a music cover may use:

```txt
{text_group_1} = music cover information area
```

while an event poster may use:

```txt
{text_group_2} = event information area
```

---

## Position Presets

`positionPreset` controls where the whole text group is placed.

Common presets include:

| Value           | Meaning                    |
| --------------- | -------------------------- |
| `top`           | Top area.                  |
| `top_left`      | Top-left area.             |
| `top_center`    | Top-center area.           |
| `top_right`     | Top-right area.            |
| `center_left`   | Center-left area.          |
| `center`        | Center area.               |
| `center_right`  | Center-right area.         |
| `bottom_left`   | Bottom-left area.          |
| `bottom_center` | Bottom-center area.        |
| `bottom_right`  | Bottom-right area.         |
| `bottom`        | Bottom area.               |
| `left_side`     | Along the left side.       |
| `right_side`    | Along the right side.      |
| `custom`        | Custom described position. |

The compiled output should treat each group as one grouped typography unit.

This helps prevent the model from spreading related text blocks too far apart.

---

## Direction, Writing Direction, Alignment, and Distribution

### `direction`

Controls layout flow between text blocks.

| Value    | Meaning                                |
| -------- | -------------------------------------- |
| `row`    | Text blocks are arranged horizontally. |
| `column` | Text blocks are arranged vertically.   |

### `writingDirection`

Controls text writing direction.

| Value          | Meaning                                   |
| -------------- | ----------------------------------------- |
| `ltr`          | Left-to-right writing direction.          |
| `rtl`          | Right-to-left writing direction.          |
| `vertical_ttb` | Vertical top-to-bottom writing direction. |
| `vertical_btt` | Vertical bottom-to-top writing direction. |

### `alignment`

Controls alignment inside the group.

| Value     | Meaning         |
| --------- | --------------- |
| `start`   | Start aligned.  |
| `center`  | Center aligned. |
| `end`     | End aligned.    |
| `justify` | Justified.      |

### `distribution`

Controls spacing between text blocks.

| Value       | Meaning                            |
| ----------- | ---------------------------------- |
| `compact`   | Tight spacing.                     |
| `balanced`  | Balanced spacing.                  |
| `spaced`    | More generous spacing.             |
| `scattered` | Intentionally scattered placement. |

---

## Text Purpose Options

`purpose` describes the role of a single text block.

Useful values include:

| Value            | Meaning                    |
| ---------------- | -------------------------- |
| `main_title`     | Main title.                |
| `subtitle`       | Subtitle.                  |
| `slogan`         | Slogan.                    |
| `artist_name`    | Artist name.               |
| `brand_name`     | Brand name.                |
| `product_name`   | Product name.              |
| `price`          | Price text.                |
| `discount`       | Discount text.             |
| `date`           | Date text.                 |
| `time`           | Time text.                 |
| `location`       | Location text.             |
| `caption`        | Caption.                   |
| `warning_label`  | Warning label.             |
| `badge_text`     | Badge text.                |
| `footer_note`    | Footer note.               |
| `credits`        | Credits text.              |
| `call_to_action` | Call-to-action text.       |
| `custom`         | User-defined text purpose. |

Use purpose to clarify hierarchy and meaning.

For example:

```txt
{text_1}: "MORE THAN HUMAN", as the main title
{text_2}: "GRASSIAS", as the artist name
{text_3}: "Available on Spotify", as the subtitle
```

---

## Font Style Options

`fontStyle` controls the visual lettering style of each text block.

Useful values include:

| Value                | Meaning                        |
| -------------------- | ------------------------------ |
| `clean_sans`         | Clean sans-serif typography.   |
| `bold_display`       | Bold display typography.       |
| `elegant_serif`      | Elegant serif typography.      |
| `condensed_poster`   | Condensed poster typography.   |
| `handwritten`        | Handwritten lettering.         |
| `gothic_blackletter` | Gothic blackletter typography. |
| `monospaced`         | Monospaced typography.         |
| `graffiti`           | Graffiti lettering.            |
| `retro_script`       | Retro script lettering.        |
| `minimal_editorial`  | Minimal editorial typography.  |
| `custom`             | User-defined font style.       |

Use `fontStyle` for the lettering family or visual typographic language.

Avoid putting color, position, material, or non-text subject details into `fontStyle`.

---

## Font Size Options

`fontSize` controls relative text scale.

Useful values include:

| Value    | Meaning                 |
| -------- | ----------------------- |
| `tiny`   | Tiny text size.         |
| `small`  | Small text size.        |
| `medium` | Medium text size.       |
| `large`  | Large text size.        |
| `huge`   | Huge text size.         |
| `hero`   | Hero-scale text size.   |
| `custom` | User-defined text size. |

Use size to create visual hierarchy.

Example:

```txt
main title = hero or large
artist name = medium
footer note = small
parenthetical detail = tiny
```

---

## Font Weight Options

`fontWeight` controls visual heaviness.

Useful values include:

| Value       | Meaning                     |
| ----------- | --------------------------- |
| `light`     | Light 300 font weight.      |
| `regular`   | Regular 400 font weight.    |
| `medium`    | Medium 500 font weight.     |
| `semibold`  | Semibold 600 font weight.   |
| `bold`      | Bold 700 font weight.       |
| `extrabold` | Extra-bold 800 font weight. |
| `black`     | Heavy 900 font weight.      |
| `custom`    | User-defined font weight.   |

Important note:

Use `heavy 900 font weight` for the `black` weight in compiled prompt output instead of `black font weight`.

This avoids confusing font weight with the color black.

Typography color should be controlled by the Color Palette module or a future typography color field, not by font weight.

---

## Text Accuracy

`textAccuracy` controls how strictly quoted text should be rendered.

| Value      | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `flexible` | Text may be interpreted flexibly when exact lettering is not essential. |
| `readable` | Quoted text should be clear and readable.                               |
| `exact`    | Quoted text should be rendered exactly as written.                      |

Recommended compiled wording:

```txt
render all quoted typography text exactly as written with correct spelling and no extra letters
```

The word `quoted` is important. It tells the model that only text values inside quotation marks are visible text instructions.

---

## Visible Text Guard

The compiler should add a safety instruction when text groups exist:

```txt
Only render the quoted text values as visible typography; do not render layer names, group names, purposes, notes, field labels, or descriptions as extra visible text; use purposes and descriptions only as layout and styling instructions.
```

This rule helps prevent accidental visible text from fields like:

* `groupName`
* `layerName`
* `groupPurpose`
* `purpose`
* `additionalDescription`
* `customPositionDescription`
* field labels
* notes

For example, this should render only the quoted text:

```txt
{text_3}: "Available on Spotify", as the subtitle, with non-visible styling note: spotify footer style
```

Visible text:

```txt
Available on Spotify
```

Not visible text:

```txt
{text_3}
subtitle
spotify footer style
```

---

## Additional Descriptions

Both group-level and text-level additional descriptions should be treated as non-visible styling instructions.

Recommended compiled wording for group notes:

```txt
with non-visible group styling note: ...
```

Recommended compiled wording for text block notes:

```txt
with non-visible styling note: ...
```

Use additional descriptions for visual behavior such as:

* slightly distressed printed edges
* keep this group visually dominant
* make the text feel like stamped ink
* use tighter spacing between the title lines
* keep the footer subtle and secondary
* make the title feel sculptural

Do not use additional descriptions for text that should appear visibly.

If a phrase should appear in the image, create a separate text block for it.

Good:

```txt
{text_4}: "SPOTIFY/GRASS"
```

Bad:

```txt
{text_3}: "Available on Spotify", with non-visible styling note: add SPOTIFY/GRASS
```

---

## Compile Behavior

The module compile config uses:

```ts
compile: {
  separator: ". ",
  removeDuplicates: true,
  overrideField: "customText",
}
```

However, Typography also has custom compile behavior in the shared compiler because `textGroups` is a nested field type.

### Override Behavior

If `customText` has content, it replaces the structured typography output completely.

Use this when the user needs a very specific typography instruction that cannot be expressed through text groups.

### Structured Compile Behavior

When `customText` is empty, the compiler:

1. Reads `textGroups`.
2. Ignores empty groups or groups without visible text.
3. Converts each group into a `Typography group ... containing ...` phrase.
4. Converts each text block into a quoted visible text instruction.
5. Adds text accuracy rules when text groups exist.
6. Adds the visible text guard.
7. Adds `extraDetails` if present.

Example compiled output:

```txt
Typography layout: Typography group {text_group_1}, serving as the music cover information area, positioned in the center area as one grouped typography unit, arranged in a vertical column, using left-to-right writing direction, center aligned, with compact spacing containing {text_1}: "MORE THAN HUMAN", as the main title, using handwritten lettering, large text size, and heavy 900 font weight; {text_2}: "GRASSIAS", as the artist name, using handwritten lettering, medium text size, and semibold 600 font weight. render all quoted typography text exactly as written with correct spelling and no extra letters. Only render the quoted text values as visible typography; do not render layer names, group names, purposes, notes, field labels, or descriptions as extra visible text; use purposes and descriptions only as layout and styling instructions.
```

---

## Relationship With Other Modules

The Typography module should focus on visible text and text layout.

It should avoid taking over responsibilities from other modules:

| Responsibility             | Better Module |
| -------------------------- | ------------- |
| Global art style           | Style         |
| Color strategy             | Color Palette |
| Deformation or distortion  | Deformation   |
| Background and environment | Background    |
| Lighting and illumination  | Lighting      |
| Camera and lens            | Camera        |
| Cropping and composition   | Framing       |
| Material or surface finish | Texture       |
| Extra visual effects       | Effects       |
| Character pose             | Pose          |
| Facial expression          | Expression    |
| Clothing                   | Outfit        |
| Hair                       | Hair          |

Some overlap is natural.

For example, Typography may describe `handwritten lettering`, while Style may describe `risograph poster artwork`. These can work together.

Typography may also reference layer names for targeted control:

```txt
apply deformation only to {text_group_1}
```

That kind of cross-module targeting is useful, but Typography should still define the text structure itself.

---

## Targeting Typography From Other Modules

The auto-generated group and layer names make Typography useful for targeted instructions.

Examples:

```txt
apply deformation only to {text_group_1}
```

```txt
use harsh compressed geometry only on {text_1}
```

```txt
keep {text_group_2} clean and readable
```

```txt
apply gold metallic material to {text_1}
```

This targeting pattern is useful for advanced prompt control.

Important rule:

Only target typography references that are generated by the Typography module.

Do not invent layer names that do not exist in the current prompt.

---

## Recommended Usage Patterns

### Music Cover

```txt
{text_group_1}
position: center
direction: column
texts:
- {text_1}: track title
- {text_2}: artist name

{text_group_2}
position: bottom_center
direction: row
texts:
- {text_3}: platform note or release note
```

### Event Poster

```txt
{text_group_1}
position: top_center
texts:
- {text_1}: event title
- {text_2}: subtitle or slogan

{text_group_2}
position: bottom_center
texts:
- {text_3}: date
- {text_4}: location
- {text_5}: ticket or CTA
```

### Product Banner

```txt
{text_group_1}
position: top_left
texts:
- {text_1}: product name
- {text_2}: slogan

{text_group_2}
position: bottom_right
texts:
- {text_3}: price
- {text_4}: discount
- {text_5}: call-to-action
```

### Badge Cluster

```txt
{text_group_1}
position: top_right
direction: column
texts:
- {text_1}: "NEW"
- {text_2}: "LIMITED"
- {text_3}: "DROP"
```

---

## Prompt Quality Rules

A good Typography module output should:

* Put exact visible text inside quotes.
* Use groups to describe layout zones.
* Use text blocks for every visible phrase.
* Use `purpose` to clarify hierarchy.
* Use `fontStyle`, `fontSize`, and `fontWeight` for each important text layer.
* Keep additional descriptions non-visible.
* Avoid adding text through notes.
* Use group and layer names only as references, not visible content.
* Keep footer and small text simple when readability matters.
* Use `textAccuracy: exact` when spelling is important.

A bad Typography module output would:

* Put visible text inside `additionalDescription`.
* Use group notes as copywriting.
* Add extra unquoted text that the model may render visibly.
* Mix font weight with color instructions.
* Describe the subject or background instead of typography.
* Create too many text blocks for a small image.
* Use tiny script lettering for important exact text.
* Use vague custom positions that imply new subjects or scenes.

---

## i18n Notes

The module key is:

```txt
typography
```

Common i18n namespaces should follow this pattern:

```txt
modules.typography.title
modules.typography.description
modules.typography.groups.core
modules.typography.groups.advanced
modules.typography.groups.override
modules.typography.fields.textGroups
modules.typography.fields.textAccuracy
modules.typography.fields.extraDetails
modules.typography.fields.customText
modules.typography.options.*
```

Because this module uses custom UI components, also check i18n strings used inside:

```txt
TextGroupsField.vue
TextGroupCard.vue
TextBlockCard.vue
```

Possible UI labels include:

```txt
Text groups
Add text group
No text group yet
Group purpose
Custom group purpose
Position
Custom position description
Direction
Writing direction
Alignment
Distribution
Group additional description
Text blocks
Add text
Text
Purpose
Custom purpose
Font style
Custom font style
Font size
Custom font size
Font weight
Custom font weight
Additional description
Required text is empty
Remove
Remove group
```

Keep English and Persian locale files synchronized.

---

## UI Component Notes

The Typography module is intentionally separated from `base.vue`.

`base.vue` should only detect the custom field type:

```vue
<ModulesPanelTextGroupsField
  v-else-if="field.type === 'textGroups'"
  v-model="values[field.id]"
  :field="field"
  :module-key="module.key" />
```

The nested UI logic belongs in:

```txt
TextGroupsField.vue
TextGroupCard.vue
TextBlockCard.vue
```

Recommended responsibilities:

### `TextGroupsField.vue`

* Owns the full `textGroups` array.
* Adds groups.
* Removes groups.
* Normalizes groups.
* Renumbers `groupName`.
* Renumbers `layerName`.
* Creates default groups and text blocks.
* Emits the final updated array.

### `TextGroupCard.vue`

* Edits one typography group.
* Edits group purpose, position, direction, writing direction, alignment, distribution, and group description.
* Renders text blocks inside the group.
* Adds or removes text blocks through events.

### `TextBlockCard.vue`

* Edits one visible text block.
* Shows the auto-generated `layerName`.
* Edits text, purpose, font style, font size, font weight, and additional description.
* Highlights empty required text.

This keeps `base.vue` small and avoids adding nested module-specific logic directly to the generic panel renderer.

---

## Design Rule of Thumb

The Typography module defines visible text structure.

A good Typography output sounds like:

```txt
Typography layout: Typography group {text_group_1}, serving as the music cover information area, positioned in the center area as one grouped typography unit, arranged in a vertical column, using left-to-right writing direction, center aligned, with compact spacing containing {text_1}: "MORE THAN HUMAN", as the main title, using handwritten lettering, large text size, and heavy 900 font weight; {text_2}: "GRASSIAS", as the artist name, using handwritten lettering, medium text size, and semibold 600 font weight.
```

A bad Typography output sounds like:

```txt
a gold and black luxury poster with a singer standing in dramatic lighting, cinematic lens, wearing a leather jacket
```

That belongs to Style, Color Palette, Background, Lighting, Camera, Outfit, or Subject description, not Typography.

---

## Checklist for Future Typography Module Changes

Before committing changes, check:

* The module key is still `typography`.
* The module is registered in `registry.ts`.
* The module appears in the expected UI order.
* `textGroups` uses the `textGroups` field type.
* `ModuleFieldType` includes `textGroups`.
* `ModuleFieldValue` supports `TypographyTextGroup[]`.
* Typography-specific types still exist in `types.ts`.
* `TextGroupsField.vue` renders correctly.
* `TextGroupCard.vue` renders correctly.
* `TextBlockCard.vue` renders correctly.
* Group add/remove works.
* Text block add/remove works.
* `groupName` is auto-generated.
* `layerName` is auto-generated.
* Empty text blocks do not produce visible prompt output.
* `customText` still overrides structured output.
* `extraDetails` remains additive.
* `additionalDescription` compiles as a non-visible note.
* Text accuracy uses `quoted typography text`.
* Visible text guard is included when text groups exist.
* `fontWeight.black` compiles as `heavy 900 font weight`, not `black font weight`.
* Position output treats groups as one grouped typography unit.
* New options use stable snake_case values.
* New options include clean reusable `promptText`.
* New i18n keys exist in both English and Persian locale files.
* Prompt tests still render only quoted text as visible typography.
* Cross-module targeting with `{text_group_n}` and `{text_n}` remains readable.
