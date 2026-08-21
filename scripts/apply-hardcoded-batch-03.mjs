#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"

const ROOT = process.cwd()

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8")
}

async function write(relativePath, content) {
  await fs.writeFile(path.join(ROOT, relativePath), content, "utf8")
}

function replaceRequired(content, from, to, label) {
  if (content.includes(to)) return content
  if (!content.includes(from)) {
    throw new Error(`Could not find expected source for ${label}`)
  }
  return content.replace(from, to)
}

async function patchFile(relativePath, replacements) {
  let content = await read(relativePath)
  let changed = false

  for (const [from, to, label] of replacements) {
    const next = replaceRequired(content, from, to, `${relativePath}: ${label}`)
    if (next !== content) changed = true
    content = next
  }

  if (changed) {
    await write(relativePath, content)
    console.log(`Patched: ${relativePath}`)
  } else {
    console.log(`Already patched: ${relativePath}`)
  }
}

await patchFile("app/components/el/color-picker.vue", [
  [
    `import { computed, ref, watch } from 'vue'`,
    `import { computed, ref, watch } from 'vue'\n\nconst { t } = useI18n()`,
    "add i18n",
  ],
  [
    `aria-label="Color saturation and brightness"`,
    `:aria-label="t('components.colorPicker.aria.saturationBrightness')"`,
    "saturation plane aria label",
  ],
])

await patchFile("app/components/modules/panel/style.vue", [
  [
    `import { compileStyle, getStylePresetValues, type StyleValues } from '../../../utils/compileStyle'`,
    `import { compileStyle, getStylePresetValues, type StyleValues } from '../../../utils/compileStyle'\n\nconst { t } = useI18n()`,
    "add i18n",
  ],
  [
    `<span class="module-panel__eyebrow">Key Module</span>`,
    `<span class="module-panel__eyebrow">{{ t('panel.keyModule') }}</span>`,
    "key module label",
  ],
  [
    `<span>Choose a base style quickly</span>`,
    `<span>{{ t('modules.style.ui.legacy.presetsHint') }}</span>`,
    "presets hint",
  ],
  [
    `        Custom Style Output`,
    `        {{ t('modules.style.ui.legacy.customOutput.label') }}`,
    "custom output label",
  ],
  [
    `<small>Overrides all selected fields when filled</small>`,
    `<small>{{ t('modules.style.ui.legacy.customOutput.hint') }}</small>`,
    "custom output hint",
  ],
  [
    `placeholder="Write a complete custom style phrase..."`,
    `:placeholder="t('modules.style.ui.legacy.customOutput.placeholder')"`,
    "custom output placeholder",
  ],
  [
    `      Custom override is active. Form options are ignored in compiled output.`,
    `      {{ t('modules.style.ui.legacy.customOutput.activeNotice') }}`,
    "custom output active notice",
  ],
  [
    `<span>Advanced Options</span>`,
    `<span>{{ t('modules.style.ui.legacy.advancedOptions') }}</span>`,
    "advanced options",
  ],
  [
    `<h3>Compiled Style</h3>`,
    `<h3>{{ t('modules.style.ui.legacy.compiledTitle') }}</h3>`,
    "compiled title",
  ],
  [
    `<p v-else class="module-panel__empty">No style selected yet.</p>`,
    `<p v-else class="module-panel__empty">{{ t('modules.style.ui.legacy.empty') }}</p>`,
    "empty style",
  ],
])

await patchFile("app/components/modules/variables/VariableBlueprintModal.vue", [
  [
    `const emit = defineEmits<{ (event: "close"): void }>()\nconst { mobile } = useScreen()`,
    `const emit = defineEmits<{ (event: "close"): void }>()\nconst { t } = useI18n()\nconst { mobile } = useScreen()`,
    "add i18n",
  ],
  [
    `          Configure one template and choose how many indexed profiles to create.`,
    `          {{ t("modules.variables.fields.variables.blueprints.modal.repeatable.description") }}`,
    "repeatable description",
  ],
  [
    `<el-text :size="11" :weight="700">Custom variables</el-text>`,
    `<el-text :size="11" :weight="700">{{ t("modules.variables.fields.variables.blueprints.modal.custom.title") }}</el-text>`,
    "custom variables title",
  ],
  [
    `          Add any semantic handles you need and choose each variable type independently.`,
    `          {{ t("modules.variables.fields.variables.blueprints.modal.custom.description") }}`,
    "custom variables description",
  ],
  [
    `        label="Add variable"`,
    `        :label="t('modules.variables.fields.variables.blueprints.modal.custom.add')"`,
    "add variable action",
  ],
  [
    `<el-text :size="10" color="normal45">{{ enabledCount }} will be created</el-text>`,
    `<el-text :size="10" color="normal45">{{ t("modules.variables.fields.variables.blueprints.modal.creationCount", { count: enabledCount }) }}</el-text>`,
    "creation count",
  ],
  [
    `              Use exactly one # in every enabled key. A # in the value is optional and receives the same index.`,
    `              {{ t("modules.variables.fields.variables.blueprints.modal.repeatable.indexHint") }}`,
    "repeatable index hint",
  ],
])

await patchFile("app/components/prompt/output-preview.vue", [
  [
    `            Select modules and complete the required setup fields to generate output.`,
    `            {{ t("create.emptyOutputDescription") }}`,
    "empty output description",
  ],
])

console.log("Hardcoded batch 03 applied.")
