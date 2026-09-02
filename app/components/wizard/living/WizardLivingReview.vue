<script setup lang="ts">
import WizardLivingAction from "./WizardLivingAction.vue";
import WizardLivingSentence from "./WizardLivingSentence.vue";
import type { WizardRuntimeReviewItem } from "~/wizard/registry";
import type {
  WizardLivingSentenceToken,
} from "~/wizard/portraitLivingPresentation";
import type {
  PortraitLivingReviewEditTarget,
} from "~/wizard/portraitLivingReviewPresentation";

const props = defineProps<{
  tokens: readonly WizardLivingSentenceToken[];
  items: readonly WizardRuntimeReviewItem[];
  mode: "image_to_image" | "text_to_image";
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "edit", target: PortraitLivingReviewEditTarget): void;
  (event: "finish"): void;
}>();

const { t } = useI18n();

function item(answerId: string) {
  return props.items.find((entry) => entry.answerId === answerId) || null;
}

function values(answerIds: readonly string[]) {
  return answerIds
    .map((answerId) => item(answerId)?.value || "")
    .filter(Boolean);
}

function joined(answerIds: readonly string[]) {
  return values(answerIds).join(" · ");
}

function target(answerId: string, fallbackStepId: string): PortraitLivingReviewEditTarget {
  const entry = item(answerId);
  return {
    answerId,
    stepId: entry?.stepId || fallbackStepId,
  };
}

const lookTarget = computed(() => {
  const answerId = ["expressionIntent", "hairIntent", "outfitIntent"]
    .find((id) => item(id)) || "expressionIntent";
  return target(answerId, "appearance");
});

const creativeRows = computed(() => [
  {
    id: "mode",
    label: t("wizard.living.review.rows.mode"),
    value: item("creationMode")?.value || "—",
    target: target("creationMode", "start"),
  },
  {
    id: "people",
    label: t("wizard.living.review.rows.people"),
    value: item("subjects")?.value || "—",
    target: target("subjects", "subjects"),
  },
  {
    id: "portrait",
    label: t("wizard.living.review.rows.portrait"),
    value: item("portraitIntent")?.value || "—",
    target: target("portraitIntent", "intent"),
  },
  {
    id: "look",
    label: t("wizard.living.review.rows.look"),
    value: joined([
      "expressionIntent",
      "hairIntent",
      "outfitIntent",
    ]) || t("wizard.living.review.notSet"),
    target: lookTarget.value,
  },
  {
    id: "composition",
    label: t("wizard.living.review.rows.composition"),
    value: joined(["framingIntent", "poseIntent"]) || "—",
    target: target("framingIntent", "composition"),
  },
  {
    id: "scene",
    label: t("wizard.living.review.rows.scene"),
    value: joined([
      "environmentType",
      "studioDirection",
      "outdoorSetting",
      "abstractDirection",
      "lightingIntent",
    ]) || "—",
    target: target("environmentType", "environment"),
  },
]);

const technicalRows = computed(() => {
  const rows = [
    {
      id: "aspect-ratio",
      label: t("wizard.living.review.rows.aspectRatio"),
      value: item("aspectRatio")?.value || "—",
      target: target("aspectRatio", "final-settings"),
    },
  ];

  if (props.mode === "image_to_image") {
    rows.push(
      {
        id: "reference",
        label: t("wizard.living.review.rows.referenceFidelity"),
        value: item("referenceUsage")?.value || "—",
        target: target("referenceUsage", "final-settings"),
      },
      {
        id: "strength",
        label: t("wizard.living.review.rows.transformationStrength"),
        value: item("transformationStrength")?.value || "—",
        target: target("transformationStrength", "final-settings"),
      },
    );
  }

  return rows;
});

function editToken(token: WizardLivingSentenceToken) {
  if (!token.answerId || !token.stepId) return;
  emit("edit", { answerId: token.answerId, stepId: token.stepId });
}
</script>

