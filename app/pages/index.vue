<script setup lang="ts">
const { t } = useI18n();
const { mini } = useScreen();

const { $menu } = useNuxtApp()

import { usePromptTranslation } from "~/composables/prompt/usePromptTranslation";

const { translateText } = usePromptTranslation();


function openTestMenu(event: MouseEvent) {
  $menu.open({
    mode: 'dropdown',
    anchor: event.currentTarget as HTMLElement,
    placement: 'bottom-start',
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Edit',
        icon: 'edit-2',
        handler: () => console.log('edit'),
      },
      {
        label: 'Duplicate',
        icon: 'copy',
        description: 'Make a duplicate',
        handler: () => console.log('duplicate'),
      },
      {
        divider: true,
      },
      {
        label: 'Delete',
        icon: 'trash',
        color: 'red',
        handler: () => console.log('delete'),
      },
    ],
  })

  console.log('menu state:', $menu.state.isOpen, $menu.state.menu)
}

function openTestContextMenu(event: MouseEvent) {
  event.preventDefault()

  $menu.open({
    mode: 'point',
    event,
    options: {
      closeOnScroll: false,
    },
    items: [
      {
        label: 'Point menu',
        icon: 'mouse-circle',
        description: 'Opened at cursor position',
        active: true,
        handler: () => console.log('point menu'),
      },
      {
        label: 'Copy position',
        icon: 'copy',
        handler: () => {
          console.log({
            x: event.clientX,
            y: event.clientY,
          })
        },
      },
      {
        divider: true,
      },
      {
        label: 'Close',
        icon: 'close-circle',
        color: 'red',
        close: true,
      },
    ],
  })

  console.log('context menu state:', $menu.state.isOpen, $menu.state.menu)
}

async function testTranslation() {
  const result = await translateText({
    text: "ساخت یک پوستر برای {app_name} با تیتر {title_1}",
    source: "auto",
    target: "en",
    alternatives: 3,
  });

  console.log(result);
}

onMounted(async () => {
  testTranslation();
})

</script>

<template>
  <el-grid :gap="0" :cols="1" rules="ccc" class="h100 w100">
    <visual-tile :count="47" :interval="25000" :transition-duration="5000" extension="webp" :edge-blur="400"
      :z-index="50" />
    <el-flex rules="ccc" class="zi100 w100 h100" bg="surface45" bd="b0" :radius="0" :p="32">
      <el-text type="span" :size="12" :weight="600" class="tc">
        {{ t("home.eyebrow") }}
      </el-text>
      <el-text type="h1" :size="mini ? 40 : 64" :weight="800" effect="glitch" marker="normal50" color="surface"
        class="tc">
        {{ t("home.title").toUpperCase() }}
      </el-text>
      <el-text type="p" :size="mini ? 14 : 20" :weight="400" class="tc mxwp400">
        {{ t("home.description") }}
      </el-text>
      <el-divider />
      <el-button label="Open menu" icon="more"
        :size="16" mode="flat"
        @contextmenu.prevent="openTestContextMenu"
        @click="openTestMenu" />
      <el-button :size="16" :label="t('home.createPrompt')" icon="magicpen" to="/create" class="" />
      <el-button :size="14" :label="t('app.navigation.guide')" icon="message-question" to="/guide" color="normal"
        mode="flat" />
    </el-flex>
  </el-grid>
</template>
