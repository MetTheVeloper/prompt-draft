<template>
  <component
    :is="componentTag"
    v-bind="componentAttrs"
    ref="flexRef"
    :class="flexClass"
    :style="flexStyle"
    @mousemove="mouseMove"
    @mousedown="mouseDown"
    @mouseup="mouseUp"
    @mouseout="mouseOut"
  >
    <div
      v-if="props.effect"
      :class="['effect poa flb16 pen', `bg-${props.effect.color}`]"
      :style="effectStyle"
    />

    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, resolveComponent, toRefs, useAttrs } from "vue";
defineOptions({
  inheritAttrs: false,
});

type FlexEffect = {
  color: string;
  transition?: number;
};

type RadiusValue = number | string | boolean | Array<number | string>;
type PaddingValue = number | string | boolean | Array<number | string>;
type BorderValue = number | string | boolean | Array<number | string>;
type BorderColorValue = string | string[];

const props = withDefaults(
  defineProps<{
    gap?: number | string;
    radius?: RadiusValue;
    p?: PaddingValue;
    br?: BorderValue;
    bc?: BorderColorValue;
    bt?: string;
    type?: string;
    to?: string;
    rules?: string;
    size?: number;
    bg?: string;
    bd?: string;
    effect?: FlexEffect | false;
    debug?: boolean;
  }>(),
  {
    radius: false,
    p: false,
    br: false,
    bt: "s",
    type: "div",
    to: "/",
    rules: "csc",
    effect: false,
    debug: false,
  }
);

const attrs = useAttrs();

const { gap, rules, radius, p, br, bt } = toRefs(props);

const flexRef = ref<HTMLElement | null>(null);

const componentTag = computed(() => {
  if (props.type === "link") {
    return resolveComponent("NuxtLink");
  }

  return props.type || "div";
});

const componentAttrs = computed(() => {
  const base: Record<string, unknown> = {
    ...attrs,
  };

  if (props.type === "link") {
    base.to = props.to;
  }

  return base;
});

const borderRadius = computed(() => {
  let brClass = "";

  if (radius.value === true) {
    brClass = "br8";
  } else if (typeof radius.value === "number") {
    brClass = `br${fixNumber(radius.value)}`;
  } else if (typeof radius.value === "string") {
    brClass = `br${fixNumber(parseInt(radius.value, 10))}`;
  } else if (Array.isArray(radius.value)) {
    const a = radius.value;
    const l = a.length;

    switch (l) {
      case 0:
        brClass = "br0";
        break;

      case 1:
        brClass = `br${a[0]}`;
        break;

      case 2:
        brClass = `brtr${a[0]} brbl${a[0]} brtl${a[1]} brbr${a[1]}`;
        break;

      case 3:
        brClass = `brtr${a[0]} brtl${a[1]} brbl${a[2]} brbr${a[0]}`;
        break;

      case 4:
        brClass = `brtl${a[0]} brtr${a[1]} brbr${a[2]} brbl${a[3]}`;
        break;

      default:
        brClass = "br0";
        break;
    }
  } else {
    brClass = "br1000";
  }

  return brClass;
});

const padding = computed(() => {
  let pad = "";

  if (p.value === true) {
    pad = "p8";
  } else if (typeof p.value === "number") {
    pad = `p${fixNumber(p.value)}`;
  } else if (typeof p.value === "string") {
    pad = `p${fixNumber(parseInt(p.value, 10))}`;
  } else if (Array.isArray(p.value)) {
    const a = p.value;
    const l = a.length;

    switch (l) {
      case 0:
        pad = "p0";
        break;

      case 1:
        pad = `p${a[0]}`;
        break;

      case 2:
        pad = `pt${a[0]} pb${a[0]} pl${a[1]} pr${a[1]}`;
        break;

      case 3:
        pad = `pt${a[0]} pl${a[1]} pr${a[1]} pb${a[2]}`;
        break;

      case 4:
        pad = `pt${a[0]} pr${a[1]} pb${a[2]} pl${a[3]}`;
        break;

      default:
        pad = "p0";
        break;
    }
  }

  return pad;
});

