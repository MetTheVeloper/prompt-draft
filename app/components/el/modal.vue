<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        v-for="(stackModal, index) in modalStack"
        :key="stackModal.id"
        name="globalModalTransition"
        appear
        @after-leave="afterLeave(stackModal.id)">
        <el-flex
          v-if="stackModal.isOpen"
          rules="ccc"
          class="globalModal"
          :class="{
            hasBlur: getModalOptions(stackModal).blur,
            isTop: isTopModal(stackModal),
          }"
          :style="getModalLayerStyle(index)">
          <el-flex bg="surface25" class="globalModalBackdrop" @click="handleBackdropClick(stackModal)" />

          <el-flex rules="csc" bg="surface" class="globalModalBox bsh16" :br="2" :effect="{ color: 'normal5' }"
            bc="normal15" :p="24" :radius="24" :style="getBoxStyle(stackModal)">
            <!-- header -->
            <el-flex v-if="stackModal.header" rules="rbs" class="w100 globalModalHeader" :gap="16">
              <el-flex rules="rsc" class="globalModalHeaderContent" :gap="12">
                <el-icon v-if="getHeaderIcon(stackModal)" :icon="getHeaderIcon(stackModal)" :size="32" :color="getHeaderColor(stackModal)" />

                <el-flex rules="css" :gap="2">
                  <el-text :size="16" :weight="700" v-if="stackModal.header.title">
                    {{ stackModal.header.title }}
                  </el-text>

                  <el-text :size="12" :weight="400" v-if="getHeaderSubtitle(stackModal)">
                    {{ getHeaderSubtitle(stackModal) }}
                  </el-text>
                </el-flex>
              </el-flex>

              <el-button v-if="showCloseButton(stackModal)" :label="t('components.modal.actions.close')"
                icon="close-circle" :size="12" color="red" mode="flat" type="fab"
                :disable="isModalLoading(stackModal)" @click="handleCloseButton(stackModal)" />
            </el-flex>

            <el-divider v-if="stackModal.header" class="mt8 mb8" />

            <el-flex rules="csc" class="w100 globalModalBody" :gap="8">
              <!-- custom component -->
              <component
                v-if="getActiveComponent(stackModal)"
                :is="getActiveComponent(stackModal)"
                v-bind="stackModal.props"
                @close="modalApi.close(stackModal.id)" />

              <!-- default content -->
              <el-flex v-else rules="ccs" class="w100" :gap="8">
                <el-text :size="16" :weight="600" v-if="stackModal.title" class="title w100">
                  {{ stackModal.title }}
                </el-text>

                <el-flex v-if="getModalDescriptions(stackModal).length" rules="ccs" class="w100" :gap="0">
                  <el-text :size="14" :weight="400" color="normal75" v-for="(desc, descIndex) in getModalDescriptions(stackModal)"
                    :key="descIndex" class="desc w100">
                    {{ desc }}
                  </el-text>
                </el-flex>
              </el-flex>
            </el-flex>

            <!-- actions -->
            <el-flex v-if="stackModal.actions && stackModal.actions.length" rules="rsc" :gap="8"
              class="w100 fw globalModalActions">
              <el-button v-for="(action, actionIndex) in stackModal.actions" :key="actionIndex" :label="action.label"
                :icon="action.icon" :color="action.color || 'prim'" :size="action.size || 14"
                :type="action.type" :mode="action.mode" :disable="isActionDisabled(action, stackModal)" :p="[8, 12]" :radius="8"
                @click="runAction(action, stackModal)" />
            </el-flex>
          </el-flex>
        </el-flex>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { GlobalModalAction, GlobalModalConfig, GlobalModalStackItem } from '~/composables/useModal'

const modalApi = useModal()
const modalState = modalApi.state

const { t } = useI18n()

const isOpen = computed(() => modalState.isOpen)

const modalStack = computed(() => {
  modalState.version
  return modalState.modals
})

const topModal = computed(() => {
  modalState.version
  return modalApi.getTopModal()
})

function getModalOptions(modal: GlobalModalStackItem) {
  return {
    width: 594,
    maxHeight: '80vh',
    closeOnBackdrop: true,
    closeOnEsc: true,
    persistent: false,
    blur: true,
    loading: false,
    ...(modal.options || {}),
  }
}

