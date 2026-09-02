<script setup lang="ts">
import type {
  WizardModalOptionsQuestionDefinition,
  WizardSingleChoiceQuestionDefinition,
} from "~/wizard/definition";
import type { PortraitLivingScenePhase } from "~/wizard/portraitLivingScenePresentation";
import WizardEnvironmentRefinement from "./WizardEnvironmentRefinement.vue";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

const props = defineProps<{
  step: "environment" | "lighting";
  phase: PortraitLivingScenePhase;
  environmentQuestion: WizardSingleChoiceQuestionDefinition;
  backgroundOptionsQuestion?: WizardModalOptionsQuestionDefinition | null;
  lightingQuestion: WizardSingleChoiceQuestionDefinition;
  environmentValue?: unknown;
  detailValue?: unknown;
  backgroundOptionsValue?: unknown;
  lightingValue?: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose-environment", value: string): void;
  (event: "update-detail", value: string): void;
  (event: "update-background-options", value: Record<string, string>): void;
  (event: "phase", value: PortraitLivingScenePhase): void;
  (event: "continue-environment"): void;
  (event: "choose-lighting", value: string): void;
}>();

const { t, te } = useI18n();
const hoveredEnvironment = ref<string | null>(null);
const hoveredLighting = ref<string | null>(null);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const environmentText = computed(() => cleanString(props.environmentValue));
const detailText = computed(() => typeof props.detailValue === "string" ? props.detailValue : "");
const environmentDisplay = computed(() => hoveredEnvironment.value || environmentText.value);
const lightingDisplay = computed(() => hoveredLighting.value || cleanString(props.lightingValue));

const ambientClass = computed(() => {
  const value = props.step === "lighting" ? lightingDisplay.value : environmentDisplay.value;
  return value ? `is-${value}` : "";
});

function sceneLabel(value: string, fallback: string) {
  const key = `wizard.living.scene.environment.options.${value}`;
  return te(key) ? t(key) : fallback;
}

function lightingLabel(value: string, fallback: string) {
  const key = `wizard.living.scene.lighting.options.${value}`;
  return te(key) ? t(key) : fallback;
}

const detailPrompt = computed(() => {
  const value = environmentText.value;
  const key = `wizard.living.scene.environment.detail.${value}.prompt`;
  return value && te(key) ? t(key) : t("wizard.living.scene.environment.detail.fallbackPrompt");
});

const detailPlaceholder = computed(() => {
  const value = environmentText.value;
  const key = `wizard.living.scene.environment.detail.${value}.placeholder`;
  return value && te(key) ? t(key) : t("wizard.living.scene.environment.detail.optional");
});

function eventValue(event: Event) {
  return (event.target as HTMLInputElement | null)?.value || "";
}
</script>

<template>
  <section class="wizard-living-scene" :class="ambientClass">
    <span class="wizard-living-scene__ambient" aria-hidden="true" />

    <div
      v-if="props.step === 'environment' && props.phase === 'environment-choice'"
      class="wizard-living-scene__content">
      <p class="wizard-living-scene__prompt">
        {{ t('wizard.living.scene.environment.prompt') }}
      </p>

      <div class="wizard-living-scene__choices" @mouseleave="hoveredEnvironment = null">
        <div
          v-for="option in props.environmentQuestion.options"
          :key="option.value"
          @mouseenter="hoveredEnvironment = option.value"
          @focusin="hoveredEnvironment = option.value"
          @focusout="hoveredEnvironment = null">
          <WizardTypographicChoice
            :label="sceneLabel(option.value, option.label)"
            size="lg"
            nowrap
            :disabled="props.disabled"
            :dimmed="hoveredEnvironment !== null && hoveredEnvironment !== option.value"
            @select="emit('choose-environment', option.value)"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="props.step === 'environment' && props.phase === 'environment-detail'"
      class="wizard-living-scene__content wizard-living-scene__detail">
      <span class="wizard-living-scene__eyebrow">
        {{ t(`wizard.living.scene.environment.options.${environmentText}`) }}
      </span>
      <h1>{{ detailPrompt }}</h1>

      <input
        :value="detailText"
        :placeholder="detailPlaceholder"
        :disabled="props.disabled"
        autocomplete="off"
        @input="emit('update-detail', eventValue($event))"
      />

      <div class="wizard-living-scene__actions">
        <button
          type="button"
          :disabled="props.disabled"
          @click="emit('continue-environment')">
          {{ detailText.trim()
            ? t('wizard.living.scene.environment.continue')
            : t('wizard.living.scene.environment.skip') }}
        </button>
        <button
          v-if="props.backgroundOptionsQuestion"
          type="button"
          class="wizard-living-scene__refine-action"
          :disabled="props.disabled"
          @click="emit('phase', 'environment-refine')">
          {{ t('wizard.living.scene.environment.refine') }}
        </button>
      </div>
    </div>

    <WizardEnvironmentRefinement
      v-else-if="props.step === 'environment' && props.phase === 'environment-refine' && props.backgroundOptionsQuestion"
      :question="props.backgroundOptionsQuestion"
      :model-value="props.backgroundOptionsValue"
      :disabled="props.disabled"
      @update:model-value="emit('update-background-options', $event)"
      @back="emit('phase', 'environment-detail')"
      @done="emit('continue-environment')"
    />

    <div v-else class="wizard-living-scene__content">
      <p class="wizard-living-scene__prompt">
        {{ t('wizard.living.scene.lighting.prompt') }}
      </p>

      <div class="wizard-living-scene__choices" @mouseleave="hoveredLighting = null">
        <div
          v-for="option in props.lightingQuestion.options"
          :key="option.value"
          @mouseenter="hoveredLighting = option.value"
          @focusin="hoveredLighting = option.value"
          @focusout="hoveredLighting = null">
          <WizardTypographicChoice
            :label="lightingLabel(option.value, option.label)"
            size="lg"
            nowrap
            :disabled="props.disabled"
            :dimmed="hoveredLighting !== null && hoveredLighting !== option.value"
            @select="emit('choose-lighting', option.value)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard-living-scene {
  position: relative;
  isolation: isolate;
  width: min(920px, 100%);
}

