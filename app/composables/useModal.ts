import { markRaw, reactive } from 'vue'
import type { Component } from 'vue'

export type GlobalModalMessageType = 'success' | 'warning' | 'error' | 'info'
export type GlobalModalId = string

export type GlobalModalActionHelpers = {
  close: () => void
  update: (config: Partial<GlobalModalConfig>) => void
  modal: GlobalModalConfig | null
}

export type GlobalModalAction = {
  label: string
  icon?: string
  color?: string
  size?: number
  type?: string
  mode?: string
  center?: boolean
  close?: boolean
  disable?: boolean | (() => boolean)
  handler?: (helpers: GlobalModalActionHelpers) => void | boolean | Promise<void | boolean>
}

export type GlobalModalHeader = {
  icon?: string
  title?: string
  subtitle?: string
  desc?: string
  closeButton?: boolean
  color?: string
}

export type GlobalModalOptions = {
  width?: number | string
  maxHeight?: number | string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  blur?: boolean
  loading?: boolean | (() => boolean)
}

export type GlobalModalConfig = {
  header?: GlobalModalHeader | null
  title?: string
  description?: string
  descriptions?: string | string[]
  component?: Component | null
  props?: Record<string, any>
  actions?: GlobalModalAction[]
  options?: GlobalModalOptions
}

export type GlobalModalStackItem = Omit<GlobalModalConfig, 'component'> & {
  id: GlobalModalId
  component: Component | null
  isOpen: boolean
}

export type GlobalMessageOptions = {
  type?: GlobalModalMessageType
  title?: string
  subtitle?: string
  message: string
  icon?: string
  actionLabel?: string
  actionColor?: string
  actionIcon?: string
  actionSize?: number
  width?: number | string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  blur?: boolean
}

type GlobalModalState = {
  isOpen: boolean
  modal: GlobalModalStackItem | null
  modals: GlobalModalStackItem[]
  version: number
}

const defaultModal: Required<Omit<GlobalModalConfig, 'component'>> & {
  component: null
} = {
  header: null,
  title: '',
  description: '',
  descriptions: [],
  component: null,
  props: {},
  actions: [],
  options: {
    width: 594,
    maxHeight: '80vh',
    closeOnBackdrop: true,
    closeOnEsc: true,
    persistent: false,
    blur: true,
    loading: false,
  },
}

const state = reactive<GlobalModalState>({
  isOpen: false,
  modal: null,
  modals: [],
  version: 0,
})

let modalIdCounter = 0

const messageTypes: Record<GlobalModalMessageType, {
  icon: string
  title: string
  color: string
}> = {
  success: {
    icon: 'check_circle',
    title: 'modal.titles.success',
    color: 'green',
  },
  warning: {
    icon: 'warning',
    title: 'modal.titles.warning',
    color: 'orange',
  },
  error: {
    icon: 'cancel',
    title: 'modal.titles.error',
    color: 'red',
  },
  info: {
    icon: 'info',
    title: 'modal.titles.info',
    color: 'blue',
  },
}

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function createModalId() {
  modalIdCounter += 1
  return `global-modal-${Date.now()}-${modalIdCounter}`
}

function normalizeDescriptions(config: Partial<GlobalModalConfig>) {
  if (Array.isArray(config.descriptions)) {
    return config.descriptions.filter(Boolean)
  }

  if (typeof config.descriptions === 'string' && config.descriptions.trim()) {
    return [config.descriptions]
  }

  if (typeof config.description === 'string' && config.description.trim()) {
    return [config.description]
  }

  return []
}

function normalizeModal(
  config: GlobalModalConfig = {},
  id: GlobalModalId = createModalId(),
  isOpen = true,
): GlobalModalStackItem {
  return {
    ...defaultModal,
    ...config,

    id,
    isOpen,

    component: config.component
      ? markRaw(config.component)
      : null,

    description: config.description || '',

    descriptions: normalizeDescriptions(config),

    props: config.props || {},

    actions: Array.isArray(config.actions) ? config.actions : [],

    options: {
      ...defaultModal.options,
      ...(config.options || {}),
    },
  }
}

function getOpenModals() {
  return state.modals.filter((modal) => modal.isOpen)
}

function getTopModal() {
  const openModals = getOpenModals()

  return openModals[openModals.length - 1] || null
}

