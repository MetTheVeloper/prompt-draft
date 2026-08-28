<script setup lang="ts">
import type { PortraitReviewItem } from "~/wizard/portraitReview";

const props = defineProps<{
  items: PortraitReviewItem[];
}>();

const emit = defineEmits<{
  (event: "edit", stepId: string): void;
}>();

const grouped = computed(() => {
  const map = new Map<string, PortraitReviewItem[]>();
  for (const item of props.items) {
    const group = map.get(item.stepId) || [];
    group.push(item);
    map.set(item.stepId, group);
  }
  return [...map.entries()];
});
</script>

<template>
  <el-grid :gap="12">
    <el-grid v-for="[stepId, items] in grouped" :key="stepId" :gap="8" :p="[12]">
      <el-flex rules="rsc">
        <el-text :size="13" :weight="700">{{ stepId }}</el-text>
        <el-button label="Edit" mode="flat" color="blue" @click="emit('edit', stepId)" />
      </el-flex>
      <el-grid :gap="6">
        <el-flex v-for="item in items" :key="item.id" rules="rsc" :gap="12">
          <el-text :size="12" color="normal55">{{ item.label }}</el-text>
          <el-text :size="12" :weight="600">{{ item.value }}</el-text>
        </el-flex>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
