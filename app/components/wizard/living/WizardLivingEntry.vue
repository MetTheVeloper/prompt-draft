<script setup lang="ts">
import WizardEntryGateway from "./WizardEntryGateway.vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "choose", value: "from_image" | "from_description"): void;
}>();

const hovered = ref<"from_image" | "from_description" | null>(null);
</script>

<template>
  <div class="wizard-living-entry">
    <div class="wizard-living-entry__meta" aria-hidden="true">
      <span>PROMPT DRAFT</span>
      <span>BEGIN</span>
    </div>

    <p class="wizard-living-entry__lead">I want to...</p>

    <div class="wizard-living-entry__paths">
      <WizardEntryGateway
        lead="Transform"
        :tail="['my own', 'image(s)']"
        description="Your reference material becomes the foundation. Something familiar, remade."
        side="left"
        :active="hovered === 'from_image'"
        :dimmed="hovered === 'from_description'"
        :disabled="props.disabled"
        @active="hovered = $event ? 'from_image' : null"
        @select="emit('choose', 'from_image')"
      />

      <div class="wizard-living-entry__divider" aria-hidden="true">
        <span />
        <em>or</em>
        <span />
      </div>

      <WizardEntryGateway
        lead="Create"
        :tail="['a photo']"
        description="Something that hasn’t existed yet. Imagined into being."
        side="right"
        :active="hovered === 'from_description'"
        :dimmed="hovered === 'from_image'"
        :disabled="props.disabled"
        @active="hovered = $event ? 'from_description' : null"
        @select="emit('choose', 'from_description')"
      />
    </div>

    <span class="wizard-living-entry__hint">Choose a path to begin</span>
  </div>
</template>

<style scoped>
.wizard-living-entry {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  min-height: clamp(440px, 68vh, 780px);
}

.wizard-living-entry__meta {
  position: absolute;
  inset: 2px 0 auto;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 18%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.17em;
}

.wizard-living-entry__lead {
  align-self: start;
  margin: clamp(34px, 5vh, 58px) 0 0 clamp(6px, 1vw, 16px);
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 32%, transparent);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(0.92rem, 1.35vw, 1.12rem);
  font-style: italic;
}

.wizard-living-entry__paths {
  display: flex;
  min-height: 0;
}

.wizard-living-entry__divider {
  display: flex;
  flex: 0 0 clamp(46px, 6vw, 78px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 16%, transparent);
}

.wizard-living-entry__divider span {
  width: 1px;
  flex: 1;
  background: color-mix(in srgb, var(--wizard-ink, #f2ede6) 7%, transparent);
}

.wizard-living-entry__divider em {
  padding: 10px 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.82rem;
  font-weight: 400;
}

.wizard-living-entry__hint {
  justify-self: center;
  color: color-mix(in srgb, var(--wizard-ink, #f2ede6) 11%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.54rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (max-width: 740px) {
  .wizard-living-entry {
    min-height: 620px;
  }

  .wizard-living-entry__paths {
    flex-direction: column;
    padding-top: 28px;
  }

  .wizard-living-entry__divider {
    flex: 0 0 42px;
    flex-direction: row;
  }

  .wizard-living-entry__divider span {
    width: auto;
    height: 1px;
  }

  .wizard-living-entry__divider em {
    padding: 0 12px;
  }
}
</style>
