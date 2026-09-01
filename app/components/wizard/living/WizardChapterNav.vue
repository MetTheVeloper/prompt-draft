<script setup lang="ts">
import type { WizardLivingChapter } from "~/wizard/portraitLivingPresentation";

const props = defineProps<{
  chapters: readonly WizardLivingChapter[];
  currentChapterId: string;
  progress?: number | null;
  canGoBack: boolean;
  isSaved?: boolean;
  isBusy?: boolean;
}>();

const emit = defineEmits<{
  (event: "back"): void;
  (event: "restart"): void;
  (event: "exit"): void;
}>();

const currentIndex = computed(() =>
  props.chapters.findIndex((chapter) => chapter.id === props.currentChapterId),
);

const safeProgress = computed(() => {
  if (typeof props.progress !== "number") return null;
  return Math.min(1, Math.max(0, props.progress));
});
</script>

<template>
  <div class="wizard-chapter-nav">
    <nav class="wizard-chapter-nav__chapters scrollbar-hidden" aria-label="Wizard chapters">
      <div
        v-for="(chapter, index) in props.chapters"
        :key="chapter.id"
        class="wizard-chapter-nav__chapter"
        :class="{
          'wizard-chapter-nav__chapter--active': chapter.id === props.currentChapterId,
          'wizard-chapter-nav__chapter--past': index < currentIndex,
        }">
        <span>{{ chapter.label }}</span>
        <span
          v-if="chapter.id === props.currentChapterId && safeProgress !== null"
          class="wizard-chapter-nav__progress"
          aria-hidden="true">
          <span :style="{ width: `${safeProgress * 100}%` }" />
        </span>
      </div>
    </nav>

    <div class="wizard-chapter-nav__actions">
      <span v-if="props.isSaved" class="wizard-chapter-nav__saved">Saved</span>
      <button
        v-if="props.canGoBack"
        type="button"
        :disabled="props.isBusy"
        @click="emit('back')">
        ← Back
      </button>
      <button type="button" :disabled="props.isBusy" @click="emit('restart')">
        Start over
      </button>
      <button type="button" :disabled="props.isBusy" @click="emit('exit')">
        Exit
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
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 8%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.59rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  transition: color 300ms ease;
}

.wizard-chapter-nav__chapter--past {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 24%, transparent);
}

.wizard-chapter-nav__chapter--active {
  color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 92%, transparent);
}

.wizard-chapter-nav__progress {
  position: relative;
  display: block;
  width: 100%;
  height: 1px;
  min-width: 28px;
  overflow: hidden;
  background: color-mix(in srgb, var(--wizard-ink, #f2ede6) 9%, transparent);
}

.wizard-chapter-nav__progress > span {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  height: 100%;
  background: color-mix(in srgb, var(--wizard-accent, #c8a96e) 72%, transparent);
  transition: width 420ms ease;
}

.wizard-chapter-nav__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
}

.wizard-chapter-nav__actions button {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 24%, transparent);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-chapter-nav__actions button:hover,
.wizard-chapter-nav__actions button:focus-visible {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 68%, transparent);
}

.wizard-chapter-nav__actions button:focus-visible {
  outline: 1px solid var(--wizard-accent, #c8a96e);
  outline-offset: 5px;
}

.wizard-chapter-nav__saved {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 18%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.56rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
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
    gap: 10px;
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
