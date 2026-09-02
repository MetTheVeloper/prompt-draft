<script setup lang="ts">
const props = defineProps<{
  lead: string;
  tail: readonly string[];
  description: string;
  side: "left" | "right";
  dimmed?: boolean;
  active?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "select"): void;
  (event: "active", active: boolean): void;
}>();
</script>

<template>
  <button
    type="button"
    class="wizard-entry-gateway"
    :class="[
      `wizard-entry-gateway--${props.side}`,
      {
        'wizard-entry-gateway--dimmed': props.dimmed,
        'wizard-entry-gateway--active': props.active,
      },
    ]"
    :disabled="props.disabled"
    @mouseenter="emit('active', true)"
    @mouseleave="emit('active', false)"
    @focus="emit('active', true)"
    @blur="emit('active', false)"
    @click="emit('select')">
    <span class="wizard-entry-gateway__title">
      <span class="wizard-entry-gateway__lead">{{ props.lead }}</span>
      <span v-for="line in props.tail" :key="line" class="wizard-entry-gateway__tail">{{ line }}</span>
    </span>
    <span class="wizard-entry-gateway__description">{{ props.description }}</span>
  </button>
</template>

<style scoped>
.wizard-entry-gateway {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  justify-content: center;
  padding: clamp(28px, 5vw, 76px);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--normalText);
  text-align: left;
  opacity: 1;
  transform: scale(1);
  transition: opacity 420ms ease, transform 420ms ease, background 520ms ease;
}

.wizard-entry-gateway--left { transform-origin: left center; }
.wizard-entry-gateway--right { transform-origin: right center; }

.wizard-entry-gateway--active {
  transform: scale(1.012);
  background: radial-gradient(circle at 35% 50%, var(--primary5), transparent 64%);
}

.wizard-entry-gateway--right.wizard-entry-gateway--active {
  background: radial-gradient(circle at 65% 50%, var(--secondary5), transparent 64%);
}

.wizard-entry-gateway--dimmed { opacity: 0.11; }

.wizard-entry-gateway:focus-visible {
  outline: 1px solid var(--primary70);
  outline-offset: -8px;
}

.wizard-entry-gateway__title {
  display: grid;
  gap: 0;
  font-family: var(--app-font-family, 'poppins', system-ui, sans-serif);
  font-size: clamp(2.4rem, 6vw, 6.2rem);
  font-weight: 300;
  letter-spacing: -0.055em;
  line-height: 0.9;
  text-transform: uppercase;
}

.wizard-entry-gateway__lead,
.wizard-entry-gateway__tail {
  display: block;
  white-space: nowrap;
  transition: font-weight 300ms ease, letter-spacing 300ms ease;
}

.wizard-entry-gateway__tail { font-size: 0.62em; }

.wizard-entry-gateway--active .wizard-entry-gateway__lead,
.wizard-entry-gateway--active .wizard-entry-gateway__tail {
  font-weight: 600;
  letter-spacing: -0.045em;
}

.wizard-entry-gateway__description {
  display: block;
  max-width: 30ch;
  margin-top: clamp(18px, 3vh, 30px);
  color: var(--normalText40);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(0.8rem, 1.1vw, 0.96rem);
  font-style: italic;
  line-height: 1.55;
  opacity: 0;
  transform: translateY(5px);
  transition: opacity 300ms ease, transform 300ms ease;
}

.wizard-entry-gateway--active .wizard-entry-gateway__description {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 740px) {
  .wizard-entry-gateway { min-height: 0; padding: 26px 22px; }
  .wizard-entry-gateway__title { font-size: clamp(2.2rem, 13vw, 4.4rem); }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-entry-gateway,
  .wizard-entry-gateway__lead,
  .wizard-entry-gateway__tail,
  .wizard-entry-gateway__description { transition: none; }
}
</style>
