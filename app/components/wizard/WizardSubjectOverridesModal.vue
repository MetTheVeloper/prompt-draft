<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  WizardModalOptionsQuestionDefinition,
  WizardSingleChoiceQuestionDefinition,
  WizardSubjectOverridesQuestionDefinition,
} from "~/wizard/definition";
import {
  getWizardEntityDisplayLabel,
  type WizardEntityAnswer,
} from "~/wizard/entities";
import WizardChoiceGroup from "./WizardChoiceGroup.vue";
import WizardTextQuestion from "./WizardTextQuestion.vue";

type SubjectOverrideState = Record<
  string,
  {
    intent?: string;
    options?: Record<string, string>;
  }
>;

const props = defineProps<{
  question: WizardSubjectOverridesQuestionDefinition;
  subjects: WizardEntityAnswer[];
  state: SubjectOverrideState;
  sharedIntent?: string;
  sharedOptions: Record<string, string>;
  intentQuestion: WizardSingleChoiceQuestionDefinition;
  optionsQuestion: WizardModalOptionsQuestionDefinition;
}>();

const selectedSubjectId = ref(props.subjects[0]?.id || "");

const selectedSubject = computed(() =>
  props.subjects.find((subject) => subject.id === selectedSubjectId.value),
);

const selectedSubjectIndex = computed(() =>
  props.subjects.findIndex((subject) => subject.id === selectedSubjectId.value),
);

const selectedOverride = computed(() =>
  selectedSubjectId.value ? props.state[selectedSubjectId.value] : undefined,
);

const sharedIntentLabel = computed(() => {
  if (!props.sharedIntent) return "No shared direction";
  return (
    props.intentQuestion.options.find((option) => option.value === props.sharedIntent)
      ?.label || props.sharedIntent
  );
});

const shouldHideFields = computed(() => {
  const intent = selectedOverride.value?.intent;
  return Boolean(
    intent && props.question.hideFieldsWhenIntent?.includes(intent),
  );
});

function ensureOverride(subjectId: string) {
  if (!props.state[subjectId]) {
    props.state[subjectId] = {
      ...(props.sharedIntent ? { intent: props.sharedIntent } : {}),
      options: { ...props.sharedOptions },
    };
  }
  if (!props.state[subjectId].options) {
    props.state[subjectId].options = {};
  }
  return props.state[subjectId];
}

function customize(subjectId: string) {
  ensureOverride(subjectId);
}

function useShared(subjectId: string) {
  delete props.state[subjectId];
}

function setIntent(value: unknown) {
  if (typeof value !== "string" || !selectedSubjectId.value) return;
  ensureOverride(selectedSubjectId.value).intent = value;
}

function setOption(fieldId: string, value: unknown) {
  if (typeof value !== "string" || !selectedSubjectId.value) return;
  const cleaned = value.trim();
  const entry = ensureOverride(selectedSubjectId.value);
  const options = entry.options || (entry.options = {});
  if (!cleaned) {
    delete options[fieldId];
    return;
  }
  options[fieldId] = value;
}

function clearOption(fieldId: string) {
  if (!selectedSubjectId.value) return;
  const entry = ensureOverride(selectedSubjectId.value);
  if (entry.options) delete entry.options[fieldId];
}
</script>

<template>
  <el-grid :gap="18" class="w100">
    <el-grid fit="fit" min="150px" max="1fr" :gap="8" class="w100">
      <el-button
        v-for="(subject, index) in props.subjects"
        :key="subject.id"
        :mode="selectedSubjectId === subject.id ? 'normal' : 'outline'"
        color="blue"
        :p="[10, 12]"
        @click="selectedSubjectId = subject.id">
        <el-flex rules="rbc" :gap="8" class="w100">
          <el-text :size="12" :weight="700">
            {{ getWizardEntityDisplayLabel(subject, index, props.subjects.length) }}
          </el-text>
          <el-text :size="9" :color="props.state[subject.id] ? 'blue' : 'normal50'">
            {{ props.state[subject.id] ? 'Custom' : 'Shared' }}
          </el-text>
        </el-flex>
      </el-button>
    </el-grid>

    <el-grid
      v-if="selectedSubject"
      :gap="14"
      :p="16"
      :radius="16"
      :br="1"
      bc="normal10"
      class="w100">
      <el-flex rules="rbc" :gap="12" class="w100">
        <el-grid :gap="3">
          <el-text :size="15" :weight="800">
            {{ getWizardEntityDisplayLabel(selectedSubject, selectedSubjectIndex, props.subjects.length) }}
          </el-text>
          <el-text :size="11" color="normal50">
            Shared direction: {{ sharedIntentLabel }}
          </el-text>
        </el-grid>

        <el-button
          v-if="selectedOverride"
          label="Use shared"
          icon="restart_alt"
          mode="flat"
          color="normal"
          :size="11"
          @click="useShared(selectedSubject.id)"
        />
        <el-button
          v-else
          label="Customize"
          icon="tune"
          color="blue"
          :size="11"
          @click="customize(selectedSubject.id)"
        />
      </el-flex>

      <template v-if="selectedOverride">
        <el-grid :gap="8">
          <el-text :size="13" :weight="700">
            {{ props.question.intentTitle || props.intentQuestion.title }}
          </el-text>
          <WizardChoiceGroup
            :options="props.intentQuestion.options"
            :model-value="selectedOverride.intent"
            @update:model-value="setIntent"
          />
        </el-grid>

        <el-grid v-if="!shouldHideFields" :gap="12" class="w100">
          <el-flex
            v-for="field in props.optionsQuestion.fields"
            :key="field.id"
            rules="csc"
            :gap="8"
            :p="14"
            :radius="14"
            :br="1"
            bc="normal10"
            class="w100">
            <el-flex rules="rbc" :gap="12" class="w100">
              <el-grid :gap="2">
                <el-text :size="13" :weight="700">{{ field.title }}</el-text>
                <el-text v-if="field.description" :size="11" color="normal50">
                  {{ field.description }}
                </el-text>
              </el-grid>

              <el-button
                v-if="selectedOverride.options?.[field.id]"
                label="Use default"
                icon="restart_alt"
                mode="flat"
                color="normal"
                :size="10"
                @click="clearOption(field.id)"
              />
            </el-flex>

            <WizardChoiceGroup
              v-if="field.type === 'singleChoice'"
              :options="field.options"
              :model-value="selectedOverride.options?.[field.id]"
              @update:model-value="setOption(field.id, $event)"
            />

            <WizardTextQuestion
              v-else
              :model-value="selectedOverride.options?.[field.id]"
              :placeholder="field.placeholder"
              :rows="field.rows"
              @update:model-value="setOption(field.id, $event)"
            />
          </el-flex>
        </el-grid>

        <el-text v-else :size="11" color="normal50">
          This direction keeps the source outfit/reference behavior, so extra details are not applied.
        </el-text>
      </template>

      <el-text v-else :size="11" color="normal50">
        This subject currently follows the shared settings above. Customize only when this person should differ.
      </el-text>
    </el-grid>
  </el-grid>
</template>
