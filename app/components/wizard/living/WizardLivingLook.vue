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
  type WizardEntityPromptMode,
} from "~/wizard/entities";
import type {
  PortraitLivingLookDomain,
  PortraitLivingLookPhase,
} from "~/wizard/portraitLivingPresentation";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

type SubjectOverrideState = Record<
  string,
  {
    intent?: string;
    options?: Record<string, string>;
  }
>;

const props = defineProps<{
  domain: PortraitLivingLookDomain;
  phase: PortraitLivingLookPhase;
  mode: WizardEntityPromptMode;
  intentQuestion: WizardSingleChoiceQuestionDefinition;
  optionsQuestion?: WizardModalOptionsQuestionDefinition | null;
  overrideQuestion?: WizardSubjectOverridesQuestionDefinition | null;
  subjects: readonly WizardEntityAnswer[];
  intentValue?: unknown;
  optionsValue?: unknown;
  overridesValue?: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose-intent", value: string): void;
  (event: "update-options", value: Record<string, string>): void;
  (event: "update-overrides", value: SubjectOverrideState): void;
  (event: "continue"): void;
}>();

const detailsOpen = ref(false);
const individualOpen = ref(false);
const selectedSubjectId = ref("");

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
    if (!validIds.has(subjectId) || !raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const intent = typeof record.intent === "string" && record.intent.trim()
      ? record.intent
      : undefined;
    const options = cleanStringMap(record.options);
    if (intent || Object.keys(options).length) {
      result[subjectId] = {
        ...(intent ? { intent } : {}),
        options,
      };
    }
  }

  return result;
}

const sharedOptions = computed(() => cleanStringMap(props.optionsValue));
const overrides = computed(() => normalizedOverrides(props.overridesValue));
const intentText = computed(() =>
  typeof props.intentValue === "string" ? props.intentValue : "",
);
const visibleIntentOptions = computed(() =>
  props.mode === "text_to_image"
    ? props.intentQuestion.options.filter((option) => option.value !== "keep_reference")
    : props.intentQuestion.options,
);
const selectedSubject = computed(() =>
  props.subjects.find((subject) => subject.id === selectedSubjectId.value) || null,
);
const selectedSubjectIndex = computed(() =>
  props.subjects.findIndex((subject) => subject.id === selectedSubjectId.value),
);
const selectedOverride = computed(() =>
  selectedSubjectId.value ? overrides.value[selectedSubjectId.value] : undefined,
);
const overrideCount = computed(() => Object.keys(overrides.value).length);
const sharedIntentLabel = computed(() =>
  props.intentQuestion.options.find((option) => option.value === intentText.value)?.label ||
  intentText.value.replaceAll("_", " "),
);
const domainCopy = computed(() => {
  if (props.domain === "expression") {
    return {
      eyebrow: "EXPRESSION",
      title: "How should they feel?",
      refine: sharedIntentLabel.value
        ? `${sharedIntentLabel.value}, for everyone.`
        : "Set one expression for everyone.",
    };
  }
  if (props.domain === "hair") {
    return {
      eyebrow: "HAIR",
      title: "What about their hair?",
      refine: intentText.value === "keep_reference"
        ? "Keep their existing hair as the shared direction."
        : `${sharedIntentLabel.value}, as the shared hair direction.`,
    };
  }
  return {
    eyebrow: "OUTFIT",
    title: "How should they be dressed?",
    refine: intentText.value === "keep_reference"
      ? "Keep their existing outfit as the shared direction."
      : `${sharedIntentLabel.value}, for the shared outfit direction.`,
  };
});

const sharedOptionsVisible = computed(() => {
  const question = props.optionsQuestion;
  if (!question) return false;
  const condition = question.visibleWhen;
  if (!condition) return true;
  if (condition.answerId !== props.intentQuestion.id) return true;
  return condition.operator === "equals"
    ? intentText.value === condition.value
    : intentText.value !== condition.value;
});

const selectedOverrideHidesFields = computed(() => {
  const intent = selectedOverride.value?.intent;
  return Boolean(
    intent && props.overrideQuestion?.hideFieldsWhenIntent?.includes(intent),
  );
});

function subjectLabel(subject: WizardEntityAnswer, index: number) {
  return getWizardEntityDisplayLabel(subject, index, props.subjects.length);
}

function eventValue(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
  return target?.value || "";
}

