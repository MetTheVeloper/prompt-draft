<script setup lang="ts">
import type { PortraitIntent } from "~/wizard/portrait";
import type { WizardEntityPromptMode } from "~/wizard/entities";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

const props = defineProps<{
  mode: WizardEntityPromptMode;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose", value: PortraitIntent): void;
}>();

const hovered = ref<PortraitIntent | null>(null);
const choices: Array<{ value: PortraitIntent; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "cinematic", label: "Cinematic" },
  { value: "fashion", label: "Fashion" },
  { value: "fantasy", label: "Fantasy" },
];
</script>

<template>
  <div class="wizard-living-portrait">
    <p class="wizard-living-portrait__prompt">
      {{ props.mode === 'image_to_image'
        ? 'I want to transform this into a...'
        : 'I want to create...' }}
    </p>

    <div class="wizard-living-portrait__choices" @mouseleave="hovered = null">
      <div
        v-for="choice in choices"
        :key="choice.value"
        @mouseenter="hovered = choice.value"
        @focusin="hovered = choice.value"
        @focusout="hovered = null">
        <WizardTypographicChoice
          :label="choice.label"
          sublabel="Portrait"
          size="lg"
          nowrap
          :disabled="props.disabled"
          :dimmed="hovered !== null && hovered !== choice.value"
          @select="emit('choose', choice.value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-living-portrait {
  display: grid;
  gap: clamp(40px, 7vh, 72px);
  width: 100%;
  max-width: 900px;
}

.wizard-living-portrait__prompt {
  margin: 0;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 52%, transparent);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-style: italic;
  letter-spacing: -0.02em;
}

.wizard-living-portrait__choices {
  display: grid;
  gap: 16px;
  max-width: 820px;
}

@media (max-width: 620px) {
  .wizard-living-portrait__choices :deep(.wizard-type-choice--nowrap .wizard-type-choice__label) {
    white-space: normal;
  }
}
</style>
