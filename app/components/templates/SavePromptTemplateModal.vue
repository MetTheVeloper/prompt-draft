<script setup lang="ts">
const props = defineProps<{
  state: {
    title: string;
    description: string;
  };
}>();
</script>

<template>
  <el-grid :gap="14" class="w100">
    <el-grid :gap="6" class="w100">
      <el-text :size="11" :weight="700" color="normal55">Template name</el-text>
      <el-text-field
        v-model="props.state.title"
        placeholder="My portrait template"
        :actions="false"
      />
    </el-grid>

    <el-grid :gap="6" class="w100">
      <el-text :size="11" :weight="700" color="normal55">Description (optional)</el-text>
      <el-text-field
        v-model="props.state.description"
        type="textarea"
        :rows="3"
        placeholder="What is this template useful for?"
        :actions="false"
      />
    </el-grid>

    <el-text :size="11" color="normal45">
      Saving a template stores a reusable copy of this structured Draft. Future edits to the current Draft will not change the saved template.
    </el-text>
  </el-grid>
</template>
