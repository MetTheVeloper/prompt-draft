<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  disabled?: boolean;
  readonly?: boolean;
  min?: string;
  max?: string;
  step?: number;
}>(), {
  modelValue: "",
  disabled: false,
  readonly: false,
  min: undefined,
  max: undefined,
  step: 60,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "change", value: Event): void;
}>();

const attrs = useAttrs();

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="el-date-time-field-host">
    <input
      class="el-text-field el-text-field--input el-date-time-field-host__control"
      type="datetime-local"
      :value="props.modelValue || ''"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      lang="en"
      dir="ltr"
      v-bind="attrs"
      @input="handleInput"
      @change="emit('change', $event)"
    />
  </div>
</template>

<style scoped>
.el-date-time-field-host {
  position: relative;
  width: 100%;
}

.el-date-time-field-host__control {
  width: 100%;
  font-size: 16px;
  line-height: 23.2px;
  padding-block: 8.8px;
  padding-inline: 12px;
  border-radius: 12px;
}
</style>
