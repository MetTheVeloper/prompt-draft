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

type ElDropdownRawItem =
  | ElDropdownValue
  | ElDropdownItem
  | Record<string, any>

type ElDropdownItemGetter<TResult> =
  | string
  | ((item: any, index: number) => TResult)

const props = withDefaults(
  defineProps<{
    modelValue?: ElDropdownValue

    items?: ElDropdownRawItem[]

    itemLabel?: ElDropdownItemGetter<string>
    itemValue?: ElDropdownItemGetter<ElDropdownValue>
    itemDescription?: ElDropdownItemGetter<string>
    itemDisabled?: ElDropdownItemGetter<boolean | (() => boolean)>
    itemIcon?: ElDropdownItemGetter<string>
    itemColor?: ElDropdownItemGetter<string>
    itemGroup?: ElDropdownItemGetter<string>
    itemGroupLabel?: ElDropdownItemGetter<string>

    placeholder?: string
    clearable?: boolean
    disabled?: boolean

    emptyValue?: ElDropdownValue

    placement?: GlobalMenuPlacement
    menuOptions?: GlobalMenuOptions

    icon?: string
  }>(),
  {
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
    clearable: false,
    disabled: false,
    emptyValue: '',
    placement: 'bottom-start',
    menuOptions: () => ({}),
    icon: undefined,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: ElDropdownValue): void
  (event: 'change', value: ElDropdownValue): void
}>()

const menuApi = useMenu()
const dropdownRef = ref<HTMLElement | null>(null)
const freeformEditing = ref(false)
const freeformDraft = ref('')
const resolvedPlaceholder = computed(() => props.placeholder || t('components.dropdown.placeholder'))

function isSameValue(first?: ElDropdownValue, second?: ElDropdownValue) {
  return first === second
}

function readItemValue<TResult>(
  item: any,
  index: number,
  getter: ElDropdownItemGetter<TResult> | undefined,
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

function isPrimitiveItem(item: ElDropdownRawItem) {
  return (
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean'
  )
}

function normalizeDropdownItem(
  item: ElDropdownRawItem,
  index: number,
): ElDropdownItem {
  const labelFromGetter = readItemValue<string>(
    item,
    index,
    props.itemLabel,
  )

  const valueFromGetter = readItemValue<ElDropdownValue>(
    item,
    index,
    props.itemValue,
  )

  if (isPrimitiveItem(item)) {
    return {
      type: 'item',
      label: labelFromGetter ?? String(item),
      value: valueFromGetter ?? item,
    }
  }

  const record = item as Record<string, any>

  if (record.type === 'divider' || record.divider === true) {
    return {
      type: 'divider',
    }
  }

  if (record.type === 'header') {
    return {
      type: 'header',
      label:
        labelFromGetter ??
        record.label ??
        '',
      icon:
        readItemValue<string>(item, index, props.itemIcon) ??
        record.icon,
    }
  }

  const value =
    valueFromGetter ??
    record.value

  const label =
    labelFromGetter ??
    record.label ??
    String(value ?? '')

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
      ) ??
      record.disabled,

    icon:
      readItemValue<string>(item, index, props.itemIcon) ??
      record.icon,

    color:
      readItemValue<string>(item, index, props.itemColor) ??
      record.color,

    group:
      readItemValue<string>(item, index, props.itemGroup) ??
      record.group,

    groupLabel:
      readItemValue<string>(item, index, props.itemGroupLabel) ??
      record.groupLabel,

    freeform: record.freeform === true,
    freeformPlaceholder: record.freeformPlaceholder,
  }
}

const normalizedItems = computed<ElDropdownItem[]>(() => {
  return props.items.map((item, index) => {
    return normalizeDropdownItem(item, index)
  })
})

function isDividerItem(item: ElDropdownItem) {
  return item.type === 'divider'
}

function isHeaderItem(item: ElDropdownItem) {
  return item.type === 'header'
}

function isSelectableItem(item: ElDropdownItem) {
  return !isDividerItem(item) && !isHeaderItem(item)
}