function getModalDescriptions(modal: GlobalModalStackItem) {
  const descriptions = modal.descriptions

  if (Array.isArray(descriptions)) {
    return descriptions.filter(Boolean)
  }

  if (typeof descriptions === 'string' && descriptions.trim()) {
    return [descriptions]
  }

  if (typeof modal.description === 'string' && modal.description.trim()) {
    return [modal.description]
  }

  return []
}

function getActiveComponent(modal: GlobalModalStackItem) {
  modalState.version
  return modalApi.getComponent(modal.id)
}

function getBoxStyle(modal: GlobalModalStackItem) {
  const modalOptions = getModalOptions(modal)
  const width = modalOptions.width || 594
  const maxHeight = modalOptions.maxHeight || '80vh'

  return {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
  }
}

function getModalLayerStyle(index: number) {
  return {
    zIndex: 9999 + index * 20,
  }
}

function isTopModal(modal: GlobalModalStackItem) {
  return topModal.value?.id === modal.id
}

function showCloseButton(modal: GlobalModalStackItem) {
  if (!modal.header) return false
  return modal.header.closeButton !== false
}

function getHeaderIcon(modal: GlobalModalStackItem) {
  return modal.header?.icon || ''
}

function getHeaderSubtitle(modal: GlobalModalStackItem) {
  return modal.header?.subtitle || modal.header?.desc || ''
}

function getHeaderColor(modal: GlobalModalStackItem) {
  return modal.header?.color || 'normal'
}

function isModalLoading(modal: GlobalModalStackItem) {
  const loading = getModalOptions(modal).loading

  if (typeof loading === 'function') {
    return loading()
  }

  return !!loading
}

watch(isOpen, (value) => {
  if (typeof document === 'undefined') return

  if (value) {
    document.body.classList.add('global-modal-open')
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  if (isOpen.value) {
    document.body.classList.add('global-modal-open')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)

  if (typeof document !== 'undefined') {
    document.body.classList.remove('global-modal-open')
  }
})

function isActionDisabled(action: GlobalModalAction, modal: GlobalModalStackItem) {
  if (isModalLoading(modal)) return true

  if (typeof action.disable === 'function') {
    return action.disable()
  }

  return !!action.disable
}

async function runAction(action: GlobalModalAction, modal: GlobalModalStackItem) {
  if (isActionDisabled(action, modal)) return

  const helpers = {
    close: () => modalApi.close(modal.id),
    update: (config: Partial<GlobalModalConfig>) => modalApi.update(config, modal.id),
    modal,
  }

  try {
    if (typeof action.handler === 'function') {
      const result = await action.handler(helpers)

      if (result === false) return
    }

    if (action.close) {
      modalApi.close(modal.id)
    }
  } catch (error) {
    console.error('[GlobalModal action error]', error)
  }
}

function handleCloseButton(modal: GlobalModalStackItem) {
  if (isModalLoading(modal)) return
  modalApi.close(modal.id)
}

function handleBackdropClick(modal: GlobalModalStackItem) {
  if (!isTopModal(modal)) return
  if (isModalLoading(modal)) return

  const modalOptions = getModalOptions(modal)

  if (modalOptions.persistent) return
  if (!modalOptions.closeOnBackdrop) return

  modalApi.close(modal.id)
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return
  if (event.key !== 'Escape') return

  const modal = topModal.value

  if (!modal) return
  if (isModalLoading(modal)) return

  const modalOptions = getModalOptions(modal)

  if (modalOptions.persistent) return
  if (!modalOptions.closeOnEsc) return

  modalApi.close(modal.id)
}

function afterLeave(id: string) {
  modalApi.clearAfterClose(id)

  if (typeof document !== 'undefined' && !modalApi.state.isOpen) {
    document.body.classList.remove('global-modal-open')
  }
}
</script>

<style scoped>
.globalModal {
  position: fixed;
  inset: 0;
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
  overflow: hidden;
}

.globalModalHeader {
  min-width: 0;
  flex: 0 0 auto;
}

.globalModalBody {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.globalModalActions {
  flex: 0 0 auto;
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
