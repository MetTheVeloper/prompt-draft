<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PromptVariable } from '~/modules/types'

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const props = defineProps<{
  variables: PromptVariable[]
}>()

const emit = defineEmits<{
  close: []
}>()

const search = ref('')
const { insertVariable } = usePromptEditor()

const filteredVariables = computed(() => {
  const query = search.value.trim().toLowerCase()

  return props.variables.filter((variable) => {
    if (variable.enabled === false) return false
    if (!variable.key?.trim()) return false

    if (!query) return true

    return [
      variable.key,
      variable.value,
      variable.description || '',
      variable.type || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

function token(variable: PromptVariable) {
  return `{${variable.key}}`
}

function insert(variable: PromptVariable) {
  insertVariable(variable.key)
  emit('close')
}
</script>

<template>
  <el-flex rules="ccs" class="w100 variable-picker" :gap="12">
    <input
      v-model="search"
      type="text"
      class="variable-picker__search"
      placeholder="Search variables..."
      autofocus
    />

    <el-flex v-if="filteredVariables.length" rules="ccs" class="w100" :gap="8">
      <button
        v-for="variable in filteredVariables"
        :key="variable.id || variable.key"
        type="button"
        class="variable-picker__item"
        @click="insert(variable)"
      >
        <span class="variable-picker__token">{{ token(variable) }}</span>
        <span class="variable-picker__value">{{ variable.value }}</span>
        <span v-if="variable.type" class="variable-picker__type">{{ variable.type }}</span>
      </button>
    </el-flex>

    <el-flex v-else rules="ccs" class="w100 variable-picker__empty" :gap="4">
      <el-text :size="14" :weight="700">No variables found</el-text>
      <el-text :size="12" color="normal50">Create or enable variables first.</el-text>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.variable-picker {
  min-width: 0;
}

.variable-picker__search {
  width: 100%;
}

.variable-picker__item {
  display: grid;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--normalText10);
  border-radius: 12px;
  background: var(--normalText5);
  color: var(--normalText);
  cursor: pointer;
  text-align: left;
}

.variable-picker__item:hover {
  border-color: var(--themeBlue50);
  background: var(--themeBlue5);
}

.variable-picker__token {
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--themeBlue);
  white-space: nowrap;
}

.variable-picker__value {
  overflow: hidden;
  color: var(--normalText75);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variable-picker__type {
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--normalText10);
  color: var(--normalText60);
  font-size: 10px;
  white-space: nowrap;
}

.variable-picker__empty {
  padding: 20px;
  border: 1px dashed var(--normalText15);
  border-radius: 14px;
}
</style>
