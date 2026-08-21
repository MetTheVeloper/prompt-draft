#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function write(relativePath, content) {
  await fs.writeFile(path.join(ROOT, relativePath), content, "utf8");
}

function replaceRequired(content, from, to, label) {
  if (content.includes(to)) return content;
  if (!content.includes(from)) {
    throw new Error(`Could not find expected source for ${label}`);
  }
  return content.replace(from, to);
}

async function patchFile(relativePath, replacements) {
  let content = await read(relativePath);
  let changed = false;

  for (const [from, to, label] of replacements) {
    const next = replaceRequired(content, from, to, `${relativePath}: ${label}`);
    if (next !== content) changed = true;
    content = next;
  }

  if (changed) {
    await write(relativePath, content);
    console.log(`Patched: ${relativePath}`);
  } else {
    console.log(`Already patched: ${relativePath}`);
  }
}

await patchFile("scripts/localization-audit.mjs", [
  [
    `      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue`,
    `      if (entry.isDirectory()) {
        if (
          EXCLUDED_DIRS.has(entry.name) ||
          /^\\.layout-stage\\d+-backup$/i.test(entry.name)
        ) continue`,
    "exclude layout backup directories",
  ],
]);

await patchFile("app/components/modules/hair/HairComponentCard.vue", [
  [
    `const { mobile } = useScreen();`,
    `const { t } = useI18n();
const { mobile } = useScreen();`,
    "add i18n",
  ],
  [`label="Duplicate component"`, `:label="t('modules.hair.ui.component.actions.duplicate')"`, "duplicate action"],
  [`label="Remove component"`, `:label="t('modules.hair.ui.component.actions.remove')"`, "remove action"],
  [`>Component name</el-text>`, `>{{ t("modules.hair.ui.component.fields.name.label") }}</el-text>`, "component name label"],
  [`placeholder="Display name"`, `:placeholder="t('modules.hair.ui.component.fields.name.placeholder')"`, "component name placeholder"],
  [`>Semantic key</el-text>`, `>{{ t("modules.hair.ui.component.fields.key.label") }}</el-text>`, "semantic key label"],
  [`>Unique inside this hairstyle</el-text>`, `>{{ t("modules.hair.ui.component.fields.key.hint") }}</el-text>`, "semantic key hint"],
  [`>Component type</el-text>`, `>{{ t("modules.hair.ui.component.fields.type.label") }}</el-text>`, "component type label"],
  [`>Custom component</el-text>`, `>{{ t("modules.hair.ui.component.fields.customType.label") }}</el-text>`, "custom component label"],
  [`placeholder="Describe the hair component..."`, `:placeholder="t('modules.hair.ui.component.fields.customType.placeholder')"`, "custom component placeholder"],
  [`>Additional component details</el-text>`, `>{{ t("modules.hair.ui.component.fields.additionalDetails.label") }}</el-text>`, "additional details label"],
  [`placeholder="Optional structural or styling details..."`, `:placeholder="t('modules.hair.ui.component.fields.additionalDetails.placeholder')"`, "additional details placeholder"],
]);

