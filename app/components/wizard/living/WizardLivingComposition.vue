<script setup lang="ts">
import type {
  WizardModalFieldDefinition,
  WizardModalOptionsQuestionDefinition,
  WizardSingleChoiceQuestionDefinition,
  WizardSubjectOverridesQuestionDefinition,
} from "~/wizard/definition";
import {
  getWizardEntityDisplayLabel,
  type WizardEntityAnswer,
} from "~/wizard/entities";
import type { PortraitLivingCompositionPhase } from "~/wizard/portraitLivingPresentation";
import WizardFramingPreview from "./WizardFramingPreview.vue";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

type SubjectOverrideState = Record<
  string,
  { intent?: string; options?: Record<string, string> }
>;

const props = defineProps<{
  phase: PortraitLivingCompositionPhase;
  framingQuestion: WizardSingleChoiceQuestionDefinition;
  poseQuestion: WizardSingleChoiceQuestionDefinition;
  poseOptionsQuestion?: WizardModalOptionsQuestionDefinition | null;
  poseOverrideQuestion?: WizardSubjectOverridesQuestionDefinition | null;
  subjects: readonly WizardEntityAnswer[];
  framingValue?: unknown;
  poseValue?: unknown;
  poseOptionsValue?: unknown;
  poseOverridesValue?: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose-framing", value: string): void;
  (event: "choose-pose", value: string): void;
  (event: "update-pose-options", value: Record<string, string>): void;
  (event: "update-pose-overrides", value: SubjectOverrideState): void;
  (event: "continue"): void;
}>();

const { t } = useI18n();
const hoveredFraming = ref<string | null>(null);
const hoveredPose = ref<string | null>(null);
const detailsOpen = ref(false);
const individualOpen = ref(false);
const selectedSubjectId = ref("");

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && item.trim()) result[key] = item;
  }
  return result;
}

function normalizedOverrides(value: unknown): SubjectOverrideState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const validIds = new Set(props.subjects.map((subject) => subject.id));
  const result: SubjectOverrideState = {};

  for (const [subjectId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!validIds.has(subjectId) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const record = raw as Record<string, unknown>;
    const intent = cleanString(record.intent) || undefined;
    const options = cleanStringMap(record.options);
    if (intent || Object.keys(options).length) {
      result[subjectId] = { ...(intent ? { intent } : {}), options };
    }
  }
  return result;
}

const sharedPoseOptions = computed(() => cleanStringMap(props.poseOptionsValue));
const poseOverrides = computed(() => normalizedOverrides(props.poseOverridesValue));
const poseText = computed(() => cleanString(props.poseValue));
const sharedPoseLabel = computed(() =>
  props.poseQuestion.options.find((option) => option.value === poseText.value)?.label ||
  poseText.value.replaceAll("_", " "),
);
const overrideCount = computed(() => Object.keys(poseOverrides.value).length);
const selectedSubject = computed(() =>
  props.subjects.find((subject) => subject.id === selectedSubjectId.value) || null,
);
const selectedSubjectIndex = computed(() =>
  props.subjects.findIndex((subject) => subject.id === selectedSubjectId.value),
);
const selectedOverride = computed(() =>
  selectedSubjectId.value ? poseOverrides.value[selectedSubjectId.value] : undefined,
);
const framingPreviewValue = computed(() => hoveredFraming.value || cleanString(props.framingValue));
const framingPreviewLabel = computed(() => {
  const value = framingPreviewValue.value;
  if (!value) return t("wizard.living.composition.framing.previewHint");
  return props.framingQuestion.options.find((option) => option.value === value)?.label || value;
});

function framingDescription(value: string) {
  const keys: Record<string, string> = {
    headshot: "headshot",
    head_shoulders: "headShoulders",
    half_body: "halfBody",
    full_body: "fullBody",
  };
  const key = keys[value];
  return key
    ? t(`wizard.living.composition.framing.descriptions.${key}`)
    : undefined;
}

function subjectLabel(subject: WizardEntityAnswer, index: number) {
  return getWizardEntityDisplayLabel(subject, index, props.subjects.length);
}

