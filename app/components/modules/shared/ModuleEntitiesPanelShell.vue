<script setup lang="ts">
import { computed } from "vue";

withDefaults(
  defineProps<{
    count?: number;
    label?: string;
  }>(),
  {
    count: 0,
    label: "Named Configurations",
  },
);

const emit = defineEmits<{
  (event: "open"): void;
}>();

const { mobile, mini } = useScreen();

const launcherStyle = computed(() => ({
  top: mobile.value ? "88px" : mini.value ? "72px" : "58px",
}));
</script>

<template>
  <div class="module-entities-panel-shell w100">
    <slot />

    <el-flex
      rules="rcc"
      :gap="5"
      class="module-entities-panel-shell__launcher"
      :style="launcherStyle"
    >
      <el-text
        v-if="count > 0"
        type="span"
        marker="blue10"
        color="blue"
        :size="10"
        :weight="700"
      >
        {{ count }}
      </el-text>

      <el-button
        type="fab"
        mode="flat"
        color="prim"
        icon="layers"
        :size="14"
        :p="8"
        :label="`${label} (${count})`"
        @click.stop="emit('open')"
      />
    </el-flex>
  </div>
</template>

<style scoped>
.module-entities-panel-shell {
  position: relative;
}

.module-entities-panel-shell__launcher {
  position: absolute;
  inset-inline-end: 18px;
  z-index: 5;
}

@media (max-width: 640px) {
  .module-entities-panel-shell__launcher {
    inset-inline-end: 12px;
  }
}
</style>