await patchFile("app/components/modules/hair/HairStylesField.vue", [
  [
    `const { mobile } = useScreen();`,
    `const { t } = useI18n();
const { mobile } = useScreen();`,
    "add i18n",
  ],
  [`label="Duplicate hairstyle"`, `:label="t('modules.hair.ui.styles.actions.duplicate')"`, "duplicate hairstyle"],
  [`label="Remove hairstyle"`, `:label="t('modules.hair.ui.styles.actions.remove')"`, "remove hairstyle"],
  [`>Hairstyle name</el-text>`, `>{{ t("modules.hair.ui.styles.fields.name.label") }}</el-text>`, "hairstyle name label"],
  [`placeholder="Hairstyle name"`, `:placeholder="t('modules.hair.ui.styles.fields.name.placeholder')"`, "hairstyle name placeholder"],
  [`>Semantic key</el-text>`, `>{{ t("modules.hair.ui.styles.fields.key.label") }}</el-text>`, "semantic key label"],
  [`>lowerCamelCase · auto-unique</el-text>`, `>{{ t("modules.hair.ui.styles.fields.key.hint") }}</el-text>`, "semantic key hint"],
  [`>Starter preset</el-text>`, `>{{ t("modules.hair.ui.styles.fields.preset.label") }}</el-text>`, "preset label"],
  [`placeholder="No preset"`, `:placeholder="t('modules.hair.ui.styles.fields.preset.placeholder')"`, "preset placeholder"],
  [`>Whose hair is this?</el-text>`, `>{{ t("modules.hair.ui.styles.fields.targets.label") }}</el-text>`, "targets label"],
  [`placeholder="Select subject targets"`, `:placeholder="t('modules.hair.ui.styles.fields.targets.placeholder')"`, "targets placeholder"],
  [`>Baseline source</el-text>`, `>{{ t("modules.hair.ui.styles.fields.source.label") }}</el-text>`, "source label"],
  [`>Reference hair hint</el-text>`, `>{{ t("modules.hair.ui.styles.fields.referenceHint.label") }}</el-text>`, "reference hint label"],
  [`placeholder="e.g. the hairstyle of the person on the left"`, `:placeholder="t('modules.hair.ui.styles.fields.referenceHint.placeholder')"`, "reference hint placeholder"],
  [`>Base Hair Structure</el-text>`, `>{{ t("modules.hair.ui.styles.sections.base.title") }}</el-text>`, "base title"],
  [`>Color and material are intentionally assigned from their own modules.</el-text>`, `>{{ t("modules.hair.ui.styles.sections.base.description") }}</el-text>`, "base description"],
  [`>Add hairstyle components</el-text>`, `>{{ t("modules.hair.ui.styles.sections.components.title") }}</el-text>`, "components title"],
  [`>Add bangs, braids, buns, ponytails, hair accessories, or custom elements.</el-text>`, `>{{ t("modules.hair.ui.styles.sections.components.description") }}</el-text>`, "components description"],
  [`label="Add selected"`, `:label="t('modules.hair.ui.styles.sections.components.addSelected')"`, "add selected"],
  [`placeholder="Select hairstyle components..."`, `:placeholder="t('modules.hair.ui.styles.sections.components.placeholder')"`, "components placeholder"],
  [`>No extra hairstyle components. Base hair structure can stand on its own.</el-text>`, `>{{ t("modules.hair.ui.styles.sections.components.empty") }}</el-text>`, "components empty"],
  [`>Additional hairstyle details</el-text>`, `>{{ t("modules.hair.ui.styles.fields.additionalDetails.label") }}</el-text>`, "additional details label"],
  [`placeholder="Optional structural or styling instructions..."`, `:placeholder="t('modules.hair.ui.styles.fields.additionalDetails.placeholder')"`, "additional details placeholder"],
  [`label="Add Hairstyle"`, `:label="t('modules.hair.ui.styles.actions.add')"`, "add hairstyle"],
  [`>Create separate hairstyles for different subjects or alternate looks.</el-text>`, `>{{ t("modules.hair.ui.styles.footer.description") }}</el-text>`, "footer description"],
]);

await patchFile("app/components/modules/outfit/OutfitItemCard.vue", [
  [
    `const { mobile } = useScreen();`,
    `const { t } = useI18n();
const { mobile } = useScreen();`,
    "add i18n",
  ],
  [`label="Duplicate item"`, `:label="t('modules.outfit.ui.item.actions.duplicate')"`, "duplicate item"],
  [`label="Remove item"`, `:label="t('modules.outfit.ui.item.actions.remove')"`, "remove item"],
  [`>Item name</el-text>`, `>{{ t("modules.outfit.ui.item.fields.name.label") }}</el-text>`, "item name label"],
  [`placeholder="Display name"`, `:placeholder="t('modules.outfit.ui.item.fields.name.placeholder')"`, "item name placeholder"],
  [`>Semantic key</el-text>`, `>{{ t("modules.outfit.ui.item.fields.key.label") }}</el-text>`, "semantic key label"],
  [`>Unique inside this set</el-text>`, `>{{ t("modules.outfit.ui.item.fields.key.hint") }}</el-text>`, "semantic key hint"],
  [`>Wearable type</el-text>`, `>{{ t("modules.outfit.ui.item.fields.type.label") }}</el-text>`, "wearable type label"],
  [`>Custom wearable</el-text>`, `>{{ t("modules.outfit.ui.item.fields.customType.label") }}</el-text>`, "custom wearable label"],
  [`placeholder="Describe the wearable item..."`, `:placeholder="t('modules.outfit.ui.item.fields.customType.placeholder')"`, "custom wearable placeholder"],
  [`>Property family</el-text>`, `>{{ t("modules.outfit.ui.item.fields.propertyFamily.label") }}</el-text>`, "property family label"],
  [`>Baseline source</el-text>`, `>{{ t("modules.outfit.ui.item.fields.source.label") }}</el-text>`, "source label"],
  [`>Reference item hint</el-text>`, `>{{ t("modules.outfit.ui.item.fields.referenceHint.label") }}</el-text>`, "reference hint label"],
  [`placeholder="e.g. the blouse worn by the person on the left"`, `:placeholder="t('modules.outfit.ui.item.fields.referenceHint.placeholder')"`, "reference hint placeholder"],
  [`>Additional item details</el-text>`, `>{{ t("modules.outfit.ui.item.fields.additionalDetails.label") }}</el-text>`, "additional details label"],
  [`placeholder="Optional construction or wearing details..."`, `:placeholder="t('modules.outfit.ui.item.fields.additionalDetails.placeholder')"`, "additional details placeholder"],
]);

