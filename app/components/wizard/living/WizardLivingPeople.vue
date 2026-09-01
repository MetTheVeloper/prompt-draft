<script setup lang="ts">
import type { PortraitLivingPeopleState } from "~/wizard/portraitLivingPresentation";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

const props = defineProps<{
  state: PortraitLivingPeopleState;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "one"): void;
  (event: "multiple"): void;
  (event: "count", value: 2 | 3 | 4): void;
}>();

const hoveredChoice = ref<"one" | "multiple" | null>(null);
const hoveredCount = ref<2 | 3 | 4 | null>(null);
const counts: Array<2 | 3 | 4> = [2, 3, 4];
</script>

<template>
  <div v-if="props.state === 'choice'" class="wizard-living-people">
    <div class="wizard-living-people__prompt">
      <p>In the final image,</p>
      <h1>I want to see...</h1>
    </div>

    <div class="wizard-living-people__choices" @mouseleave="hoveredChoice = null">
      <div @mouseenter="hoveredChoice = 'one'">
        <WizardTypographicChoice
          label="One person"
          size="lg"
          nowrap
          :disabled="props.disabled"
          :dimmed="hoveredChoice !== null && hoveredChoice !== 'one'"
          @select="emit('one')"
        />
      </div>
      <div @mouseenter="hoveredChoice = 'multiple'">
        <WizardTypographicChoice
          label="Multiple people"
          size="lg"
          nowrap
          :disabled="props.disabled"
          :dimmed="hoveredChoice !== null && hoveredChoice !== 'multiple'"
          @select="emit('multiple')"
        />
      </div>
    </div>
  </div>

  <div v-else-if="props.state === 'count'" class="wizard-living-people wizard-living-people--count">
    <div class="wizard-living-people__prompt">
      <h1>How many?</h1>
    </div>

    <div class="wizard-living-people__counts" @mouseleave="hoveredCount = null">
      <button
        v-for="count in counts"
        :key="count"
        type="button"
        :disabled="props.disabled"
        :class="{
          'wizard-living-people__count--dimmed': hoveredCount !== null && hoveredCount !== count,
        }"
        @mouseenter="hoveredCount = count"
        @focus="hoveredCount = count"
        @blur="hoveredCount = null"
        @click="emit('count', count)">
        0{{ count }}
      </button>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.wizard-living-people {
  display: grid;
  gap: clamp(38px, 7vh, 72px);
  width: 100%;
  max-width: 980px;
}

.wizard-living-people__prompt {
  display: grid;
  gap: 7px;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-weight: 400;
}

.wizard-living-people__prompt p,
.wizard-living-people__prompt h1 {
  margin: 0;
  font: inherit;
}

.wizard-living-people__prompt p {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 34%, transparent);
  font-size: clamp(0.84rem, 1.25vw, 1rem);
}

.wizard-living-people__prompt h1 {
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 56%, transparent);
  font-size: clamp(1.2rem, 2.1vw, 1.72rem);
  letter-spacing: -0.025em;
}

.wizard-living-people__choices {
  display: grid;
  gap: 20px;
  max-width: 820px;
}

.wizard-living-people--count {
  gap: clamp(46px, 9vh, 92px);
}

.wizard-living-people__counts {
  display: flex;
  align-items: flex-end;
  gap: clamp(28px, 7vw, 78px);
}

.wizard-living-people__counts button {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--wizard-ink, #f2ede6);
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: clamp(3.2rem, 10vw, 8.6rem);
  font-weight: 300;
  letter-spacing: -0.055em;
  line-height: 0.9;
  opacity: 0.86;
  transform: translateY(0);
  transition:
    opacity 260ms ease,
    transform 280ms ease,
    font-weight 280ms ease;
}

.wizard-living-people__counts button:hover,
.wizard-living-people__counts button:focus-visible {
  font-weight: 600;
  opacity: 1;
  transform: translateY(-5px);
}

.wizard-living-people__counts button:focus-visible {
  outline: 1px solid var(--wizard-accent, #c8a96e);
  outline-offset: 8px;
}

.wizard-living-people__counts .wizard-living-people__count--dimmed {
  opacity: 0.14;
}

@media (max-width: 620px) {
  .wizard-living-people__choices :deep(.wizard-type-choice--nowrap .wizard-type-choice__label) {
    white-space: normal;
  }

  .wizard-living-people__counts {
    justify-content: space-between;
    gap: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-people__counts button {
    transition: none;
  }
}
</style>