function eventValue(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
  return target?.value || "";
}

function fieldValue(field: WizardModalFieldDefinition, source: Record<string, string>) {
  return source[field.id] || "";
}

function updateSharedPoseOption(fieldId: string, value: unknown) {
  const next = { ...sharedPoseOptions.value };
  const cleaned = cleanString(value);
  if (cleaned) next[fieldId] = cleaned;
  else delete next[fieldId];
  emit("update-pose-options", next);
}

function selectSubject(subjectId: string) {
  selectedSubjectId.value = subjectId;
}

function customizeSelectedSubject() {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.poseOverridesValue);
  next[subject.id] = {
    ...(poseText.value ? { intent: poseText.value } : {}),
    options: { ...sharedPoseOptions.value },
  };
  emit("update-pose-overrides", next);
}

function useSharedForSelectedSubject() {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.poseOverridesValue);
  delete next[subject.id];
  emit("update-pose-overrides", next);
}

function updateSelectedOverrideIntent(value: string) {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.poseOverridesValue);
  const existing = next[subject.id] || { options: { ...sharedPoseOptions.value } };
  next[subject.id] = {
    ...existing,
    intent: value,
    options: { ...(existing.options || {}) },
  };
  emit("update-pose-overrides", next);
}

function updateSelectedOverrideOption(fieldId: string, value: unknown) {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.poseOverridesValue);
  const existing = next[subject.id] || {
    ...(poseText.value ? { intent: poseText.value } : {}),
    options: { ...sharedPoseOptions.value },
  };
  const options = { ...(existing.options || {}) };
  const cleaned = cleanString(value);
  if (cleaned) options[fieldId] = cleaned;
  else delete options[fieldId];
  next[subject.id] = { ...existing, options };
  emit("update-pose-overrides", next);
}

function resetDisclosure() {
  detailsOpen.value = Object.keys(sharedPoseOptions.value).length > 0;
  individualOpen.value = overrideCount.value > 0;
  selectedSubjectId.value =
    props.subjects.find((subject) => poseOverrides.value[subject.id])?.id ||
    props.subjects[0]?.id ||
    "";
}

watch(() => props.phase, resetDisclosure, { immediate: true });
watch(
  () => props.subjects.map((subject) => subject.id).join("|"),
  () => {
    if (!props.subjects.some((subject) => subject.id === selectedSubjectId.value)) {
      selectedSubjectId.value = props.subjects[0]?.id || "";
    }
  },
);
</script>

