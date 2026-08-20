<script setup lang="ts">
import type {
  GlobalMenuItem,
  GlobalMenuOptions,
  GlobalMenuPlacement,
} from '~/composables/useMenu'
import type {
  ElDropdownItem,
  ElDropdownValue,
} from '~/types/dropdown'

defineOptions({
  inheritAttrs: false,
})

type ElMultiSelectRawItem =
  | ElDropdownValue
  | ElDropdownItem
  | Record<string, any>

type ElMultiSelectItemGetter<TResult> =
  | string
  | ((item: any, index: number) => TResult)

const props = withDefaults(
  defineProps<{
    modelValue?: ElDropdownValue[]
    items?: ElMultiSelectRawItem[]

    itemLabel?: ElMultiSelectItemGetter<string>
    itemValue?: ElMultiSelectItemGetter<ElDropdownValue>
    itemDescription?: ElMultiSelectItemGetter<string>
    itemDisabled?: ElMultiSelectItemGetter<boolean | (() => boolean)>
    itemIcon?: ElMultiSelectItemGetter<string>
    itemColor?: ElMultiSelectItemGetter<string>
    itemGroup?: ElMultiSelectItemGetter<string>
    itemGroupLabel?: ElMultiSelectItemGetter<string>

    placeholder?: string
    clearable?: boolean
    clearLabel?: string
    disabled?: boolean
    exclusiveValues?: ElDropdownValue[]

    placement?: GlobalMenuPlacement
    menuOptions?: GlobalMenuOptions
    icon?: string
    maxSummaryItems?: number
  }>(),
  {
    modelValue: () => [],
    items: () => [],
    itemLabel: undefined,
    itemValue: undefined,
    itemDescription: undefined,
    itemDisabled: undefined,
    itemIcon: undefined,
    itemColor: undefined,
    itemGroup: undefined,
    itemGroupLabel: undefined,
    placeholder: 'Select options',
    clearable: true,
    clearLabel: 'Clear selection',
    disabled: false,
    exclusiveValues: () => [],
    placement: 'bottom-start',
    menuOptions: () => ({}),
    icon: undefined,
    maxSummaryItems: 3,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ElDropdownValue[]): void
  (event: 'change', value: ElDropdownValue[]): void
}>()

const menuApi = useMenu()
const triggerRef = ref<HTMLElement | null>(null)
const localValues = ref<ElDropdownValue[]>([])

function readItemValue<TResult>(
  item: any,
  index: number,
  getter: ElMultiSelectItemGetter<TResult> | undefined,
  fallback?: TResult,
): TResult | undefined {
  if (typeof getter === 'function') {
    return getter(item, index)
  }

  if (
    typeof getter === 'string' &&
    item &&
    typeof item === 'object'
  ) {
    return item[getter] as TResult
  }

  return fallback
}

function isPrimitiveItem(item: ElMultiSelectRawItem) {
  return (
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean'
  )
}

function normalizeItem(
  item: ElMultiSelectRawItem,
  index: number,
): ElDropdownItem {
  const labelFromGetter = readItemValue<string>(item, index, props.itemLabel)
  const valueFromGetter = readItemValue<ElDropdownValue>(item, index, props.itemValue)

  if (isPrimitiveItem(item)) {
    return {
      type: 'item',
      label: labelFromGetter ?? String(item),
      value: valueFromGetter ?? item,
    }
  }

  const record = item as Record<string, any>

  if (record.type === 'divider' || record.divider === true) {
    return { type: 'divider' }
  }

  if (record.type === 'header') {
    return {
      type: 'header',
      label: labelFromGetter ?? record.label ?? '',
      icon: readItemValue<string>(item, index, props.itemIcon) ?? record.icon,
    }
  }

  const value = valueFromGetter ?? record.value
  const label = labelFromGetter ?? record.label ?? String(value ?? '')

  return {
    type: 'item',
    label,
    value,
    description:
      readItemValue<string>(item, index, props.itemDescription) ??
      record.description,
    disabled:
      readItemValue<boolean | (() => boolean)>(
        item,
        index,
        props.itemDisabled,
      ) ?? record.disabled,
    icon:
      readItemValue<string>(item, index, props.itemIcon) ?? record.icon,
    color:
      readItemValue<string>(item, index, props.itemColor) ?? record.color,
    group:
      readItemValue<string>(item, index, props.itemGroup) ?? record.group,
    groupLabel:
      readItemValue<string>(item, index, props.itemGroupLabel) ??
      record.groupLabel,
  }
}

