<script setup lang="ts">
import {
  normalizeWizardEntityDefinitionForMode,
  renameWizardEntity,
  type WizardEntityAnswer,
  type WizardEntityDefinition,
  type WizardEntityPromptMode,
  type WizardEntitySemanticDescriptor,
} from "~/wizard/entities";

const props = defineProps<{
  subjects: readonly WizardEntityAnswer[];
  mode: WizardEntityPromptMode;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (event: "update", value: WizardEntityAnswer[]): void }>();
const { t } = useI18n();
const openNames = ref<Record<string, boolean>>({});

const transformChoices = computed(() => [
  { value: "sequence", label: t("wizard.living.subjects.choices.sequence") },
  { value: "male_person", label: t("wizard.living.subjects.choices.malePerson") },
  { value: "female_person", label: t("wizard.living.subjects.choices.femalePerson") },
  { value: "custom", label: t("wizard.living.subjects.choices.customTransform") },
] as const);

const createChoices = computed(() => [
  { value: "person", label: t("wizard.living.subjects.choices.person") },
  { value: "man", label: t("wizard.living.subjects.choices.man") },
  { value: "woman", label: t("wizard.living.subjects.choices.woman") },
  { value: "boy", label: t("wizard.living.subjects.choices.boy") },
  { value: "girl", label: t("wizard.living.subjects.choices.girl") },
  { value: "custom", label: t("wizard.living.subjects.choices.customCreate") },
] as const);

const choices = computed(() =>
  props.mode === "image_to_image" ? transformChoices.value : createChoices.value,
);

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value;
}

function updateSubject(subjectId: string, updater: (subject: WizardEntityAnswer) => WizardEntityAnswer) {
  emit("update", props.subjects.map((subject) => subject.id === subjectId ? updater(subject) : subject));
}

function selection(subject: WizardEntityAnswer) {
  const definition = normalizeWizardEntityDefinitionForMode(subject, props.mode);
  if (definition.strategy === "sequence") return "sequence";
  if (definition.strategy === "custom") return "custom";
  return definition.descriptor;
}

function setDefinition(subject: WizardEntityAnswer, value: string) {
  let definition: WizardEntityDefinition;
  if (value === "sequence") definition = { strategy: "sequence" };
  else if (value === "custom") {
    definition = {
      strategy: "custom",
      custom: subject.definition?.strategy === "custom" ? subject.definition.custom : "",
    };
  } else {
    definition = { strategy: "semantic", descriptor: value as WizardEntitySemanticDescriptor };
  }
  updateSubject(subject.id, (current) => ({ ...current, definition }));
}

function setCustomDescription(subject: WizardEntityAnswer, value: string) {
  updateSubject(subject.id, (current) => ({
    ...current,
    definition: { strategy: "custom", custom: value },
  }));
}

function rename(subject: WizardEntityAnswer, value: string) {
  updateSubject(subject.id, (current) => renameWizardEntity(current, value, props.subjects));
}

function fallbackTitle(index: number) {
  const number = String(index + 1).padStart(2, "0");
  return props.mode === "image_to_image"
    ? t("wizard.living.subjects.personInReference", { number })
    : t("wizard.living.subjects.person", { number });
}

function title(subject: WizardEntityAnswer, index: number) {
  return subject.label.trim() || fallbackTitle(index);
}

function showName(subject: WizardEntityAnswer) {
  return Boolean(subject.label.trim()) || Boolean(openNames.value[subject.id]);
}

function customDescription(subject: WizardEntityAnswer) {
  return subject.definition?.strategy === "custom" ? subject.definition.custom : "";
}
</script>

