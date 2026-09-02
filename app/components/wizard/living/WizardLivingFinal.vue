<script setup lang="ts">
import type { WizardSingleChoiceQuestionDefinition } from "~/wizard/definition";
import type { WizardEntityPromptMode } from "~/wizard/entities";
import type { PortraitLivingFinalPhase } from "~/wizard/portraitLivingFinalPresentation";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

const props = defineProps<{
  phase: PortraitLivingFinalPhase;
  mode: WizardEntityPromptMode;
  aspectRatioQuestion: WizardSingleChoiceQuestionDefinition;
  referenceUsageQuestion?: WizardSingleChoiceQuestionDefinition | null;
  transformationStrengthQuestion?: WizardSingleChoiceQuestionDefinition | null;
  aspectRatioValue?: unknown;
  referenceUsageValue?: unknown;
  transformationStrengthValue?: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose-aspect-ratio", value: string): void;
  (event: "choose-reference-usage", value: string): void;
  (event: "choose-transformation-strength", value: string): void;
}>();

const { t } = useI18n();
const hoveredRatio = ref<string | null>(null);
const hoveredReference = ref<string | null>(null);
const hoveredStrength = ref<string | null>(null);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const aspectRatioText = computed(() => cleanString(props.aspectRatioValue));
const referenceUsageText = computed(() => cleanString(props.referenceUsageValue));
const transformationStrengthText = computed(() => cleanString(props.transformationStrengthValue));

function ratioDimensions(value: string) {
  const [widthRaw, heightRaw] = value.split(":");
  const width = Number(widthRaw);
  const height = Number(heightRaw);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: "72px", height: "72px" };
  }

  const max = 72;
  if (width >= height) {
    return {
      width: `${max}px`,
      height: `${Math.round((max * height) / width)}px`,
    };
  }
  return {
    width: `${Math.round((max * width) / height)}px`,
    height: `${max}px`,
  };
}

function ratioDescriptor(value: string) {
  if (value === "1:1") return t("wizard.living.final.aspectRatio.descriptors.square");
  if (value === "9:16") return t("wizard.living.final.aspectRatio.descriptors.vertical");
  if (value === "4:5" || value === "3:4") {
    return t("wizard.living.final.aspectRatio.descriptors.portrait");
  }
  return t("wizard.living.final.aspectRatio.descriptors.landscape");
}

function referenceDescription(value: string) {
  const key = value === "strict" || value === "balanced" || value === "loose"
    ? value
    : "balanced";
  return t(`wizard.living.final.referenceFidelity.descriptions.${key}`);
}

function strengthDescription(value: string) {
  const key = value === "subtle" || value === "balanced" || value === "strong" || value === "extreme"
    ? value
    : "balanced";
  return t(`wizard.living.final.transformationStrength.descriptions.${key}`);
}
</script>

