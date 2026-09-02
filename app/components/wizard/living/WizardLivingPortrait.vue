<script setup lang="ts">
import type { PortraitIntent } from "~/wizard/portrait";
import type { WizardEntityPromptMode } from "~/wizard/entities";
import WizardTypographicChoice from "./WizardTypographicChoice.vue";

const props = defineProps<{ mode: WizardEntityPromptMode; disabled?: boolean }>();
const emit = defineEmits<{ (event: "choose", value: PortraitIntent): void }>();
const { t } = useI18n();
const hovered = ref<PortraitIntent | null>(null);
const choices: PortraitIntent[] = ["professional", "cinematic", "fashion", "fantasy"];
</script>

<template>
  <div class="wizard-living-portrait">
    <p class="wizard-living-portrait__prompt">
      {{ props.mode === 'image_to_image'
        ? t('wizard.living.portrait.fromImagePrompt')
        : t('wizard.living.portrait.fromDescriptionPrompt') }}
    </p>

    <div class="wizard-living-portrait__choices" @mouseleave="hovered = null">
      <div
        v-for="choice in choices"
        :key="choice"
        @mouseenter="hovered = choice"
        @focusin="hovered = choice"
        @focusout="hovered = null">
        <WizardTypographicChoice
          :label="t(`wizard.living.portrait.${choice}`)"
          :sublabel="t('wizard.living.portrait.sublabel')"
          size="lg"
          nowrap
          :disabled="props.disabled"
          :dimmed="hovered !== null && hovered !== choice"
          @select="emit('choose', choice)"
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
  color: var(--normalText55);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-style: italic;
  letter-spacing: -0.02em;
}

.wizard-living-portrait__choices { display: grid; gap: 16px; max-width: 820px; }

@media (max-width: 620px) {
  .wizard-living-portrait__choices :deep(.wizard-type-choice--nowrap .wizard-type-choice__label) { white-space: normal; }
}
</style>