<template>
  <div class="wizard-subject-config">
    <p class="wizard-subject-config__prompt">
      {{ props.mode === 'image_to_image'
        ? t('wizard.living.subjects.transformPrompt')
        : t('wizard.living.subjects.createPrompt') }}
    </p>

    <div class="wizard-subject-config__list">
      <section v-for="(subject, index) in props.subjects" :key="subject.id" class="wizard-subject-config__person">
        <div class="wizard-subject-config__heading">
          <span class="wizard-subject-config__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <h2>{{ title(subject, index) }}</h2>
        </div>

        <div
          class="wizard-subject-config__choices"
          role="group"
          :aria-label="t('wizard.living.subjects.defineAria', { name: title(subject, index) })">
          <button
            v-for="choice in choices"
            :key="choice.value"
            type="button"
            class="wizard-subject-config__choice"
            :class="{ 'wizard-subject-config__choice--selected': selection(subject) === choice.value }"
            :aria-pressed="selection(subject) === choice.value"
            :disabled="props.disabled"
            @click="setDefinition(subject, choice.value)">
            {{ choice.label }}
          </button>
        </div>

        <div v-if="selection(subject) === 'custom'" class="wizard-subject-config__field wizard-subject-config__field--description">
          <label :for="`subject-description-${subject.id}`">{{ t('wizard.living.subjects.description') }}</label>
          <input
            :id="`subject-description-${subject.id}`"
            :value="customDescription(subject)"
            :disabled="props.disabled"
            :placeholder="props.mode === 'image_to_image'
              ? t('wizard.living.subjects.transformDescriptionPlaceholder')
              : t('wizard.living.subjects.createDescriptionPlaceholder')"
            autocomplete="off"
            @input="setCustomDescription(subject, inputValue($event))"
          />
          <span v-if="!customDescription(subject).trim()" class="wizard-subject-config__required">
            {{ t('wizard.living.subjects.descriptionRequired') }}
          </span>
        </div>

        <button
          v-if="!showName(subject)"
          type="button"
          class="wizard-subject-config__name-toggle"
          :disabled="props.disabled"
          @click="openNames[subject.id] = true">
          {{ t('wizard.living.subjects.addName') }}
        </button>

        <div v-else class="wizard-subject-config__field wizard-subject-config__field--name">
          <label :for="`subject-name-${subject.id}`">{{ t('wizard.living.subjects.nameOptional') }}</label>
          <input
            :id="`subject-name-${subject.id}`"
            :value="subject.label"
            :disabled="props.disabled"
            :placeholder="fallbackTitle(index)"
            autocomplete="off"
            @input="rename(subject, inputValue($event))"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wizard-subject-config { width: 100%; max-width: 760px; }

.wizard-subject-config__prompt {
  margin: 0 0 clamp(28px, 5vh, 48px);
  color: var(--normalText60);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.wizard-subject-config__list { display: grid; }
.wizard-subject-config__person { display: grid; gap: 18px; padding: 24px 0 28px; border-top: 1px solid var(--normalText10); }
.wizard-subject-config__heading { display: flex; align-items: baseline; gap: 16px; }

.wizard-subject-config__index,
.wizard-subject-config__field label,
.wizard-subject-config__required,
.wizard-subject-config__name-toggle {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-transform: uppercase;
}

.wizard-subject-config__index { color: var(--primary); font-size: 0.64rem; letter-spacing: 0.14em; }
.wizard-subject-config__heading h2 { margin: 0; color: var(--normalText); font-size: clamp(1rem, 2vw, 1.4rem); font-weight: 300; letter-spacing: -0.02em; }
.wizard-subject-config__choices { display: flex; flex-wrap: wrap; gap: 9px; }

.wizard-subject-config__choice {
  padding: 6px 11px;
  border: 1px solid var(--normalText10);
  border-radius: 1px;
  background: transparent;
  color: var(--normalText35);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
}

.wizard-subject-config__choice:hover,
.wizard-subject-config__choice:focus-visible,
.wizard-subject-config__choice--selected {
  border-color: var(--primary40);
  color: var(--primary);
  background: var(--primary5);
}

.wizard-subject-config__choice:focus-visible,
.wizard-subject-config__name-toggle:focus-visible,
.wizard-subject-config__field input:focus-visible { outline: 1px solid var(--primary60); outline-offset: 4px; }

.wizard-subject-config__field { display: grid; gap: 7px; max-width: 42ch; }
.wizard-subject-config__field label { color: var(--normalText30); font-size: 0.59rem; letter-spacing: 0.12em; }

.wizard-subject-config__field input {
  width: 100%;
  padding: 6px 0 7px;
  border: 0;
  border-bottom: 1px solid var(--primary30);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--normalText);
  font-size: 0.86rem;
}

.wizard-subject-config__field input:focus { border-bottom-color: var(--primary60); background: transparent; box-shadow: none; }
.wizard-subject-config__required { color: var(--themeRed80); font-size: 0.56rem; letter-spacing: 0.07em; }

.wizard-subject-config__name-toggle {
  justify-self: start;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--normalText20);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  transition: color 180ms ease;
}

.wizard-subject-config__name-toggle:hover,
.wizard-subject-config__name-toggle:focus-visible { color: var(--normalText55); }

.wizard-subject-config:dir(rtl) .wizard-subject-config__prompt {
  font-family: var(--app-font-family, system-ui, sans-serif);
  font-style: normal;
  letter-spacing: 0;
  line-height: 1.8;
}

.wizard-subject-config:dir(rtl) .wizard-subject-config__choice,
.wizard-subject-config:dir(rtl) .wizard-subject-config__field label,
.wizard-subject-config:dir(rtl) .wizard-subject-config__name-toggle {
  letter-spacing: 0;
  text-transform: none;
}

@media (max-width: 620px) {
  .wizard-subject-config__person { gap: 16px; padding-block: 22px; }
  .wizard-subject-config__choices { gap: 7px; }
  .wizard-subject-config__choice { font-size: 0.66rem; }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-subject-config__choice,
  .wizard-subject-config__name-toggle { transition: none; }
}
</style>