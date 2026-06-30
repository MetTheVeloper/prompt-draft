<template>
  <el-flex rules="rcc" :class="['usn por', disable ? 'crna pen' : '']" :br="0">
    <el-flex rules="rcc" class="usn por w100"
      :type="to ? 'link' : 'div'"
      :to="to"
      style="-webkit-user-drag: none;"
      @mouseenter="hover = true"
      @mouseleave="hover = false"
      :debug="true"
      :radius="buttonRadius"
      :br="buttonBorder.size"
      :bc="buttonBorder.color"
      :effect="preparedEffect"
      :p="buttonPadding"
      :class="[bodyClass, bodyClasses]">
      <div v-if="$slots.default" class="w100">
        <slot></slot>
      </div>
      <el-flex :rules="rules ?? 'rcc'" class="w100 h100 pen por" :gap="gap ?? fixNumber(app.settings.globalSize * 0.5)" v-else>
        <slot name="icon" v-if="!invert && $slots.icon"></slot>
        <el-icon
          v-if="!buttonType.simple && !invert && !$slots.icon && icon"
          :size="iconSize || sizes.button.icon"
          :icon="icon"
          class="pen"
          :mode="iconMode"
          :color="mode === 'outline' || mode === 'flat' ? (iconColor || targetColor.short) : iconColor ?? buttonTextColor">
          {{ icon }}
        </el-icon>
        <el-flex :gap="2" :rules="!invert ? 'ccs' : 'cce'" v-if="!buttonType.fab || (buttonType.fab && typeof label === 'number')">
          <el-text
            :size="sizes.button.label"
            :style="{
              fontFamily: font ? font : 'unset'
            }"
            :class="['lh1 wsnw']"
            weight="500"
            :color="mode === 'outline' || mode === 'flat' ? (textColor || targetColor.short) : buttonTextColor">
            {{ label }}
          </el-text>
          <el-text
            :size="fixNumber(sizes.button.label * 0.8)" v-if="sublabel"
            :style="{
              fontFamily: font ? font : 'unset'
            }"
            :localize="true"
            :class="['lh1 wsnw']"
            weight="300"
            :color="mode === 'outline' || mode === 'flat' ? (textColor || targetColor.short) : buttonTextColor">
            {{ sublabel }}
          </el-text>
        </el-flex>
        <el-icon
          v-if="!buttonType.simple && invert && !$slots.icon && icon"
          :size="iconSize || sizes.button.icon"
          :icon="icon"
          class="pen"
          :mode="iconMode"
          :color="mode === 'outline' || mode === 'flat' ? (iconColor || targetColor.short) : iconColor ?? buttonTextColor">
          {{ icon }}
        </el-icon>
        <slot name="icon" v-if="invert && $slots.icon"></slot>
        <slot name="iconafter"></slot>
      </el-flex>
    </el-flex>
    <!-- tooltip -->
    <el-tooltip :opened="(label || tooltip) && hover && buttonTooltip.show"
      :size="sizes.button.tooltip.label"
      :body="tooltip || label" :position="tooltipPosition" />
    <el-text
      v-if="false"
      :size="sizes.button.tooltip.label"
      :style="{
        fontFamily: font ? font : 'unset'
      }"
      :color="buttonTextColor"
      :class="[tooltipClass, 'zi700 bsh4']">
      {{ buttonTooltip.label }}
    </el-text>
    <!-- badge -->
    <el-text
      v-if="badge"
      :size="sizes.badge.label"
      :localize="true"
      color="white"
      :class="[badgeClass, 'zi600 pen pt4 pb4 lh1']">
      {{ badge }}
    </el-text>
  </el-flex>
</template>

<script setup>
import { useAppStore } from '~/store/app';

