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
    :class="{ 'wizard-living-shell--entry': !props.showNav && !props.showSentence }"
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
      <slot />
    </main>

    <footer v-if="$slots.footer" class="wizard-living-shell__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.wizard-living-shell {
  --wizard-bg: #0a0a0d;
  --wizard-ink: #f2ede6;
  --wizard-accent: #c8a96e;
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--wizard-ink) 5%, transparent);
  border-radius: 20px;
  background:
    radial-gradient(circle at 18% 48%, rgb(200 169 110 / 2.5%), transparent 34%),
    linear-gradient(155deg, #0d0d11 0%, var(--wizard-bg) 58%, #08080b 100%);
  color: var(--wizard-ink);
}

.wizard-living-shell--entry {
  grid-template-rows: minmax(0, 1fr);
}

.wizard-living-shell--entry .wizard-living-shell__main {
  padding: clamp(20px, 3vw, 34px) clamp(22px, 4vw, 50px);
}

.wizard-living-shell__ambient {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 75% 18%, rgb(115 137 176 / 2.5%), transparent 31%),
    radial-gradient(circle at 12% 82%, rgb(200 169 110 / 2%), transparent 30%);
}

.wizard-living-shell__header {
  padding: clamp(20px, 3vw, 32px) clamp(22px, 5vw, 64px) 12px;
}

.wizard-living-shell__sentence {
  max-width: 84ch;
  padding: 10px clamp(22px, 5vw, 64px) 0;
}

.wizard-living-shell__main {
  display: flex;
  min-height: 0;
  align-items: center;
  padding: clamp(26px, 4vh, 52px) clamp(22px, 6vw, 78px);
  overflow: auto;
}

.wizard-living-shell__main > :deep(*) {
  width: 100%;
}

.wizard-living-shell__footer {
  padding: 0 clamp(22px, 6vw, 78px) clamp(22px, 4vh, 36px);
}

@media (max-width: 700px) {
  .wizard-living-shell {
    border-radius: 16px;
  }

  .wizard-living-shell__header {
    padding-inline: 18px;
  }

  .wizard-living-shell__sentence,
  .wizard-living-shell__main,
  .wizard-living-shell__footer {
    padding-inline: 20px;
  }
}
</style>