function updateSharedOption(fieldId: string, value: unknown) {
  const next = { ...sharedOptions.value };
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (cleaned) next[fieldId] = value as string;
  else delete next[fieldId];
  emit("update-options", next);
}

function selectSubject(subjectId: string) {
  selectedSubjectId.value = subjectId;
}

function customizeSelectedSubject() {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.overridesValue);
  next[subject.id] = {
    ...(intentText.value ? { intent: intentText.value } : {}),
    options: { ...sharedOptions.value },
  };
  emit("update-overrides", next);
}

function useSharedForSelectedSubject() {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.overridesValue);
  delete next[subject.id];
  emit("update-overrides", next);
}

function updateSelectedOverrideIntent(value: string) {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.overridesValue);
  const existing = next[subject.id] || { options: { ...sharedOptions.value } };
  next[subject.id] = {
    ...existing,
    intent: value,
    options: { ...(existing.options || {}) },
  };
  emit("update-overrides", next);
}

function updateSelectedOverrideOption(fieldId: string, value: unknown) {
  const subject = selectedSubject.value;
  if (!subject) return;
  const next = normalizedOverrides(props.overridesValue);
  const existing = next[subject.id] || {
    ...(intentText.value ? { intent: intentText.value } : {}),
    options: { ...sharedOptions.value },
  };
  const options = { ...(existing.options || {}) };
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (cleaned) options[fieldId] = value as string;
  else delete options[fieldId];
  next[subject.id] = { ...existing, options };
  emit("update-overrides", next);
}

function fieldValue(field: WizardModalFieldDefinition, source: Record<string, string>) {
  return source[field.id] || "";
}

function resetDisclosure() {
  detailsOpen.value = Object.keys(sharedOptions.value).length > 0;
  individualOpen.value = overrideCount.value > 0;
  selectedSubjectId.value = props.subjects.find((subject) => overrides.value[subject.id])?.id ||
    props.subjects[0]?.id ||
    "";
}

