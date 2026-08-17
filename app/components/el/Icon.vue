<template>
  <span
    class="el-icon-root"
    :style="rootStyle"
    aria-hidden="true"
  >
    <span
      :class="symbolClass"
      :style="symbolStyle"
    >{{ icon }}</span>

    <span
      v-if="badge"
      :class="badgeClass"
    >{{ badge }}</span>
  </span>
</template>

<script setup lang="ts">
import { useAppStore } from "~/store/app";
import { dimension } from "~/utils/utils";

type MaterialSymbolVariant = "outlined" | "rounded" | "sharp";

const props = withDefaults(
  defineProps<{
    icon: string;
    size?: number;
    color?: string;
    badge?: string | number;
    /** @deprecated Material Symbols is now the only renderer. Use `variant` for the symbol family. */
    mode?: string;
    variant?: MaterialSymbolVariant;
    weight?: number;
    fill?: boolean | 0 | 1;
    grade?: number;
    opticalSize?: number;
  }>(),
  {
    color: "normal",
    mode: "symbols",
    variant: "outlined",
    weight: 400,
    fill: 0,
    grade: 0,
  },
);

const app = useAppStore();
const { mobile, mini } = useScreen();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const sizes = computed(() => dimension(props.size || app.settings.globalSize));
const iconSize = computed(() => props.size ?? sizes.value.icon);
const symbolWeight = computed(() => clamp(props.weight, 100, 700));
const symbolFill = computed(() => (props.fill === true || props.fill === 1 ? 1 : 0));
const symbolGrade = computed(() => clamp(props.grade, -50, 200));
const symbolOpticalSize = computed(() =>
  clamp(props.opticalSize ?? iconSize.value, 20, 48),
);
const desktopMode = computed(() => !mobile.value && !mini.value);

const symbolClass = computed(() => [
  `material-symbols-${props.variant}`,
  `txt-${props.color}`,
  "el-icon__symbol",
]);

const rootStyle = computed(() => ({
  width: `${iconSize.value}px`,
  height: `${iconSize.value}px`,
  minWidth: `${iconSize.value}px`,
  minHeight: `${iconSize.value}px`,
}));

const symbolStyle = computed(() => ({
  fontSize: `${iconSize.value}px`,
  fontVariationSettings: `'FILL' ${symbolFill.value}, 'wght' ${symbolWeight.value}, 'GRAD' ${symbolGrade.value}, 'opsz' ${symbolOpticalSize.value}`,
}));

const badgeClass = computed(() => [
  "el-icon__badge",
  "bg-red",
  "txt-white",
  "lh1",
  "frcc",
  desktopMode.value ? "mnwp20 mnhp20" : "mnwp16 mnhp16 p4",
]);
</script>

<style scoped>
.el-icon-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  line-height: 1;
  vertical-align: middle;
}

.el-icon__symbol {
  display: block;
  width: 1em;
  height: 1em;
  line-height: 1;
  overflow: hidden;
  user-select: none;
}

.el-icon__badge {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  transform: translate(50%, -50%);
  border-radius: 999px;
  z-index: 1;
  pointer-events: none;
}

.el-icon-root:dir(rtl) .el-icon__badge {
  transform: translate(-50%, -50%);
}
</style>
