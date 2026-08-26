<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    summary: string
    icon?: string
    enabled?: boolean
    expanded?: boolean
  }>(),
  {
    icon: "tune",
    enabled: true,
    expanded: false,
  },
)

const emit = defineEmits<{
  (event: "toggle"): void
  (event: "update:enabled", value: boolean): void
  (event: "duplicate"): void
  (event: "remove"): void
}>()

const { t } = useI18n()
const { mobile } = useScreen()

function translate(path: string, fallback: string) {
  const translated = t(path)
  return translated === path ? fallback : translated
}
</script>

<template>
  <el-grid
    :p="12"
    :br="2"
    :bc="expanded ? 'blue40' : 'normal10'"
    :radius="16"
    :gap="12"
    class="w100"
  >
    <el-flex
      :rules="mobile ? 'ccs' : 'rbc'"
      class="w100 crp"
      :gap="8"
      @click="emit('toggle')"
    >
      <el-flex rules="ccs" :gap="1" class="minw0">
        <el-text :size="14" :weight="600" :icon="icon">
          {{ title }}
        </el-text>
        <el-text :size="9" color="normal45">
          {{ summary }}
        </el-text>
      </el-flex>

      <el-flex
        rules="rcc"
        :gap="6"
        :class="mobile ? 'w100 fw' : ''"
      >
        <el-switch
          :model-value="enabled"
          :size="12"
          :label="translate('components.moduleEntities.enabled', 'Enabled')"
          @click.stop
          @update:model-value="emit('update:enabled', $event)"
        />
        <el-button
          type="fab"
          mode="flat"
          icon="content_copy"
          :label="translate('components.moduleEntities.actions.duplicate', 'Duplicate')"
          :size="12"
          :p="8"
          @click.stop="emit('duplicate')"
        />
        <el-button
          type="fab"
          mode="flat"
          color="red"
          icon="delete"
          :label="translate('components.moduleEntities.actions.remove', 'Remove')"
          :size="12"
          :p="8"
          @click.stop="emit('remove')"
        />
        <el-icon :icon="expanded ? 'expand_less' : 'expand_more'" :size="14" />
      </el-flex>
    </el-flex>

    <el-grid v-show="expanded" :gap="12" class="w100">
      <slot />
    </el-grid>
  </el-grid>
</template>