const border = computed(() => {
  let bor = "";

  if (br.value === true) {
    bor = `br${bt.value}1`;
  } else if (typeof br.value === "number") {
    bor = `br${bt.value}${br.value}`;
  } else if (typeof br.value === "string") {
    bor = `br${bt.value}${parseInt(br.value, 10)}`;
  } else if (Array.isArray(br.value)) {
    const a = br.value;
    const l = a.length;

    switch (l) {
      case 0:
        bor = `br${bt.value}1`;
        break;

      case 1:
        bor = `br${bt.value}${a[0]}`;
        break;

      case 2:
        bor = `br${bt.value}t${a[0]} br${bt.value}b${a[0]} br${bt.value}l${a[1]} br${bt.value}r${a[1]}`;
        break;

      case 3:
        bor = `br${bt.value}t${a[0]} br${bt.value}r${a[1]} br${bt.value}l${a[1]} br${bt.value}b${a[2]}`;
        break;

      case 4:
        bor = `br${bt.value}t${a[0]} br${bt.value}r${a[1]} br${bt.value}b${a[2]} br${bt.value}l${a[3]}`;
        break;

      default:
        bor = "brs0";
        break;
    }
  }

  return bor;
});

const flexClass = computed(() => {
  const g = gap.value ?? 8;

  return [
    "por usn",
    `f${rules.value}`,
    props.bg ? `bg-${props.bg}` : "",
    borderRadius.value,
    props.p ? padding.value : "",
    props.bd ? `bd${props.bd}` : "",
    `por fgp${g}`,
    border.value,
    props.effect ? "ofh" : "",
  ];
});

const flexStyle = computed(() => {
  let borderColors: Record<string, string> | null = null;

  if (props.bc) {
    if (typeof props.bc === "string") {
      borderColors = {
        borderColor: splitColor(props.bc).cssVariableFull,
      };
    } else if (Array.isArray(props.bc)) {
      switch (props.bc.length) {
        case 1:
          borderColors = {
            borderColor: splitColor(props.bc[0]).cssVariableFull,
          };
          break;

        case 2:
          borderColors = {
            borderTopColor: splitColor(props.bc[0]).cssVariableFull,
            borderBottomColor: splitColor(props.bc[0]).cssVariableFull,
            borderRightColor: splitColor(props.bc[1]).cssVariableFull,
            borderLeftColor: splitColor(props.bc[1]).cssVariableFull,
          };
          break;

        case 3:
          borderColors = {
            borderTopColor: splitColor(props.bc[0]).cssVariableFull,
            borderBottomColor: splitColor(props.bc[2]).cssVariableFull,
            borderRightColor: splitColor(props.bc[1]).cssVariableFull,
            borderLeftColor: splitColor(props.bc[1]).cssVariableFull,
          };
          break;

        case 4:
          borderColors = {
            borderTopColor: splitColor(props.bc[0]).cssVariableFull,
            borderRightColor: splitColor(props.bc[1]).cssVariableFull,
            borderBottomColor: splitColor(props.bc[2]).cssVariableFull,
            borderLeftColor: splitColor(props.bc[3]).cssVariableFull,
          };
          break;

        default:
          borderColors = null;
          break;
      }
    }
  } else {
    borderColors = {
      borderColor: splitColor("normal0").cssVariableFull,
    };
  }

  return borderColors;
});

const transition = ref(700);
const effectSize = ref(0);
const effectX = ref(0);
const effectY = ref(0);
const isMouseDown = ref(false);

const effectTransition = computed(() => {
  if (!props.effect) return transition.value;
  return props.effect.transition ?? transition.value;
});

const effectStyle = computed(() => ({
  width: `${effectSize.value * (isMouseDown.value ? 2 : 1)}px`,
  height: `${effectSize.value * (isMouseDown.value ? 2 : 1)}px`,
  borderRadius: "50%",
  top: `${effectY.value}%`,
  left: `${effectX.value}%`,
  filter: `blur(${isMouseDown.value ? 16 : 4}px)`,
  opacity: isMouseDown.value ? "0.50" : "0.25",
  transform: "translate(-50%, -50%)",
  transition: `
    width ease ${effectTransition.value}ms,
    height ease ${effectTransition.value}ms,
    background ease ${effectTransition.value}ms,
    opacity ease ${effectTransition.value}ms
  `,
}));

const mouseMove = (e: MouseEvent) => {
  if (!props.effect) return;

  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;

  const rect = target.getBoundingClientRect();

  effectX.value = ((e.clientX - rect.left) / rect.width) * 100;
  effectY.value = ((e.clientY - rect.top) / rect.height) * 100;
  effectSize.value = rect.height * 2.5;
};

const mouseOut = () => {
  if (!props.effect) return;

  effectSize.value = 0;
  isMouseDown.value = false;
};

const mouseDown = () => {
  if (!props.effect) return;

  isMouseDown.value = true;
};

const mouseUp = () => {
  if (!props.effect) return;

  isMouseDown.value = false;
};

onMounted(() => {
  // console.warn(splitColor(props.bc).cssVariableFull);
});
</script>
