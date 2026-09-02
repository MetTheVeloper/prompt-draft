<script setup lang="ts">
import WizardLivingSentence from "./WizardLivingSentence.vue";
import type { WizardLivingSentenceToken } from "~/wizard/portraitLivingPresentation";

const props = defineProps<{
  tokens: readonly WizardLivingSentenceToken[];
  promptPreview: string;
  issue?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "open-create"): void;
  (event: "save-template"): void;
  (event: "start-another"): void;
  (event: "edit-direction"): void;
}>();

const { t } = useI18n();

const preview = computed(() => props.promptPreview.trim());
</script>

<template>
  <main class="wizard-direction-ready">
    <div class="wizard-direction-ready__ambient" aria-hidden="true" />

    <section class="wizard-direction-ready__content">
      <header class="wizard-direction-ready__header">
        <span>{{ t('wizard.living.ready.eyebrow') }}</span>
        <h1>{{ t('wizard.living.ready.title') }}</h1>
        <p>{{ t('wizard.living.ready.subcopy') }}</p>
      </header>

      <section class="wizard-direction-ready__direction" aria-labelledby="wizard-ready-direction">
        <span id="wizard-ready-direction" class="wizard-direction-ready__label">
          {{ t('wizard.living.ready.directionLabel') }}
        </span>
        <WizardLivingSentence :tokens="props.tokens" :compact="false" />
      </section>

      <section v-if="preview" class="wizard-direction-ready__artifact" aria-labelledby="wizard-ready-prompt">
        <div class="wizard-direction-ready__artifact-head">
          <span id="wizard-ready-prompt" class="wizard-direction-ready__label">
            {{ t('wizard.living.ready.promptLabel') }}
          </span>
          <span>{{ t('wizard.living.ready.promptStatus') }}</span>
        </div>
        <p>{{ preview }}</p>
      </section>

      <section class="wizard-direction-ready__actions">
        <button
          type="button"
          class="wizard-direction-ready__primary"
          :disabled="props.disabled"
          @click="emit('open-create')">
          <span>{{ t('wizard.living.ready.openCreate') }}</span>
          <i aria-hidden="true">→</i>
        </button>

        <div class="wizard-direction-ready__secondary-actions">
          <button
            type="button"
            :disabled="props.disabled"
            @click="emit('save-template')">
            {{ t('wizard.living.ready.saveTemplate') }}
          </button>
          <button
            type="button"
            :disabled="props.disabled"
            @click="emit('start-another')">
            {{ t('wizard.living.ready.startAnother') }}
          </button>
        </div>

        <p v-if="props.issue" class="wizard-direction-ready__issue" role="alert">
          {{ props.issue }}
        </p>
      </section>

      <footer class="wizard-direction-ready__footer">
        <button
          type="button"
          :disabled="props.disabled"
          @click="emit('edit-direction')">
          {{ t('wizard.living.ready.editDirection') }}
        </button>
        <p>{{ t('wizard.living.ready.handoffNote') }}</p>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.wizard-direction-ready {
  position: relative;
  isolation: isolate;
  min-height: min(820px, calc(100vh - 72px));
  width: 100%;
  overflow: hidden;
  background: var(--themeBackground);
  color: var(--normalText);
}

.wizard-direction-ready__ambient {
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 62% 48% at 72% 16%, var(--primary15), transparent 72%),
    radial-gradient(ellipse 54% 42% at 18% 74%, var(--normalText5), transparent 76%);
}

.wizard-direction-ready__content {
  display: grid;
  width: min(1040px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(44px, 7vw, 92px) 0 clamp(36px, 6vw, 72px);
  gap: clamp(36px, 6vh, 68px);
}

.wizard-direction-ready__header {
  display: grid;
  max-width: 720px;
  gap: 12px;
}

.wizard-direction-ready__header > span,
.wizard-direction-ready__label,
.wizard-direction-ready__artifact-head > span:last-child {
  color: var(--primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.wizard-direction-ready__header h1 {
  margin: 0;
  color: var(--normalText);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.7rem, 7vw, 6.8rem);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 0.92;
}

.wizard-direction-ready__header p {
  max-width: 58ch;
  margin: 4px 0 0;
  color: var(--normalText50);
  font-size: clamp(0.86rem, 1.35vw, 1rem);
  line-height: 1.7;
}

.wizard-direction-ready__direction,
.wizard-direction-ready__artifact {
  display: grid;
  gap: 16px;
  padding: clamp(22px, 4vw, 38px) 0;
  border-top: 1px solid var(--normalText10);
  border-bottom: 1px solid var(--normalText10);
}

.wizard-direction-ready__label {
  color: var(--normalText30);
}

.wizard-direction-ready__artifact {
  gap: 14px;
}

.wizard-direction-ready__artifact-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 18px;
}

.wizard-direction-ready__artifact-head > span:last-child {
  color: var(--normalText25);
  letter-spacing: 0.1em;
}

.wizard-direction-ready__artifact p {
  display: -webkit-box;
  overflow: hidden;
  max-width: 92ch;
  margin: 0;
  color: var(--normalText60);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.72rem, 1.1vw, 0.86rem);
  line-height: 1.75;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
}

.wizard-direction-ready__actions {
  display: grid;
  gap: 22px;
}

.wizard-direction-ready__primary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: min(720px, 100%);
  padding: 18px 0 14px;
  border: 0;
  border-bottom: 1px solid var(--primary70);
  background: transparent;
  color: var(--normalText);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.85rem, 1.6vw, 1.08rem);
  font-weight: 650;
  letter-spacing: 0.14em;
  text-align: left;
  text-transform: uppercase;
  transition: color 180ms ease, border-color 180ms ease;
}

.wizard-direction-ready__primary i {
  color: var(--primary);
  font-size: 1.4em;
  font-style: normal;
  transition: transform 180ms ease;
}

.wizard-direction-ready__primary:hover,
.wizard-direction-ready__primary:focus-visible {
  border-bottom-color: var(--primary);
  color: var(--primary);
}

.wizard-direction-ready__primary:hover i,
.wizard-direction-ready__primary:focus-visible i {
  transform: translateX(6px);
}

.wizard-direction-ready__secondary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
}

.wizard-direction-ready__secondary-actions button,
.wizard-direction-ready__footer button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--normalText45);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-direction-ready__secondary-actions button:hover,
.wizard-direction-ready__secondary-actions button:focus-visible,
.wizard-direction-ready__footer button:hover,
.wizard-direction-ready__footer button:focus-visible {
  color: var(--primary);
}

.wizard-direction-ready__primary:focus-visible,
.wizard-direction-ready__secondary-actions button:focus-visible,
.wizard-direction-ready__footer button:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 5px;
}

.wizard-direction-ready button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.wizard-direction-ready__issue {
  margin: 0;
  color: var(--themeRed);
  font-size: 0.75rem;
  line-height: 1.5;
}

.wizard-direction-ready__footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  padding-top: 10px;
}

.wizard-direction-ready__footer p {
  max-width: 55ch;
  margin: 0;
  color: var(--normalText25);
  font-size: 0.7rem;
  line-height: 1.6;
  text-align: right;
}

@media (max-width: 680px) {
  .wizard-direction-ready__content {
    width: min(100% - 28px, 1040px);
  }

  .wizard-direction-ready__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .wizard-direction-ready__footer p {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-direction-ready__primary,
  .wizard-direction-ready__primary i,
  .wizard-direction-ready__secondary-actions button,
  .wizard-direction-ready__footer button {
    transition: none;
  }
}
</style>
