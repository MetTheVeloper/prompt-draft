<script setup lang="ts">
import type { WizardStageDefinition } from "~/wizard/definition";

const props = defineProps<{
  stages: readonly WizardStageDefinition[];
  currentStageId?: string;
}>();

const { mobile } = useScreen();

const currentIndex = computed(() => {
  const index = props.stages.findIndex((stage) => stage.id === props.currentStageId);
  return index >= 0 ? index : 0;
});

const currentStage = computed(() => props.stages[currentIndex.value] || null);

const progressWidth = computed(() => {
  if (!props.stages.length) return 0;
  return ((currentIndex.value + 1) / props.stages.length) * 100;
});
</script>

<template>
  <div v-if="props.stages.length" class="wizard-progress w100">
    <template v-if="mobile">
      <div class="wizard-progress__mobile-head">
        <span class="wizard-progress__mobile-title">
          {{ currentStage?.title || 'Wizard' }}
        </span>
        <span class="wizard-progress__count">
          {{ currentIndex + 1 }} of {{ props.stages.length }}
        </span>
      </div>
      <div class="wizard-progress__bar">
        <div
          class="wizard-progress__bar-value"
          :style="{ width: `${progressWidth}%` }"
        />
      </div>
    </template>

    <div v-else class="wizard-progress__desktop">
      <template v-for="(stage, index) in props.stages" :key="stage.id">
        <div class="wizard-progress__stage">
          <div
            :class="[
              'wizard-progress__dot',
              index < currentIndex && 'is-complete',
              index === currentIndex && 'is-current',
            ]">
            <span v-if="index < currentIndex">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            :class="[
              'wizard-progress__label',
              index <= currentIndex && 'is-active',
            ]">
            {{ stage.shortTitle || stage.title }}
          </span>
        </div>
        <div
          v-if="index < props.stages.length - 1"
          :class="[
            'wizard-progress__connector',
            index < currentIndex && 'is-complete',
          ]"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.wizard-progress {
  display: block;
  min-height: 38px;
}

.wizard-progress__mobile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.wizard-progress__mobile-title {
  font-size: 12px;
  font-weight: 700;
}

.wizard-progress__count {
  font-size: 10px;
  opacity: 0.55;
}

.wizard-progress__bar {
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.16);
}

.wizard-progress__bar-value {
  height: 100%;
  border-radius: inherit;
  background: var(--color-prim, #5b77f3);
  transition: width 180ms ease;
}

.wizard-progress__desktop {
  display: flex;
  align-items: flex-start;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
}

.wizard-progress__stage {
  display: flex;
  flex: 0 0 auto;
  min-width: 58px;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.wizard-progress__dot {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.14);
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.72;
}

.wizard-progress__dot.is-current,
.wizard-progress__dot.is-complete {
  color: white;
  background: var(--color-prim, #5b77f3);
  opacity: 1;
}

.wizard-progress__label {
  max-width: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  font-weight: 500;
  opacity: 0.42;
}

.wizard-progress__label.is-active {
  opacity: 0.9;
  font-weight: 700;
}

.wizard-progress__connector {
  flex: 1 1 28px;
  min-width: 12px;
  height: 2px;
  margin: 10px 4px 0;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.14);
}

.wizard-progress__connector.is-complete {
  background: var(--color-prim, #5b77f3);
}
</style>
