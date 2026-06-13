<template>
  <el-flex :rules="direction === 'horizontal' ? 'rcc' : 'ccc'" :class="wrapperClass">
    <!-- Start Slot -->
    <slot name="start" />

    <!-- Divider Line main -->
    <div :class="lineClass" :style="lineStyle"></div>

    <!-- Center Slot -->
    <slot name="center" />

    <!-- Divider Line (after center slot) -->
    <div v-if="$slots.center" :class="lineClass" :style="lineStyle"></div>

    <!-- End Slot -->
    <slot name="end" />
  </el-flex>
</template>

<script setup>
const props = defineProps({
  direction: { type: String, default: "horizontal" }, // horizontal | vertical
  mode: { type: String, default: "solid" }, // solid | dashed
  size: { type: Number, default: 2 }, // ضخامت واقعی خط
  height: { type: Number, required: false },
  radius: { type: Number, default: 8 },
  color: { type: String, default: "normal5" },
  dash: { type: Number, default: 8 }, // طول dash
  gap: { type: Number, default: 6 }, // فاصله dash
});

const slots = useSlots();

const isVertical = computed(() => props.direction === "vertical");

const wrapperClass = computed(() => [
  isVertical.value ? "" : "w100",
  isVertical.value && props.height ? `hp${props.height}` : "",
]);

const lineClass = computed(() => [
  "fg100",
  `br${props.radius}`,
  isVertical.value ? `wp${props.size}` : `hp${props.size}`,
]);

const lineStyle = computed(() => {
  const colorVar = `var(--${splitColor(props.color).variableFull})`;

  // جهت گرادینت
  const gradientDir = isVertical.value ? "to bottom" : "to right";

  // SOLID
  if (props.mode === "solid") {
    return {
      background: `linear-gradient(${gradientDir}, ${colorVar}, ${colorVar})`,
    };
  }

  // DASHED
  const dash = props.dash;
  const gap = props.gap;

  return {
    background: `repeating-linear-gradient(
      ${gradientDir},
      ${colorVar} 0,
      ${colorVar} ${dash}px,
      transparent ${dash}px,
      transparent ${dash + gap}px
    )`,
  };
});
</script>

<style scoped>
/* چیزی لازم نیست، همه چیز با style کنترل می‌شود */
</style>
