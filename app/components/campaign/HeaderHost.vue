<script setup lang="ts">
const targetReady = ref(false)
let observer: MutationObserver | null = null

function resolveTarget() {
  if (!import.meta.client) return false
  const ready = Boolean(document.querySelector('.app-header'))
  targetReady.value = ready
  return ready
}

onMounted(() => {
  if (resolveTarget()) return

  observer = new MutationObserver(() => {
    if (!resolveTarget()) return
    observer?.disconnect()
    observer = null
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <Teleport v-if="targetReady" to=".app-header">
    <CampaignPlacement slot="site_header" />
  </Teleport>
</template>
