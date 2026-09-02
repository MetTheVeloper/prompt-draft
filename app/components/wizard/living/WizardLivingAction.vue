<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    disabled?: boolean;
    wide?: boolean;
    size?: "md" | "lg";
  }>(),
  {
    disabled: false,
    wide: false,
    size: "md",
  },
);

const emit = defineEmits<{
  (event: "click"): void;
}>();
</script>

<template>
  <button
    type="button"
    class="wizard-living-action"
    :class="{
      'wizard-living-action--wide': props.wide,
      'wizard-living-action--large': props.size === 'lg',
    }"
    :disabled="props.disabled"
    @click="emit('click')">
    <span>{{ props.label }}</span>
    <span class="wizard-living-action__arrow" aria-hidden="true">→</span>
  </button>
</template>

<style scoped>
.wizard-living-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 38px;
  padding: 10px 17px;
  border: 1px solid var(--primary45);
  border-radius: 999px;
  background: transparent;
  color: var(--primary);
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.wizard-living-action__arrow {
  display: inline-block;
  font-size: 1.08em;
  transition: transform 180ms ease;
}

.wizard-living-action:hover,
.wizard-living-action:focus-visible {
  border-color: var(--primary70);
  background: var(--primary5);
  color: var(--primary);
}

.wizard-living-action:hover .wizard-living-action__arrow,
.wizard-living-action:focus-visible .wizard-living-action__arrow {
  transform: translateX(3px);
}

.wizard-living-action:focus-visible {
  outline: 1px solid var(--primary);
  outline-offset: 4px;
}

.wizard-living-action:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.wizard-living-action--wide {
  width: 100%;
  justify-content: space-between;
}

.wizard-living-action--large {
  min-height: 52px;
  padding: 15px 20px;
  font-size: clamp(0.78rem, 1vw, 0.9rem);
  font-weight: 600;
  letter-spacing: 0.08em;
}

@media (prefers-reduced-motion: reduce) {
  .wizard-living-action,
  .wizard-living-action__arrow {
    transition: none;
  }
}
</style>
