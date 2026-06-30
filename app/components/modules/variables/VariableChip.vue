<script setup lang="ts">
import type { PromptVariable } from "../../../modules/types";

withDefaults(
  defineProps<{
    variable: PromptVariable;
    token: string;
    typeLabel: string;
    valuePreview: string;
    issue?: string;
    disabled?: boolean;
    disabledLabel: string;
    deleteLabel: string;
    duplicateLabel: string;
    editLabel: string;
  }>(),
  {
    issue: "",
    disabled: false,
  }
);

const emit = defineEmits<{
  (event: "edit"): void;
  (event: "delete"): void;
  (event: "duplicate"): void;
}>();

function handleEdit() {
  emit("edit");
}

function handleDelete() {
  emit("delete");
}

function handleDuplicate() {
  emit("duplicate");
}
</script>

<template>
  <el-flex rules="rbc" :p="[8, 12]" :gap="16" :radius="16" :br="1" :bg="disabled || issue ? 'orange5' : 'normal5'"
    :bc="disabled || issue ? 'orange50' : 'normal15'" role="button" tabindex="0" :title="valuePreview" class="crp"
    @click="handleEdit" @keydown.enter.prevent="handleEdit" @keydown.space.prevent="handleEdit">
    <el-flex rules="ccs" bg="red0" :gap="0" class="w100">
      <el-flex rules="rsc" :gap="12">
        <el-flex rules="ccs" :gap="0">
          <el-text :size="18" :weight="600" marker="blue5" color="normal">
            {{ token }}
          </el-text>

          <el-text :size="10" :weight="600" color="normal65">
            {{ typeLabel }}
          </el-text>

          <el-text v-if="disabled" :size="10" :weight="600" marker="orange5" color="orange">
            {{ disabledLabel }}
          </el-text>
        </el-flex>
      </el-flex>

      <!-- <el-text :size="11" color="normal55" class="variable-chip__preview">
        {{ valuePreview }}
      </el-text> -->

      <el-text v-if="issue" :size="10" color="orange" icon="danger" icon-color="orange">
        {{ issue }}
      </el-text>
    </el-flex>
    <el-flex rules="rcc" bg="blue0" :gap="6">
      <el-button type="fab" mode="flat" color="blue" icon="copy" :label="duplicateLabel" :size="12" :p="4"
        @click.stop="handleDuplicate" />

      <el-button type="fab" mode="outline" :br="1" color="red" icon="trash" :label="deleteLabel" :size="12" :p="4"
        @click.stop="handleDelete" />
    </el-flex>
  </el-flex>
</template>

<style scoped>
</style>