.wizard-living-scene__ambient {
  position: fixed;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 500ms ease, background 500ms ease;
}

.wizard-living-scene.is-studio .wizard-living-scene__ambient {
  opacity: 1;
  background: radial-gradient(ellipse 70% 54% at 50% 56%, var(--normalText5), transparent 68%);
}

.wizard-living-scene.is-outdoor .wizard-living-scene__ambient {
  opacity: 1;
  background: linear-gradient(180deg, var(--primary15), transparent 72%);
}

.wizard-living-scene.is-abstract .wizard-living-scene__ambient {
  opacity: 1;
  background: radial-gradient(ellipse 66% 48% at 32% 64%, var(--primary15), transparent 66%);
}

.wizard-living-scene.is-soft .wizard-living-scene__ambient {
  opacity: 1;
  background: radial-gradient(ellipse 82% 62% at 50% 60%, var(--normalText5), transparent 72%);
}

.wizard-living-scene.is-dramatic .wizard-living-scene__ambient {
  opacity: 1;
  background: linear-gradient(135deg, var(--normalText10), transparent 54%);
}

.wizard-living-scene.is-moody .wizard-living-scene__ambient {
  opacity: 1;
  background: radial-gradient(ellipse 46% 54% at 28% 62%, var(--primary15), transparent 68%);
}

.wizard-living-scene.is-clean .wizard-living-scene__ambient {
  opacity: 1;
  background: radial-gradient(ellipse 96% 78% at 50% 50%, var(--normalText5), transparent 82%);
}

.wizard-living-scene__content {
  position: relative;
  z-index: 1;
  display: grid;
  max-width: 62ch;
  gap: clamp(28px, 5vh, 48px);
}

.wizard-living-scene__prompt,
.wizard-living-scene__detail h1 {
  margin: 0;
  color: var(--normalText60);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.45;
}

.wizard-living-scene__choices {
  display: grid;
  gap: clamp(14px, 2.2vh, 22px);
}

.wizard-living-scene__detail {
  gap: 18px;
}

.wizard-living-scene__eyebrow {
  color: var(--primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.wizard-living-scene__detail input {
  width: min(44ch, 100%);
  padding: 8px 0 9px;
  border: 0;
  border-bottom: 1px solid var(--normalText15);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--normalText);
  font-size: clamp(0.94rem, 1.5vw, 1.15rem);
  font-weight: 300;
  transition: border-color 180ms ease;
}

.wizard-living-scene__detail input:focus {
  border-bottom-color: var(--primary70);
  background: transparent;
  box-shadow: none;
}

.wizard-living-scene__detail input:focus-visible {
  outline: 0;
}

.wizard-living-scene__detail input::placeholder {
  color: var(--normalText25);
}

.wizard-living-scene__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 26px;
  margin-top: 12px;
}

.wizard-living-scene__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--normalText60);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.wizard-living-scene__actions button:hover,
.wizard-living-scene__actions button:focus-visible {
  color: var(--primary);
}

.wizard-living-scene__actions button:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 5px;
}

.wizard-living-scene__actions .wizard-living-scene__refine-action {
  color: var(--normalText25);
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-scene__ambient,
  .wizard-living-scene__detail input,
  .wizard-living-scene__actions button { transition: none; }
}
</style>
