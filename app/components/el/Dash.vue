<template>
  <div class="w100 fccc">
    <!-- Directly access props variables -->
    <svg :height="height" class="w100">
      <line x1="0%" :y1="`${height / 2}`" x2="100%" :y2="`${height / 2}`" :stroke="splitColor(color).cssVariableFull" 
        :stroke-width="height" :stroke-dasharray="dashArray" stroke-linecap="round" />
    </svg>
  </div>
</template>

<script setup>
  // Define props directly with `defineProps`
  const props = defineProps({
    height: {
      type: Number,
      required: true,
      default: 2,
    },
    color: {
      type: String,
      default: 'normal25',
    },
    dashArray: {
      type: String,
      default: "8, 8",
    },
  });

</script>

<style lang="scss" scoped>
</style>