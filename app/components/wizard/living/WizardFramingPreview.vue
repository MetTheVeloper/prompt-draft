<script setup lang="ts">
const props = defineProps<{
  framing?: string | null;
}>();

const cropHeight = computed(() => {
  if (props.framing === "headshot") return "31%";
  if (props.framing === "head_shoulders") return "47%";
  if (props.framing === "half_body") return "69%";
  if (props.framing === "full_body") return "100%";
  return "100%";
});

const active = computed(() => Boolean(props.framing));
</script>

<template>
  <div class="wizard-framing-preview" aria-hidden="true">
    <div class="wizard-framing-preview__figure">
      <span class="wizard-framing-preview__head" />
      <span class="wizard-framing-preview__torso" />
      <span class="wizard-framing-preview__arm wizard-framing-preview__arm--left" />
      <span class="wizard-framing-preview__arm wizard-framing-preview__arm--right" />
      <span class="wizard-framing-preview__leg wizard-framing-preview__leg--left" />
      <span class="wizard-framing-preview__leg wizard-framing-preview__leg--right" />
      <span
        class="wizard-framing-preview__crop"
        :class="{ 'wizard-framing-preview__crop--active': active }"
        :style="{ height: cropHeight }"
      />
    </div>
  </div>
</template>

<style scoped>
.wizard-framing-preview {
  display: flex;
  width: 112px;
  height: 172px;
  align-items: flex-start;
  justify-content: center;
}

.wizard-framing-preview__figure {
  position: relative;
  width: 76px;
  height: 156px;
}

.wizard-framing-preview__head,
.wizard-framing-preview__torso,
.wizard-framing-preview__arm,
.wizard-framing-preview__leg {
  position: absolute;
  display: block;
  background: var(--normalText15);
}

.wizard-framing-preview__head {
  top: 0;
  left: 50%;
  width: 24px;
  height: 28px;
  border-radius: 48%;
  transform: translateX(-50%);
}

.wizard-framing-preview__torso {
  top: 34px;
  left: 50%;
  width: 34px;
  height: 48px;
  border-radius: 8px 8px 4px 4px;
  transform: translateX(-50%);
}

.wizard-framing-preview__arm {
  top: 38px;
  width: 12px;
  height: 44px;
  border-radius: 5px;
}

.wizard-framing-preview__arm--left { left: 8px; }
.wizard-framing-preview__arm--right { right: 8px; }

.wizard-framing-preview__leg {
  top: 88px;
  width: 17px;
  height: 68px;
  border-radius: 5px 5px 2px 2px;
}

.wizard-framing-preview__leg--left { left: 18px; }
.wizard-framing-preview__leg--right { right: 18px; }

.wizard-framing-preview__crop {
  position: absolute;
  inset: 0 0 auto;
  display: block;
  width: 100%;
  border: 1px solid var(--normalText10);
  background: transparent;
  transition:
    height 350ms ease,
    border-color 220ms ease,
    background 220ms ease;
}

.wizard-framing-preview__crop--active {
  border-color: var(--primary70);
  background: var(--primary05);
}

@media (prefers-reduced-motion: reduce) {
  .wizard-framing-preview__crop { transition: none; }
}
</style>
