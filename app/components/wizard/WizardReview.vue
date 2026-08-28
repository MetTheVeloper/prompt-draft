<script setup lang="ts">
import type { WizardDefinition } from "~/wizard/definition";
import type { WizardRuntimeReviewItem } from "~/wizard/registry";

const props = defineProps<{
  items: WizardRuntimeReviewItem[];
  definition: WizardDefinition;
}>();

const emit = defineEmits<{
  (event: "edit", stepId: string): void;
}>();

const grouped = computed(() => {
  const map = new Map<string, {
    id: string;
    title: string;
    stepId: string;
    items: WizardRuntimeReviewItem[];
  }>();

  for (const item of props.items) {
    const step = props.definition.steps.find((entry) => entry.id === item.stepId);
    const stage = step?.stageId
      ? props.definition.stages?.find((entry) => entry.id === step.stageId)
      : null;
    const groupId = stage?.id || step?.id || item.stepId;
    const current = map.get(groupId) || {
      id: groupId,
      title: stage?.title || step?.title || item.stepId,
      stepId: step?.id || item.stepId,
      items: [],
    };
    current.items.push(item);
    map.set(groupId, current);
  }

  return [...map.values()];
});
</script>

<template>
  <el-grid :gap="12" class="w100">
    <el-flex
      v-for="group in grouped"
      :key="group.id"
      rules="csc"
      :gap="10"
      :p="16"
      :radius="16"
      :br="1"
      bc="normal10"
      bg="surface"
      class="w100">
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-text :size="13" :weight="800">{{ group.title }}</el-text>
        <el-button
          label="Edit"
          icon="edit"
          mode="flat"
          color="blue"
          :size="11"
          @click="emit('edit', group.stepId)"
        />
      </el-flex>

      <el-grid :gap="7" class="w100">
        <el-flex
          v-for="item in group.items"
          :key="item.id"
          rules="rbc"
          :gap="16"
          class="w100">
          <el-text :size="11" color="normal50">{{ item.label }}</el-text>
          <el-text :size="11" :weight="600" class="tar">{{ item.value }}</el-text>
        </el-flex>
      </el-grid>
    </el-flex>
  </el-grid>
</template>
