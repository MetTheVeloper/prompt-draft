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

const { t } = useI18n()

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
    placeholder: undefined,
    clearable: true,
    clearLabel: undefined,
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
const freeformEditing = ref(false)
const freeformDraft = ref('')
const resolvedPlaceholder = computed(() => props.placeholder || t('components.multiSelect.placeholder'))
const resolvedClearLabel = computed(() => props.clearLabel || t('components.multiSelect.clearSelection'))

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
    freeform: record.freeform === true,
    freeformPlaceholder: record.freeformPlaceholder,
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

const selectableItems = computed(() => normalizedItems.value.filter(isSelectable))
const freeformItem = computed(() => selectableItems.value.find((item) => item.freeform))
const knownSelectableItems = computed(() => selectableItems.value.filter((item) => !item.freeform))

function isKnownValue(value: ElDropdownValue) {
  return knownSelectableItems.value.some((item) => isSameValue(item.value, value))
}

function getCustomSelectedValue(values = localValues.value) {
  if (!freeformItem.value) return ''

  const value = values.find((item) => !isKnownValue(item))
  return typeof value === 'string' ? value : ''
}

watch(
  () => props.modelValue,
  (value) => {
    localValues.value = uniqueValues(Array.isArray(value) ? value : [])

    const customValue = getCustomSelectedValue(localValues.value)
    if (customValue) {
      freeformDraft.value = customValue
    } else if (!freeformEditing.value) {
      freeformDraft.value = ''
    }
  },
  { immediate: true, deep: true },
)

const selectedValues = computed(() => localValues.value)
const customSelectedValue = computed(() => getCustomSelectedValue())
const isFreeformActive = computed(() => {
  return Boolean(
    freeformItem.value &&
      (freeformEditing.value || customSelectedValue.value),
  )
})

const freeformInputValue = computed(() => {
  if (freeformEditing.value) return freeformDraft.value
  return customSelectedValue.value
})

const freeformPlaceholder = computed(() => {
  return (
    freeformItem.value?.freeformPlaceholder ||
    freeformItem.value?.label ||
    'Custom'
  )
})

const selectedItems = computed(() => {
  return knownSelectableItems.value.filter((item) => {
    return selectedValues.value.some((value) => isSameValue(value, item.value))
  })
})

const hasValue = computed(() => selectedValues.value.length > 0)
const hasDisplayValue = computed(() => hasValue.value || isFreeformActive.value)
const displaySelectionCount = computed(() => {
  return selectedValues.value.length +
    (freeformEditing.value && !customSelectedValue.value ? 1 : 0)
})

const selectedLabel = computed(() => {
  if (!hasDisplayValue.value) return resolvedPlaceholder.value

  if (displaySelectionCount.value === 1) {
    if (isFreeformActive.value) {
      return freeformInputValue.value.trim() || freeformItem.value?.label || 'Custom'
    }

    return selectedItems.value[0]?.label || String(selectedValues.value[0])
  }

  return t('components.multiSelect.selectedCount', { count: displaySelectionCount.value })
})

const selectedDescription = computed(() => {
  if (!hasDisplayValue.value) return ''

  if (displaySelectionCount.value === 1) {
    if (isFreeformActive.value) {
      return freeformItem.value?.description || ''
    }

    return selectedItems.value[0]?.description || ''
  }

  const labels = [
    ...selectedItems.value.map((item) => item.label || '').filter(Boolean),
    ...(isFreeformActive.value && freeformInputValue.value.trim()
      ? [freeformInputValue.value.trim()]
      : []),
  ]

  const visible = labels.slice(0, Math.max(1, props.maxSummaryItems))
  const hiddenCount = Math.max(0, displaySelectionCount.value - visible.length)

  return [visible.join(' · '), hiddenCount ? `+${hiddenCount}` : '']
    .filter(Boolean)
    .join(' ')
})

const selectedIcon = computed(() => {
  if (displaySelectionCount.value === 1) {
    if (isFreeformActive.value) return freeformItem.value?.icon || props.icon
    return selectedItems.value[0]?.icon || props.icon
  }

  return props.icon
})

const selectionRenderKey = computed(() => {
  return [
    selectedValues.value.map((value) => String(value)).join('|'),
    isFreeformActive.value ? 'freeform' : 'catalog',
    freeformInputValue.value,
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

function valuesWithoutCustom(values = localValues.value) {
  return values.filter((value) => isKnownValue(value))
}

function deactivateFreeform() {
  freeformEditing.value = false
  freeformDraft.value = ''
  emitValues(valuesWithoutCustom())
}

function activateFreeform() {
  if (!freeformItem.value) return

  freeformEditing.value = true
  freeformDraft.value = customSelectedValue.value

  const knownValues = valuesWithoutCustom().filter((value) => !isExclusiveValue(value))
  emitValues(knownValues)
}

function updateFreeformValue(value: unknown) {
  const nextValue = String(value ?? '')
  freeformEditing.value = true
  freeformDraft.value = nextValue

  const knownValues = valuesWithoutCustom().filter((item) => !isExclusiveValue(item))
  emitValues(nextValue ? [...knownValues, nextValue] : knownValues)
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
  const active = item.freeform
    ? isFreeformActive.value
    : selection.some((selected) => isSameValue(selected, value))

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

      if (item.freeform) {
        if (isFreeformActive.value) {
          deactivateFreeform()
        } else {
          activateFreeform()
        }
        await refreshOpenMenu()
        return false
      }

      const nextSelection = toggleSelection(localValues.value, value)
      if (isExclusiveValue(value) && nextSelection.includes(value)) {
        freeformEditing.value = false
        freeformDraft.value = ''
      }
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
    label: resolvedClearLabel.value,
    icon: 'cancel',
    active: selection.length === 0 && !isFreeformActive.value,
    disabled: selection.length === 0 && !isFreeformActive.value,
    close: false,
    handler: async () => {
      freeformEditing.value = false
      freeformDraft.value = ''
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
      'elMultiSelect--filled': hasDisplayValue,
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
      :color="hasDisplayValue ? 'blue25' : 'normal15'"
      :effect="{ color: hasDisplayValue ? 'normal25' : 'blue50' }"
      :disable="disabled"
      :radius="10"
      :p="[12, 10]"
      @click="openMultiSelect"
    >
      <template #iconafter>
        <el-icon icon="arrow_downward" :size="12" color="normal" />
      </template>
    </el-button>

    <div
      v-if="isFreeformActive"
      class="elMultiSelect__freeform"
      @click.stop
      @keydown.stop
    >
      <el-text-field
        :model-value="freeformInputValue"
        type="text"
        :placeholder="freeformPlaceholder"
        support-variables
        @update:model-value="updateFreeformValue"
      />
    </div>
  </div>
</template>

<style scoped>
.elMultiSelect {
  min-width: 0;
}

.elMultiSelect__freeform {
  margin-top: 6px;
}

.elMultiSelect--disabled {
  cursor: not-allowed;
}
</style>