function isItemDisabled(item: ElDropdownItem) {
  if (!isSelectableItem(item)) return true

  if (typeof item.disabled === 'function') {
    try {
      return item.disabled()
    } catch (error) {
      console.error('[el-dropdown] خطا در بررسی disabled آیتم:', error)
      return true
    }
  }

  return !!item.disabled
}

const selectableItems = computed(() => {
  return normalizedItems.value.filter(isSelectableItem)
})

const freeformItem = computed(() => {
  return selectableItems.value.find((item) => item.freeform)
})

const knownSelectableItems = computed(() => {
  return selectableItems.value.filter((item) => !item.freeform)
})

function findKnownItem(value?: ElDropdownValue) {
  return knownSelectableItems.value.find((item) => {
    return isSameValue(item.value, value)
  })
}

function isEmptyValue(value?: ElDropdownValue) {
  return value === undefined || value === null || isSameValue(value, props.emptyValue)
}

const externalFreeformValue = computed(() => {
  if (!freeformItem.value || isEmptyValue(props.modelValue)) return false
  if (findKnownItem(props.modelValue)) return false

  return typeof props.modelValue === 'string'
})

watch(
  () => props.modelValue,
  (value) => {
    if (freeformEditing.value) {
      if (findKnownItem(value)) {
        freeformEditing.value = false
        freeformDraft.value = ''
      }
      return
    }

    if (externalFreeformValue.value) {
      freeformDraft.value = String(value ?? '')
      return
    }

    if (isEmptyValue(value) || findKnownItem(value)) {
      freeformDraft.value = ''
    }
  },
  { immediate: true },
)

const isFreeformActive = computed(() => {
  return Boolean(
    freeformItem.value &&
      (freeformEditing.value || externalFreeformValue.value),
  )
})

const freeformInputValue = computed(() => {
  if (freeformEditing.value) return freeformDraft.value
  if (externalFreeformValue.value) return String(props.modelValue ?? '')
  return ''
})

const hasValue = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) {
    return false
  }

  return !isSameValue(props.modelValue, props.emptyValue)
})

const hasDisplayValue = computed(() => hasValue.value || isFreeformActive.value)

const selectedItem = computed(() => {
  if (isFreeformActive.value) return freeformItem.value

  return selectableItems.value.find((item) => {
    return isSameValue(item.value, props.modelValue)
  })
})

const selectedLabel = computed(() => {
  if (isFreeformActive.value) {
    return freeformInputValue.value.trim() || freeformItem.value?.label || 'Custom'
  }

  if (!hasValue.value) return resolvedPlaceholder.value

  return selectedItem.value?.label || String(props.modelValue ?? '')
})

const selectedIcon = computed(() => {
  return selectedItem.value?.icon || props.icon
})

const selectedDescription = computed(() => {
  return selectedItem.value?.description || ''
})

const freeformPlaceholder = computed(() => {
  return (
    freeformItem.value?.freeformPlaceholder ||
    freeformItem.value?.label ||
    'Custom'
  )
})

const triggerMode = computed(() => {
  return hasDisplayValue.value ? 'normal' : 'normal'
})

const triggerColor = computed(() => {
  return hasDisplayValue.value ? 'blue25' : 'normal15'
})

function emitValue(value: ElDropdownValue) {
  emit('update:modelValue', value)
  emit('change', value)
}

function resetFreeformState() {
  freeformEditing.value = false
  freeformDraft.value = ''
}

function activateFreeform() {
  if (!freeformItem.value) return

  const currentCustomValue = externalFreeformValue.value
    ? String(props.modelValue ?? '')
    : ''

  freeformEditing.value = true
  freeformDraft.value = currentCustomValue

  if (!externalFreeformValue.value) {
    emitValue(props.emptyValue)
  }
}

function updateFreeformValue(value: unknown) {
  const nextValue = String(value ?? '')
  freeformEditing.value = true
  freeformDraft.value = nextValue
  emitValue(nextValue || props.emptyValue)
}

function createHeaderItem(label?: string, icon?: string): GlobalMenuItem {
  return {
    type: 'header',
    label,
    icon,
  }
}

