<script setup lang="ts">
import type { WizardEntityCollectionQuestionDefinition } from "~/wizard/definition";
import {
  createWizardEntity,
  getWizardEntityDisplayLabel,
  normalizeWizardEntityAnswers,
  renameWizardEntity,
  type WizardEntityAnswer,
} from "~/wizard/entities";

const props = defineProps<{
  question: WizardEntityCollectionQuestionDefinition;
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: WizardEntityAnswer[]): void;
}>();

const entities = computed(() => normalizeWizardEntityAnswers(props.modelValue));
const min = computed(() => Math.max(props.question.min || 0, 0));
const max = computed(() => Math.max(props.question.max || 1, min.value));

function update(next: WizardEntityAnswer[]) {
  emit("update:modelValue", next);
}

function ensureMinimum() {
  if (entities.value.length >= min.value) return;
  const next = [...entities.value];
  const fallbackKind = props.question.allowedKinds[0]?.value;
  if (!fallbackKind) return;
  while (next.length < min.value) {
    next.push(createWizardEntity(fallbackKind, next));
  }
  update(next);
}

function addEntity(kind = props.question.allowedKinds[0]?.value) {
  if (!kind || entities.value.length >= max.value) return;
  update([...entities.value, createWizardEntity(kind, entities.value)]);
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

onMounted(ensureMinimum);
watch(() => props.modelValue, ensureMinimum);
</script>

<template>
  <el-grid :gap="14" class="w100">
    <el-grid fit="fit" min="220px" max="1fr" :gap="12" class="w100">
      <el-flex
        v-for="entity in entities"
        :key="entity.id"
        rules="csc"
        :gap="10"
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
                {{ getWizardEntityDisplayLabel(entity) }}
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
            :placeholder="`Optional — ${getWizardEntityDisplayLabel({ ...entity, label: '' })}`"
            @update:model-value="renameEntity(entity.id, String($event || ''))"
          />
          <el-text :size="10" color="normal40">
            Leave it blank and we'll use “{{ getWizardEntityDisplayLabel({ ...entity, label: '' }) }}”.
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
