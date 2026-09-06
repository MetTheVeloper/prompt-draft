<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number | string;
    size?: number;
    weight?: number;
    color?: string;
  }>(),
  {
    size: 12,
    weight: 600,
    color: "normal",
  },
);

const { locale } = useI18n();

const formattedValue = computed(() => {
  if (typeof props.value !== "number") return props.value;
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(props.value);
});
</script>

<template>
  <el-flex rules="rsc" :gap="5" class="goin-amount">
    <img
      src="/icons/goin.svg"
      alt=""
      aria-hidden="true"
      class="goin-amount__icon"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
    <el-text :size="size" :color="color || 'normal'" :weight="weight || 600">
      {{ formattedValue }}
    </el-text>
  </el-flex>
</template>

<style scoped>
.goin-amount {
  min-width: 0;
  flex: 0 0 auto;
}

.goin-amount__icon {
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
}
</style>
