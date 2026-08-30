<script setup lang="ts">
import type { WizardEntityCollectionQuestionDefinition } from "~/wizard/definition";
import {
  createWizardEntity,
  defaultWizardEntityDefinition,
  getWizardEntityDisplayLabel,
  normalizeWizardEntityAnswers,
  normalizeWizardEntityDefinitionForMode,
  renameWizardEntity,
  type WizardEntityAnswer,
  type WizardEntityDefinition,
  type WizardEntityPromptMode,
  type WizardEntitySemanticDescriptor,
} from "~/wizard/entities";

const props = defineProps<{
  question: WizardEntityCollectionQuestionDefinition;
  modelValue?: unknown;
  creationMode?: unknown;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: WizardEntityAnswer[]): void;
}>();

const entities = computed(() => normalizeWizardEntityAnswers(props.modelValue));
const min = computed(() => Math.max(props.question.min || 0, 0));
const max = computed(() => Math.max(props.question.max || 1, min.value));
const promptMode = computed<WizardEntityPromptMode>(() =>
  props.creationMode === "from_description" ? "text_to_image" : "image_to_image",
);

const imageDefinitionItems = [
  {
    value: "sequence",
    label: "By position in reference",
    description: "Use first, second, third… person order in the reference images.",
  },
  {
    value: "male_person",
    label: "Male person in reference",
    description: "Identify this subject as the male person in {reference}.",
  },
  {
    value: "female_person",
    label: "Female person in reference",
    description: "Identify this subject as the female person in {reference}.",
  },
  {
    value: "custom",
    label: "Custom reference description",
    description: "Describe exactly who or what this subject is in the reference.",
  },
];

const textDefinitionItems = [
  { value: "person", label: "Person", description: "A person without age or gender assumptions." },
  { value: "man", label: "Man", description: "An adult man." },
  { value: "woman", label: "Woman", description: "An adult woman." },
  { value: "boy", label: "Boy", description: "A boy." },
  { value: "girl", label: "Girl", description: "A girl." },
  {
    value: "custom",
    label: "Custom subject",
    description: "Describe the subject explicitly — a person, animal, character, or anything else.",
  },
];

const definitionItems = computed(() =>
  promptMode.value === "image_to_image" ? imageDefinitionItems : textDefinitionItems,
);

function update(next: WizardEntityAnswer[]) {
  emit("update:modelValue", next);
}

function createEntityWithDefinition(
  kind: Parameters<typeof createWizardEntity>[0],
  existing: readonly WizardEntityAnswer[],
) {
  return {
    ...createWizardEntity(kind, existing),
    definition: defaultWizardEntityDefinition(promptMode.value),
  };
}

function ensureMinimum() {
  if (entities.value.length >= min.value) return;
  const next = [...entities.value];
  const fallbackKind = props.question.allowedKinds[0]?.value;
  if (!fallbackKind) return;
  while (next.length < min.value) {
    next.push(createEntityWithDefinition(fallbackKind, next));
  }
  update(next);
}

function normalizeDefinitions() {
  if (!entities.value.length) return;
  let changed = false;
  const next = entities.value.map((entity) => {
    const definition = normalizeWizardEntityDefinitionForMode(entity, promptMode.value);
    if (JSON.stringify(entity.definition) === JSON.stringify(definition)) return entity;
    changed = true;
    return { ...entity, definition };
  });
  if (changed) update(next);
}

function addEntity(kind = props.question.allowedKinds[0]?.value) {
  if (!kind || entities.value.length >= max.value) return;
  update([...entities.value, createEntityWithDefinition(kind, entities.value)]);
}

function renameEntity(entityId: string, label: string) {
  const next = entities.value.map((entity) =>
    entity.id === entityId
      ? renameWizardEntity(entity, label, entities.value)
      : entity,
  );
  update(next);
}

function removeEntity(entityId: string) {
  if (entities.value.length <= min.value) return;
  update(entities.value.filter((entity) => entity.id !== entityId));
}

function definitionSelection(entity: WizardEntityAnswer) {
  const definition = normalizeWizardEntityDefinitionForMode(entity, promptMode.value);
  if (definition.strategy === "sequence") return "sequence";
  if (definition.strategy === "custom") return "custom";
  return definition.descriptor;
}

function setDefinition(entityId: string, definition: WizardEntityDefinition) {
  update(
    entities.value.map((entity) =>
      entity.id === entityId ? { ...entity, definition } : entity,
    ),
  );
}

