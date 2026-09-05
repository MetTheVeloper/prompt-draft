<!-- components/tooltip.vue -->
<template>
  <ClientOnly>
    <Teleport to="#teleports">
      <Transition name="elTooltipTransition">
        <div
          v-if="opened && hasContent"
          ref="bubbleRef"
          class="el-tooltip-portal"
          :class="`el-tooltip-portal--${resolvedPosition}`"
          :style="bubbleStyle"
          role="tooltip">
          <el-flex
            rules="ccc"
            :radius="8"
            class="el-tooltip-bubble brs1 bg-surface bc-normal15 pl12 pr12 pt8 pb8 wsnw por pen">
            <el-text
              v-if="title"
              class="lh1"
              :size="fixNumber(size)"
              :weight="600">
              {{ title }}
            </el-text>
            <el-text
              v-if="body !== ''"
              class="lh1"
              :size="fixNumber(size * 0.8)"
              :weight="300">
              {{ body }}
            </el-text>
            <div
              class="el-tooltip-arrow bg-surface"
              :class="`el-tooltip-arrow--${resolvedPosition}`"
              :style="arrowStyle" />
          </el-flex>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
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

const instance = getCurrentInstance();
const bubbleRef = ref<HTMLDivElement | null>(null);
const resolvedPosition = ref<TooltipPosition>(props.position);
const position = reactive({
  left: 0,
  top: 0,
  ready: false,
  arrowX: 0,
  arrowY: 0,
});

const SAFE_PADDING = 8;
const TOOLTIP_GAP = 8;
const ARROW_EDGE_PADDING = 12;
let frameId = 0;

const hasContent = computed(() => Boolean(props.title) || props.body !== "");

