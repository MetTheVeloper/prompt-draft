<script setup lang="ts">
import type { WizardQuestionOption } from "~/wizard/definition";

const props = defineProps<{
  options: readonly WizardQuestionOption[];
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <el-grid fit="fit" min="220px" max="1fr" :gap="10" class="w100">
    <el-button
      v-for="option in props.options"
      :key="option.value"
      :mode="props.modelValue === option.value ? 'normal' : 'outline'"
      color="blue"
      rules="rsc"
      :p="[12, 14]"
      @click="emit('update:modelValue', option.value)">
      <el-flex rules="rsc" :gap="10" class="w100">
        <el-icon
          v-if="option.icon"
          :icon="option.icon"
          :size="18"
          :color="props.modelValue === option.value ? 'on-prim' : 'blue'"
        />
        <el-grid :gap="3">
          <el-text
            :size="13"
            :weight="700"
            :color="props.modelValue === option.value ? 'on-prim' : 'blue'">
            {{ option.label }}
          </el-text>
          <el-text
            v-if="option.description"
            :size="10"
            :color="props.modelValue === option.value ? 'on-prim' : 'normal50'">
            {{ option.description }}
          </el-text>
        </el-grid>
      </el-flex>
    </el-button>
  </el-grid>
</template>