function updateDefinitionSelection(entity: WizardEntityAnswer, value: unknown) {
  if (typeof value !== "string") return;

  if (value === "sequence") {
    setDefinition(entity.id, { strategy: "sequence" });
    return;
  }

  if (value === "custom") {
    const current = entity.definition?.strategy === "custom"
      ? entity.definition.custom
      : "";
    setDefinition(entity.id, { strategy: "custom", custom: current });
    return;
  }

  setDefinition(entity.id, {
    strategy: "semantic",
    descriptor: value as WizardEntitySemanticDescriptor,
  });
}

function updateCustomDefinition(entity: WizardEntityAnswer, value: unknown) {
  setDefinition(entity.id, {
    strategy: "custom",
    custom: String(value || ""),
  });
}

function fallbackLabel(entity: WizardEntityAnswer, index: number) {
  return getWizardEntityDisplayLabel(
    { ...entity, label: "" },
    index,
    entities.value.length,
  );
}

onMounted(() => {
  ensureMinimum();
  nextTick(normalizeDefinitions);
});

watch(() => props.modelValue, ensureMinimum);
watch(promptMode, () => nextTick(normalizeDefinitions));
</script>

<template>
  <el-grid :gap="14" class="w100">
    <el-grid fit="fit" min="220px" max="1fr" :gap="12" class="w100">
      <el-flex
        v-for="(entity, index) in entities"
        :key="entity.id"
        rules="csc"
        :gap="12"
        :p="16"
        :radius="18"
        :br="1"
        bc="normal10"
        bg="surface"
        class="w100">
        <el-flex rules="rbc" class="w100" :gap="8">
          <el-flex rules="rsc" :gap="8">
            <el-icon
              :icon="question.allowedKinds.find((item) => item.value === entity.kind)?.icon || 'person'"
              :size="18"
              color="prim"
            />
            <el-grid :gap="2">
              <el-text :size="13" :weight="700">
                {{ getWizardEntityDisplayLabel(entity, index, entities.length) }}
              </el-text>
              <el-text :size="10" color="normal45">
                {{ question.allowedKinds.find((item) => item.value === entity.kind)?.label || entity.kind }}
              </el-text>
            </el-grid>
          </el-flex>

          <el-button
            v-if="entities.length > min"
            icon="close"
            type="fab"
            mode="flat"
            color="normal"
            :size="11"
            :p="6"
            label="Remove subject"
            @click="removeEntity(entity.id)"
          />
        </el-flex>

        <el-grid :gap="5" class="w100">
          <el-text :size="10" color="normal45">Name this subject</el-text>
          <el-text-field
            :model-value="entity.label"
            :actions="false"
            :size="14"
            :placeholder="`Optional — ${fallbackLabel(entity, index)}`"
            @update:model-value="renameEntity(entity.id, String($event || ''))"
          />
          <el-text :size="10" color="normal40">
            Optional. This only names the variable and later subject controls.
          </el-text>
        </el-grid>

        <el-grid :gap="5" class="w100">
          <el-text :size="10" color="normal45">
            {{ promptMode === 'image_to_image' ? 'Identify this subject in the reference' : 'Define this subject' }}
          </el-text>
          <el-dropdown
            :model-value="definitionSelection(entity)"
            :items="definitionItems"
            item-label="label"
            item-value="value"
            item-description="description"
            @update:model-value="updateDefinitionSelection(entity, $event)"
          />
          <el-text :size="10" color="normal40">
            {{ promptMode === 'image_to_image'
              ? 'Position is the fallback. Use a semantic or custom description when upload order may be unreliable.'
              : 'This description becomes the actual subject value; the optional name above does not describe appearance.' }}
          </el-text>
        </el-grid>

        <el-grid
          v-if="normalizeWizardEntityDefinitionForMode(entity, promptMode).strategy === 'custom'"
          :gap="5"
          class="w100">
          <el-text :size="10" color="normal45">Custom subject description</el-text>
          <el-text-field
            :model-value="entity.definition?.strategy === 'custom' ? entity.definition.custom : ''"
            :actions="false"
            :size="14"
            :placeholder="promptMode === 'image_to_image'
              ? 'e.g. woman with a short black bob and pearl choker'
              : 'e.g. elderly man with silver hair, or a black Persian cat'"
            @update:model-value="updateCustomDefinition(entity, $event)"
          />
          <el-text :size="10" :color="entity.definition?.strategy === 'custom' && entity.definition.custom.trim() ? 'normal40' : 'red'">
            Custom descriptions must be explicit before continuing.
          </el-text>
        </el-grid>
      </el-flex>
    </el-grid>

    <el-button
      v-if="entities.length < max && question.allowedKinds.length === 1"
      icon="add"
      mode="outline"
      color="blue"
      label="Add another person"
      :p="[10, 14]"
      @click="addEntity()"
    />
  </el-grid>
</template>
