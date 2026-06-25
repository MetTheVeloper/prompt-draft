<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="globalModalTransition" appear @after-leave="afterLeave">
        <el-flex v-if="isOpen" rules="ccc" class="globalModal" :class="{ hasBlur: modalOptions.blur }">
          <el-flex bg="surface25" class="globalModalBackdrop" @click="handleBackdropClick" />

          <el-flex rules="csc" bg="surface" class="globalModalBox bsh16" :br="2" :effect="{ color: 'normal5' }"
            bc="normal15" :p="24" :radius="24" :style="boxStyle">
            <!-- header -->
            <el-flex v-if="modal.header" rules="rbs" class="w100 globalModalHeader" :gap="16">
              <el-flex rules="rsc" class="globalModalHeaderContent" :gap="12">
                <el-icon v-if="headerIcon" :icon="headerIcon" :size="32" :color="headerColor" />

                <el-flex rules="css" :gap="2">
                  <el-text :size="16" :weight="700" v-if="modal.header.title">
                    {{ modal.header.title }}
                  </el-text>

                  <el-text :size="12" :weight="400" v-if="headerSubtitle">
                    {{ headerSubtitle }}
                  </el-text>
                </el-flex>
              </el-flex>

              <el-button v-if="showCloseButton" :label="t('components.modal.actions.close')"
                icon="close-circle" :size="12" color="red" mode="flat" type="fab"
                :disable="globalLoading" @click="handleCloseButton" />
            </el-flex>

            <el-divider v-if="modal.header" class="mt8 mb8" />

            <!-- custom component -->
            <component v-if="activeComponent" :is="activeComponent" v-bind="modal.props" @close="modalApi.close" />

            <!-- default content -->
            <el-flex v-else rules="ccs" class="w100" :gap="8">
              <el-text :size="16" :weight="600" v-if="modal.title" class="title w100">
                {{ modal.title }}
              </el-text>

              <el-flex v-if="modalDescriptions.length" rules="ccs" class="w100" :gap="0">
                <el-text :size="14" :weight="400" color="normal75" v-for="(desc, index) in modalDescriptions"
                  :key="index" class="desc w100">
                  {{ desc }}
                </el-text>
              </el-flex>
            </el-flex>

            <!-- actions -->
            <el-flex v-if="modal.actions && modal.actions.length" rules="rsc" :gap="8"
              class="w100 fw globalModalActions">
              <el-button v-for="(action, index) in modal.actions" :key="index" :label="action.label"
                :icon="action.icon" :color="action.color || 'prim'" :size="action.size || 14"
                :type="action.type" :mode="action.mode" :disable="isActionDisabled(action)" :p="[8, 12]" :radius="8"
                @click="runAction(action)" />
            </el-flex>
          </el-flex>
        </el-flex>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { GlobalModalAction } from '~/composables/useModal'

const modalApi = useModal()
const modalState = modalApi.state

const { t } = useI18n()

const isOpen = computed(() => modalState.isOpen)

const modal = computed(() => {
  return modalState.modal || {
    header: null,
    title: '',
    description: '',
    descriptions: [],
    props: {},
    actions: [],
    options: {},
  }
})

const modalOptions = computed(() => {
  return {
    width: 594,
    closeOnBackdrop: true,
    closeOnEsc: true,
    persistent: false,
    blur: true,
    loading: false,
    ...(modal.value.options || {}),
  }
})

const modalDescriptions = computed(() => {
  const descriptions = modal.value.descriptions

  if (Array.isArray(descriptions)) {
    return descriptions.filter(Boolean)
  }

  if (typeof descriptions === 'string' && descriptions.trim()) {
    return [descriptions]
  }

  if (typeof modal.value.description === 'string' && modal.value.description.trim()) {
    return [modal.value.description]
  }

  return []
})

const activeComponent = computed(() => {
  modalState.version
  return modalApi.getComponent()
})

const boxStyle = computed(() => {
  const width = modalOptions.value.width || 594

  return {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
  }
})

const showCloseButton = computed(() => {
  if (!modal.value.header) return false
  return modal.value.header.closeButton !== false
})

const headerIcon = computed(() => {
  return modal.value.header?.icon || ''
})

const headerSubtitle = computed(() => {
  return modal.value.header?.subtitle || modal.value.header?.desc || ''
})

const headerColor = computed(() => {
  return modal.value.header?.color || 'normal'
})

const globalLoading = computed(() => {
  const loading = modalOptions.value.loading

  if (typeof loading === 'function') {
    return loading()
  }

  return !!loading
})

watch(isOpen, (value) => {
  if (typeof document === 'undefined') return

  if (value) {
    document.body.classList.add('global-modal-open')
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)

  if (typeof document !== 'undefined') {
    document.body.classList.remove('global-modal-open')
  }
})

function isActionDisabled(action: GlobalModalAction) {
  if (globalLoading.value) return true

  if (typeof action.disable === 'function') {
    return action.disable()
  }

  return !!action.disable
}

async function runAction(action: GlobalModalAction) {
  if (isActionDisabled(action)) return

  const helpers = {
    close: modalApi.close,
    update: modalApi.update,
    modal: modalState.modal,
  }

  try {
    if (typeof action.handler === 'function') {
      const result = await action.handler(helpers)

      if (result === false) return
    }

    if (action.close) {
      modalApi.close()
    }
  } catch (error) {
    console.error('[GlobalModal action error]', error)
  }
}

function handleCloseButton() {
  if (globalLoading.value) return
  modalApi.close()
}

function handleBackdropClick() {
  if (globalLoading.value) return
  if (modalOptions.value.persistent) return
  if (!modalOptions.value.closeOnBackdrop) return

  modalApi.close()
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return
  if (event.key !== 'Escape') return
  if (globalLoading.value) return
  if (modalOptions.value.persistent) return
  if (!modalOptions.value.closeOnEsc) return

  modalApi.close()
}

function afterLeave() {
  modalApi.clearAfterClose()

  if (typeof document !== 'undefined') {
    document.body.classList.remove('global-modal-open')
  }
}
</script>

<style scoped>
.globalModal {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.globalModalBackdrop {
  position: absolute;
  inset: 0;
}

.globalModal.hasBlur .globalModalBackdrop {
  backdrop-filter: blur(8px);
}

.globalModalBox {
  position: relative;
  width: calc(100% - 64px);
  z-index: 2;
}

.globalModalHeader {
  min-width: 0;
}

/* Vue 3 transition classes */
.globalModalTransition-enter-active,
.globalModalTransition-leave-active {
  transition: opacity 220ms ease;
}

.globalModalTransition-enter-from,
.globalModalTransition-leave-to {
  opacity: 0;
}

.globalModalTransition-enter-active .globalModalBox,
.globalModalTransition-leave-active .globalModalBox {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.globalModalTransition-enter-from .globalModalBox,
.globalModalTransition-leave-to .globalModalBox {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.globalModalTransition-enter-to .globalModalBox,
.globalModalTransition-leave-from .globalModalBox {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>

<style>
body.global-modal-open {
  overflow: hidden;
}
</style>