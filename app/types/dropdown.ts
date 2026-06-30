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
   * Optional lightweight grouping.
   * el-dropdown converts group changes to menu header items.
   */
  group?: string
  groupLabel?: string
}