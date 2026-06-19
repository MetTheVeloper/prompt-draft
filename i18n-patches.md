# i18n Patches Guide

This file documents the workflow for finding, creating, and merging missing translation keys in the Prompt Draft project.

The goal of this guide is to make future i18n fixes easier, both for manual use and for future ChatGPT-assisted edits.

Use this file when you need to understand:

* where missing i18n keys are collected
* where patch files should be created
* how patch files should be structured
* how patches are merged into the main locale files
* which file should be edited for each part of the translation workflow

---

## Important Paths

### Missing i18n key collector plugin

```txt
app/plugins/collect-missing-i18n-keys.client.ts
```

This plugin runs only in development mode:

```ts
if (!import.meta.dev) return
```

Its job is to intercept i18n-related `console.warn` messages and collect missing translation keys.

Expected warning format:

```txt
'modules.example.key' key in 'en' locale messages
```

In the current version, the plugin only collects missing keys from the English locale:

```ts
if (locale === 'en') {
  missingKeys.add(key)
}
```

Since `en.ts` and `fa.ts` should have the same key structure, collecting missing keys from `en` is usually enough. The same keys should then be added to both `en.missing.ts` and `fa.missing.ts`.

---

## Merge Script

```txt
scripts/merge-i18n.ts
```

This script reads a patch file, converts flat dot-path keys into a nested object, and merges them into the target locale file.

For example, this flat key:

```ts
"modules.style.fields.visualTreatment.placeholder"
```

will be converted into this nested structure inside the main locale file:

```ts
modules: {
  style: {
    fields: {
      visualTreatment: {
        placeholder: "..."
      }
    }
  }
}
```

---

## Patch Folder

```txt
scripts/i18n-patches
```

Missing key patch files should be placed inside this folder:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

---

## Full Workflow

### 1. Run the project in dev mode

Start the project:

```bash
pnpm dev
```

Then navigate through different pages and UI sections.

Important:

Missing keys are only detected when the related UI is actually rendered. To collect a more complete list, open and test different parts of the project, such as:

* main pages
* create page
* guide page
* collage page
* module panels
* selects and presets
* different prompt modes
* sections rendered with `v-if`
* modals, dropdowns, empty states, and validation messages

---

### 2. Dump missing keys from the browser console

After navigating through the project, run this command in the browser Console:

```js
dumpMissingI18nKeys()
```

This command:

* sorts the collected missing keys
* displays them with `console.table`
* tries to copy the full list to the clipboard
* prints the list in the console if clipboard access fails

Example output:

```txt
modules.colorPalette.fields.customText.label
modules.colorPalette.fields.customText.placeholder
modules.colorPalette.fields.paletteAssignments.placeholder
modules.style.fields.visualTreatment.placeholder
```

---

## Creating Patch Files

After collecting the missing key list, create one patch file for each locale.

### English patch file

Path:

```txt
scripts/i18n-patches/en.missing.ts
```

Structure:

```ts
export default {
  "modules.colorPalette.fields.customText.label": "Custom Color Palette Override",
  "modules.colorPalette.fields.customText.placeholder": "Write a complete custom color palette description...",
  "modules.colorPalette.fields.paletteAssignments.placeholder": "Select palette assignments",
  "modules.style.fields.visualTreatment.placeholder": "Select visual treatment",
}
```

---

### Persian patch file

Path:

```txt
scripts/i18n-patches/fa.missing.ts
```

Structure:

```ts
export default {
  "modules.colorPalette.fields.customText.label": "جایگزین دستی پالت رنگ",
  "modules.colorPalette.fields.customText.placeholder": "توضیح کامل پالت رنگ را به صورت دستی بنویس...",
  "modules.colorPalette.fields.paletteAssignments.placeholder": "نحوه پخش رنگ‌ها را انتخاب کن",
  "modules.style.fields.visualTreatment.placeholder": "نوع پرداخت بصری را انتخاب کن",
}
```

---

## Important Patch Rule

Patch files must use a flat key structure, not a nested object structure.

Correct:

```ts
export default {
  "modules.style.fields.visualTreatment.placeholder": "Select visual treatment",
}
```

Wrong:

```ts
export default {
  modules: {
    style: {
      fields: {
        visualTreatment: {
          placeholder: "Select visual treatment",
        },
      },
    },
  },
}
```

The reason is that `merge-i18n.ts` already converts flat keys into nested objects using the `flatToNested` function.

---

## Running the Merge Script

### Dry run without changing the original file

For English:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
```

For Persian:

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa
```

In this mode, the script does not modify the original locale files. Instead, it creates test output files:

```txt
i18n/locales/en.merged.ts
i18n/locales/fa.merged.ts
```

Use this mode first when you want to safely inspect the result.

---

### Real merge into the main locale files

For English:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write
```

For Persian:

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa --write
```

This updates the main locale files:

```txt
i18n/locales/en.ts
i18n/locales/fa.ts
```

Before writing, the script automatically creates a backup:

```txt
i18n/locales/en.ts.bak.<timestamp>
i18n/locales/fa.ts.bak.<timestamp>
```

---

### Merge with overwrite

