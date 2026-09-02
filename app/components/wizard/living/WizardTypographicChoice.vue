<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    sublabel?: string;
    description?: string;
    size?: "xl" | "lg" | "md";
    dimmed?: boolean;
    selected?: boolean;
    nowrap?: boolean;
    disabled?: boolean;
  }>(),
  {
    size: "xl",
    dimmed: false,
    selected: false,
    nowrap: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: "select"): void;
}>();
</script>

<template>
  <button
    type="button"
    class="wizard-type-choice"
    :class="[
      `wizard-type-choice--${props.size}`,
      {
        'wizard-type-choice--dimmed': props.dimmed,
        'wizard-type-choice--selected': props.selected,
        'wizard-type-choice--nowrap': props.nowrap,
      },
    ]"
    :disabled="props.disabled"
    @click="emit('select')">
    <span class="wizard-type-choice__label">{{ props.label }}</span>
    <span v-if="props.sublabel" class="wizard-type-choice__sublabel">{{ props.sublabel }}</span>
    <span v-if="props.description" class="wizard-type-choice__description">{{ props.description }}</span>
  </button>
</template>

<style scoped>
.wizard-type-choice {
  --choice-size: clamp(2rem, 5vw, 5rem);
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--normalText);
  text-align: left;
  opacity: 0.76;
  transform: translateX(0);
  transition: opacity 280ms ease, transform 320ms ease;
}

.wizard-type-choice:hover,
.wizard-type-choice:focus-visible,
.wizard-type-choice--selected {
  opacity: 1;
  transform: translateX(7px);
}

.wizard-type-choice:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: 8px;
}

.wizard-type-choice--dimmed { opacity: 0.12; }
.wizard-type-choice--xl { --choice-size: clamp(2.1rem, 5.4vw, 5.25rem); }
.wizard-type-choice--lg { --choice-size: clamp(1.7rem, 4vw, 3.8rem); }
.wizard-type-choice--md { --choice-size: clamp(1.25rem, 2.6vw, 2.2rem); }

.wizard-type-choice__label {
  display: block;
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: var(--choice-size);
  font-weight: 300;
  line-height: 0.98;
  letter-spacing: -0.045em;
  text-transform: uppercase;
  transition: font-weight 300ms ease, letter-spacing 300ms ease;
}

.wizard-type-choice:hover .wizard-type-choice__label,
.wizard-type-choice:focus-visible .wizard-type-choice__label,
.wizard-type-choice--selected .wizard-type-choice__label {
  font-weight: 600;
  letter-spacing: -0.035em;
}

.wizard-type-choice--nowrap .wizard-type-choice__label { white-space: nowrap; }

.wizard-type-choice__sublabel {
  display: block;
  margin-top: 7px;
  color: var(--primary75);
  font-size: clamp(0.64rem, 1vw, 0.76rem);
  font-weight: 500;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.wizard-type-choice__description {
  display: block;
  max-width: 38ch;
  margin-top: 10px;
  color: var(--normalText40);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(0.78rem, 1.05vw, 0.92rem);
  font-style: italic;
  font-weight: 400;
  line-height: 1.55;
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 280ms ease, transform 280ms ease;
}

.wizard-type-choice:hover .wizard-type-choice__description,
.wizard-type-choice:focus-visible .wizard-type-choice__description {
  opacity: 1;
  transform: translateY(0);
}

.wizard-type-choice:dir(rtl) {
  text-align: right;
}

.wizard-type-choice:dir(rtl):hover,
.wizard-type-choice:dir(rtl):focus-visible,
.wizard-type-choice--selected:dir(rtl) {
  transform: translateX(-7px);
}

.wizard-type-choice:dir(rtl) .wizard-type-choice__label,
.wizard-type-choice:dir(rtl) .wizard-type-choice__sublabel {
  letter-spacing: 0;
  text-transform: none;
}

.wizard-type-choice:dir(rtl) .wizard-type-choice__description {
  font-family: var(--app-font-family, system-ui, sans-serif);
  font-style: normal;
  line-height: 1.8;
}

@media (prefers-reduced-motion: reduce) {
  .wizard-type-choice,
  .wizard-type-choice__label,
  .wizard-type-choice__description { transition: none; }
}
</style>
