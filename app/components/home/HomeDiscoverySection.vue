<script setup lang="ts">
import type { DiscoveryInterestDefinition } from '~/composables/useDiscoveryPreferences'
import type { HomeShowcaseItem } from '~/composables/useHomeDiscovery'

const props = defineProps<{
  definition: DiscoveryInterestDefinition
  items: HomeShowcaseItem[]
}>()

const { t, locale } = useI18n()
const { mobile } = useScreen()
const activeIndex = ref(0)
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const activeItem = computed(() => props.items[activeIndex.value] ?? null)
const activeImage = computed(() => {
  return activeItem.value?.coverImage?.fullUrl || activeItem.value?.coverImage?.thumbnailUrl || ''
})
const localizedItemTitle = computed(() => {
  const item = activeItem.value
  if (!item) return ''
  return locale.value === 'fa' ? item.title.fa : item.title.en
})
const formattedDate = computed(() => {
  const value = activeItem.value?.publishedAt
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
})

watch(
  () => props.items,
  () => {
    activeIndex.value = 0
    restartAutoplay()
  },
  { deep: true },
)

onMounted(restartAutoplay)
onBeforeUnmount(stopAutoplay)

function stopAutoplay() {
  if (!autoplayTimer) return
  clearInterval(autoplayTimer)
  autoplayTimer = null
}

function restartAutoplay() {
  stopAutoplay()
  if (props.items.length <= 1) return
  autoplayTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % props.items.length
  }, 6200)
}

function setActive(index: number) {
  if (!props.items.length) return
  activeIndex.value = (index + props.items.length) % props.items.length
  restartAutoplay()
}

function previous() {
  setActive(activeIndex.value - 1)
}