<template>
  <section class="wizard-living-composition">
    <div v-if="props.phase === 'framing'" class="wizard-living-composition__framing">
      <div class="wizard-living-composition__framing-main">
        <p class="wizard-living-composition__prompt">
          {{ t('wizard.living.composition.framing.prompt') }}
        </p>

        <div class="wizard-living-composition__choices" @mouseleave="hoveredFraming = null">
          <div
            v-for="option in props.framingQuestion.options"
            :key="option.value"
            @mouseenter="hoveredFraming = option.value"
            @focusin="hoveredFraming = option.value"
            @focusout="hoveredFraming = null">
            <WizardTypographicChoice
              :label="option.label"
              :description="framingDescription(option.value)"
              size="md"
              nowrap
              :disabled="props.disabled"
              :dimmed="hoveredFraming !== null && hoveredFraming !== option.value"
              @select="emit('choose-framing', option.value)"
            />
          </div>
        </div>
      </div>

      <aside class="wizard-living-composition__preview">
        <WizardFramingPreview :framing="framingPreviewValue" />
        <span>{{ framingPreviewLabel }}</span>
      </aside>
    </div>

    <div v-else-if="props.phase === 'pose-choice'" class="wizard-living-composition__pose-choice">
      <div class="wizard-living-composition__header">
        <span>{{ t('wizard.living.composition.pose.eyebrow') }}</span>
        <h1>
          {{ props.subjects.length > 1
            ? t('wizard.living.composition.pose.promptMultiple')
            : t('wizard.living.composition.pose.prompt') }}
        </h1>
        <p v-if="props.subjects.length > 1">
          {{ t('wizard.living.composition.pose.sharedFirst') }}
        </p>
      </div>

      <div class="wizard-living-composition__choices" @mouseleave="hoveredPose = null">
        <div
          v-for="option in props.poseQuestion.options"
          :key="option.value"
          @mouseenter="hoveredPose = option.value"
          @focusin="hoveredPose = option.value"
          @focusout="hoveredPose = null">
          <WizardTypographicChoice
            :label="option.label"
            size="md"
            nowrap
            :disabled="props.disabled"
            :dimmed="hoveredPose !== null && hoveredPose !== option.value"
            @select="emit('choose-pose', option.value)"
          />
        </div>
      </div>
    </div>

    <div v-else class="wizard-living-composition__pose-refine">
      <div class="wizard-living-composition__header">
        <span>{{ t('wizard.living.composition.pose.eyebrow') }}</span>
        <h1>{{ t('wizard.living.composition.pose.resolved', { value: sharedPoseLabel }) }}</h1>
      </div>

      <div class="wizard-living-composition__shared-line">
        <span>{{ t('wizard.living.composition.pose.shared') }}</span>
        <strong>{{ sharedPoseLabel }}</strong>
      </div>

      <div class="wizard-living-composition__refine-actions">
        <button
          v-if="props.poseOptionsQuestion"
          type="button"
          :disabled="props.disabled"
          :class="{ 'is-active': detailsOpen }"
          @click="detailsOpen = !detailsOpen">
          {{ detailsOpen
            ? t('wizard.living.composition.pose.hideFineTuning')
            : t('wizard.living.composition.pose.fineTuneDetails') }}
        </button>
        <button
          v-if="props.subjects.length > 1 && props.poseOverrideQuestion"
          type="button"
          :disabled="props.disabled"
          :class="{ 'is-active': individualOpen || overrideCount > 0 }"
          @click="individualOpen = !individualOpen">
          {{ overrideCount
            ? t('wizard.living.composition.pose.adjustIndividuallyCount', { count: overrideCount })
            : t('wizard.living.composition.pose.adjustIndividually') }}
        </button>
      </div>

      <div v-if="detailsOpen && props.poseOptionsQuestion" class="wizard-living-composition__panel">
        <div class="wizard-living-composition__panel-heading">
          <span>{{ t('wizard.living.composition.pose.fineTune') }}</span>
          <p>{{ t('wizard.living.composition.pose.fineTuneDescription') }}</p>
        </div>

        <div class="wizard-living-composition__fields">
          <div
            v-for="field in props.poseOptionsQuestion.fields"
            :key="field.id"
            class="wizard-living-composition__field">
            <div class="wizard-living-composition__field-label">
              <strong>{{ field.title }}</strong>
              <small v-if="field.description">{{ field.description }}</small>
            </div>

            <div v-if="field.type === 'singleChoice'" class="wizard-living-composition__chips">
              <button
                v-for="option in field.options"
                :key="option.value"
                type="button"
                :disabled="props.disabled"
                :class="{ 'is-selected': fieldValue(field, sharedPoseOptions) === option.value }"
                @click="updateSharedPoseOption(field.id, option.value)">
                {{ option.label }}
              </button>
            </div>

            <textarea
              v-else
              :value="fieldValue(field, sharedPoseOptions)"
              :rows="field.rows || 2"
              :placeholder="field.placeholder"
              :disabled="props.disabled"
              @input="updateSharedPoseOption(field.id, eventValue($event))"
            />
          </div>
        </div>
      </div>

      <div
        v-if="individualOpen && props.subjects.length > 1 && props.poseOverrideQuestion"
        class="wizard-living-composition__panel">
        <div class="wizard-living-composition__panel-heading">
          <span>{{ t('wizard.living.composition.pose.individual') }}</span>
          <p>{{ t('wizard.living.composition.pose.individualDescription') }}</p>
        </div>

        <div
          class="wizard-living-composition__subject-picker"
          role="list"
          :aria-label="t('wizard.living.composition.pose.subjectsAria')">
          <button
            v-for="(subject, index) in props.subjects"
            :key="subject.id"
            type="button"
            :disabled="props.disabled"
            :class="{
              'is-selected': selectedSubjectId === subject.id,
              'is-custom': Boolean(poseOverrides[subject.id]),
            }"
            @click="selectSubject(subject.id)">
            <span>{{ subjectLabel(subject, index) }}</span>
            <small>
              {{ poseOverrides[subject.id]
                ? t('wizard.living.composition.pose.custom')
                : t('wizard.living.composition.pose.sharedStatus') }}
            </small>
          </button>
        </div>

        <div v-if="selectedSubject" class="wizard-living-composition__subject-editor">
          <div class="wizard-living-composition__subject-summary">
            <div>
              <span>{{ subjectLabel(selectedSubject, selectedSubjectIndex) }}</span>
              <small>
                {{ t('wizard.living.composition.pose.sharedDirection', { value: sharedPoseLabel }) }}
              </small>
            </div>
            <button
              v-if="selectedOverride"
              type="button"
              :disabled="props.disabled"
              @click="useSharedForSelectedSubject">
              {{ t('wizard.living.composition.pose.useShared') }}
            </button>
            <button
              v-else
              type="button"
              :disabled="props.disabled"
              @click="customizeSelectedSubject">
              {{ t('wizard.living.composition.pose.changeForPerson') }}
            </button>
          </div>

          <template v-if="selectedOverride">
            <div class="wizard-living-composition__chips wizard-living-composition__chips--intent">
              <button
                v-for="option in props.poseQuestion.options"
                :key="option.value"
                type="button"
                :disabled="props.disabled"
                :class="{ 'is-selected': selectedOverride.intent === option.value }"
                @click="updateSelectedOverrideIntent(option.value)">
                {{ option.label }}
              </button>
            </div>

            <div v-if="props.poseOptionsQuestion" class="wizard-living-composition__fields">
              <div
                v-for="field in props.poseOptionsQuestion.fields"
                :key="field.id"
                class="wizard-living-composition__field">
                <div class="wizard-living-composition__field-label">
                  <strong>{{ field.title }}</strong>
                </div>
                <div v-if="field.type === 'singleChoice'" class="wizard-living-composition__chips">
                  <button
                    v-for="option in field.options"
                    :key="option.value"
                    type="button"
                    :disabled="props.disabled"
                    :class="{ 'is-selected': selectedOverride.options?.[field.id] === option.value }"
                    @click="updateSelectedOverrideOption(field.id, option.value)">
                    {{ option.label }}
                  </button>
                </div>
                <textarea
                  v-else
                  :value="selectedOverride.options?.[field.id] || ''"
                  :rows="field.rows || 2"
                  :placeholder="field.placeholder"
                  :disabled="props.disabled"
                  @input="updateSelectedOverrideOption(field.id, eventValue($event))"
                />
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="wizard-living-composition__continue">
        <button type="button" :disabled="props.disabled" @click="emit('continue')">
          {{ t('wizard.living.composition.pose.continue') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard-living-composition {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

.wizard-living-composition__framing {
  display: flex;
  align-items: flex-start;
  gap: clamp(44px, 8vw, 92px);
}

.wizard-living-composition__framing-main {
  flex: 1 1 auto;
  min-width: 0;
}

.wizard-living-composition__prompt {
  margin: 0 0 clamp(34px, 6vh, 58px);
  color: var(--normalText50);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.wizard-living-composition__choices {
  display: grid;
  gap: 17px;
  max-width: 760px;
}

.wizard-living-composition__preview {
  display: grid;
  flex: 0 0 132px;
  justify-items: center;
  gap: 12px;
  padding-top: 36px;
}

.wizard-living-composition__preview > span,
.wizard-living-composition__header > span,
.wizard-living-composition__panel-heading > span,
.wizard-living-composition__shared-line > span {
  color: var(--primary70);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.wizard-living-composition__preview > span {
  color: var(--normalText20);
  text-align: center;
}

.wizard-living-composition__pose-choice,
.wizard-living-composition__pose-refine {
  display: grid;
  gap: clamp(30px, 5vh, 54px);
}

.wizard-living-composition__header {
  display: grid;
  gap: 8px;
  max-width: 760px;
}

.wizard-living-composition__header h1 {
  margin: 0;
  color: var(--normalText);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.45rem, 3vw, 2.55rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.wizard-living-composition__header p,
.wizard-living-composition__panel-heading p {
  margin: 0;
  color: var(--normalText40);
  font-size: 0.76rem;
  line-height: 1.6;
}

.wizard-living-composition__shared-line {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.wizard-living-composition__shared-line strong {
  color: var(--normalText);
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  font-weight: 500;
  text-transform: uppercase;
}

.wizard-living-composition__refine-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.wizard-living-composition__refine-actions button,
.wizard-living-composition__subject-summary > button,
.wizard-living-composition__continue button {
  padding: 9px 14px;
  border: 1px solid var(--normalText15);
  border-radius: 999px;
  background: transparent;
  color: var(--normalText60);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
}

.wizard-living-composition__refine-actions button.is-active,
.wizard-living-composition__refine-actions button:hover,
.wizard-living-composition__refine-actions button:focus-visible,
.wizard-living-composition__subject-summary > button:hover,
.wizard-living-composition__subject-summary > button:focus-visible {
  border-color: var(--primary45);
  color: var(--normalText);
}

.wizard-living-composition__panel {
  display: grid;
  gap: 20px;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid var(--normalText10);
  background: var(--themeSurface);
}

.wizard-living-composition__panel-heading {
  display: grid;
  gap: 5px;
}

.wizard-living-composition__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 22px;
}

.wizard-living-composition__field {
  display: grid;
  align-content: start;
  gap: 9px;
}

.wizard-living-composition__field-label {
  display: grid;
  gap: 3px;
}

.wizard-living-composition__field-label strong {
  color: var(--normalText);
  font-size: 0.76rem;
  font-weight: 600;
}

.wizard-living-composition__field-label small {
  color: var(--normalText35);
  font-size: 0.66rem;
  line-height: 1.45;
}

.wizard-living-composition__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.wizard-living-composition__chips button,
.wizard-living-composition__subject-picker button {
  border: 1px solid var(--normalText10);
  border-radius: 8px;
  background: transparent;
  color: var(--normalText45);
  font-size: 0.68rem;
}

.wizard-living-composition__chips button.is-selected,
.wizard-living-composition__chips button:hover,
.wizard-living-composition__chips button:focus-visible,
.wizard-living-composition__subject-picker button.is-selected {
  border-color: var(--primary50);
  background: var(--primary05);
  color: var(--normalText);
}

.wizard-living-composition__field textarea {
  min-height: 74px;
  border: 1px solid var(--normalText10);
  border-radius: 8px;
  background: var(--themeBackground);
  color: var(--normalText);
  font-size: 0.75rem;
}

.wizard-living-composition__subject-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.wizard-living-composition__subject-picker button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
}

.wizard-living-composition__subject-picker button small {
  color: var(--normalText30);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wizard-living-composition__subject-picker button.is-custom small {
  color: var(--primary80);
}

.wizard-living-composition__subject-editor {
  display: grid;
  gap: 18px;
  padding-top: 6px;
}

.wizard-living-composition__subject-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.wizard-living-composition__subject-summary > div {
  display: grid;
  gap: 3px;
}

.wizard-living-composition__subject-summary span {
  color: var(--normalText);
  font-size: 0.9rem;
  font-weight: 600;
}

.wizard-living-composition__subject-summary small {
  color: var(--normalText35);
  font-size: 0.66rem;
}

.wizard-living-composition__continue {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.wizard-living-composition__continue button {
  border-color: var(--primary45);
  color: var(--primary90);
}

button:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 4px;
}

@media (max-width: 720px) {
  .wizard-living-composition__preview { display: none; }
  .wizard-living-composition__fields { grid-template-columns: 1fr; }
  .wizard-living-composition__subject-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .wizard-living-composition__choices :deep(.wizard-type-choice--nowrap .wizard-type-choice__label) {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-composition * { scroll-behavior: auto; }
}
</style>
