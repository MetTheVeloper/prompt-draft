<script setup lang="ts">
import type { WizardLivingChapter } from "~/wizard/portraitLivingPresentation";

const props = defineProps<{
  chapters: readonly WizardLivingChapter[];
  currentChapterId: string;
  maxReachedChapterId?: string;
  progress?: number | null;
  canGoBack: boolean;
  isSaved?: boolean;
  isBusy?: boolean;
}>();

const emit = defineEmits<{
  (event: "chapter", chapterId: string): void;
  (event: "back"): void;
  (event: "restart"): void;
  (event: "exit"): void;
}>();

const { t } = useI18n();
const currentIndex = computed(() =>
  props.chapters.findIndex((chapter) => chapter.id === props.currentChapterId),
);
const reachedIndex = computed(() => {
  const id = props.maxReachedChapterId || props.currentChapterId;
  const index = props.chapters.findIndex((chapter) => chapter.id === id);
  return index >= 0 ? index : currentIndex.value;
});

const safeProgress = computed(() => {
  if (typeof props.progress !== "number") return null;
  return Math.min(1, Math.max(0, props.progress));
});

function canNavigate(index: number, chapterId: string) {
  return !props.isBusy &&
    chapterId !== props.currentChapterId &&
    index < reachedIndex.value;
}
</script>

<template>
  <div class="wizard-chapter-nav">
    <nav class="wizard-chapter-nav__chapters scrollbar-hidden" :aria-label="t('wizard.living.nav.ariaLabel')">
      <button
        v-for="(chapter, index) in props.chapters"
        :key="chapter.id"
        type="button"
        class="wizard-chapter-nav__chapter"
        :class="{
          'wizard-chapter-nav__chapter--active': chapter.id === props.currentChapterId,
          'wizard-chapter-nav__chapter--past': index < reachedIndex,
          'wizard-chapter-nav__chapter--clickable': canNavigate(index, chapter.id),
        }"
        :disabled="!canNavigate(index, chapter.id)"
        :aria-current="chapter.id === props.currentChapterId ? 'step' : undefined"
        @click="emit('chapter', chapter.id)">
        <span>{{ chapter.label }}</span>
        <span
          v-if="chapter.id === props.currentChapterId && safeProgress !== null"
          class="wizard-chapter-nav__progress"
          aria-hidden="true">
          <span :style="{ width: `${safeProgress * 100}%` }" />
        </span>
      </button>
    </nav>

    <div class="wizard-chapter-nav__actions">
      <span v-if="props.isSaved" class="wizard-chapter-nav__saved">{{ t('wizard.living.nav.saved') }}</span>
      <button
        v-if="props.canGoBack"
        type="button"
        :disabled="props.isBusy"
        @click="emit('back')">
        {{ t('wizard.living.nav.back') }}
      </button>
      <button type="button" :disabled="props.isBusy" @click="emit('restart')">
        {{ t('wizard.living.nav.startOver') }}
      </button>
      <button type="button" :disabled="props.isBusy" @click="emit('exit')">
        {{ t('wizard.living.nav.exit') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wizard-chapter-nav {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
}

.wizard-chapter-nav__chapters {
  display: flex;
  flex: 1 1 auto;
  align-items: flex-start;
  gap: clamp(12px, 2vw, 24px);
  min-width: 0;
  overflow-x: auto;
}

.wizard-chapter-nav__chapter {
  display: grid;
  flex: 0 0 auto;
  gap: 6px;
  min-width: 28px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--normalText20);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.59rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  line-height: 1;
  text-align: left;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-chapter-nav__chapter:disabled {
  cursor: default;
  opacity: 1;
}

.wizard-chapter-nav__chapter--past {
  color: var(--normalText35);
}

.wizard-chapter-nav__chapter--clickable {
  cursor: pointer;
}

.wizard-chapter-nav__chapter--clickable:hover,
.wizard-chapter-nav__chapter--clickable:focus-visible {
  color: var(--normalText70);
}

.wizard-chapter-nav__chapter--clickable:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 5px;
}

.wizard-chapter-nav__chapter--active {
  color: var(--primary);
}

.wizard-chapter-nav__progress {
  position: relative;
  display: block;
  width: 100%;
  height: 1px;
  min-width: 28px;
  overflow: hidden;
  background: var(--normalText15);
}

.wizard-chapter-nav__progress > span {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  height: 100%;
  background: var(--primary70);
  transition: width 420ms ease;
}

.wizard-chapter-nav__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 22px;
}

.wizard-chapter-nav__actions button {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--normalText35);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-chapter-nav__actions button:hover,
.wizard-chapter-nav__actions button:focus-visible {
  color: var(--normalText70);
}

.wizard-chapter-nav__actions button:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 5px;
}

.wizard-chapter-nav__saved {
  color: var(--normalText30);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.56rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.wizard-chapter-nav:dir(rtl) .wizard-chapter-nav__chapter {
  text-align: right;
}

.wizard-chapter-nav:dir(rtl) .wizard-chapter-nav__chapter,
.wizard-chapter-nav:dir(rtl) .wizard-chapter-nav__actions button,
.wizard-chapter-nav:dir(rtl) .wizard-chapter-nav__saved {
  letter-spacing: 0;
  text-transform: none;
}

.wizard-chapter-nav:dir(rtl) .wizard-chapter-nav__progress > span {
  inset: 0 0 0 auto;
}

@media (max-width: 900px) {
  .wizard-chapter-nav {
    display: grid;
    gap: 12px;
  }

  .wizard-chapter-nav__actions {
    justify-content: flex-end;
  }
}

@media (max-width: 620px) {
  .wizard-chapter-nav__actions {
    justify-content: space-between;
    gap: 14px;
  }

  .wizard-chapter-nav__saved {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-chapter-nav__chapter,
  .wizard-chapter-nav__progress > span,
  .wizard-chapter-nav__actions button {
    transition: none;
  }
}
</style>
