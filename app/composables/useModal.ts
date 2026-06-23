import { markRaw, reactive, shallowRef } from 'vue'
import type { Component } from 'vue'

export type GlobalModalMessageType = 'success' | 'warning' | 'error' | 'info'

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
  modal: GlobalModalConfig | null
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
  version: 0,
})

const activeComponent = shallowRef<Component | null>(null)

const messageTypes: Record<GlobalModalMessageType, {
  icon: string
  title: string
  color: string
}> = {
  success: {
    icon: 'tick-circle',
    title: 'modal.titles.success',
    color: 'green',
  },
  warning: {
    icon: 'warning-2',
    title: 'modal.titles.warning',
    color: 'orange',
  },
  error: {
    icon: 'close-circle',
    title: 'modal.titles.error',
    color: 'red',
  },
  info: {
    icon: 'info-circle',
    title: 'modal.titles.info',
    color: 'blue',
  },
}

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key)
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

function normalizeModal(config: GlobalModalConfig = {}): GlobalModalConfig {
  return {
    ...defaultModal,
    ...config,

    component: null,

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

function getMessageType(type?: string): GlobalModalMessageType {
  if (type && type in messageTypes) {
    return type as GlobalModalMessageType
  }

  return 'info'
}

function open(config: GlobalModalConfig = {}) {
  activeComponent.value = config.component
    ? markRaw(config.component)
    : null

  state.modal = normalizeModal(config)
  state.isOpen = true
  state.version += 1
}

function close() {
  state.isOpen = false
  state.version += 1
}

function clearAfterClose() {
  if (state.isOpen) return

  state.modal = null
  activeComponent.value = null
  state.version += 1
}

function update(config: Partial<GlobalModalConfig> = {}) {
  if (!state.modal) return

  if (hasOwn(config, 'component')) {
    activeComponent.value = config.component
      ? markRaw(config.component)
      : null
  }

  state.modal = normalizeModal({
    ...state.modal,
    ...config,

    header: hasOwn(config, 'header')
      ? {
          ...(state.modal.header || {}),
          ...(config.header || {}),
        }
      : state.modal.header,

    props: {
      ...(state.modal.props || {}),
      ...(config.props || {}),
    },

    options: {
      ...(state.modal.options || {}),
      ...(config.options || {}),
    },

    actions: hasOwn(config, 'actions')
      ? config.actions
      : state.modal.actions,

    descriptions: hasOwn(config, 'descriptions')
      ? config.descriptions
      : state.modal.descriptions,

    description: hasOwn(config, 'description')
      ? config.description
      : state.modal.description,
  })

  state.version += 1
}

function getComponent() {
  return activeComponent.value
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
        icon: finalOptions.actionIcon || 'tick-circle',
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
  update,
  clearAfterClose,
  getComponent,
  message,
}

export function useModal() {
  return modalApi
}