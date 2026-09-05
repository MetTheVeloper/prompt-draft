<script setup lang="ts">
import { useAppStore } from "~/store/app";

const props = withDefaults(defineProps<{
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: string | number;
  sizeOffset?: number;
  br?: number | string | boolean | Array<number | string | boolean>;
  bc?: number | string | boolean | Array<number | string | boolean>;
}>(), {
  src: null,
  name: "",
  alt: "",
  size: "normal",
  sizeOffset: 0,
  br: false,
  bc: false,
});

const app = useAppStore();
const imageFailed = ref(false);

const sizeMap = new Map<string, number>([
  ["tiny", -2],
  ["mini", -1],
  ["normal", 0],
  ["medium", 1],
  ["big", 2],
  ["-3", -3],
  ["-2", -2],
  ["-1", -1],
  ["0", 0],
  ["+1", 1],
  ["+2", 2],
  ["+3", 3],
]);

const sizes = computed(() => {
  let mainSize = app.settings.globalSize;

  if (typeof props.size === "number") {
    mainSize = fixNumber(props.size);
  } else {
    mainSize += sizeMap.get(props.size) ?? 0;
  }

  return dimension(mainSize);
});

const avatarSize = computed(() => {
  return Math.max(1, sizes.value.button.height + fixNumber(props.sizeOffset));
});
const avatarIconSize = computed(() => sizes.value.button.icon);
const avatarTextSize = computed(() => Math.max(9, sizes.value.button.label));

const normalizedName = computed(() => String(props.name || "").trim());

const initials = computed(() => {
  const value = normalizedName.value;
  if (!value) return "";

  const localPart = value.includes("@") ? value.split("@", 1)[0] : value;
  const parts = localPart
    .split(/[\s._-]+/)
    .map(part => part.trim())
    .filter(Boolean);

  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts.at(-1)?.charAt(0) || ""}`.toUpperCase();
});

const showImage = computed(() => Boolean(props.src) && !imageFailed.value);
const accessibleLabel = computed(() => props.alt || normalizedName.value || "Avatar");

watch(
  () => props.src,
  () => {
    imageFailed.value = false;
  },
);
</script>

<template>
  <el-flex
    rules="rcc"
    bg="normal10"
    :radius="100"
    :br="br"
    :bc="bc"
    class="el-avatar ofh usn fsh0"
    :style="{
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      minWidth: `${avatarSize}px`,
      minHeight: `${avatarSize}px`,
      maxWidth: `${avatarSize}px`,
      maxHeight: `${avatarSize}px`,
    }"
    role="img"
    :aria-label="accessibleLabel">
    <img
      v-if="showImage"
      :src="src || ''"
      :alt="accessibleLabel"
      class="el-avatar__image"
      draggable="false"
      @error="imageFailed = true"
    >
    <el-text
      v-else-if="initials"
      :size="avatarTextSize"
      :weight="800"
      class="lh1 pen">
      {{ initials }}
    </el-text>
    <el-icon
      v-else
      icon="person"
      color="normal55"
      :size="avatarIconSize"
      class="pen"
    />
  </el-flex>
</template>

<style scoped>
.el-avatar {
  position: relative;
  flex: 0 0 auto;
}

.el-avatar__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  user-select: none;
  pointer-events: none;
}
</style>