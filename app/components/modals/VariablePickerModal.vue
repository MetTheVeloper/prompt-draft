<script setup lang="ts">
import { computed, ref } from "vue";
import type { PromptVariable } from "~/modules/types";

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";

type VariablePickerSource = "user" | "system";

type PickerVariable = PromptVariable & {
  source: VariablePickerSource;
};

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    variables: PromptVariable[];
    systemVariables?: PromptVariable[];
    insertOnSelect?: boolean;
    closeOnSelect?: boolean;
    onSelect?: (variable: PromptVariable) => void;
  }>(),
  {
    systemVariables: () => [],
    insertOnSelect: true,
    closeOnSelect: true,
  }
);

const emit = defineEmits<{
  close: [];
}>();

const search = ref("");
const showSystemVariables = ref(!props.variables.length && props.systemVariables.length > 0);
const { insertVariable } = usePromptEditor();

const hasSystemVariables = computed(() => props.systemVariables.length > 0);

const pickerVariables = computed<PickerVariable[]>(() => {
  const sourceVariables = showSystemVariables.value
    ? props.systemVariables
    : props.variables;

  const source: VariablePickerSource = showSystemVariables.value
    ? "system"
    : "user";

  return sourceVariables.map((variable) => ({
    ...variable,
    source,
  }));
});

const filteredVariables = computed(() => {
  const query = search.value.trim().toLowerCase();

  return pickerVariables.value.filter((variable) => {
    if (variable.enabled === false) return false;
    if (!variable.key?.trim()) return false;

    if (!query) return true;

    return [
      variable.key,
      variable.value,
      variable.description || "",
      variable.type || "",
      variable.source,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
});

const canSelectVariable = computed(() => {
  return props.insertOnSelect || typeof props.onSelect === "function";
});

function token(variable: PromptVariable) {
  return `{${variable.key}}`;
}

function shouldSpanColumns(variable: PickerVariable) {
  return token(variable).length > 16;
}

function variableTypeLabel(variable: PickerVariable) {
  if (variable.source === "system") {
    return t("modules.variables.fields.variables.picker.sources.system");
  }

  return variable.type || t("modules.variables.fields.variables.picker.sources.user");
}

function select(variable: PromptVariable) {
  if (!canSelectVariable.value) return;

  props.onSelect?.(variable);

  if (props.insertOnSelect) {
    insertVariable(variable.key);
  }

  if (props.closeOnSelect) {
    emit("close");
  }
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
    <el-switch
      v-if="hasSystemVariables" :model-value="showSystemVariables" @update:model-value="showSystemVariables = $event"
      :invert="true"
      :size="12"
      :label="t('modules.variables.fields.variables.picker.systemVariables.label')" />

    <el-grid v-if="filteredVariables.length" :cols="2" class="w100" :gap="8">
      <el-flex
        v-for="variable in filteredVariables"
        :key="`${variable.source}:${variable.id || variable.key}`"
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
        @click="select(variable)">
        <el-flex rules="ccs" class="fg100" :gap="0">
          <el-flex rules="rsc">
            <el-text
              type="span"
              :size="16"
              :weight="700"
              color="white"
              marker="blue35"
              class="variable-picker__token"
              :title="token(variable)"
            >
              {{ token(variable) }}
            </el-text>
            <el-text class="variable-picker__type" :size="10" :class="`is-${variable.source}`">
              {{ variableTypeLabel(variable) }}
            </el-text>
          </el-flex>
          <el-text
            :size="12"
            :weight="400"
            class="frsc variable-picker__value"
            :title="variable.value">
            {{ stringShortner(variable.value, shouldSpanColumns(variable) ? 56 : 24) }}
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

.variable-picker__search {
  width: 100%;
}

.variable-picker__system-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  cursor: pointer;
  user-select: none;
}

.variable-picker__item {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
}

.variable-picker__item.is-selectable {
  cursor: pointer;
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
  font-size: 10px;
  white-space: nowrap;
}

.variable-picker__type.is-system {
  background: var(--themeBlue15);
  color: var(--themeBlue75);
}

.variable-picker__empty {
  padding: 20px;
  border: 1px dashed var(--normalText15);
  border-radius: 14px;
}
</style>