const props = defineProps({
  mode: {
    type: String,
    default: 'normal',
    validator: (value) => ['outline', 'flat', 'normal', 'gradient'].includes(value),
  },
  rules: {
    type: String,
    required: false,
  },
  font: {
    type: String,
    required: false,
  },
  badge: {
    type: [String, Number],
    required: false,
  },
  bodyClasses: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'normal',
  },
  rippleColor: {
    type: String,
    default: 'normal45',
  },
  textColor: {
    type: String,
    required: false,
  },
  iconColor: {
    type: String,
    required: false,
  },
  iconMode: {
    type: String,
    default: 'vuesax',
  },
  iconSize: {
    type: Number,
    required: false,
  },
  size: {
    type: [String, Number],
    default: 'normal',
    validator: value => typeof value === 'number'
      ? value >= 0
      : ['tiny', 'mini', 'normal', 'medium', 'big', '-3', '-2', '-1', '0', '+1', '+2', '+3'].includes(value),
  },
  radius: {
    type: [Number, Array],
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  to: {
    type: String,
    required: false,
  },
  gap: {
    type: Number,
    required: false,
  },
  type: {
    type: String,
    default: 'normal',
  },
  tooltip: {
    type: [String, Boolean],
    default: false,
  },
  tooltipPosition: {
    type: String,
    default: 'bottom',
  },
  label: {
    type: [String, Number],
    required: false,
  },
  sublabel: {
    type: [String, Number],
    required: false,
  },
  invert: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  },
  effect: {
    type: [Object, Boolean],
    default: false,
  },
  br: {
    type: [Number, String, Boolean, Array],
    required: false,
  },
  bc: {
    type: [Number, String, Boolean, Array],
    required: false,
  },
  p: {
    type: [Number, Array],
    required: false,
  },
  bd: {
    type: String,
    required: false,
  },
  debug: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['clicked']);

const preparedEffect = computed(() => {
  if (props.effect === false) return false;
  let def = null;
  if (props.effect === true) {
    def = {
      type: 'hover',
      transition: 700,
    };
  } else {
    def = props.effect;
  }
  return {
    type: def.type ?? 'hover',
    transition: def.transition ?? 300,
    color: ['outline', 'flat'].includes(props.mode) ? (def.color || props.color) : targetColor.value.alpha < 40 ? (def.color ?? 'normal') : 'normal',
  }
})

const app = useAppStore();

const hover = ref(false);

const sizes = computed(() => {
  const sizeMap = [
    {
      size: 'tiny',
      value: -2
    },
    {
      size: 'mini',
      value: -1
    },
    {
      size: 'normal',
      value: 0
    },
    {
      size: 'medium',
      value: 1,
    },
    {
      size: 'big',
      value: 2,
    },
    {
      size: '-3',
      value: -3,
    },
    {
      size: '-2',
      value: -2,
    },
    {
      size: '-1',
      value: -1,
    },
    {
      size: '0',
      value: 0,
    },
    {
      size: '+1',
      value: 1,
    },
    {
      size: '+2',
      value: 2,
    },
    {
      size: '+3',
      value: 3,
    },
  ];
  let power = 0;
  let mainSize = app.settings.globalSize;
  if (typeof props.size === 'number') {
    mainSize = fixNumber(props.size);
  } else if (typeof props.size === 'string') {
    const size = sizeMap.find(s => s.size === props.size);
    if (size) {
      power = size.value;
      mainSize += power;
    }
  }
  return dimension(mainSize);
});

// button options as ref
const prepareColor = (color) => {
  if (!color) {
    return null;
  }
  const match = color.match(/\d+$/); // فقط عدد انتهای رشته
  const alpha = match ? parseInt(match[0], 10) : 100;
  const c = getColor(color);
  c.alpha = alpha;
  return c;
}

const targetColor = computed(() => {
  return prepareColor(props.color);
});

const targetTextColor = computed(() => {
  return prepareColor(props.textColor) || 'normal';
});

// type
const buttonType = computed(() => {
  const hasLabel = props.label && props.label.length > 0;
  const hasIcon = props.icon;
  const isFab = props.type === 'fab' || !hasLabel || typeof props.label === 'number';
  const isSimple = props.type === 'simple' || !hasIcon;
  const isNormal = !isFab && !isSimple;

  return {
    fab: isFab,
    simple: isSimple,
    normal: isNormal,
  }
});

// background
const buttonColor = computed(() => {
  const borderSize = props.mode === 'outline' ? sizes.value.border : 0;
  if (props.mode === 'normal') {
    return `bg-${targetColor.value.short}${Math.abs(targetColor.value.alpha - 5)} hbg-${targetColor.value.short}${targetColor.value.alpha}`;
  } else if (props.mode === 'outline' && false) {
    return `brs${borderSize} bc-${targetColor.value.short}${Math.abs(targetColor.value.alpha - 10)} hbc-${targetColor.value.short}${targetColor.value.alpha}`;
  } else if (props.mode === 'flat') {
    return `bg-${targetColor.value.short}0 hbg-${targetColor.value.short}0`;
  } else if (props.mode === 'gradient') {
    return `gr-${targetColor.value.short}${Math.abs(targetColor.value.alpha)} hgr-${targetColor.value.short}`;
  }
});