By default, if a key already exists in the target locale file, the script does not replace it. Existing keys are listed under `Skipped existing`.

To replace existing values with the values from the patch file, use `--overwrite`:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write --overwrite
```

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa --write --overwrite
```

Use `--overwrite` only when you are sure the new values should replace the old ones.

---

## Running the Script with Custom Paths

If needed, the locale file or patch file can be passed manually.

English:

```bash
pnpm tsx scripts/merge-i18n.ts \
  --locale en \
  --file i18n/locales/en.ts \
  --patch scripts/i18n-patches/en.missing.ts \
  --write
```

Persian:

```bash
pnpm tsx scripts/merge-i18n.ts \
  --locale fa \
  --file i18n/locales/fa.ts \
  --patch scripts/i18n-patches/fa.missing.ts \
  --write
```

---

## Understanding Script Output

After running the script, the output looks like this:

```txt
Locale: en
Patch: scripts/i18n-patches/en.missing.ts
Output: /project/i18n/locales/en.ts

Added: 12
Skipped existing: 3
Overwritten: 0
```

Meaning:

### Added

Keys that did not exist before and were added.

### Skipped existing

Keys that already existed and were not changed because `--overwrite` was not used.

### Overwritten

Keys that already existed and were replaced because `--overwrite` was used.

---

## Translation Rules

### 1. English and Persian keys must match

If this key exists in `en.missing.ts`:

```ts
"modules.style.fields.visualTreatment.placeholder"
```

The exact same key should also exist in `fa.missing.ts`.

Only the translated value should be different.

---

### 2. Do not manually nest patch objects

Always keep patch files flat.

---

### 3. Keep labels short

Good example:

```ts
"modules.camera.fields.lens.label": "Lens"
```

```ts
"modules.camera.fields.lens.label": "لنز"
```

---

### 4. Use helpful placeholder text

Good example:

```ts
"modules.camera.fields.lens.placeholder": "Select camera lens"
```

```ts
"modules.camera.fields.lens.placeholder": "لنز دوربین را انتخاب کن"
```

---

### 5. Descriptions can be slightly more detailed

Example:

```ts
"modules.style.presets.cinematic_realism.description": "Realistic cinematic look with dramatic lighting and polished detail"
```

```ts
"modules.style.presets.cinematic_realism.description": "ظاهر سینمایی واقع‌گرا با نورپردازی دراماتیک و جزئیات پرداخت‌شده"
```

---

## Persian Translation Tone

For Prompt Draft, Persian UI text should be:

* clear
* natural
* not too formal
* short and readable for UI labels
* helpful for placeholders
* slightly more descriptive for module and preset descriptions

Example:

```txt
Select visual treatment
```

Better Persian translation:

```txt
نوع پرداخت بصری را انتخاب کن
```

Too formal:

```txt
پردازش تصویری را انتخاب نمایید
```

---

## Using ChatGPT for Future i18n Fixes

When asking ChatGPT for help with missing translations in the future, provide:

1. the key list copied from:

```js
dumpMissingI18nKeys()
```

2. optional context about the related UI section, if needed

ChatGPT should then generate two files:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

Both files should use the flat patch format:

```ts
export default {
  "some.missing.key": "Translated value",
}
```

After that, run the merge script.

---

## Quick Checklist

### Step 1

Run the project:

```bash
pnpm dev
```

### Step 2

Navigate through the UI and open different sections.

### Step 3

Run this in the browser Console:

```js
dumpMissingI18nKeys()
```

### Step 4

Create or update these files:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

### Step 5

Run a dry merge first:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
pnpm tsx scripts/merge-i18n.ts --locale fa
```

### Step 6

If the output looks correct, write into the real locale files:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write
pnpm tsx scripts/merge-i18n.ts --locale fa --write
```

### Step 7

Run the project again and check whether the i18n warnings are gone.

---

## If `pnpm tsx` Does Not Work

If this command fails:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
```

`tsx` may not be installed in dev dependencies.

Install it:

```bash
pnpm add -D tsx
```

Then run the command again.

---

## File Summary

| Path                                              | Purpose                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `app/plugins/collect-missing-i18n-keys.client.ts` | Collects missing i18n warnings in dev mode    |
| `scripts/merge-i18n.ts`                           | Merges patch files into the main locale files |
| `scripts/i18n-patches/en.missing.ts`              | English missing key patch file                |
| `scripts/i18n-patches/fa.missing.ts`              | Persian missing key patch file                |
| `i18n/locales/en.ts`                              | Main English locale file                      |
| `i18n/locales/fa.ts`                              | Main Persian locale file                      |

---

## Future Note

If missing keys for the Persian locale ever need to be collected separately, the plugin can be changed from this:

```ts
if (locale === 'en') {
  missingKeys.add(key)
}
```

to this:

### Persian only

```ts
if (locale === 'fa') {
  missingKeys.add(key)
}
```

### All locales

```ts
missingKeys.add(`${locale}:${key}`)
```

However, in the current workflow, collecting missing keys from `en` is usually cleaner because the goal is to keep the structure of `en.ts` and `fa.ts` identical.
