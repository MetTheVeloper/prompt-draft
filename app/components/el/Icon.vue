<template>
  <i
    v-if="mode === 'material'"
    :style="{
      fontSize: `${size || sizes.icon}px`,
    }"
    :class="iconClass"
    >{{ icon }}</i
  >
  <el-iconsax
    v-else
    :icon="icon"
    :color="color"
    :badge="badge"
    :size="size ?? sizes.icon"
  />
</template>

<script setup>
import { useAppStore } from "~/store/app";
import { dimension } from "~/utils/utils";
const props = defineProps({
  color: {
    type: String,
    default: "normal",
  },
  mode: {
    type: String,
    default: "vuesax",
  },
  size: {
    type: Number,
    required: false,
  },
  icon: {
    type: String,
    required: true,
  },
  badge: {
    type: [String, Number],
    required: false,
  },
});

const { type, color, weight, size } = toRefs(props);

const app = useAppStore();
const sizes = computed(() => {
  return dimension(size.value || app.settings.globalSize);
});

const iconClass = computed(() => {
  return [`i txt-${color.value}`].join(" ");
});
</script>
