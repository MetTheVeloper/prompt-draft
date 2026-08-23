<template>
  <span
    ref="root"
    class="el-help"
    role="button"
    tabindex="0"
    :aria-expanded="opened"
    @click.stop="toggle"
    @keydown.enter.stop.prevent="toggle"
    @keydown.space.stop.prevent="toggle"
  >
    <el-icon :icon="icon" :size="size" :color="color" />

    <el-grid
      v-if="opened"
      class="el-help__popover"
      :p="12"
      :gap="4"
      :radius="12"
      :br="1"
      bc="normal15"
      bg="surface"
      @click.stop
    >
      <el-text
        v-if="title"
        :size="12"
        :weight="700"
        color="normal"
        class="el-help__text"
      >
        {{ title }}
      </el-text>

      <el-text
        :size="11"
        :weight="300"
        color="normal70"
        class="el-help__text"
      >
        {{ text }}
      </el-text>
    </el-grid>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    title?: string;
    icon?: string;
    size?: number;
    color?: string;
  }>(),
  {
    title: "",
    icon: "help",
    size: 14,
    color: "normal45",
  },
);

const root = ref<HTMLElement | null>(null);
const opened = ref(false);

function toggle() {
  if (!props.text) return;
  opened.value = !opened.value;
}

function close() {
  opened.value = false;
}

function onPointerDown(event: PointerEvent) {
  if (!opened.value || !root.value) return;
  if (root.value.contains(event.target as Node)) return;
  close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.el-help {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  cursor: pointer;
  line-height: 1;
}

.el-help__popover {
  position: absolute;
  z-index: 3500;
  top: calc(100% + 8px);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  width: max-content;
  min-width: min(220px, calc(100vw - 32px));
  max-width: min(340px, calc(100vw - 32px));
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  cursor: default;
}

.el-help__text {
  width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.45;
}
</style>
