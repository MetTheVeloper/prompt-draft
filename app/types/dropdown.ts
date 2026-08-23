export type ElDropdownValue = string | number | boolean

export type ElDropdownItemType = 'item' | 'divider' | 'header'

export type ElDropdownItem = {
  type?: ElDropdownItemType

  label?: string
  icon?: string
  color?: string
  description?: string

  value?: ElDropdownValue

  disabled?: boolean | (() => boolean)

  /**
   * Marks this item as an opt-in freeform entry point. Selecting it opens an
   * inline text input; the authored text itself becomes the model value rather
   * than the item's sentinel value.
   */
  freeform?: boolean
  freeformPlaceholder?: string

  /**
   * Optional lightweight grouping.
   * el-dropdown converts group changes to menu header items.
   */
  group?: string
  groupLabel?: string
}
