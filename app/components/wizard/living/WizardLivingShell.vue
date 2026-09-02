<script setup lang="ts">
import type {
  WizardLivingChapter,
  WizardLivingSentenceToken,
} from "~/wizard/portraitLivingPresentation";
import WizardChapterNav from "./WizardChapterNav.vue";
import WizardLivingSentence from "./WizardLivingSentence.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    chapters: readonly WizardLivingChapter[];
    currentChapterId: string;
    sentenceTokens: readonly WizardLivingSentenceToken[];
    chapterProgress?: number | null;
    canGoBack: boolean;
    isSaved?: boolean;
    isBusy?: boolean;
    showNav?: boolean;
    showSentence?: boolean;
  }>(),
  {
    chapterProgress: null,
    isSaved: false,
    isBusy: false,
    showNav: true,
    showSentence: true,
  },
);

const emit = defineEmits<{
  (event: "back"): void;
  (event: "restart"): void;
  (event: "exit"): void;
}>();
</script>

<template>
  <section
    class="wizard-living-shell w100 h100"
    :class="{
      'wizard-living-shell--entry': !props.showNav && !props.showSentence,
      'wizard-living-shell--review': props.currentChapterId === 'review',
    }"
    :aria-label="props.title">
    <div class="wizard-living-shell__ambient" aria-hidden="true" />

    <header v-if="props.showNav" class="wizard-living-shell__header">
      <WizardChapterNav
        :chapters="props.chapters"
        :current-chapter-id="props.currentChapterId"
        :progress="props.chapterProgress"
        :can-go-back="props.canGoBack"
        :is-saved="props.isSaved"
        :is-busy="props.isBusy"
        @back="emit('back')"
        @restart="emit('restart')"
        @exit="emit('exit')"
      />
    </header>

    <div
      v-if="props.showSentence"
      class="wizard-living-shell__sentence"
      aria-live="polite">
      <WizardLivingSentence :tokens="props.sentenceTokens" compact />
    </div>

    <main class="wizard-living-shell__main">
      <div class="wizard-living-shell__stage">
        <slot />
      </div>
    </main>

    <footer v-if="$slots.footer" class="wizard-living-shell__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.wizard-living-shell {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  background: var(--themeBackground);
  color: var(--normalText);
}

.wizard-living-shell--entry {
  grid-template-rows: minmax(0, 1fr);
}

.wizard-living-shell__ambient {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 75% 18%, var(--secondary5), transparent 31%),
    radial-gradient(circle at 12% 82%, var(--primary5), transparent 30%);
}

.wizard-living-shell__header {
  padding: clamp(20px, 3vw, 32px) clamp(22px, 5vw, 64px) 12px;
}

.wizard-living-shell__sentence {
  max-width: 84ch;
  padding: 10px clamp(22px, 5vw, 64px) 0;
}

.wizard-living-shell__main {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}

.wizard-living-shell__stage {
  display: flex;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  padding: clamp(26px, 4vh, 52px) clamp(22px, 6vw, 78px);
}

.wizard-living-shell__stage > :deep(*) {
  width: 100%;
}

.wizard-living-shell--entry .wizard-living-shell__stage {
  padding: clamp(20px, 3vw, 34px) clamp(22px, 4vw, 50px);
}

.wizard-living-shell__footer {
  padding: 0 clamp(22px, 6vw, 78px) clamp(22px, 4vh, 36px);
}

@media (min-width: 1080px) {
  .wizard-living-shell--review .wizard-living-shell__main {
    display: flex;
    overflow: hidden;
  }

  .wizard-living-shell--review .wizard-living-shell__stage {
    flex: 1 1 auto;
    min-height: 0;
    align-items: stretch;
  }

  .wizard-living-shell--review .wizard-living-shell__stage > :deep(*) {
    min-height: 0;
    align-self: stretch;
  }
}

@media (max-width: 700px) {
  .wizard-living-shell__header {
    padding-inline: 18px;
  }

  .wizard-living-shell__sentence,
  .wizard-living-shell__stage,
  .wizard-living-shell__footer {
    padding-inline: 20px;
  }
}
</style>