function next() {
  setActive(activeIndex.value + 1)
}

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function openTelegram() {
  if (!activeItem.value?.telegramUrl || !import.meta.client) return
  window.open(activeItem.value.telegramUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section
    class="home-discovery-section por ofh"
    @mouseenter="stopAutoplay"
    @mouseleave="restartAutoplay">
    <Transition name="home-section-image" mode="out-in">
      <img
        v-if="activeImage"
        :key="activeImage"
        :src="activeImage"
        :alt="localizedItemTitle"
        class="home-discovery-section__background"
        loading="lazy"
        decoding="async"
        draggable="false"
      >
      <div v-else key="fallback" class="home-discovery-section__fallback" />
    </Transition>

    <div class="home-discovery-section__shade pen" />
    <div class="home-discovery-section__grain pen" />

    <el-flex
      rules="cbs"
      class="home-discovery-section__content w100 h100 por zi10"
      :gap="18"
      :p="mobile ? 22 : 30">
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-flex rules="csc" :gap="5" class="fg100">
          <el-text :size="10" :weight="900" class="w100" style="opacity: .66">
            {{ t('growth.home.sectionEyebrow') }}
          </el-text>
          <el-text type="h2" :size="mobile ? 24 : 30" :weight="850" class="w100">
            {{ t(definition.messageKey) }}
          </el-text>
          <el-text :size="11" class="w100" style="max-width: 520px; opacity: .72; line-height: 1.5">
            {{ t(definition.descriptionKey) }}
          </el-text>
        </el-flex>

        <el-flex v-if="items.length > 1" rules="rcc" :gap="4">
          <el-button
            type="fab"
            mode="flat"
            color="normal"
            icon="arrow_back"
            :size="11"
            :p="8"
            :tooltip="t('growth.home.previous')"
            @click="previous"
          />
          <el-button
            type="fab"
            mode="flat"
            color="normal"
            icon="arrow_forward"
            :size="11"
            :p="8"
            :tooltip="t('growth.home.next')"
            @click="next"
          />
        </el-flex>
      </el-flex>

      <el-flex v-if="activeItem" rules="csc" class="w100" :gap="14">
        <el-text
          type="h3"
          :size="mobile ? 36 : 52"
          :weight="700"
          class="home-discovery-section__item-title w100">
          {{ localizedItemTitle }}
        </el-text>

        <el-flex v-if="activeItem.tags.length" rules="rsc" :gap="12" class="w100 fw" wrap>
          <el-text
            v-for="tag in activeItem.tags"
            :key="tag"
            :size="10"
            color="normal"
            marker="invert"
            :p="[4, 7]"
            :radius="100">
            {{ formatTag(tag) }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" :gap="12" class="w100 fw home-discovery-section__meta" wrap>
          <el-flex v-if="activeItem.owner" rules="rsc" :gap="7">
            <el-avatar
              :src="activeItem.owner.avatarUrl"
              :name="activeItem.owner.username"
              :size="9"
              :size-offset="3"
              :br="2"
              bc="surface"
            />
            <el-text :size="11" :weight="700">
              @{{ activeItem.owner.username }}
            </el-text>
          </el-flex>

          <el-text
            v-if="formattedDate"
            :size="11"
            icon="calendar_month">
            {{ formattedDate }}
          </el-text>

          <el-text
            :size="11"
            icon="photo_library">
            {{ t('prompts.card.imageCount', { count: activeItem.imageCount }) }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" :gap="8" class="w100 fw" wrap>
          <el-button
            color="normal"
            icon="visibility"
            :label="t('growth.home.viewPrompt')"
            :to="`/prompts?id=${activeItem.id}`"
          />
          <el-button
            v-if="activeItem.telegramUrl"
            mode="flat"
            color="normal"
            icon="send"
            :label="t('prompts.actions.telegram')"
            @click="openTelegram"
          />
        </el-flex>

        <el-flex v-if="items.length > 1" rules="rsc" :gap="5" class="w100">
          <button
            v-for="(_, index) in items"
            :key="index"
            type="button"
            class="home-discovery-section__dot"
            :class="{ 'is-active': index === activeIndex }"
            :aria-label="`${index + 1}`"
            @click="setActive(index)"
          />
        </el-flex>
      </el-flex>
    </el-flex>
  </section>
</template>

<style scoped>
.home-discovery-section {
  min-width: 0;
  height: var(--home-viewport-height);
  min-height: var(--home-viewport-height);
  isolation: isolate;
  background: var(--themeBackground);
}

.home-discovery-section__background,
.home-discovery-section__fallback,
.home-discovery-section__shade,
.home-discovery-section__grain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.home-discovery-section__background {
  z-index: 0;
  display: block;
  object-fit: cover;
  object-position: center;
  transform: scale(1.015);
}

.home-discovery-section__fallback {
  z-index: 0;
  background:
    radial-gradient(circle at 20% 15%, var(--primary35), transparent 44%),
    radial-gradient(circle at 80% 80%, var(--themePurple25), transparent 48%),
    var(--themeBackground);
}

.home-discovery-section__shade {
  z-index: 2;
  background:
    linear-gradient(180deg, var(--themeSurface20), var(--themeSurface20) 32%, var(--themeSurface85) 100%),
    linear-gradient(90deg, var(--themeSurface45), var(--themeSurface0) 72%);
}

.home-discovery-section__grain {
  z-index: 3;
  opacity: .08;
  background-image: repeating-radial-gradient(circle at 0 0, var(--normalText30) 0, var(--normalText30) .5px, transparent .6px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.home-discovery-section__content {
  text-shadow: 0 4px 20px var(--invertText45);
}

.home-discovery-section__item-title {
  max-width: 760px;
  line-height: .98 !important;
  letter-spacing: -.035em;
  text-wrap: balance;
  text-shadow: 0 4px 20px var(--invertText70);
}

.home-discovery-section__meta {
  opacity: .86;
}

.home-discovery-section__dot {
  width: 18px;
  height: 3px;
  padding: 0;
  border: 0;
  border-radius: 100px;
  background: var(--normalText35);
  cursor: pointer;
  transition: width 180ms ease, background 180ms ease;
}

.home-discovery-section__dot.is-active {
  width: 34px;
  background: var(--normalText95);
}

.home-section-image-enter-active,
.home-section-image-leave-active {
  transition: opacity 500ms ease, transform 900ms ease;
}

.home-section-image-enter-from,
.home-section-image-leave-to {
  opacity: 0;
  transform: scale(1.045);
}
</style>
