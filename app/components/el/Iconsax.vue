<template>
  <div class="por">
    <i
      :class="`uiIcon i-${icon.replace(
        'ui-',
        ''
      )} por fccc ${iconColor} mnwp${size} mnhp${size} wp${size} hp${size} fs${size}`"
      :style="{
        cursor: pointer || button ? 'pointer' : 'auto',
        color: hex === undefined ? 'auto' : hex,
        fontSize: `${size || sizes.icon}px`,
      }"
    >
      <div class="buttonHover" v-if="button"></div>
    </i>
    <div
      :class="[
        `mnwp12 mnhp12 br16 lh1 bg-${badgeColor} txt-white poa t0 trnsy-50 frcc`,

        { rp0: $i18n.locale === 'en' },
        { 'lp0 trnsx-50': $i18n.locale === 'fa' },
        { 'mnwp20 mnhp20': badge !== '' && desktopMode },
        { 'mnwp16 mnhp16 p4': badge !== '' && !desktopMode },
      ]"
      v-if="badge"
    >
      {{ badge }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: false,
  },
  pointer: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    required: false,
  },
  button: {
    type: Boolean,
    required: false,
  },
  badge: {
    type: [String, Number],
    required: false,
  },
  badgeColor: {
    type: String,
    default: "red",
  },
  badgeTextColor: {
    type: String,
    default: "white",
  },
  hex: {
    type: String,
    required: false,
  },
});

const { mobile, mini } = useScreen();

const desktopMode = computed(() => {
  return !mobile.value && !mini.value;
});

import { useAppStore } from "~/store/app";

const app = useAppStore();

const sizes = computed(() => {
  return dimension(props.size || app.settings.globalSize);
});

const iconColor = computed(() => {
  let c = "";
  if (props.hex === undefined) {
    c = "txt-normal";
    if (props.color !== undefined) {
      c = `txt-${props.color}`;
    }
  }
  return c;
});
</script>

<style lang="scss" scoped>
.uiIcon {
  .buttonHover {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--primary0);
    background: radial-gradient(circle, var(--primary25) 0%, var(--primary0) 100%);
    width: 0;
    height: 0;
    filter: blur(4px);
    border-radius: 200px;
    transition: all ease-in-out 0.2s;
  }
}

.uiIcon:hover {
  .buttonHover {
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    background: var(--primary0);
    background: radial-gradient(circle, var(--primary25) 0%, var(--primary0) 100%);
  }
}
</style>
