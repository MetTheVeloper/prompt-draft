<script setup lang="ts">
import type { PromptKeyModule } from "../../modules/types";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modules: PromptKeyModule[];
    modelValue: string[];
    embedded?: boolean;
    hideHead?: boolean;
  }>(),
  {
    embedded: false,
    hideHead: false,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string[]): void;
}>();

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function moduleTitle(module: PromptKeyModule) {
  return translate(`modules.${module.key}.title`, module.key);
}

function moduleDescription(module: PromptKeyModule) {
  return translate(`modules.${module.key}.description`);
}

function isModuleSelected(moduleKey: string) {
  return props.modelValue.includes(moduleKey);
}

function toggleModule(moduleKey: string) {
  if (isModuleSelected(moduleKey)) {
    emit(
      "update:modelValue",
      props.modelValue.filter((key) => key !== moduleKey)
    );

    return;
  }

  emit("update:modelValue", [...props.modelValue, moduleKey]);
}
</script>

<template>
  <el-grid
    type="section"
    :p="embedded ? [0] : [0]"
    :br="0"
    :bg="embedded ? undefined : 'surface'"
    :radius="embedded ? 0 : 28"
    class="w100"
  >
    <!-- Header -->
    <el-grid v-if="!hideHead" :p="[20, 20, 16, 20]" class="w100">
      <el-flex rules="ccs" :gap="4">
        <el-text type="h2" :size="16" :weight="800" class="lh1">
          {{ t("create.modulesTitle") }}
        </el-text>

        <el-text type="p" :size="12" :weight="300" color="normal60">
          {{ t("create.modulesDescription") }}
        </el-text>
      </el-flex>
    </el-grid>

    <el-divider v-if="!hideHead" />

    <!-- Module List -->
    <el-grid :cols="6" rules="rsc" class="fw" :gap="8" :p="embedded ? [0] : [16]">
      <label v-for="module in modules" :key="module.key" class="crp">
        <el-button
          :label="moduleTitle(module)"
          :icon="module.icon"
          :color="isModuleSelected(module.key) ? 'prim' : 'prim15'"
          :text-color="isModuleSelected(module.key) ? 'onPrim' : 'normal'"
          :p="[10, 4]"
          type="fab"
          :size="12"
          :gap="4"
          mode="normal" />
          <input
            type="checkbox" class="dsn"
            :checked="isModuleSelected(module.key)"
            @change="toggleModule(module.key)"/>

      </label>
    </el-grid>
  </el-grid>
</template>