<template>
  <section class="wizard-living-review">
    <div class="wizard-living-review__column">
      <div class="wizard-living-review__column-stage">
        <div class="wizard-living-review__column-content wizard-living-review__column-content--creative">
          <header class="wizard-living-review__header">
            <span>{{ t('wizard.living.review.eyebrow') }}</span>
            <h1>{{ t('wizard.living.review.title') }}</h1>
            <p>{{ t('wizard.living.review.subcopy') }}</p>
          </header>

          <div class="wizard-living-review__sentence">
            <WizardLivingSentence
              :tokens="props.tokens"
              :compact="false"
              editable
              @navigate="editToken"
            />
            <p class="wizard-living-review__hint">
              {{ t('wizard.living.review.editHint') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-living-review__column">
      <div class="wizard-living-review__column-stage">
        <div class="wizard-living-review__column-content wizard-living-review__column-content--recap">
          <div class="wizard-living-review__recap">
            <section>
              <span class="wizard-living-review__section-label">
                {{ t('wizard.living.review.creative') }}
              </span>
              <button
                v-for="row in creativeRows"
                :key="row.id"
                type="button"
                class="wizard-living-review__row"
                :disabled="props.disabled"
                @click="emit('edit', row.target)">
                <span>{{ row.label }}</span>
                <strong>{{ row.value }}</strong>
                <i aria-hidden="true">↗</i>
              </button>
            </section>

            <section>
              <span class="wizard-living-review__section-label">
                {{ t('wizard.living.review.technical') }}
              </span>
              <button
                v-for="row in technicalRows"
                :key="row.id"
                type="button"
                class="wizard-living-review__row"
                :disabled="props.disabled"
                @click="emit('edit', row.target)">
                <span>{{ row.label }}</span>
                <strong>{{ row.value }}</strong>
                <i aria-hidden="true">↗</i>
              </button>
            </section>
          </div>

          <div class="wizard-living-review__action">
            <WizardLivingAction
              :label="t('wizard.living.review.generate')"
              :disabled="props.disabled"
              @click="emit('finish')"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard-living-review {
  display: grid;
  width: min(1420px, 100%);
  min-width: 0;
  margin: 0 auto;
  gap: clamp(36px, 5vw, 76px);
}

.wizard-living-review__column,
.wizard-living-review__column-stage,
.wizard-living-review__column-content {
  min-width: 0;
}

.wizard-living-review__column-content {
  display: grid;
  width: 100%;
}

.wizard-living-review__column-content--creative {
  gap: clamp(28px, 5vh, 52px);
}

.wizard-living-review__column-content--recap {
  gap: clamp(26px, 4vh, 42px);
}

.wizard-living-review__header {
  display: grid;
  max-width: 54ch;
  gap: 10px;
}

.wizard-living-review__header > span,
.wizard-living-review__section-label {
  color: var(--primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.wizard-living-review__header h1 {
  margin: 0;
  color: var(--normalText);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 0.98;
}

.wizard-living-review__header p,
.wizard-living-review__hint {
  margin: 0;
  color: var(--normalText40);
  font-size: 0.78rem;
  line-height: 1.6;
}

.wizard-living-review__sentence {
  display: grid;
  gap: 16px;
  padding: clamp(24px, 3vw, 36px) 0;
  border-top: 1px solid var(--normalText10);
  border-bottom: 1px solid var(--normalText10);
}

.wizard-living-review__recap {
  display: grid;
  gap: clamp(24px, 3vh, 34px);
}

.wizard-living-review__recap section {
  display: grid;
  align-content: start;
}

.wizard-living-review__section-label {
  display: block;
  margin-bottom: 12px;
  color: var(--normalText25);
}

.wizard-living-review__row {
  display: grid;
  grid-template-columns: minmax(90px, 0.38fr) minmax(0, 1fr) auto;
  gap: 16px;
  align-items: baseline;
  width: 100%;
  padding: 13px 0;
  border: 0;
  border-top: 1px solid var(--normalText10);
  background: transparent;
  color: inherit;
  text-align: left;
  transition: border-color 180ms ease, color 180ms ease;
}

.wizard-living-review__row:last-child {
  border-bottom: 1px solid var(--normalText10);
}

.wizard-living-review__row > span {
  color: var(--normalText40);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wizard-living-review__row strong {
  overflow: hidden;
  color: var(--normalText60);
  font-size: 0.82rem;
  font-weight: 450;
  line-height: 1.45;
  text-overflow: ellipsis;
}

.wizard-living-review__row i {
  color: var(--normalText15);
  font-size: 0.72rem;
  font-style: normal;
  transition: color 180ms ease, transform 180ms ease;
}

.wizard-living-review__row:hover,
.wizard-living-review__row:focus-visible {
  border-color: var(--primary30);
}

.wizard-living-review__row:hover strong,
.wizard-living-review__row:focus-visible strong,
.wizard-living-review__row:hover i,
.wizard-living-review__row:focus-visible i {
  color: var(--primary);
}

.wizard-living-review__row:hover i,
.wizard-living-review__row:focus-visible i {
  transform: translate(2px, -2px);
}

.wizard-living-review__row:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 4px;
}

.wizard-living-review__action {
  display: flex;
  justify-content: flex-end;
}

.wizard-living-review:dir(rtl) .wizard-living-review__header,
.wizard-living-review:dir(rtl) .wizard-living-review__row {
  text-align: right;
}

.wizard-living-review:dir(rtl) .wizard-living-review__header h1 {
  font-family: var(--app-font-family, system-ui, sans-serif);
  letter-spacing: 0;
  line-height: 1.25;
}

.wizard-living-review:dir(rtl) .wizard-living-review__header > span,
.wizard-living-review:dir(rtl) .wizard-living-review__section-label,
.wizard-living-review:dir(rtl) .wizard-living-review__row > span {
  letter-spacing: 0;
  text-transform: none;
}

.wizard-living-review:dir(rtl) .wizard-living-review__action {
  justify-content: flex-start;
}

@media (min-width: 1080px) {
  .wizard-living-review {
    grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
    grid-template-rows: minmax(0, 1fr);
    align-self: stretch;
    min-height: 0;
    overflow: hidden;
  }

  .wizard-living-review__column {
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    padding-block: clamp(18px, 3vh, 34px);
  }

  .wizard-living-review__column-stage {
    flex: 0 0 auto;
    width: 100%;
    margin-block: auto;
  }

  .wizard-living-review__header h1 {
    font-size: clamp(3rem, 4.7vw, 4.8rem);
  }
}

@media (max-width: 760px) {
  .wizard-living-review__row {
    grid-template-columns: 92px minmax(0, 1fr) auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-review__row,
  .wizard-living-review__row i {
    transition: none;
  }
}
</style>