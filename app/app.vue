<script setup lang="ts">
const isAppMounted = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isAppMounted.value = true
  })
})
</script>

<template>
  <NuxtLoadingIndicator />

  <Transition name="appBootLoader">
    <div v-if="!isAppMounted" class="appBootLoader" aria-label="Loading application">
      <div class="appBootLoader__content">
        <div class="appBootLoader__logo">
          PROMPT DRAFT
        </div>

        <div class="appBootLoader__spinner" />
      </div>
    </div>
  </Transition>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <el-variable-fab />
  <el-modal />
</template>

<style scoped>
.appBootLoader {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f14;
}

.appBootLoader__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.appBootLoader__logo {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #ffffff;
  opacity: 0.9;
}

.appBootLoader__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgb(255 255 255 / 14%);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: appBootLoaderSpin 0.7s linear infinite;
}

.appBootLoader-enter-active,
.appBootLoader-leave-active {
  transition: opacity 0.2s ease;
}

.appBootLoader-enter-from,
.appBootLoader-leave-to {
  opacity: 0;
}

@keyframes appBootLoaderSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>