<template>
  <section class="wizard-living-final">
    <div v-if="props.phase === 'aspect-ratio'" class="wizard-living-final__ratio-state">
      <div class="wizard-living-final__header">
        <span>{{ t('wizard.living.final.aspectRatio.eyebrow') }}</span>
        <h1>{{ t('wizard.living.final.aspectRatio.prompt') }}</h1>
      </div>

      <div
        class="wizard-living-final__ratios"
        role="list"
        :aria-label="t('wizard.living.final.aspectRatio.ariaLabel')"
        @mouseleave="hoveredRatio = null">
        <button
          v-for="option in props.aspectRatioQuestion.options"
          :key="option.value"
          type="button"
          class="wizard-living-final__ratio"
          :class="{
            'is-hovered': hoveredRatio === option.value,
            'is-selected': aspectRatioText === option.value,
            'is-dimmed': hoveredRatio !== null && hoveredRatio !== option.value,
          }"
          :disabled="props.disabled"
          @mouseenter="hoveredRatio = option.value"
          @focus="hoveredRatio = option.value"
          @blur="hoveredRatio = null"
          @click="emit('choose-aspect-ratio', option.value)">
          <span
            class="wizard-living-final__ratio-frame"
            :style="ratioDimensions(option.value)"
            aria-hidden="true"
          />
          <span class="wizard-living-final__ratio-copy">
            <strong>{{ option.value }}</strong>
            <small>{{ ratioDescriptor(option.value) }}</small>
          </span>
        </button>
      </div>
    </div>

    <div
      v-else-if="props.phase === 'reference-fidelity' && props.referenceUsageQuestion"
      class="wizard-living-final__choice-state">
      <div class="wizard-living-final__header">
        <span>{{ t('wizard.living.final.referenceFidelity.eyebrow') }}</span>
        <h1>{{ t('wizard.living.final.referenceFidelity.prompt') }}</h1>
      </div>

      <div class="wizard-living-final__choices" @mouseleave="hoveredReference = null">
        <div
          v-for="option in props.referenceUsageQuestion.options"
          :key="option.value"
          @mouseenter="hoveredReference = option.value"
          @focusin="hoveredReference = option.value"
          @focusout="hoveredReference = null">
          <WizardTypographicChoice
            :label="option.label"
            :description="referenceDescription(option.value)"
            size="lg"
            :selected="referenceUsageText === option.value"
            :dimmed="hoveredReference !== null && hoveredReference !== option.value"
            :disabled="props.disabled"
            @select="emit('choose-reference-usage', option.value)"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="props.phase === 'transformation-strength' && props.transformationStrengthQuestion"
      class="wizard-living-final__choice-state">
      <div class="wizard-living-final__header">
        <span>{{ t('wizard.living.final.transformationStrength.eyebrow') }}</span>
        <h1>{{ t('wizard.living.final.transformationStrength.prompt') }}</h1>
      </div>

      <div class="wizard-living-final__choices" @mouseleave="hoveredStrength = null">
        <div
          v-for="option in props.transformationStrengthQuestion.options"
          :key="option.value"
          @mouseenter="hoveredStrength = option.value"
          @focusin="hoveredStrength = option.value"
          @focusout="hoveredStrength = null">
          <WizardTypographicChoice
            :label="option.label"
            :description="strengthDescription(option.value)"
            size="lg"
            :selected="transformationStrengthText === option.value"
            :dimmed="hoveredStrength !== null && hoveredStrength !== option.value"
            :disabled="props.disabled"
            @select="emit('choose-transformation-strength', option.value)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard-living-final {
  width: min(100%, 980px);
  margin: 0 auto;
}

.wizard-living-final__header {
  margin-bottom: clamp(2.2rem, 6vw, 4.8rem);
}

.wizard-living-final__header > span {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--normalText25);
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.wizard-living-final__header h1 {
  max-width: 26ch;
  margin: 0;
  color: var(--normalText60);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.08rem, 2.3vw, 1.65rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.4;
}

.wizard-living-final__ratios {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: clamp(1.4rem, 3vw, 2.5rem);
}

.wizard-living-final__ratio {
  display: flex;
  min-width: 76px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--normalText);
  align-items: center;
  flex-direction: column;
  gap: 0.8rem;
  opacity: 0.78;
  transform: translateY(0);
  transition: opacity 260ms ease, transform 280ms ease;
}

.wizard-living-final__ratio:hover,
.wizard-living-final__ratio:focus-visible,
.wizard-living-final__ratio.is-hovered,
.wizard-living-final__ratio.is-selected {
  opacity: 1;
  transform: translateY(-4px);
}

.wizard-living-final__ratio.is-dimmed { opacity: 0.14; }

.wizard-living-final__ratio:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 8px;
}

.wizard-living-final__ratio-frame {
  display: block;
  box-sizing: border-box;
  border: 1px solid var(--normalText15);
  background: transparent;
  transition: border-color 260ms ease, background 260ms ease;
}

.wizard-living-final__ratio:hover .wizard-living-final__ratio-frame,
.wizard-living-final__ratio:focus-visible .wizard-living-final__ratio-frame,
.wizard-living-final__ratio.is-selected .wizard-living-final__ratio-frame {
  border-color: var(--primary70);
  background: var(--primary05);
}

.wizard-living-final__ratio-copy {
  display: grid;
  gap: 0.15rem;
  text-align: center;
}

.wizard-living-final__ratio-copy strong {
  color: var(--normalText60);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.wizard-living-final__ratio-copy small {
  color: var(--normalText25);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.wizard-living-final__choices {
  display: grid;
  max-width: 760px;
  gap: clamp(1.2rem, 3vw, 2rem);
}

@media (max-width: 680px) {
  .wizard-living-final__ratios {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }

  .wizard-living-final__ratio { min-width: 0; }
}

@media (max-width: 420px) {
  .wizard-living-final__ratios { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-final__ratio,
  .wizard-living-final__ratio-frame { transition: none; }
}
</style>