const normalizedItems = computed<ElDropdownItem[]>(() => {
  return props.items.map((item, index) => normalizeItem(item, index))
})

function isDivider(item: ElDropdownItem) {
  return item.type === 'divider'
}

function isHeader(item: ElDropdownItem) {
  return item.type === 'header'
}

function isSelectable(item: ElDropdownItem) {
  return !isDivider(item) && !isHeader(item) && item.value !== undefined
}

function isItemDisabled(item: ElDropdownItem) {
  if (!isSelectable(item)) return true

  if (typeof item.disabled === 'function') {
    try {
      return item.disabled()
    } catch (error) {
      console.error('[el-multi-select] failed to resolve disabled state:', error)
      return true
    }
  }

  return !!item.disabled
}

function isSameValue(first?: ElDropdownValue, second?: ElDropdownValue) {
  return first === second
}

function uniqueValues(values: ElDropdownValue[]) {
  return values.filter((value, index) => {
    return values.findIndex((item) => isSameValue(item, value)) === index
  })
}

watch(
  () => props.modelValue,
  (value) => {
    localValues.value = uniqueValues(Array.isArray(value) ? value : [])
  },
  { immediate: true, deep: true },
)

const selectedValues = computed(() => localValues.value)

const selectedItems = computed(() => {
  return normalizedItems.value.filter((item) => {
    return (
      isSelectable(item) &&
      selectedValues.value.some((value) => isSameValue(value, item.value))
    )
  })
})

const hasValue = computed(() => selectedValues.value.length > 0)

const selectedLabel = computed(() => {
  if (!selectedValues.value.length) return props.placeholder
  if (selectedValues.value.length === 1) {
    return selectedItems.value[0]?.label || String(selectedValues.value[0])
  }

  return `${selectedValues.value.length} selected`
})

const selectedDescription = computed(() => {
  if (!selectedValues.value.length) return ''
  if (selectedValues.value.length === 1) {
    return selectedItems.value[0]?.description || ''
  }

  const labels = selectedItems.value
    .map((item) => item.label || '')
    .filter(Boolean)

  const visible = labels.slice(0, Math.max(1, props.maxSummaryItems))
  const hiddenCount = Math.max(0, labels.length - visible.length)

  return [visible.join(' · '), hiddenCount ? `+${hiddenCount}` : '']
    .filter(Boolean)
    .join(' ')
})

const selectedIcon = computed(() => {
  if (selectedValues.value.length === 1) {
    return selectedItems.value[0]?.icon || props.icon
  }

  return props.icon
})

const selectionRenderKey = computed(() => {
  return [
    selectedValues.value.map((value) => String(value)).join('|'),
    selectedLabel.value,
    selectedDescription.value,
    selectedIcon.value || '',
  ].join('::')
})

function isExclusiveValue(value: ElDropdownValue) {
  return props.exclusiveValues.some((item) => isSameValue(item, value))
}

function toggleSelection(
  current: ElDropdownValue[],
  value: ElDropdownValue,
) {
  const exists = current.some((item) => isSameValue(item, value))

  if (exists) {
    return current.filter((item) => !isSameValue(item, value))
  }

  if (isExclusiveValue(value)) {
    return [value]
  }

  return [
    ...current.filter((item) => !isExclusiveValue(item)),
    value,
  ]
}

function emitValues(values: ElDropdownValue[]) {
  const normalized = uniqueValues(values)
  localValues.value = normalized
  emit('update:modelValue', normalized)
  emit('change', normalized)
}

function ownsOpenMenu() {
  return Boolean(
    menuApi.state.isOpen &&
      triggerRef.value &&
      menuApi.state.menu?.anchor === triggerRef.value,
  )
}

async function refreshOpenMenu() {
  await nextTick()
  if (!ownsOpenMenu()) return
  menuApi.update({ items: buildMenuItems(localValues.value) })
}

function createHeaderItem(label?: string, icon?: string): GlobalMenuItem {
  return {
    type: 'header',
    label,
    icon,
  }
}

function createDividerItem(): GlobalMenuItem {
  return { type: 'divider' }
}

