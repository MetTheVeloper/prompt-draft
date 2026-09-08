<script setup lang="ts">
import moment from "moment-jalaali";

const props = withDefaults(defineProps<{
  modelValue: string | null;
  disabled?: boolean;
}>(), {
  disabled: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string | null): void;
}>();

const { locale, t } = useI18n();

const jYear = ref("");
const jMonth = ref("");
const jDay = ref("");

const isPersian = computed(() => locale.value === "fa");
const currentJYear = Number(moment().format("jYYYY"));

function formatFaNumber(value: number) {
  return new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);
}

const yearItems = computed(() => Array.from(
  { length: Math.max(1, currentJYear - 1249) },
  (_, index) => {
    const value = currentJYear - index;
    return { value: String(value), label: formatFaNumber(value) };
  },
));

const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const monthItems = monthNames.map((label, index) => ({
  value: String(index + 1),
  label,
}));

const daysInSelectedMonth = computed(() => {
  const year = Number(jYear.value);
  const month = Number(jMonth.value);
  if (!year || !month) return 31;

  try {
    return Number(moment.jDaysInMonth(year, month - 1)) || 31;
  } catch {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 30;
  }
});

const dayItems = computed(() => Array.from(
  { length: daysInSelectedMonth.value },
  (_, index) => ({
    value: String(index + 1),
    label: formatFaNumber(index + 1),
  }),
));

function syncFromIso(value: string | null) {
  if (!value) {
    jYear.value = "";
    jMonth.value = "";
    jDay.value = "";
    return;
  }

  const date = moment(value, "YYYY-MM-DD", true);
  if (!date.isValid()) return;
  jYear.value = date.format("jYYYY");
  jMonth.value = String(Number(date.format("jMM")));
  jDay.value = String(Number(date.format("jDD")));
}

function emitJalaliDate() {
  if (!jYear.value || !jMonth.value || !jDay.value) {
    emit("update:modelValue", null);
    return;
  }

  const day = Math.min(Number(jDay.value), daysInSelectedMonth.value);
  jDay.value = String(day);
  const value = `${jYear.value}/${jMonth.value}/${jDay.value}`;
  const date = moment(value, "jYYYY/jM/jD", true);
  emit("update:modelValue", date.isValid() ? date.format("YYYY-MM-DD") : null);
}

function clearBirthday() {
  jYear.value = "";
  jMonth.value = "";
  jDay.value = "";
  emit("update:modelValue", null);
}

watch(() => props.modelValue, syncFromIso, { immediate: true });
watch([jYear, jMonth], () => {
  if (Number(jDay.value) > daysInSelectedMonth.value) {
    jDay.value = String(daysInSelectedMonth.value);
  }
});
</script>

<template>
  <el-flex v-if="isPersian" rules="rsc" :gap="8" class="w100 fw">
    <el-dropdown
      v-model="jDay"
      :items="dayItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.day')"
      @update:model-value="emitJalaliDate"
    />
    <el-dropdown
      v-model="jMonth"
      :items="monthItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.month')"
      @update:model-value="emitJalaliDate"
    />
    <el-dropdown
      v-model="jYear"
      :items="yearItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.year')"
      @update:model-value="emitJalaliDate"
    />
    <el-button
      v-if="modelValue"
      type="fab"
      mode="flat"
      icon="close"
      :tooltip="t('manage.profile.birthday.clear')"
      :disable="disabled"
      @click="clearBirthday"
    />
  </el-flex>

  <input
    v-else
    :value="modelValue || ''"
    type="date"
    class="profile-native-input w100"
    :disabled="disabled"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value || null)"
  >
</template>

<style scoped>
.profile-native-input {
  box-sizing: border-box;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
}
</style>
