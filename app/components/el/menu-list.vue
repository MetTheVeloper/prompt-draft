<script setup lang="ts">
import type { GlobalMenuItem } from '~/composables/useMenu'

const props = withDefaults(
  defineProps<{
    items?: GlobalMenuItem[]
  }>(),
  {
    items: () => [],
  },
)

const menuApi = useMenu()

function isDivider(item: GlobalMenuItem) {
  return item.type === 'divider' || item.divider === true
}

function isHeader(item: GlobalMenuItem) {
  return item.type === 'header'
}

function isDisabled(item: GlobalMenuItem) {
  return menuApi.isItemDisabled(item)
}

function isActive(item: GlobalMenuItem) {
  return !!item.active
}

function getItemMode(item: GlobalMenuItem) {
  return isActive(item) ? 'normal' : 'flat'
}

function getItemColor(item: GlobalMenuItem) {
  if (isDisabled(item)) return 'normal'

  if (isActive(item)) return 'blue'

  return item.color || 'normal'
}

function getItemEffect(item: GlobalMenuItem) {
  if (isDisabled(item)) return undefined

  return {
    color: isActive(item) ? 'normal15' : item.color || 'blue15',
  }
}

function getItemKey(item: GlobalMenuItem, index: number) {
  return `${item.type || 'item'}-${item.value ?? item.label ?? 'menu-item'}-${index}`
}

async function handleItemClick(item: GlobalMenuItem) {
  await menuApi.runItem(item)
}
</script>

<template>
  <el-grid :gap="0" :p="6" class="w100">
    <template v-for="(item, index) in props.items" :key="getItemKey(item, index)">
      <el-divider v-if="isDivider(item)" class="mb2 mt2" />

      <el-flex v-else-if="isHeader(item)" rules="rsc" class="globalMenuHeader w100" :p="[8, 10]">
        <el-text :size="11" :weight="600" color="normal45" :icon="item.icon">
          {{ item.label }}
        </el-text>
      </el-flex>

      <el-grid v-else-if="item.description" :gap="2" class="w100">
        <el-button class="w100" rules="rsc" :label="item.label || ''" :icon="item.icon" :size="12"
          text-color="normal"
          :sublabel="item.description" :mode="getItemMode(item)" :color="`${getItemColor(item)}15`" 
          :effect="getItemEffect(item)" :disable="isDisabled(item)" :radius="8" :p="[8]"
          @click="handleItemClick(item)" />
      </el-grid>

      <el-button v-else class="w100" rules="rsc" :label="item.label || ''" :icon="item.icon" :size="12"
        text-color="normal"
        :mode="getItemMode(item)" :color="`${getItemColor(item)}15`" :effect="getItemEffect(item)" :disable="isDisabled(item)"
        :radius="10" :p="[12, 8]" @click="handleItemClick(item)" />
    </template>
  </el-grid>
</template>

<style scoped>
.globalMenuHeader {
  user-select: none;
}
</style>