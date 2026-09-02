<script setup lang="ts">
import type { WizardLivingSentenceToken } from "~/wizard/portraitLivingPresentation";

const props = withDefaults(
  defineProps<{
    tokens: readonly WizardLivingSentenceToken[];
    compact?: boolean;
    editable?: boolean;
  }>(),
  { compact: true, editable: false },
);

const emit = defineEmits<{
  (event: "navigate", token: WizardLivingSentenceToken): void;
}>();
</script>

<template>
  <p class="wizard-living-sentence" :class="{ 'wizard-living-sentence--compact': props.compact }">
    <template v-for="token in props.tokens" :key="token.id">
      <button
        v-if="props.editable && token.editable"
        type="button"
        class="wizard-living-sentence__token wizard-living-sentence__token--editable"
        @click="emit('navigate', token)">
        {{ token.text }}
      </button>
      <span
        v-else
        class="wizard-living-sentence__token"
        :class="{ 'wizard-living-sentence__token--dim': token.dim }">
        {{ token.text }}
      </span>
    </template>
  </p>
</template>

<style scoped>
.wizard-living-sentence {
  margin: 0;
  color: var(--normalText);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.35rem, 2.8vw, 2.15rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.36;
  text-wrap: pretty;
}

.wizard-living-sentence--compact {
  color: var(--normalText50);
  font-size: clamp(0.92rem, 1.55vw, 1.18rem);
  letter-spacing: -0.015em;
  line-height: 1.55;
}

.wizard-living-sentence__token { white-space: pre-wrap; }
.wizard-living-sentence__token--dim { opacity: 0.34; }

button.wizard-living-sentence__token--editable {
  display: inline;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--primary35);
  border-radius: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  transition: color 180ms ease, border-color 180ms ease;
}

button.wizard-living-sentence__token--editable:hover,
button.wizard-living-sentence__token--editable:focus-visible {
  border-bottom-color: var(--primary);
  color: var(--normalText);
}

button.wizard-living-sentence__token--editable:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 3px;
}

.wizard-living-sentence:dir(rtl) {
  font-family: var(--app-font-family, system-ui, sans-serif);
  font-style: normal;
  letter-spacing: 0;
  line-height: 1.8;
  text-align: right;
}

.wizard-living-sentence--compact:dir(rtl) {
  letter-spacing: 0;
  line-height: 1.8;
}
</style>