function createDividerItem(): GlobalMenuItem {
  return {
    type: 'divider',
  }
}

function createSelectableMenuItem(item: ElDropdownItem): GlobalMenuItem {
  return {
    type: 'item',
    label: item.label,
    icon: item.icon,
    color: item.color,
    description: item.description,
    value: item.value,
    active: item.freeform
      ? isFreeformActive.value
      : isSameValue(item.value, props.modelValue),
    disabled: item.disabled,
    handler: () => {
      if (item.value === undefined) return false

      if (item.freeform) {
        activateFreeform()
        return true
      }

      resetFreeformState()
      emitValue(item.value)

      return true
    },
  }
}

function createClearItem(): GlobalMenuItem {
  return {
    type: 'item',
    label: resolvedPlaceholder.value,
    icon: 'cancel',
    value: props.emptyValue,
    active: !hasDisplayValue.value,
    handler: () => {
      resetFreeformState()
      emitValue(props.emptyValue)

      return true
    },
  }
}

function buildGroupedMenuItems(items: ElDropdownItem[]) {
  const hasGroups = items.some((item) => {
    return isSelectableItem(item) && !!item.group
  })

  if (!hasGroups) {
    return items.map((item) => {
      if (isDividerItem(item)) return createDividerItem()
      if (isHeaderItem(item)) return createHeaderItem(item.label, item.icon)

      return createSelectableMenuItem(item)
    })
  }

  const menuItems: GlobalMenuItem[] = []
  let activeGroup = ''

  items.forEach((item) => {
    if (isDividerItem(item)) {
      menuItems.push(createDividerItem())
      activeGroup = ''
      return
    }

    if (isHeaderItem(item)) {
      menuItems.push(createHeaderItem(item.label, item.icon))
      activeGroup = ''
      return
    }

    const group = item.group || ''

    if (!group) {
      menuItems.push(createSelectableMenuItem(item))
      activeGroup = ''
      return
    }

    if (group !== activeGroup) {
      menuItems.push(
        createHeaderItem(item.groupLabel || group),
      )

      activeGroup = group
    }

    menuItems.push(createSelectableMenuItem(item))
  })

  return menuItems
}

const menuItems = computed<GlobalMenuItem[]>(() => {
  const items = buildGroupedMenuItems(normalizedItems.value)

  if (!props.clearable) return items

  if (items.length === 0) {
    return [createClearItem()]
  }

  return [
    createClearItem(),
    createDividerItem(),
    ...items,
  ]
})

function openDropdown() {
  if (props.disabled) return

  const anchor = dropdownRef.value

  if (!anchor) return

  menuApi.open({
    mode: 'dropdown',
    anchor,
    placement: props.placement,
    items: menuItems.value,
    options: {
      matchAnchorWidth: true,
      minWidth: 180,
      maxHeight: 'min(360px, calc(100vh - 24px))',
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
    openDropdown()
  }
}
</script>

<template>
  <div ref="dropdownRef" class="elDropdown w100" :class="{
    'elDropdown--disabled': disabled,
    'elDropdown--filled': hasDisplayValue,
  }" @keydown="handleKeydown">
    <el-button v-bind="$attrs"
      class="w100"
      rules="rbc"
      :label="selectedLabel"
      :icon="selectedIcon"
      :sublabel="selectedDescription"
      :br="2"
      bc="blue"
      :size="12"
      :mode="triggerMode"
      text-color="normal"
      :color="triggerColor"
      :effect="{ color: hasDisplayValue ? 'normal25' : 'blue50' }" :disable="disabled" :radius="10" :p="[12, 10]"
      @click="openDropdown">
      <template #iconafter>
        <el-icon icon="arrow_downward" :size="12" color="normal" />
      </template>
    </el-button>

    <div
      v-if="isFreeformActive"
      class="elDropdown__freeform"
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
.elDropdown {
  min-width: 0;
}

.elDropdown__freeform {
  margin-top: 6px;
}

.elDropdown--disabled {
  cursor: not-allowed;
}
</style>