<!-- components/tooltip.vue -->
<template>
  <el-flex rules="ccc"
    :radius="8"
    :class="classes.bubble">
    <el-text class="lh1" :size="fixNumber(size)" v-if="title" :weight="600">{{ title }}</el-text>
    <el-text class="lh1" :size="fixNumber(size * 0.8)" v-if="body !== ''" :weight="300">{{ body }}</el-text>
    <div :class="classes.arrow"
      :style="{
        boxShadow: arrowPosition.style,
      }"></div>
  </el-flex>
</template>

<script setup lang="ts">
type TooltipPosition = "top" | "bottom" | "left" | "right";

const props = withDefaults(
  defineProps<{
    position?: TooltipPosition;
    title?: string | null;
    body?: string;
    opened?: boolean;
    size?: number;
  }>(),
  {
    position: "bottom",
    title: null,
    body: "",
    opened: false,
    size: 16,
  },
);

const arrowSize = ref(8);

const classes = computed<{
  bubble: string,
  arrow: string,
}>(() => {
  const bubble = `bubble brs1 bg-surface bc-normal15 tne100 pl12 pr12 pt8 pb8 wsnw poa ${props.position} pen chpen zi3000 ${props.opened ? 'opened' : ''}`;
  const arrow = `${arrowPosition.value.c} wp${arrowSize.value} hp${arrowSize.value} bg-surface poa arrow`
  return {
    bubble,
    arrow,
  }
});

const bubblePosition = computed<string>(() => {
  switch (props.position) {
    case 'top': {
      return 'b100 l50 trnsx-50';
    }
    case 'bottom': {
      return 't100 l50 trnsx-50';
    }
    case 'left': {
      return 't50 r100 trnsy-50';
    }
    case 'right': {
      return 't50 l100 trnsy-50';
    }
    default:
      return 't50 l50';
  }
})

const arrowPosition = computed<{
  c: string,
  style: string,
}>(() => {
  let c = '';
  let arrowShadowPosition = [0, 0];
  switch (props.position) {
    case 'top': {
      c = 't100 l50';
      arrowShadowPosition = [1, 1];
      break;
    }
    case 'bottom': {
      c = 't0 l50';
      arrowShadowPosition = [-1, -1];
      break;
    }
    case 'left': {
      c = 't50 l100';
      arrowShadowPosition = [1, -1];
      break;
    }
    case 'right': {
      c = 't50 l0';
      arrowShadowPosition = [-1, 1];
      break;
    }
    default:
      break;
  }
  let style = `${arrowShadowPosition[0]}px ${arrowShadowPosition[1]}px 0 0 var(--normalText15)`;
  // console.warn(style);
  return {
    c,
    style,
  };
})

</script>

<style scoped>
  .arrow {
    transform: translate(-50%, -50%) rotate(45deg);
    box-shadow: -1px -1px 0 0 var(--normalText15);
  }

  .top {
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, 0) scale(0);
  }

  .top.opened {
    transform: translate(-50%, 0) scale(1);
    transform-origin: center bottom;
  }

  .bottom {
    top: 100%;
    left: 50%;
    transform: translate(-50%, 0) scale(0);
    transform-origin: center top;
  }

  .bottom.opened {
    transform: translate(-50%, 0) scale(1);
  }

  .left {
    top: 50%;
    right: 100%;
    transform: translate(0, -50%) scale(0);
    transform-origin: right center;
  }

  .left.opened {
    transform: translate(0, -50%) scale(1);
  }

  .right {
    top: 50%;
    left: 100%;
    transform: translate(0, -50%) scale(0);
    transform-origin: left center;
  }

  .right.opened {
    transform: translate(0, -50%) scale(1);
  }

</style>