await patchFile("app/components/modules/outfit/OutfitSetsField.vue", [
  [
    `const { mobile } = useScreen();`,
    `const { t } = useI18n();
const { mobile } = useScreen();`,
    "add i18n",
  ],
  [`label="Duplicate set"`, `:label="t('modules.outfit.ui.sets.actions.duplicate')"`, "duplicate set"],
  [`label="Remove set"`, `:label="t('modules.outfit.ui.sets.actions.remove')"`, "remove set"],
  [`>Set name</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.name.label") }}</el-text>`, "set name label"],
  [`placeholder="Outfit set name"`, `:placeholder="t('modules.outfit.ui.sets.fields.name.placeholder')"`, "set name placeholder"],
  [`>Semantic key</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.key.label") }}</el-text>`, "semantic key label"],
  [`>lowerCamelCase · auto-unique</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.key.hint") }}</el-text>`, "semantic key hint"],
  [`>Starter preset</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.preset.label") }}</el-text>`, "preset label"],
  [`placeholder="No preset"`, `:placeholder="t('modules.outfit.ui.sets.fields.preset.placeholder')"`, "preset placeholder"],
  [`>Who wears this set?</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.targets.label") }}</el-text>`, "targets label"],
  [`placeholder="Select subject targets"`, `:placeholder="t('modules.outfit.ui.sets.fields.targets.placeholder')"`, "targets placeholder"],
  [`>Add wearable items</el-text>`, `>{{ t("modules.outfit.ui.sets.sections.items.title") }}</el-text>`, "items title"],
  [`>Choose canonical items, prepared starters, or a custom wearable.</el-text>`, `>{{ t("modules.outfit.ui.sets.sections.items.description") }}</el-text>`, "items description"],
  [`label="Add selected"`, `:label="t('modules.outfit.ui.sets.sections.items.addSelected')"`, "add selected"],
  [`placeholder="Select clothes and wearable items..."`, `:placeholder="t('modules.outfit.ui.sets.sections.items.placeholder')"`, "items placeholder"],
  [`>This set has no wearable items yet.</el-text>`, `>{{ t("modules.outfit.ui.sets.sections.items.empty") }}</el-text>`, "items empty"],
  [`>Additional set details</el-text>`, `>{{ t("modules.outfit.ui.sets.fields.additionalDetails.label") }}</el-text>`, "additional details label"],
  [`placeholder="Optional instructions for the whole outfit set..."`, `:placeholder="t('modules.outfit.ui.sets.fields.additionalDetails.placeholder')"`, "additional details placeholder"],
  [`label="Add Outfit Set"`, `:label="t('modules.outfit.ui.sets.actions.add')"`, "add set"],
  [`>Create separate outfit sets for different subjects or alternate looks.</el-text>`, `>{{ t("modules.outfit.ui.sets.footer.description") }}</el-text>`, "footer description"],
]);

await patchFile("app/components/modules/panel/hair.vue", [
  [`>Hairstyle Designer</el-text>`, `>{{ t("modules.hair.ui.designer.title") }}</el-text>`, "designer title"],
  [`>Build one or more subject-scoped hairstyles, then assign color and material externally when needed.</el-text>`, `>{{ t("modules.hair.ui.designer.description") }}</el-text>`, "designer description"],
  [`>Custom Override</el-text>`, `>{{ t("modules.hair.ui.override.title") }}</el-text>`, "override title"],
  [`>Replace the structured Hairstyle Designer output with your own instruction.</el-text>`, `>{{ t("modules.hair.ui.override.description") }}</el-text>`, "override description"],
  [`placeholder="Describe the complete hairstyle instruction..."`, `:placeholder="t('modules.hair.ui.override.placeholder')"`, "override placeholder"],
]);

await patchFile("app/components/modules/panel/outfit.vue", [
  [`>Outfit Designer</el-text>`, `>{{ t("modules.outfit.ui.designer.title") }}</el-text>`, "designer title"],
  [`>Build one or more wearable sets, assign each set to subjects, then configure every item independently.</el-text>`, `>{{ t("modules.outfit.ui.designer.description") }}</el-text>`, "designer description"],
  [`>Custom Override</el-text>`, `>{{ t("modules.outfit.ui.override.title") }}</el-text>`, "override title"],
  [`>Replace the structured Outfit Designer output with your own instruction.</el-text>`, `>{{ t("modules.outfit.ui.override.description") }}</el-text>`, "override description"],
  [`placeholder="Describe the complete outfit instruction..."`, `:placeholder="t('modules.outfit.ui.override.placeholder')"`, "override placeholder"],
]);

console.log("Hardcoded batch 02 applied.");
