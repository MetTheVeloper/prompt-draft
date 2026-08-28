<script setup lang="ts">
import type { WizardModalOptionsQuestionDefinition } from "~/wizard/definition";
import WizardChoiceGroup from "./WizardChoiceGroup.vue";
import WizardTextQuestion from "./WizardTextQuestion.vue";

const props = defineProps<{
  question: WizardModalOptionsQuestionDefinition;
  state: Record<string, string>;
}>();

function setField(fieldId: string, value: unknown) {
  if (typeof value !== "string") return;
  const cleaned = value.trim();
  if (!cleaned) {
    delete props.state[fieldId];
    return;
  }
  props.state[fieldId] = value;
}

function clearField(fieldId: string) {
  delete props.state[fieldId];
}
</script>

<template>
  <el-grid :gap="16" class="w100">
    <el-flex
      v-for="field in props.question.fields"
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
          v-if="props.state[field.id]"
          label="Use default"
          icon="restart_alt"
          mode="flat"
          color="normal"
          :size="10"
          @click="clearField(field.id)"
        />
      </el-flex>

      <WizardChoiceGroup
        v-if="field.type === 'singleChoice'"
        :options="field.options"
        :model-value="props.state[field.id]"
        @update:model-value="setField(field.id, $event)"
      />

      <WizardTextQuestion
        v-else
        :model-value="props.state[field.id]"
        :placeholder="field.placeholder"
        :rows="field.rows"
        @update:model-value="setField(field.id, $event)"
      />
    </el-flex>
  </el-grid>
</template>