function syncState() {
  state.isOpen = state.modals.some((modal) => modal.isOpen)
  state.modal = getTopModal()
  state.version += 1
}

function getMessageType(type?: string): GlobalModalMessageType {
  if (type && type in messageTypes) {
    return type as GlobalModalMessageType
  }

  return 'info'
}

function resolveModalId(id?: GlobalModalId | null) {
  return id || getTopModal()?.id || null
}

function findModalIndex(id?: GlobalModalId | null) {
  const resolvedId = resolveModalId(id)

  if (!resolvedId) return -1

  return state.modals.findIndex((modal) => modal.id === resolvedId)
}

function open(config: GlobalModalConfig = {}) {
  const modal = normalizeModal(config)

  state.modals.push(modal)
  syncState()

  return modal.id
}

function close(id?: GlobalModalId | null) {
  const index = findModalIndex(id)

  if (index < 0) return
  if (!state.modals[index].isOpen) return

  state.modals[index].isOpen = false
  syncState()
}

function closeAll() {
  let changed = false

  state.modals.forEach((modal) => {
    if (!modal.isOpen) return

    modal.isOpen = false
    changed = true
  })

  if (changed) {
    syncState()
  }
}

function clearAfterClose(id?: GlobalModalId | null) {
  const beforeLength = state.modals.length

  if (id) {
    state.modals = state.modals.filter((modal) => {
      return modal.id !== id || modal.isOpen
    })
  } else {
    state.modals = state.modals.filter((modal) => modal.isOpen)
  }

  if (state.modals.length !== beforeLength) {
    syncState()
  }
}

function update(config: Partial<GlobalModalConfig> = {}, id?: GlobalModalId | null) {
  const index = findModalIndex(id)

  if (index < 0) return

  const currentModal = state.modals[index]

  const nextConfig: GlobalModalConfig = {
    ...currentModal,
    ...config,

    component: hasOwn(config, 'component')
      ? config.component
      : currentModal.component,

    header: hasOwn(config, 'header')
      ? config.header === null
        ? null
        : {
            ...(currentModal.header || {}),
            ...(config.header || {}),
          }
      : currentModal.header,

    props: {
      ...(currentModal.props || {}),
      ...(config.props || {}),
    },

    options: {
      ...(currentModal.options || {}),
      ...(config.options || {}),
    },

    actions: hasOwn(config, 'actions')
      ? config.actions
      : currentModal.actions,

    descriptions: hasOwn(config, 'descriptions')
      ? config.descriptions
      : currentModal.descriptions,

    description: hasOwn(config, 'description')
      ? config.description
      : currentModal.description,
  }

  state.modals[index] = normalizeModal(
    nextConfig,
    currentModal.id,
    currentModal.isOpen,
  )

  syncState()
}

function getComponent(id?: GlobalModalId | null) {
  const index = findModalIndex(id)

  if (index >= 0) {
    return state.modals[index].component
  }

  return getTopModal()?.component || null
}

function message(options: GlobalMessageOptions | string) {
  const finalOptions: GlobalMessageOptions = typeof options === 'string'
    ? { message: options }
    : options

  if (!finalOptions || !finalOptions.message || typeof finalOptions.message !== 'string') {
    console.warn('[this.$message] گزینه‌ی message الزامی است.')
    return
  }

  const type = getMessageType(finalOptions.type)
  const typeConfig = messageTypes[type]

  open({
    header: {
      icon: finalOptions.icon || typeConfig.icon,
      title: finalOptions.title || typeConfig.title,
      subtitle: finalOptions.subtitle || '',
      color: typeConfig.color,
    },

    descriptions: finalOptions.message,

    actions: [
      {
        label: finalOptions.actionLabel || 'modal.actions.ok',
        color: finalOptions.actionColor || typeConfig.color,
        icon: finalOptions.actionIcon || 'check_circle',
        size: finalOptions.actionSize || 16,
        close: true,
      },
    ],

    options: {
      width: finalOptions.width || 480,
      closeOnBackdrop: finalOptions.closeOnBackdrop !== false,
      closeOnEsc: finalOptions.closeOnEsc !== false,
      persistent: !!finalOptions.persistent,
      blur: finalOptions.blur !== false,
    },
  })
}

const modalApi = {
  state,
  open,
  close,
  closeAll,
  update,
  clearAfterClose,
  getComponent,
  getTopModal,
  message,
}

export function useModal() {
  return modalApi
}
