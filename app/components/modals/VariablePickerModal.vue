<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type {
  PromptVariable,
  PromptVariableGroup,
} from "~/modules/types"
import { usePromptEditor } from "~/composables/prompt/usePromptEditor"

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    groups: PromptVariableGroup[]
    insertOnSelect?: boolean
    closeOnSelect?: boolean
    onSelect?: (variable: PromptVariable) => void
  }>(),
  {
    groups: () => [],
    insertOnSelect: true,
    closeOnSelect: true,
  },
)

const emit = defineEmits<{
  close: []
}>()

const search = ref("")
const activeGroupId = ref("")
const { insertVariable } = usePromptEditor()

const visibleGroups = computed(() => {
  return props.groups
    .map((group) => ({
      ...group,
      variables: group.variables.filter((variable) => {
        return variable.enabled !== false && Boolean(variable.key?.trim())
      }),
    }))
    .filter((group) => group.variables.length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

watch(
  visibleGroups,
  (groups) => {
    if (groups.some((group) => group.id === activeGroupId.value)) return
    activeGroupId.value = groups[0]?.id || ""
  },
  { immediate: true },
)

const activeGroup = computed(() => {
  return visibleGroups.value.find((group) => {
    return group.id === activeGroupId.value
  })
})

const filteredVariables = computed(() => {
  const query = search.value.trim().toLowerCase()
  const variables = activeGroup.value?.variables || []

  if (!query) return variables

  return variables.filter((variable) => {
    return [
      variable.key,
      variable.label || "",
      variable.value,
      variable.description || "",
      variable.type || "",
      variable.entityType || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query)
  })
})

const canSelectVariable = computed(() => {
  return props.insertOnSelect || typeof props.onSelect === "function"
})

function translate(path: string | undefined, fallback: string) {
  if (!path) return fallback
  const translated = t(path)
  return translated === path ? fallback : translated
}

function groupLabel(group: PromptVariableGroup) {
  return translate(group.labelKey, group.label || group.id)
}

function token(variable: PromptVariable) {
  return `{${variable.key}}`
}

function shouldSpanColumns(variable: PromptVariable) {
  return token(variable).length > 16 || variable.entityType === "region"
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function variableTypeLabel(variable: PromptVariable) {
  if (variable.entityType && variable.entityType !== "module") {
    return humanize(variable.entityType)
  }

  return humanize(variable.type || variable.source || "variable")
}

function select(variable: PromptVariable) {
  if (!canSelectVariable.value) return

  props.onSelect?.(variable)

  if (props.insertOnSelect) {
    insertVariable(variable.key)
  }

  if (props.closeOnSelect) {
    emit("close")
  }
}
</script>

<template>
  <el-flex rules="ccs" class="w100 variable-picker" :gap="12">
    <div class="variable-picker__tabs">
      <el-button
        v-for="group in visibleGroups"
        :key="group.id"
        :label="groupLabel(group)"
        :icon="group.icon"
        :mode="activeGroupId === group.id ? 'normal' : 'flat'"
        :color="activeGroupId === group.id ? 'prim' : 'normal'"
        :size="11"
        :p="[7, 10]"
        @click="activeGroupId = group.id"
      />
    </div>

    <input
      v-model="search"
      type="text"
      class="variable-picker__search"
      :placeholder="t('modules.variables.fields.variables.picker.search.placeholder')"
      autofocus
    />

    <el-grid v-if="filteredVariables.length" :cols="2" class="w100" :gap="8">
      <el-flex
        v-for="variable in filteredVariables"
        :key="`${activeGroupId}:${variable.id || variable.key}`"
        type="button"
        rules="rsc"
        bg="normal5"
        :radius="12"
        :br="1"
        bc="normal10"
        :p="[8]"
        :gap="10"
        :class="[
          'variable-picker__item w100',
          {
            'is-wide': shouldSpanColumns(variable),
            'is-selectable crp chpen': canSelectVariable,
          },
        ]"
        @click="select(variable)"
      >
        <el-flex rules="ccs" class="fg100" :gap="1">
          <el-flex rules="rsc" :gap="6">
            <el-text
              type="span"
              :size="14"
              :weight="700"
              color="white"
              marker="blue35"
              class="variable-picker__token"
              :title="token(variable)"
            >
              {{ token(variable) }}
            </el-text>

            <el-text class="variable-picker__type" :size="9">
              {{ variableTypeLabel(variable) }}
            </el-text>
          </el-flex>

          <el-text
            v-if="variable.label && variable.label !== variable.key"
            :size="11"
            :weight="600"
          >
            {{ variable.label }}
          </el-text>

          <el-text
            :size="11"
            :weight="400"
            class="frsc variable-picker__value"
            :title="variable.value"
          >
            {{ stringShortner(variable.value, shouldSpanColumns(variable) ? 72 : 32) }}
          </el-text>
        </el-flex>
      </el-flex>
    </el-grid>

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

.variable-picker__tabs {
  display: flex;
  gap: 6px;
  width: 100%;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.variable-picker__tabs::-webkit-scrollbar {
  display: none;
}

.variable-picker__search {
  width: 100%;
}

.variable-picker__item {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
}

.variable-picker__item.is-selectable:hover {
  border-color: var(--themeBlue50);
  background: var(--themeBlue5);
}

.variable-picker__item.is-wide {
  grid-column: 1 / -1;
}

.variable-picker__token {
  font-family: monospace;
  white-space: nowrap;
}

.variable-picker__value {
  min-width: 0;
}

.variable-picker__type {
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--normalText10);
  color: var(--normalText60);
  white-space: nowrap;
}

.variable-picker__empty {
  padding: 20px;
  border: 1px dashed var(--normalText15);
  border-radius: 14px;
}

@media (max-width: 640px) {
  .variable-picker :deep(.elGrid) {
    grid-template-columns: 1fr !important;
  }

  .variable-picker__item.is-wide {
    grid-column: auto;
  }
}
</style>