// tooltip
const buttonTooltip = computed(() => {
  const show = props.tooltip !== undefined && buttonType.value.fab;
  const label = props.tooltip || props.label;
  return {
    show,
    label,
  };
});

// text
const buttonTextColor = computed(() => {
  if (props.textColor) return props.textColor;
  const t = targetTextColor.value;
  const c = targetColor.value;
  const globalCondition = c.alpha > 40 || ['outline', 'flat'].includes(props.mode);
  const forceWhite = (![
    'normal',
    'invert',
    'background',
    'surface',
    'white',
    'yellow',
    // sss
  ].includes(c.short) || props.textColor === 'white') && globalCondition;
  const forceBlack = (['white', 'orange', 'yellow'].includes(c.short) || props.textColor === 'black') && globalCondition;
  const forceOnPrim = ['prim', 'primDark'].includes(c.short) && globalCondition;
  const forceOnSec = ['sec', 'secDark'].includes(c.short) && globalCondition;
  const forceInvert = ['normal'].includes(c.short) && globalCondition;
  return forceWhite ? 'white' : forceBlack ? 'black' : forceOnPrim ? 'on-prim' : forceOnSec ? 'on-sec' : forceInvert ? 'invert' : `${t.short}${Math.abs(t.alpha)}`;
});

const slots = useSlots();

const bodyClass = computed(() => {
  const b = sizes.value.button;
  return [
    props.disable ? 'pen o50 flg10' : '',
    'crp por',
    props.bd ? `bd${props.bd}` : '',
    props.effect?.transition ? `tne${props.effect?.transition}` : 'tne200',
    hover.value ? 'hzi500' : '',
    buttonColor.value,
    !props.p ? `hp${b.height}` : '',
    buttonType.value.fab ? !props.p ? `mnwp${b.height} mxwp${b.height}` : '' : '',
  ];
});

const buttonPadding = computed(() => {
  const p = sizes.value.button.padding;
  if (props.p) {
    return props.p;
  } else {
    return [fixNumber(p.right * 0.2), p.right];
  }
});

const buttonRadius = computed(() => {
  return props.radius ? props.radius : buttonType.value.fab ? 100 : sizes.value.button.radius;
});

const buttonBorder = computed(() => {
  let c = null;
  if (props.bc) {
    c = props.bc
  } else {
    c = '123456';
  }
  return {
    size: props.mode === 'outline' ? (props.br || sizes.value.border) : 0,
    color: props.bc ? props.bc : `${targetColor.value.short}${Math.abs(targetColor.value.alpha)}`,
  }
})


const tooltipClass = computed(() => {
  const p = sizes.value.button.tooltip.padding;
  const bg = `${targetColor.value.short === 'normal' ? 'invert' : targetColor.value.short}`;
  const position = () => {
    if (props.tooltipPosition === 'top') {
      return 'b110 l50 trnsx-50';
    } else if (props.tooltipPosition === 'bottom') {
      return 't110 l50 trnsx-50';
    } else if (props.tooltipPosition === 'left') {
      return 't50 r110 trnsy-50';
    } else if (props.tooltipPosition === 'right') {
      return 't50 l110 trnsy-50';
    }
  }
  return [
    position(),
    'poa tne100 wsnw lh1 zi500',
    `mnhp${sizes.value.button.tooltip.height}`,
    `p${p} br${sizes.value.button.tooltip.radius}`,
    `bg-${bg}`,
  ];
});

const badgeClass = computed(() => {
  const p = sizes.value.badge.padding;
  const s = sizes.value.badge.height;
  return [
    'poa t10 l95 trnsxy-50 tne100 wsnw lh1 zi50 frcc',
    ` br${sizes.value.radius * 5}`,
    `pl${p} pr${p}`,
    `mxhp${s} mnhp${s} mnwp${s}`,
    `bg-red`,
  ];
});

onMounted(() => {
  nextTick(() => {
    if (props.debug) {
    }
  });
});

</script>

<style lang="scss" scoped>
.latin {
  font-family: latin !important;
}
.yb {
  font-family: yb !important;
}
.kalame {
  font-family: kalame !important;
}
.arial {
  font-family: 'Arial' !important;
}
.tahoma {
  font-family: 'Tahoma' !important;
}
</style>