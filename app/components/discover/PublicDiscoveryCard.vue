<script setup lang="ts">
import type { HomeShowcaseItem } from '~/composables/useHomeDiscovery'

const props = defineProps<{
  item: HomeShowcaseItem
}>()

const { t, locale } = useI18n()
const { mobile } = useScreen()

const localizedTitle = computed(() => {
  return locale.value === 'fa' ? props.item.title.fa : props.item.title.en
})

const coverUrl = computed(() => {
  return props.item.coverImage?.thumbnailUrl || props.item.coverImage?.fullUrl || ''
})

const formattedDate = computed(() => {
  const date = new Date(props.item.publishedAt)
  if (Number.isNaN(date.getTime())) return props.item.publishedAt

  return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
})

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function openTelegram() {
  if (!props.item.telegramUrl || !import.meta.client) return
  window.open(props.item.telegramUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <article class="public-discovery-card por ofh">
    <img
      v-if="coverUrl"
      :src="coverUrl"
      :alt="localizedTitle"
      class="public-discovery-card__image"
      loading="lazy"
      decoding="async"
      draggable="false"
    >
    <div v-else class="public-discovery-card__fallback" />
    <div class="public-discovery-card__shade pen" />

    <el-flex
      rules="cbs"
      class="public-discovery-card__content w100 h100 por zi10"
      :gap="12"
      :p="mobile ? 16 : 20">
      <el-flex rules="rbc" :gap="8" class="w100" wrap>
        <el-flex v-if="item.tags.length" rules="rsc" :gap="6" class="fg100 fw" wrap>
          <el-text
            v-for="tag in item.tags.slice(0, 4)"
            :key="tag"
            :size="9"
            marker="invert"
            color="normal"
            :p="[3, 6]"
            :radius="100">
            {{ formatTag(tag) }}
          </el-text>
        </el-flex>

        <el-text
          v-if="item.imageCount"
          :size="10"
          marker="invert"
          color="normal"
          :p="[3, 6]"
          :radius="100">
          {{ t('prompts.card.imageCount', { count: item.imageCount }) }}
        </el-text>
      </el-flex>

      <el-flex rules="csc" :gap="10" class="w100">
        <el-text
          type="h3"
          :size="mobile ? 24 : 30"
          :weight="800"
          class="public-discovery-card__title w100">
          {{ localizedTitle }}
        </el-text>

        <el-flex rules="rsc" :gap="10" class="w100 fw" wrap>
          <el-flex v-if="item.owner" rules="rsc" :gap="6">
            <el-avatar
              :src="item.owner.avatarUrl"
              :name="item.owner.username"
              :size="8"
              :size-offset="2"
              :br="2"
              bc="surface"
            />
            <el-text :size="10" :weight="700">@{{ item.owner.username }}</el-text>
          </el-flex>

          <el-text
            :size="10"
            icon="calendar_month"
            icon-color="normal">
            {{ formattedDate }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" :gap="8" class="w100 fw" wrap>
          <el-button
            color="normal"
            icon="visibility"
            :label="t('growth.publicDiscovery.viewPrompt')"
            :to="`/prompts?id=${item.id}`"
          />
          <el-button
            v-if="item.telegramUrl"
            mode="flat"
            color="normal"
            icon="send"
            :label="t('prompts.actions.telegram')"
            @click="openTelegram"
          />
        </el-flex>
      </el-flex>
    </el-flex>
  </article>
</template>

<style scoped>
.public-discovery-card {
  min-height: 420px;
  border-radius: 18px;
  isolation: isolate;
  background: var(--themeSurface);
  border: 1px solid var(--normalText10);
}

.public-discovery-card__image,
.public-discovery-card__fallback,
.public-discovery-card__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.public-discovery-card__image {
  z-index: 0;
  object-fit: cover;
  transition: transform 500ms ease;
}

.public-discovery-card:hover .public-discovery-card__image {
  transform: scale(1.025);
}

.public-discovery-card__fallback {
  z-index: 0;
  background:
    radial-gradient(circle at 20% 20%, var(--primary20), transparent 44%),
    radial-gradient(circle at 80% 80%, var(--themeBlue15), transparent 46%),
    var(--themeSurface);
}

.public-discovery-card__shade {
  z-index: 1;
  background:
    linear-gradient(180deg, var(--themeSurface10), var(--themeSurface25) 42%, var(--themeSurface90) 100%),
    linear-gradient(90deg, var(--themeSurface35), var(--themeSurface0) 76%);
}

.public-discovery-card__title {
  line-height: 1.02 !important;
  letter-spacing: -.03em;
  text-wrap: balance;
  text-shadow: 0 4px 18px var(--invertText55);
}
</style>
