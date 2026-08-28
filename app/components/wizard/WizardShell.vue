<script setup lang="ts">
import type { WizardStageDefinition } from "~/wizard/definition";

const props = defineProps<{
  title: string;
  stepTitle: string;
  stepDescription?: string;
  stages: readonly WizardStageDefinition[];
  currentStageId?: string;
  canGoBack: boolean;
  isReview?: boolean;
  isBusy?: boolean;
  isSaved?: boolean;
}>();

const emit = defineEmits<{
  (event: "back"): void;
  (event: "next"): void;
  (event: "finish"): void;
  (event: "exit"): void;
  (event: "restart"): void;
}>();
</script>

<template>
  <el-grid class="wizard-shell w100 h100" :gap="0">
    <el-grid class="wizard-shell__header w100" :gap="14">
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-button
          icon="close"
          label="Exit"
          mode="flat"
          color="normal"
          :disable="props.isBusy"
          @click="emit('exit')"
        />

        <el-flex rules="rcc" :gap="8">
          <el-text :size="12" :weight="700">{{ props.title }}</el-text>
          <el-text v-if="props.isSaved" :size="9" color="normal40" icon="cloud_done">
            Saved
          </el-text>
        </el-flex>

        <el-button
          icon="refresh"
          label="Start over"
          mode="flat"
          color="normal"
          :disable="props.isBusy"
          @click="emit('restart')"
        />
      </el-flex>

      <WizardProgress
        v-if="props.stages.length"
        :stages="props.stages"
        :current-stage-id="props.currentStageId"
      />
    </el-grid>

    <div class="wizard-shell__stage w100">
      <el-grid class="wizard-shell__content w100" :gap="24">
        <el-grid :gap="6" class="w100 tac">
          <el-text :size="26" :weight="800">{{ props.stepTitle }}</el-text>
          <el-text
            v-if="props.stepDescription"
            :size="13"
            color="normal50"
            style="max-width: 620px; margin: 0 auto">
            {{ props.stepDescription }}
          </el-text>
        </el-grid>

        <slot />
      </el-grid>
    </div>

    <el-flex class="wizard-shell__footer w100" rules="rbc" :gap="12">
      <div>
        <el-button
          v-if="props.canGoBack"
          label="Back"
          icon="arrow_back"
          mode="flat"
          color="normal"
          :disable="props.isBusy"
          @click="emit('back')"
        />
      </div>

      <el-button
        :label="props.isReview ? 'Create prompt' : 'Continue'"
        :icon="props.isReview ? 'auto_awesome' : 'arrow_forward'"
        :invert="true"
        color="blue"
        :disable="props.isBusy"
        @click="props.isReview ? emit('finish') : emit('next')"
      />
    </el-flex>
  </el-grid>
</template>

<style scoped>
.wizard-shell {
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.wizard-shell__header {
  padding: 4px 4px 18px;
}

.wizard-shell__stage {
  min-height: 0;
  overflow: auto;
  display: grid;
  place-items: center;
  padding: 28px 12px 36px;
}

.wizard-shell__content {
  max-width: 820px;
  margin: auto;
}

.wizard-shell__footer {
  padding: 14px 4px 4px;
  border-top: 1px solid var(--color-normal10, rgba(127, 127, 127, 0.12));
  background: var(--color-background, transparent);
}
</style>
