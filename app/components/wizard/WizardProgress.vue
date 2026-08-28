<script setup lang="ts">
import type { WizardStageDefinition } from "~/wizard/definition";

const props = defineProps<{
  stages: readonly WizardStageDefinition[];
  currentStageId?: string;
}>();

const { mobile } = useScreen();

const currentIndex = computed(() =>
  props.stages.findIndex((stage) => stage.id === props.currentStageId),
);

const currentStage = computed(() =>
  currentIndex.value >= 0 ? props.stages[currentIndex.value] : null,
);
</script>

<template>
  <el-grid v-if="mobile" :gap="7" class="w100">
    <el-flex rules="rbc" class="w100" :gap="8">
      <el-text :size="12" :weight="700">
        {{ currentStage?.title || 'Wizard' }}
      </el-text>
      <el-text :size="10" color="normal45">
        {{ Math.max(currentIndex + 1, 1) }} of {{ stages.length }}
      </el-text>
    </el-flex>
    <div class="wizard-progress-line bg-normal10">
      <div
        class="wizard-progress-line__value bg-prim"
        :style="{ width: `${((Math.max(currentIndex, 0) + 1) / Math.max(stages.length, 1)) * 100}%` }"
      />
    </div>
  </el-grid>

  <el-flex v-else rules="rcc" :gap="0" class="w100 wizard-stage-progress">
    <template v-for="(stage, index) in stages" :key="stage.id">
      <el-flex rules="csc" :gap="5" class="wizard-stage-progress__item">
        <el-flex
          rules="rcc"
          :size="22"
          :radius="100"
          :bg="index <= currentIndex ? 'prim' : 'normal10'">
          <el-icon
            v-if="index < currentIndex"
            icon="check"
            :size="12"
            color="white"
          />
          <el-text
            v-else
            :size="9"
            :weight="800"
            :color="index === currentIndex ? 'white' : 'normal45'">
            {{ index + 1 }}
          </el-text>
        </el-flex>
        <el-text
          :size="9"
          :weight="index === currentIndex ? 700 : 500"
          :color="index <= currentIndex ? 'normal' : 'normal40'"
          class="wsnw">
          {{ stage.shortTitle || stage.title }}
        </el-text>
      </el-flex>
      <div
        v-if="index < stages.length - 1"
        :class="['wizard-stage-progress__connector', index < currentIndex ? 'bg-prim' : 'bg-normal10']"
      />
    </template>
  </el-flex>
</template>

<style scoped>
.wizard-progress-line {
  width: 100%;
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
}

.wizard-progress-line__value {
  height: 100%;
  border-radius: inherit;
  transition: width 180ms ease;
}

.wizard-stage-progress__item {
  min-width: 54px;
}

.wizard-stage-progress__connector {
  height: 2px;
  min-width: 12px;
  flex: 1 1 32px;
  margin: 0 4px 17px;
  border-radius: 999px;
}
</style>