function createSelectableItem(
  item: ElDropdownItem,
  selection: ElDropdownValue[],
): GlobalMenuItem {
  const value = item.value as ElDropdownValue
  const active = selection.some((selected) => isSameValue(selected, value))

  return {
    type: 'item',
    label: item.label,
    description: item.description,
    color: item.color,
    value,
    active,
    icon: active ? 'check' : item.icon,
    disabled: item.disabled,
    close: false,
    handler: async () => {
      if (isItemDisabled(item)) return false

      const nextSelection = toggleSelection(localValues.value, value)
      emitValues(nextSelection)
      await refreshOpenMenu()
      return false
    },
  }
}

function buildGroupedItems(
  items: ElDropdownItem[],
  selection: ElDropdownValue[],
) {
  const hasGroups = items.some((item) => isSelectable(item) && !!item.group)

  if (!hasGroups) {
    return items.map((item) => {
      if (isDivider(item)) return createDividerItem()
      if (isHeader(item)) return createHeaderItem(item.label, item.icon)
      return createSelectableItem(item, selection)
    })
  }

  const result: GlobalMenuItem[] = []
  let activeGroup = ''

  items.forEach((item) => {
    if (isDivider(item)) {
      result.push(createDividerItem())
      activeGroup = ''
      return
    }

    if (isHeader(item)) {
      result.push(createHeaderItem(item.label, item.icon))
      activeGroup = ''
      return
    }

    const group = item.group || ''

    if (!group) {
      result.push(createSelectableItem(item, selection))
      activeGroup = ''
      return
    }

    if (group !== activeGroup) {
      result.push(createHeaderItem(item.groupLabel || group))
      activeGroup = group
    }

    result.push(createSelectableItem(item, selection))
  })

  return result
}

function createClearItem(selection: ElDropdownValue[]): GlobalMenuItem {
  return {
    type: 'item',
    label: props.clearLabel,
    icon: 'cancel',
    active: selection.length === 0,
    disabled: selection.length === 0,
    close: false,
    handler: async () => {
      emitValues([])
      await refreshOpenMenu()
      return false
    },
  }
}

function buildMenuItems(selection: ElDropdownValue[]) {
  const items = buildGroupedItems(normalizedItems.value, selection)

  if (!props.clearable) return items
  if (!items.length) return [createClearItem(selection)]

  return [
    createClearItem(selection),
    createDividerItem(),
    ...items,
  ]
}

function openMultiSelect() {
  if (props.disabled) return

  const anchor = triggerRef.value
  if (!anchor) return

  menuApi.open({
    mode: 'dropdown',
    anchor,
    placement: props.placement,
    items: buildMenuItems(selectedValues.value),
    options: {
      matchAnchorWidth: true,
      minWidth: 180,
      maxHeight: 'min(420px, calc(100vh - 24px))',
      closeOnSelect: false,
      closeOnScroll: false,
      zIndex: 30000,
      ...props.menuOptions,
    },
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  if (
    event.key === 'Enter' ||
    event.key === ' ' ||
    event.key === 'ArrowDown'
  ) {
    event.preventDefault()
    openMultiSelect()
  }
}
</script>

<template>
  <div
    ref="triggerRef"
    class="elMultiSelect w100"
    :class="{
      'elMultiSelect--disabled': disabled,
      'elMultiSelect--filled': hasValue,
    }"
    @keydown="handleKeydown"
  >
    <el-button
      :key="selectionRenderKey"
      v-bind="$attrs"
      class="w100"
      rules="rbc"
      :label="selectedLabel"
      :sublabel="selectedDescription"
      :icon="selectedIcon"
      :br="2"
      bc="blue"
      :size="12"
      mode="normal"
      text-color="normal"
      :color="hasValue ? 'blue25' : 'normal15'"
      :effect="{ color: hasValue ? 'normal25' : 'blue50' }"
      :disable="disabled"
      :radius="10"
      :p="[12, 10]"
      @click="openMultiSelect"
    >
      <template #iconafter>
        <el-icon icon="arrow_downward" :size="12" color="normal" />
      </template>
    </el-button>
  </div>
</template>

<style scoped>
.elMultiSelect {
  min-width: 0;
}

.elMultiSelect--disabled {
  cursor: not-allowed;
}
</style>