function resolveAnchorElement(): HTMLElement | SVGElement | null {
  if (!import.meta.client) return null;

  const parentElement = instance?.parent?.proxy?.$el;
  if (parentElement instanceof HTMLElement || parentElement instanceof SVGElement) {
    return parentElement;
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function opposite(value: TooltipPosition): TooltipPosition {
  switch (value) {
    case "top": return "bottom";
    case "bottom": return "top";
    case "left": return "right";
    case "right": return "left";
  }
}

function hasRoom(
  side: TooltipPosition,
  anchor: DOMRect,
  width: number,
  height: number,
) {
  switch (side) {
    case "top":
      return anchor.top - TOOLTIP_GAP - height >= SAFE_PADDING;
    case "bottom":
      return anchor.bottom + TOOLTIP_GAP + height <= window.innerHeight - SAFE_PADDING;
    case "left":
      return anchor.left - TOOLTIP_GAP - width >= SAFE_PADDING;
    case "right":
      return anchor.right + TOOLTIP_GAP + width <= window.innerWidth - SAFE_PADDING;
  }
}

function choosePosition(anchor: DOMRect, width: number, height: number) {
  const preferred = props.position;
  if (hasRoom(preferred, anchor, width, height)) return preferred;

  const flipped = opposite(preferred);
  return hasRoom(flipped, anchor, width, height) ? flipped : preferred;
}

async function updatePosition() {
  if (!props.opened || !hasContent.value || !import.meta.client) return;

  position.ready = false;
  await nextTick();

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const anchorElement = resolveAnchorElement();
  const bubbleElement = bubbleRef.value;
  if (!anchorElement || !bubbleElement) return;

  const anchor = anchorElement.getBoundingClientRect();
  const bubble = bubbleElement.getBoundingClientRect();
  const width = bubble.width || 1;
  const height = bubble.height || 1;
  const side = choosePosition(anchor, width, height);

  let left = anchor.left + (anchor.width - width) / 2;
  let top = anchor.top + (anchor.height - height) / 2;

  if (side === "top") top = anchor.top - height - TOOLTIP_GAP;
  if (side === "bottom") top = anchor.bottom + TOOLTIP_GAP;
  if (side === "left") left = anchor.left - width - TOOLTIP_GAP;
  if (side === "right") left = anchor.right + TOOLTIP_GAP;

  left = clamp(left, SAFE_PADDING, window.innerWidth - width - SAFE_PADDING);
  top = clamp(top, SAFE_PADDING, window.innerHeight - height - SAFE_PADDING);

  resolvedPosition.value = side;
  position.left = left;
  position.top = top;
  position.arrowX = clamp(
    anchor.left + anchor.width / 2 - left,
    ARROW_EDGE_PADDING,
    Math.max(ARROW_EDGE_PADDING, width - ARROW_EDGE_PADDING),
  );
  position.arrowY = clamp(
    anchor.top + anchor.height / 2 - top,
    ARROW_EDGE_PADDING,
    Math.max(ARROW_EDGE_PADDING, height - ARROW_EDGE_PADDING),
  );
  position.ready = true;
}

function schedulePosition() {
  if (!props.opened || !import.meta.client) return;

  if (frameId) cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(() => {
    frameId = 0;
    void updatePosition();
  });
}

const bubbleStyle = computed(() => ({
  left: `${position.left}px`,
  top: `${position.top}px`,
  visibility: position.ready ? "visible" : "hidden",
  opacity: position.ready ? 1 : 0,
  "--el-tooltip-arrow-x": `${position.arrowX}px`,
  "--el-tooltip-arrow-y": `${position.arrowY}px`,
}));

const arrowStyle = computed(() => {
  let x = 0;
  let y = 0;

  switch (resolvedPosition.value) {
    case "top":
      x = 1;
      y = 1;
      break;
    case "bottom":
      x = -1;
      y = -1;
      break;
    case "left":
      x = 1;
      y = -1;
      break;
    case "right":
      x = -1;
      y = 1;
      break;
  }

  return {
    boxShadow: `${x}px ${y}px 0 0 var(--normalText15)`,
  };
});

watch(
  () => [props.opened, props.position, props.title, props.body, props.size],
  () => {
    if (!props.opened) {
      position.ready = false;
      return;
    }

    resolvedPosition.value = props.position;
    schedulePosition();
  },
  { flush: "post" },
);

onMounted(() => {
  window.addEventListener("resize", schedulePosition);
  window.addEventListener("scroll", schedulePosition, true);
});

onBeforeUnmount(() => {
  if (frameId) cancelAnimationFrame(frameId);
  window.removeEventListener("resize", schedulePosition);
  window.removeEventListener("scroll", schedulePosition, true);
});
</script>

<style scoped>
.el-tooltip-portal {
  position: fixed;
  z-index: 4000;
  width: max-content;
  max-width: calc(100vw - 16px);
  pointer-events: none;
  transform-origin: center;
}

.el-tooltip-portal--top {
  transform-origin: center bottom;
}

.el-tooltip-portal--bottom {
  transform-origin: center top;
}

.el-tooltip-portal--left {
  transform-origin: right center;
}

.el-tooltip-portal--right {
  transform-origin: left center;
}

.el-tooltip-bubble {
  width: max-content;
  max-width: calc(100vw - 16px);
  box-shadow: 0 8px 28px rgb(0 0 0 / 24%);
}

.el-tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%) rotate(45deg);
}

.el-tooltip-arrow--top {
  top: 100%;
  left: var(--el-tooltip-arrow-x);
}

.el-tooltip-arrow--bottom {
  top: 0;
  left: var(--el-tooltip-arrow-x);
}

.el-tooltip-arrow--left {
  top: var(--el-tooltip-arrow-y);
  left: 100%;
}

.el-tooltip-arrow--right {
  top: var(--el-tooltip-arrow-y);
  left: 0;
}

.elTooltipTransition-enter-active,
.elTooltipTransition-leave-active {
  transition: opacity 100ms ease, transform 100ms ease;
}

.elTooltipTransition-enter-from,
.elTooltipTransition-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.elTooltipTransition-enter-to,
.elTooltipTransition-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
