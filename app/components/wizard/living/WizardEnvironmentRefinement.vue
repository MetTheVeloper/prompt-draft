<script setup lang="ts">
import type {
  WizardModalFieldDefinition,
  WizardModalOptionsQuestionDefinition,
} from "~/wizard/definition";

const props = defineProps<{
  question: WizardModalOptionsQuestionDefinition;
  modelValue?: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: Record<string, string>): void;
  (event: "back"): void;
  (event: "done"): void;
}>();

const { t, te } = useI18n();

function cleanStringMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && item.trim()) result[key] = item.trim();
  }
  return result;
}

const selections = computed(() => cleanStringMap(props.modelValue));

function fieldValue(field: WizardModalFieldDefinition) {
  return selections.value[field.id] || "";
}

function setField(fieldId: string, value: string) {
  const next = { ...selections.value };
  if (next[fieldId] === value) delete next[fieldId];
  else next[fieldId] = value;
  emit("update:modelValue", next);
}

function fieldLabel(field: WizardModalFieldDefinition) {
  const key = `wizard.living.scene.refinement.fields.${field.id}`;
  return te(key) ? t(key) : field.title;
}

function optionLabel(fieldId: string, value: string, fallback: string) {
  const key = `wizard.living.scene.refinement.options.${fieldId}.${value}`;
  return te(key) ? t(key) : fallback;
}

function selectedLabel(fieldId: string) {
  const field = props.question.fields.find((item) => item.id === fieldId);
  const value = selections.value[fieldId];
  if (!field || !value || field.type !== "singleChoice") return "";
  const option = field.options.find((item) => item.value === value);
  return option ? optionLabel(fieldId, option.value, option.label) : value.replaceAll("_", " ");
}

const preview = computed(() => {
  const density = selectedLabel("detailDensity").toLowerCase();
  const material = selectedLabel("backgroundMaterial").toLowerCase();
  const setting = selectedLabel("setting").toLowerCase();
  const structure = selectedLabel("spatialStructure").toLowerCase();
  const element = selectedLabel("backgroundElement").toLowerCase();

  let lead = "";
  if (density && material) {
    lead = t("wizard.living.scene.refinement.preview.densityMaterial", {
      density,
      material,
    });
  } else if (material) {
    lead = t("wizard.living.scene.refinement.preview.material", { material });
  } else if (setting) {
    lead = t("wizard.living.scene.refinement.preview.setting", { setting });
  }

  const parts = [lead];
  if (structure) {
    parts.push(t("wizard.living.scene.refinement.preview.structure", { structure }));
  }
  if (element) {
    parts.push(t("wizard.living.scene.refinement.preview.element", { element }));
  }

  const text = parts.filter(Boolean).join(", ");
  return text
    ? t("wizard.living.scene.refinement.preview.complete", { value: text })
    : t("wizard.living.scene.refinement.preview.empty");
});
</script>

<template>
  <section class="wizard-environment-refinement">
    <header class="wizard-environment-refinement__header">
      <span>{{ t('wizard.living.scene.refinement.eyebrow') }}</span>
      <button type="button" :disabled="props.disabled" @click="emit('back')">
        {{ t('wizard.living.scene.refinement.back') }}
      </button>
    </header>

    <div class="wizard-environment-refinement__fields">
      <section
        v-for="field in props.question.fields"
        :key="field.id"
        class="wizard-environment-refinement__field">
        <p>{{ fieldLabel(field) }}</p>

        <div v-if="field.type === 'singleChoice'" class="wizard-environment-refinement__chips">
          <button
            v-for="option in field.options"
            :key="option.value"
            type="button"
            :disabled="props.disabled"
            :class="{ 'is-selected': fieldValue(field) === option.value }"
            @click="setField(field.id, option.value)">
            {{ optionLabel(field.id, option.value, option.label) }}
          </button>
        </div>
      </section>
    </div>

    <div class="wizard-environment-refinement__preview">
      <span>{{ t('wizard.living.scene.refinement.preview.label') }}</span>
      <p>{{ preview }}</p>
    </div>

    <button
      type="button"
      class="wizard-environment-refinement__done"
      :disabled="props.disabled"
      @click="emit('done')">
      {{ t('wizard.living.scene.refinement.done') }}
    </button>
  </section>
</template>

<style scoped>
.wizard-environment-refinement {
  display: grid;
  width: min(900px, 100%);
  gap: clamp(28px, 4.5vh, 48px);
}

.wizard-environment-refinement__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.wizard-environment-refinement__header span,
.wizard-environment-refinement__header button,
.wizard-environment-refinement__field > p,
.wizard-environment-refinement__preview > span,
.wizard-environment-refinement__done {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-transform: uppercase;
}

.wizard-environment-refinement__header span {
  color: var(--primary);
  font-size: 0.64rem;
  letter-spacing: 0.18em;
}

.wizard-environment-refinement__header button,
.wizard-environment-refinement__done {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--normalText40);
  font-size: 0.66rem;
  letter-spacing: 0.11em;
  transition: color 180ms ease;
}

.wizard-environment-refinement__header button:hover,
.wizard-environment-refinement__header button:focus-visible,
.wizard-environment-refinement__done:hover,
.wizard-environment-refinement__done:focus-visible {
  color: var(--primary);
}

.wizard-environment-refinement__header button:focus-visible,
.wizard-environment-refinement__done:focus-visible,
.wizard-environment-refinement__chips button:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 4px;
}

.wizard-environment-refinement__fields {
  display: grid;
  gap: clamp(24px, 3vh, 34px);
}

.wizard-environment-refinement__field {
  display: grid;
  gap: 12px;
}

.wizard-environment-refinement__field > p {
  margin: 0;
  color: var(--normalText40);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
}

.wizard-environment-refinement__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wizard-environment-refinement__chips button {
  padding: 6px 11px;
  border: 1px solid var(--normalText10);
  border-radius: 2px;
  background: transparent;
  color: var(--normalText40);
  font-size: 0.75rem;
  letter-spacing: 0.035em;
  transition: color 180ms ease, border-color 180ms ease, background 180ms ease;
}

.wizard-environment-refinement__chips button:hover,
.wizard-environment-refinement__chips button:focus-visible {
  border-color: var(--normalText25);
  color: var(--normalText);
}

.wizard-environment-refinement__chips button.is-selected {
  border-color: var(--primary30);
  background: var(--primary15);
  color: var(--primary);
}

.wizard-environment-refinement__preview {
  display: grid;
  gap: 8px;
  padding-top: 22px;
  border-top: 1px solid var(--normalText10);
}

.wizard-environment-refinement__preview > span {
  color: var(--normalText25);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
}

.wizard-environment-refinement__preview p {
  max-width: 62ch;
  margin: 0;
  color: var(--normalText60);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(0.95rem, 1.5vw, 1.18rem);
  font-style: italic;
  line-height: 1.55;
}

.wizard-environment-refinement__done {
  justify-self: start;
  color: var(--normalText60);
}

@media (prefers-reduced-motion: reduce) {
  .wizard-environment-refinement__header button,
  .wizard-environment-refinement__done,
  .wizard-environment-refinement__chips button { transition: none; }
}
</style>