watch(
  () => [props.domain, props.phase] as const,
  resetDisclosure,
  { immediate: true },
);

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
  <section class="wizard-living-look">
    <div class="wizard-living-look__header">
      <span>{{ domainCopy.eyebrow }}</span>
      <h1>{{ props.phase === 'choice' ? domainCopy.title : domainCopy.refine }}</h1>
      <p v-if="props.phase === 'choice' && props.subjects.length > 1">
        Start with one shared direction. You can change it for any person immediately after.
      </p>
    </div>

    <div v-if="props.phase === 'choice'" class="wizard-living-look__choices">
      <WizardTypographicChoice
        v-for="option in visibleIntentOptions"
        :key="option.value"
        :label="option.label"
        :description="option.description"
        size="md"
        :disabled="props.disabled"
        @select="emit('choose-intent', option.value)"
      />
    </div>

    <div v-else class="wizard-living-look__refine">
      <div class="wizard-living-look__shared-line">
        <span>SHARED</span>
        <strong>{{ sharedIntentLabel }}</strong>
      </div>

      <div class="wizard-living-look__refine-actions">
        <button
          v-if="props.optionsQuestion && sharedOptionsVisible"
          type="button"
          :disabled="props.disabled"
          :class="{ 'is-active': detailsOpen }"
          @click="detailsOpen = !detailsOpen">
          {{ detailsOpen ? 'Hide fine-tuning' : 'Fine-tune details' }}
        </button>
        <button
          v-if="props.subjects.length > 1 && props.overrideQuestion"
          type="button"
          :disabled="props.disabled"
          :class="{ 'is-active': individualOpen || overrideCount > 0 }"
          @click="individualOpen = !individualOpen">
          {{ overrideCount ? `Adjust individually · ${overrideCount}` : 'Adjust individually' }}
        </button>
      </div>

      <div
        v-if="detailsOpen && props.optionsQuestion && sharedOptionsVisible"
        class="wizard-living-look__panel">
        <div class="wizard-living-look__panel-heading">
          <span>FINE-TUNE</span>
          <p>Optional details refine the shared direction without changing who it applies to.</p>
        </div>

        <div class="wizard-living-look__fields">
          <div
            v-for="field in props.optionsQuestion.fields"
            :key="field.id"
            class="wizard-living-look__field">
            <div class="wizard-living-look__field-label">
              <strong>{{ field.title }}</strong>
              <small v-if="field.description">{{ field.description }}</small>
            </div>

            <div v-if="field.type === 'singleChoice'" class="wizard-living-look__chips">
              <button
                v-for="option in field.options"
                :key="option.value"
                type="button"
                :disabled="props.disabled"
                :class="{ 'is-selected': fieldValue(field, sharedOptions) === option.value }"
                @click="updateSharedOption(field.id, option.value)">
                {{ option.label }}
              </button>
            </div>

            <textarea
              v-else
              :value="fieldValue(field, sharedOptions)"
              :rows="field.rows || 2"
              :placeholder="field.placeholder"
              :disabled="props.disabled"
              @input="updateSharedOption(field.id, eventValue($event))"
            />
          </div>
        </div>
      </div>

      <div
        v-if="individualOpen && props.subjects.length > 1 && props.overrideQuestion"
        class="wizard-living-look__panel wizard-living-look__panel--individual">
        <div class="wizard-living-look__panel-heading">
          <span>INDIVIDUAL</span>
          <p>Everyone follows the shared direction until you explicitly change them here.</p>
        </div>

        <div class="wizard-living-look__subject-picker" role="list" aria-label="Portrait subjects">
          <button
            v-for="(subject, index) in props.subjects"
            :key="subject.id"
            type="button"
            :disabled="props.disabled"
            :class="{
              'is-selected': selectedSubjectId === subject.id,
              'is-custom': Boolean(overrides[subject.id]),
            }"
            @click="selectSubject(subject.id)">
            <span>{{ subjectLabel(subject, index) }}</span>
            <small>{{ overrides[subject.id] ? 'Custom' : 'Shared' }}</small>
          </button>
        </div>

        <div v-if="selectedSubject" class="wizard-living-look__subject-editor">
          <div class="wizard-living-look__subject-summary">
            <div>
              <span>{{ subjectLabel(selectedSubject, selectedSubjectIndex) }}</span>
              <small>Shared direction: {{ sharedIntentLabel }}</small>
            </div>
            <button
              v-if="selectedOverride"
              type="button"
              :disabled="props.disabled"
              @click="useSharedForSelectedSubject">
              Use shared
            </button>
            <button
              v-else
              type="button"
              :disabled="props.disabled"
              @click="customizeSelectedSubject">
              Change it for this person
            </button>
          </div>

          <template v-if="selectedOverride">
            <div class="wizard-living-look__chips wizard-living-look__chips--intent">
              <button
                v-for="option in visibleIntentOptions"
                :key="option.value"
                type="button"
                :disabled="props.disabled"
                :class="{ 'is-selected': selectedOverride.intent === option.value }"
                @click="updateSelectedOverrideIntent(option.value)">
                {{ option.label }}
              </button>
            </div>

            <div
              v-if="props.optionsQuestion && !selectedOverrideHidesFields"
              class="wizard-living-look__fields wizard-living-look__fields--subject">
              <div
                v-for="field in props.optionsQuestion.fields"
                :key="field.id"
                class="wizard-living-look__field">
                <div class="wizard-living-look__field-label">
                  <strong>{{ field.title }}</strong>
                </div>

                <div v-if="field.type === 'singleChoice'" class="wizard-living-look__chips">
                  <button
                    v-for="option in field.options"
                    :key="option.value"
                    type="button"
                    :disabled="props.disabled"
                    :class="{
                      'is-selected': selectedOverride.options?.[field.id] === option.value,
                    }"
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

            <p v-else-if="props.optionsQuestion && selectedOverrideHidesFields" class="wizard-living-look__muted">
              This direction keeps the source reference, so extra outfit details are not applied to this person.
            </p>
          </template>
        </div>
      </div>

      <div class="wizard-living-look__continue">
        <button type="button" :disabled="props.disabled" @click="emit('continue')">
          Continue →
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard-living-look {
  display: grid;
  gap: clamp(30px, 5vh, 54px);
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

.wizard-living-look__header {
  display: grid;
  gap: 8px;
  max-width: 760px;
}

.wizard-living-look__header > span,
.wizard-living-look__panel-heading > span,
.wizard-living-look__shared-line > span {
  color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 70%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
}

.wizard-living-look__header h1 {
  margin: 0;
  color: var(--wizard-ink, #f2ede6);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.5rem, 3.1vw, 2.7rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.wizard-living-look__header p,
.wizard-living-look__panel-heading p,
.wizard-living-look__muted {
  margin: 0;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 38%, transparent);
  font-size: 0.76rem;
  line-height: 1.6;
}

.wizard-living-look__choices {
  display: grid;
  gap: 18px;
  max-width: 760px;
}

.wizard-living-look__refine {
  display: grid;
  gap: 22px;
}

.wizard-living-look__shared-line {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.wizard-living-look__shared-line strong {
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  font-weight: 500;
  text-transform: uppercase;
}

.wizard-living-look__refine-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.wizard-living-look__refine-actions button,
.wizard-living-look__subject-summary > button,
.wizard-living-look__continue button {
  border: 1px solid color-mix(in srgb, var(--wizard-ink, #f2ede6) 12%, transparent);
  border-radius: 999px;
  background: transparent;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 62%, transparent);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
}

.wizard-living-look__refine-actions button.is-active,
.wizard-living-look__refine-actions button:hover,
.wizard-living-look__refine-actions button:focus-visible,
.wizard-living-look__subject-summary > button:hover,
.wizard-living-look__subject-summary > button:focus-visible {
  border-color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 45%, transparent);
  color: var(--wizard-ink, #f2ede6);
}

.wizard-living-look__panel {
  display: grid;
  gap: 20px;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid color-mix(in srgb, var(--wizard-ink, #f2ede6) 7%, transparent);
  background: rgb(255 255 255 / 1.5%);
}

.wizard-living-look__panel-heading {
  display: grid;
  gap: 5px;
}

.wizard-living-look__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 22px;
}

.wizard-living-look__fields--subject {
  margin-top: 4px;
}

.wizard-living-look__field {
  display: grid;
  align-content: start;
  gap: 9px;
}

.wizard-living-look__field-label {
  display: grid;
  gap: 3px;
}

.wizard-living-look__field-label strong {
  font-size: 0.76rem;
  font-weight: 600;
}

.wizard-living-look__field-label small {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 32%, transparent);
  font-size: 0.66rem;
  line-height: 1.45;
}

.wizard-living-look__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.wizard-living-look__chips button,
.wizard-living-look__subject-picker button {
  border: 1px solid color-mix(in srgb, var(--wizard-ink, #f2ede6) 9%, transparent);
  border-radius: 8px;
  background: transparent;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 45%, transparent);
  font-size: 0.68rem;
}

.wizard-living-look__chips button.is-selected,
.wizard-living-look__chips button:hover,
.wizard-living-look__chips button:focus-visible {
  border-color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 48%, transparent);
  background: color-mix(in srgb, var(--wizard-accent, #c8a96e) 7%, transparent);
  color: var(--wizard-ink, #f2ede6);
}

.wizard-living-look__field textarea {
  min-height: 74px;
  border: 1px solid color-mix(in srgb, var(--wizard-ink, #f2ede6) 9%, transparent);
  border-radius: 8px;
  background: rgb(255 255 255 / 2%);
  color: var(--wizard-ink, #f2ede6);
  font-size: 0.75rem;
}

.wizard-living-look__subject-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.wizard-living-look__subject-picker button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
}

.wizard-living-look__subject-picker button small {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 28%, transparent);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wizard-living-look__subject-picker button.is-selected {
  border-color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 50%, transparent);
  color: var(--wizard-ink, #f2ede6);
}

.wizard-living-look__subject-picker button.is-custom small {
  color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 80%, transparent);
}

.wizard-living-look__subject-editor {
  display: grid;
  gap: 18px;
  padding-top: 6px;
}

.wizard-living-look__subject-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.wizard-living-look__subject-summary > div {
  display: grid;
  gap: 3px;
}

.wizard-living-look__subject-summary span {
  font-size: 0.9rem;
  font-weight: 600;
}

.wizard-living-look__subject-summary small {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 34%, transparent);
  font-size: 0.66rem;
}

.wizard-living-look__continue {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.wizard-living-look__continue button {
  padding: 10px 17px;
  border-color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 42%, transparent);
  color: color-mix(in srgb, var(--wizard-accent, #c8a96e) 90%, transparent);
}

button:focus-visible {
  outline: 1px solid var(--wizard-accent, #c8a96e);
  outline-offset: 4px;
}

@media (max-width: 700px) {
  .wizard-living-look__fields {
    grid-template-columns: 1fr;
  }

  .wizard-living-look__subject-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-look * {
    scroll-behavior: auto;
  }
}
</style>
