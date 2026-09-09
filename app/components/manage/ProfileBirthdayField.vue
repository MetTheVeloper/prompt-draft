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

const year = ref("");
const month = ref("");
const day = ref("");

const isPersian = computed(() => locale.value === "fa");
const currentGregorianYear = new Date().getUTCFullYear();
const currentJalaliYear = Number(moment().format("jYYYY"));
const YEAR_SPAN = 125;

function formatNumber(value: number) {
  return new Intl.NumberFormat(isPersian.value ? "fa-IR" : "en-US", {
    useGrouping: false,
  }).format(value);
}

const currentCalendarYear = computed(() => (
  isPersian.value ? currentJalaliYear : currentGregorianYear
));

const yearItems = computed(() => Array.from(
  { length: YEAR_SPAN + 1 },
  (_, index) => {
    const value = currentCalendarYear.value - index;
    return { value: String(value), label: formatNumber(value) };
  },
));

const monthItems = computed(() => Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: isPersian.value
    ? t(`manage.profile.birthday.months.${index + 1}`)
    : t(`manage.profile.birthday.gregorianMonths.${index + 1}`),
})));

const daysInSelectedMonth = computed(() => {
  const selectedYear = Number(year.value);
  const selectedMonth = Number(month.value);
  if (!selectedYear || !selectedMonth) return 31;

  if (isPersian.value) {
    try {
      return Number(moment.jDaysInMonth(selectedYear, selectedMonth - 1)) || 31;
    } catch {
      if (selectedMonth <= 6) return 31;
      if (selectedMonth <= 11) return 30;
      return 30;
    }
  }

  return new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
});

const dayItems = computed(() => Array.from(
  { length: daysInSelectedMonth.value },
  (_, index) => ({
    value: String(index + 1),
    label: formatNumber(index + 1),
  }),
));

function resetParts() {
  year.value = "";
  month.value = "";
  day.value = "";
}

function syncFromIso(value: string | null) {
  if (!value) {
    resetParts();
    return;
  }

  const date = moment(value, "YYYY-MM-DD", true);
  if (!date.isValid()) return;

  if (isPersian.value) {
    year.value = date.format("jYYYY");
    month.value = String(Number(date.format("jMM")));
    day.value = String(Number(date.format("jDD")));
    return;
  }

  year.value = date.format("YYYY");
  month.value = String(Number(date.format("MM")));
  day.value = String(Number(date.format("DD")));
}

function emitSelectedDate() {
  if (!year.value || !month.value || !day.value) {
    emit("update:modelValue", null);
    return;
  }

  const selectedDay = Math.min(Number(day.value), daysInSelectedMonth.value);
  day.value = String(selectedDay);

  const source = `${year.value}/${month.value}/${day.value}`;
  const date = isPersian.value
    ? moment(source, "jYYYY/jM/jD", true)
    : moment(source, "YYYY/M/D", true);

  emit("update:modelValue", date.isValid() ? date.format("YYYY-MM-DD") : null);
}

function clearBirthday() {
  resetParts();
  emit("update:modelValue", null);
}

watch(() => props.modelValue, syncFromIso, { immediate: true });
watch(isPersian, () => syncFromIso(props.modelValue));
watch([year, month], () => {
  if (Number(day.value) > daysInSelectedMonth.value) {
    day.value = String(daysInSelectedMonth.value);
  }
});
</script>

<template>
  <div
    class="profile-birthday-field w100"
    :dir="isPersian ? 'rtl' : 'ltr'"
  >
    <el-dropdown
      v-model="year"
      :items="yearItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.year')"
      @update:model-value="emitSelectedDate"
    />
    <el-dropdown
      v-model="month"
      :items="monthItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.month')"
      @update:model-value="emitSelectedDate"
    />
    <el-dropdown
      v-model="day"
      :items="dayItems"
      :disabled="disabled"
      :placeholder="t('manage.profile.birthday.day')"
      @update:model-value="emitSelectedDate"
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
  </div>
</template>

<style scoped>
.profile-birthday-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, .8fr) auto;
  gap: 8px;
  align-items: center;
}

@media (max-width: 560px) {
  .profile-birthday-field {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, .8fr) auto;
    gap: 6px;
  }
}
</style>
