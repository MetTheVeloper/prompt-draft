<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PromptVariable } from '~/modules/types'

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
const { t } = useI18n();
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
      :placeholder="t('modules.variables.fields.variables.picker.search.placeholder')"
      autofocus
    />

    <el-flex v-if="filteredVariables.length" rules="ccs" class="w100" :gap="8">
      <el-flex type="button" rules="rsc"
        bg="normal5"
        :radius="12"
        :br="1"
        bc="normal10"
        :p="[10, 12]"
        :gap="10"
        v-for="variable in filteredVariables"
        :key="variable.id || variable.key"
        class="variable-picker__item crp chpen w100"
        @click="insert(variable)">
        <el-flex rules="ccs" class="fg100" :gap="0">
          <el-text type="span"
            :size="16"
            :weight="700"
            color="white"
            marker="blue35"
            class="variable-picker__token">
            {{ token(variable) }}
          </el-text>
          <el-text
            :size="12"
            :weight="400"
            class="frsc">
            {{ variable.value }}
          </el-text>
        </el-flex>
        <el-text
          v-if="variable.type"
          class="variable-picker__type">
          {{ variable.type }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex v-else rules="ccs" class="w100 variable-picker__empty" :gap="4">
      <el-text :size="14" :weight="700">
        {{ t("modules.variables.fields.variables.picker.empty.title") }}
      </el-text>
      <el-text :size="12" color="normal50">
        {{ t("modules.variables.fields.variables.picker.empty.description") }}
      </el-text>
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
  width: 100%;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.variable-picker__item:hover {
  border-color: var(--themeBlue50);
  background: var(--themeBlue5);
}

.variable-picker__token {
  font-family: monospace;
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
