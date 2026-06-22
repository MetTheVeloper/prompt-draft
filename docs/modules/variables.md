# Variables Module

The `Variables` module defines reusable prompt tokens that can be referenced by other modules.

It turns a prompt into a reusable template by placing editable values at the top of the final output.

## Purpose

Use this module when a prompt contains repeated references such as a person, logo, product, title, brand name, color, or attached image reference.

Example:

```txt
{person} = person in the first attached photo
{logo} = the symbol in the second attached photo
{headline} = "MORE THAN HUMAN"
```

Other modules can then reference those values manually:

```txt
place {logo} behind {person}
use {headline} as the main title
```

The final prompt keeps variable references as references. It does not replace `{headline}` with its value inside the rest of the prompt.

## Data Shape

```ts
type PromptVariable = {
  id: string
  key: string
  value: string
  description?: string
  type?: 'text' | 'subject' | 'reference' | 'object' | 'color' | 'custom'
  enabled: boolean
}
```

## Key Rules

Variable keys are normalized before output.

Examples:

```txt
Music title -> music_title
person 1 -> person_1
1 logo -> var_1_logo
```

Valid final keys must match:

```txt
/^[a-z][a-zA-Z0-9_]*$/
```

Reserved keys must not be used because Typography already uses them internally:

```txt
text_*
text_group_*
```

## Output Behavior

Variables are printed above the setup prompt in modular output:

```txt
{person} = person in the first attached photo
{headline} = "MORE THAN HUMAN"

{mode} = image to image
{reference} = attached reference image
{idea} = game poster
{typography} = Typography layout: ... {text_1}: "{headline}" ...
```

For JSON output, active variables are exposed as a top-level object:

```json
{
  "variables": {
    "person": "person in the first attached photo",
    "headline": "MORE THAN HUMAN"
  },
  "mode": "image_to_image",
  "modules": {
    "typography": "Typography layout: ..."
  }
}
```

## Validation

The module should validate:

- duplicate variable keys
- invalid normalized keys
- empty variable values
- reserved key conflicts
- undefined variable references
- unused variables

Undefined and unused references are warnings. Invalid, duplicate, empty, and reserved keys are errors.

## UI Notes

The Variables UI should render a repeatable list of variable rows.

Each row should include:

- key input
- normalized token preview, such as `{headline}`
- type select
- value textarea or input
- optional description
- enabled toggle
- duplicate/delete actions

Variable insertion should be handled later by a shared input wrapper. In the Variables module itself, variable picker support should stay disabled to avoid encouraging nested variables.
