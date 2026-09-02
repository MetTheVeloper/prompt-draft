<script setup lang="ts">
import WizardLivingAction from "./WizardLivingAction.vue";

const props = defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  (event: "continue"): void;
  (event: "start-over"): void;
}>();

const { t } = useI18n();
</script>

<template>
  <main class="wizard-resume-gateway">
    <div class="wizard-resume-gateway__ambient" aria-hidden="true" />

    <section class="wizard-resume-gateway__content">
      <span class="wizard-resume-gateway__eyebrow">
        {{ t('wizard.living.resume.eyebrow') }}
      </span>

      <div class="wizard-resume-gateway__copy">
        <h1>{{ t('wizard.living.resume.title', { title: props.title }) }}</h1>
        <p>{{ t('wizard.living.resume.copy') }}</p>
      </div>

      <div class="wizard-resume-gateway__actions">
        <WizardLivingAction
          :label="t('wizard.living.resume.continue')"
          @click="emit('continue')"
        />
        <button type="button" class="wizard-resume-gateway__secondary" @click="emit('start-over')">
          {{ t('wizard.living.resume.startOver') }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wizard-resume-gateway {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: var(--themeBackground);
  color: var(--normalText);
}

.wizard-resume-gateway__ambient {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 52% 44% at 72% 22%, var(--secondary5), transparent 72%),
    radial-gradient(ellipse 44% 40% at 18% 78%, var(--primary5), transparent 76%);
}

.wizard-resume-gateway__content {
  display: grid;
  width: min(680px, calc(100% - 40px));
  gap: clamp(18px, 3vh, 28px);
  padding: clamp(28px, 5vw, 48px) 0;
  border-top: 1px solid var(--normalText10);
  border-bottom: 1px solid var(--normalText10);
}

.wizard-resume-gateway__eyebrow {
  color: var(--primary70);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.wizard-resume-gateway__copy {
  display: grid;
  gap: 12px;
}

.wizard-resume-gateway__copy h1 {
  max-width: 11ch;
  margin: 0;
  color: var(--normalText);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.2rem, 5vw, 4.8rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 0.98;
}

.wizard-resume-gateway__copy p {
  max-width: 58ch;
  margin: 0;
  color: var(--normalText50);
  font-size: 0.8rem;
  line-height: 1.7;
}

.wizard-resume-gateway__actions {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-top: 4px;
}

.wizard-resume-gateway__secondary {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--normalText40);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-resume-gateway__secondary:hover,
.wizard-resume-gateway__secondary:focus-visible {
  color: var(--primary);
}

.wizard-resume-gateway__secondary:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 5px;
}

@media (max-width: 560px) {
  .wizard-resume-gateway__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .wizard-resume-gateway__secondary {
    align-self: flex-start;
  }
}
</style>
