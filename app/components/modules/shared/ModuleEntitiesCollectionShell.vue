<script setup lang="ts">
const props = defineProps<{
  count: number
  expanded: boolean
  addLabel: string
}>()

const emit = defineEmits<{
  (event: "update:expanded", value: boolean): void
  (event: "add"): void
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
    type="section"
    :p="mobile ? 12 : 16"
    :br="1"
    bc="blue25"
    :radius="mobile ? 16 : 24"
    class="w100"
  >
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="16" :weight="700" icon="layers">
          {{ translate("components.moduleEntities.title", "Named Configurations") }}
        </el-text>
        <el-text :size="10" color="normal50">
          {{
            translate(
              "components.moduleEntities.description",
              "Create reusable module configurations that inherit from the global/default values above.",
            )
          }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="6">
        <el-text marker="blue5" color="blue" :size="10" :weight="600">
          {{ count }}
        </el-text>
        <el-button
          type="fab"
          mode="flat"
          color="prim"
          :icon="expanded ? 'expand_less' : 'expand_more'"
          :label="
            expanded
              ? translate('components.moduleEntities.actions.collapse', 'Collapse')
              : translate('components.moduleEntities.actions.expand', 'Expand')
          "
          :size="12"
          :p="8"
          @click="emit('update:expanded', !expanded)"
        />
        <el-button
          color="blue"
          icon="add"
          :label="addLabel"
          :size="12"
          :p="[8, 12]"
          @click="emit('add')"
        />
      </el-flex>
    </el-flex>

    <el-grid v-show="expanded" :gap="12" class="w100">
      <slot />
    </el-grid>
  </el-grid>
</template>
