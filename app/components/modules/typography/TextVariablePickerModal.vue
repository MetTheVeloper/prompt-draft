<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type { PromptVariable } from "~/modules/types"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"

type TextVariablePickerController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

const props = withDefaults(
  defineProps<{
    existingTokens?: string[]
    controller?: TextVariablePickerController
    onSave?: (variables: PromptVariable[]) => void
  }>(),
  {
    existingTokens: () => [],
  },
)

const { t } = useI18n()
const { enabledPromptVariables } = usePromptVariables()
const selectedVariableIds = ref<ElDropdownValue[]>([])

function translate(path: string, fallback = "") {
  const translated = t(path)
  return translated === path ? fallback : translated
}

function variableToken(variable: PromptVariable) {
  return `{${variable.key}}`
}

const existingTokenSet = computed(() => {
  return new Set(props.existingTokens.map((token) => token.trim()).filter(Boolean))
})

const textVariables = computed(() => {
  return enabledPromptVariables.value.filter((variable) => variable.type === "text")
})

const variableItems = computed(() => {
  return textVariables.value.map((variable) => {
    const token = variableToken(variable)

    return {
      value: variable.id,
      label: token,
      description: variable.value,
      icon: "text_fields",
      disabled: existingTokenSet.value.has(token),
    }
  })
})

const selectedVariables = computed(() => {
  return selectedVariableIds.value
    .map((id) => {
      return textVariables.value.find((variable) => variable.id === String(id))
    })
    .filter((variable): variable is PromptVariable => Boolean(variable))
})

const canSubmit = computed(() => selectedVariables.value.length > 0)

function saveSelection() {
  if (!canSubmit.value) return false
  props.onSave?.(selectedVariables.value)
  return true
}

if (props.controller) {
  props.controller.submit = saveSelection
  props.controller.canSubmit = () => canSubmit.value
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveSelection) {
    props.controller.submit = () => false
  }

  if (props.controller?.canSubmit) {
    delete props.controller.canSubmit
  }
})
</script>

<template>
  <el-grid class="text-variable-picker" :gap="10">
    <el-flex rules="ccs" :gap="3">
      <el-text :size="12" :weight="700" icon="text_fields">
        {{
          translate(
            "modules.typography.fields.textGroups.variablePicker.title",
            "Text variables",
          )
        }}
      </el-text>
      <el-text :size="10" color="normal45">
        {{
          translate(
            "modules.typography.fields.textGroups.variablePicker.description",
            "Select one or more user Text variables to add as typography text items.",
          )
        }}
      </el-text>
    </el-flex>

    <el-multi-select
      v-if="variableItems.length"
      v-model="selectedVariableIds"
      :items="variableItems"
      item-label="label"
      item-value="value"
      item-description="description"
      item-icon="icon"
      item-disabled="disabled"
      icon="text_fields"
      :placeholder="
        translate(
          'modules.typography.fields.textGroups.variablePicker.placeholder',
          'Select Text variables',
        )
      "
      :clear-label="
        translate(
          'modules.typography.fields.textGroups.variablePicker.clear',
          'Clear text variable selection',
        )
      "
    />

    <el-flex v-else rules="rsc" :gap="6" class="text-variable-picker__empty">
      <el-icon icon="info" :size="12" color="normal45" />
      <el-text :size="10" color="normal45">
        {{
          translate(
            "modules.typography.fields.textGroups.variablePicker.empty",
            "No active user Text variables are available. Create them in Variables first.",
          )
        }}
      </el-text>
    </el-flex>

    <el-text v-if="selectedVariables.length" :size="10" color="blue">
      {{ selectedVariables.length }} selected
    </el-text>
  </el-grid>
</template>

<style scoped>
.text-variable-picker {
  width: 100%;
}

.text-variable-picker__empty {
  min-height: 42px;
  padding: 10px;
  border: 1px dashed var(--normalText15);
  border-radius: 10px;
  background: var(--normalText5);
}
</style>
