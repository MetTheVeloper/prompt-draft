<template>
  <el-flex rules="rcc" class="por" :gap="fixNumber(size * 0.5)">
    <div class="poa zi5 t50 txt-normal0" :style="markerStyle([-5, 5])" v-if="marker">
      {{}}
    </div>
    <div
      class="poa zi5 t50 txt-normal0"
      :style="markerStyle([-4, 4])"
      v-if="marker"
    ></div>
    <div
      class="poa zi5 t50 txt-normal0"
      :style="markerStyle([-3, 3])"
      v-if="marker"
    ></div>
    <div
      class="poa zi5 t50 txt-normal0"
      :style="markerStyle([-2, 2])"
      v-if="marker"
    ></div>
    <el-icon
      v-if="icon"
      :icon="icon"
      :color="iconColor || color"
      :size="size"
      :class="['zi10', iconClass]"
    />
    <component
      :is="type === 'a' || urlMode ? 'nuxt-link' : type"
      :class="[textClass, 'por zi10 fg100', type === 'p' || type === 'body' ? 'p0 m0' : '']"
      :style="textStyle"
      v-bind="urlMode ? { to } : {}"
    >
      <template v-for="(node, i) in localizedText" :key="i">
        <component :is="node" />
      </template>
    </component>
  </el-flex>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: "div",
  },
  to: {
    type: String,
    required: false,
  },
  iconClass: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    required: false,
  },
  iconColor: {
    type: String,
    default: "normal",
  },
  color: {
    type: String,
    default: "normal",
  },
  weight: {
    type: [Number, String],
    default: 400,
  },
  size: {
    type: Number,
    required: false,
  },
  localize: {
    type: Boolean,
    default: false,
  },
  marker: {
    type: String,
    required: false,
  },
  effect: {
    type: String,
    required: false,
  },
  font: {
    type: String,
    required: false,
  },
});

const { type, color, weight, size } = toRefs(props);
const { randomInt } = useRandom();

const markerStyle = (range = [-10, 10]) => {
  if (!props.marker) return {};
  const tel1 = randomInt(-3.5, 0);
  const tel2 = randomInt(-3.5, 0);
  const skewRandom = randomInt(range[0] + tel1, range[1] + tel2);
  return {
    left: `${Math.max(fixNumber(preparedSize.value * 0.3)) * -1}px`,
    right: `${Math.max(fixNumber(preparedSize.value * 0.3)) * -1}px`,
    height: `${fixNumber(preparedSize.value * 1.2)}px`,
    borderRadius: `${fixNumber(preparedSize.value * 0.25)}px`,
    transform: `translateY(-50%) skew(${skewRandom * 1}deg, ${skewRandom / 3}deg)`,
    backgroundColor: splitColor(props.marker).full,
  };
};

const urlMode = computed(() => {
  return type.value === "a" || props.to;
});

const preparedSize = computed(() => {
  // is custom size defined?
  if (props.size) return props.size;
  // default size for text type
  const d = dimension().text;
  if (!props.type || props.type === "div") {
    return d.normal;
  } else {
    return d[props.type] || d.normal;
  }
});

const glitchTimer = ref(null);
let glitchTextShadow = ref(null);

const textStyle = computed(() => {
  const s = {
    fontSize: `${preparedSize.value}px`,
    textShadow: glitchTextShadow.value || "none",
  };
  if (props.font) s.fontFamily = props.font;
  return s;
});

const updateGlitchEffect = () => {
  if (!props.effect) return;
  const p = preparedSize.value;
  // const colors =
  const step = p / 20;
  const steps = [
    Math.round((-2 * step * randomInt(80, 100)) / 100),
    Math.round((-1 * step * randomInt(80, 100)) / 100),
    Math.round((1 * step * randomInt(80, 100)) / 100),
    Math.round((2 * step * randomInt(80, 100)) / 100),
  ];
  const alphas = [
    randomInt(0, 10) * 5,
    randomInt(0, 10) * 5,
    randomInt(0, 10) * 5,
    randomInt(0, 10) * 5,
  ];
  glitchTextShadow.value = `${steps[0]}px 0 0 var(--themeRed${alphas[0]}), ${steps[1]}px 0px 0 var(--themeRed${alphas[1]}), ${steps[2]}px 0 0 var(--themeBlue${alphas[2]}), ${steps[3]}px 0px 0 var(--themeBlue${alphas[3]})`;
};

watch(
  () => textStyle.value,
  () => {
    // console.log(textStyle.value);
  }
);

const textClass = computed(() => {
  return [
    urlMode.value ? "u" : "",
    `${type.value !== "div" && type.value !== "span" ? "" : ""}`,
    `txt-${color.value}`,
    `fw${weight.value}`,
    "usn",
  ];
});

import { useSlots } from "vue";

const slots = useSlots();

const toPersianDigits = (str) => {
  return str.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

const toEnglishDigits = (str) => {
  return str.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
};

const { locale } = useI18n();

const localizedText = computed(() => {
  const nodes = slots.default?.() || [];

  return nodes.map((node) => {
    // فقط text node ها رو تغییر بده
    if (typeof node.children === "string") {
      let text = node.children;

      if (locale.value === "fa") {
        if (props.localize) {
          text = toPersianDigits(text);
        }
      } else {
        text = toEnglishDigits(text);
      }

      return {
        ...node,
        children: text,
      };
    }

    return node;
  });
});

onMounted(() => {
  if (props.effect === "glitch") {
    glitchTimer.value = setInterval(() => {
      updateGlitchEffect();
    }, 100);
  }
});

onBeforeUnmount(() => {
  if (glitchTimer.value) clearTimeout(glitchTimer.value);
});
</script>

<style lang="scss" scoped>
.u {
  text-decoration: underline !important;
  text-decoration-color: var(--themeBlue65) !important;
  text-decoration-thickness: 1px !important;
}
</style>
