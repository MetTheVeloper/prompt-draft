<script setup lang="ts">
import { computed } from "vue";
import type { PromptTemplate } from "~/templates/types";

const props = defineProps<{
  templates: PromptTemplate[];
  state: { selectedId: string };
}>();

const builtIns = computed(() =>
  props.templates.filter((template) => template.origin === "builtin"),
);
const userTemplates = computed(() =>
  props.templates.filter((template) => template.origin === "user"),
);

function selectTemplate(templateId: string) {
  props.state.selectedId = templateId;
}
</script>

<template>
  <el-grid :gap="18" class="w100">
    <el-grid v-if="builtIns.length" :gap="8" class="w100">
      <el-text :size="11" :weight="800" color="normal55">Built-in templates</el-text>
      <el-grid :gap="8" class="w100">
        <el-button
          v-for="template in builtIns"
          :key="template.id"
          :label="template.title"
          :description="template.description"
          icon="auto_awesome"
          rules="rsc"
          :mode="state.selectedId === template.id ? 'normal' : 'outline'"
          :color="state.selectedId === template.id ? 'blue' : 'normal'"
          class="w100"
          @click="selectTemplate(template.id)"
        />
      </el-grid>
    </el-grid>

    <el-grid v-if="userTemplates.length" :gap="8" class="w100">
      <el-divider mode="dashed" />
      <el-text :size="11" :weight="800" color="normal55">My templates</el-text>
      <el-grid :gap="8" class="w100">
        <el-button
          v-for="template in userTemplates"
          :key="template.id"
          :label="template.title"
          :description="template.description"
          icon="bookmark"
          rules="rsc"
          :mode="state.selectedId === template.id ? 'normal' : 'outline'"
          :color="state.selectedId === template.id ? 'blue' : 'normal'"
          class="w100"
          @click="selectTemplate(template.id)"
        />
      </el-grid>
    </el-grid>

    <el-text v-if="!templates.length" :size="12" color="normal50">
      No templates are available yet.
    </el-text>
  </el-grid>
</template>
