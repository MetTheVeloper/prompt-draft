<script setup lang="ts">
import type { AdminGrowthDailyPoint, AdminGrowthTopTag } from "~/types/adminGrowthApi";

const props = defineProps<{
  series: AdminGrowthDailyPoint[];
  topTags: AdminGrowthTopTag[];
}>();

const { locale, t } = useI18n();
const { mobile, tablet } = useScreen();
const dailyMode = ref<"chart" | "table">("chart");
const tagsMode = ref<"chart" | "table">("chart");

const visualColumns = computed(() => mobile.value || tablet.value ? 1 : 2);
const activityMax = computed(() => Math.max(
  1,
  ...props.series.flatMap(point => [
    point.promptViews,
    point.promptCopies,
    point.referralSignups,
    point.promptUnlocks,
  ]),
));
const goinMax = computed(() => Math.max(
  1,
  ...props.series.flatMap(point => [point.goinIssued, point.goinSpent]),
));
const tagMax = computed(() => Math.max(
  1,
  ...props.topTags.flatMap(tag => [tag.views, tag.copies]),
));
const labelStep = computed(() => props.series.length > 12 ? 5 : 1);

function number(value: number) {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale.value === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function barHeight(value: number, maximum: number) {
  if (value <= 0) return "3%";
  return `${Math.max(7, (value / maximum) * 100)}%`;
}

function barWidth(value: number) {
  if (value <= 0) return "0%";
  return `${Math.max(4, (value / tagMax.value) * 100)}%`;
}
</script>

<template>
  <el-grid :cols="visualColumns" :gap="16" align-items="start" class="w100">
    <el-flex rules="ccs" :gap="14" bg="surface" :p="16" :radius="14" :br="1" bc="normal15" class="w100 growth-visual-panel">
      <el-flex rules="rbc" :gap="12" class="w100" wrap>
        <el-flex rules="ccs" :gap="3" class="fg100">
          <el-text :size="17" :weight="800">{{ t("manage.growth.daily.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.growth.daily.description") }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="4">
          <el-button
            :color="dailyMode === 'chart' ? 'prim' : 'normal'"
            :mode="dailyMode === 'chart' ? 'normal' : 'flat'"
            icon="show_chart"
            :label="t('manage.growth.view.chart')"
            :size="10"
            :p="[6, 8]"
            @click="dailyMode = 'chart'"
          />
          <el-button
            :color="dailyMode === 'table' ? 'prim' : 'normal'"
            :mode="dailyMode === 'table' ? 'normal' : 'flat'"
            icon="table_rows"
            :label="t('manage.growth.view.table')"
            :size="10"
            :p="[6, 8]"
            @click="dailyMode = 'table'"
          />
        </el-flex>
      </el-flex>

      <template v-if="dailyMode === 'chart'">
        <el-flex rules="ccs" :gap="8" class="w100">
          <el-text :size="11" :weight="750">{{ t("manage.growth.daily.activityChart") }}</el-text>
          <div class="daily-chart-scroll w100">
            <div class="daily-chart" :style="{ minWidth: `${Math.max(430, series.length * 24)}px` }" dir="ltr">
              <div
                v-for="(point, index) in series"
                :key="`activity-${point.day}`"
                class="daily-chart__day">
                <div class="daily-chart__bars">
                  <span class="daily-chart__bar daily-chart__bar--primary" :style="{ height: barHeight(point.promptViews, activityMax) }" :title="`${number(point.promptViews)} ${t('manage.growth.daily.views')}`" />
                  <span class="daily-chart__bar daily-chart__bar--strong" :style="{ height: barHeight(point.promptCopies, activityMax) }" :title="`${number(point.promptCopies)} ${t('manage.growth.daily.copies')}`" />
                  <span class="daily-chart__bar daily-chart__bar--mid" :style="{ height: barHeight(point.referralSignups, activityMax) }" :title="`${number(point.referralSignups)} ${t('manage.growth.daily.referralSignups')}`" />
                  <span class="daily-chart__bar daily-chart__bar--soft" :style="{ height: barHeight(point.promptUnlocks, activityMax) }" :title="`${number(point.promptUnlocks)} ${t('manage.growth.daily.unlocks')}`" />
                </div>
                <el-text v-if="index % labelStep === 0 || index === series.length - 1" :size="8" color="normal45" class="daily-chart__label">
                  {{ formatDay(point.day) }}
                </el-text>
              </div>
            </div>
          </div>
          <el-flex rules="rsc" :gap="10" wrap class="w100 growth-chart-legend">
            <span class="legend-dot legend-dot--primary" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.views") }}</el-text>
            <span class="legend-dot legend-dot--strong" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.copies") }}</el-text>
            <span class="legend-dot legend-dot--mid" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.referralSignups") }}</el-text>
            <span class="legend-dot legend-dot--soft" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.unlocks") }}</el-text>
          </el-flex>
        </el-flex>

        <el-flex rules="ccs" :gap="8" class="w100">
          <el-text :size="11" :weight="750">{{ t("manage.growth.daily.goinFlowChart") }}</el-text>
          <div class="daily-chart-scroll w100">
            <div class="daily-chart daily-chart--goin" :style="{ minWidth: `${Math.max(430, series.length * 24)}px` }" dir="ltr">
              <div
                v-for="(point, index) in series"
                :key="`goin-${point.day}`"
                class="daily-chart__day">
                <div class="daily-chart__bars">
                  <span class="daily-chart__bar daily-chart__bar--primary" :style="{ height: barHeight(point.goinIssued, goinMax) }" :title="`${number(point.goinIssued)} ${t('manage.growth.daily.issued')}`" />
                  <span class="daily-chart__bar daily-chart__bar--strong" :style="{ height: barHeight(point.goinSpent, goinMax) }" :title="`${number(point.goinSpent)} ${t('manage.growth.daily.spent')}`" />
                </div>
                <el-text v-if="index % labelStep === 0 || index === series.length - 1" :size="8" color="normal45" class="daily-chart__label">
                  {{ formatDay(point.day) }}
                </el-text>
              </div>
            </div>
          </div>
          <el-flex rules="rsc" :gap="10" wrap class="w100 growth-chart-legend">
            <span class="legend-dot legend-dot--primary" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.issued") }}</el-text>
            <span class="legend-dot legend-dot--strong" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.spent") }}</el-text>
          </el-flex>
        </el-flex>
      </template>

      <div v-else class="growth-table-wrap w100">
        <div class="growth-table">
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.day") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.views") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.copies") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.referralSignups") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.issued") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.spent") }}</el-text>
          <el-text :size="11" :weight="700">{{ t("manage.growth.daily.unlocks") }}</el-text>

          <template v-for="point in series" :key="point.day">
            <el-text :size="11">{{ formatDay(point.day) }}</el-text>
            <el-text :size="11">{{ number(point.promptViews) }}</el-text>
            <el-text :size="11">{{ number(point.promptCopies) }}</el-text>
            <el-text :size="11">{{ number(point.referralSignups) }}</el-text>
            <EconomyGoinAmount :value="point.goinIssued" :size="10" :weight="650" />
            <EconomyGoinAmount :value="point.goinSpent" :size="10" :weight="650" />
            <el-text :size="11">{{ number(point.promptUnlocks) }}</el-text>
          </template>
        </div>
      </div>
    </el-flex>

    <el-flex rules="ccs" :gap="14" bg="surface" :p="16" :radius="14" :br="1" bc="normal15" class="w100 growth-visual-panel">
      <el-flex rules="rbc" :gap="12" class="w100" wrap>
        <el-flex rules="ccs" :gap="3" class="fg100">
          <el-text :size="17" :weight="800">{{ t("manage.growth.tags.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.growth.tags.description") }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="4">
          <el-button
            :color="tagsMode === 'chart' ? 'prim' : 'normal'"
            :mode="tagsMode === 'chart' ? 'normal' : 'flat'"
            icon="bar_chart"
            :label="t('manage.growth.view.chart')"
            :size="10"
            :p="[6, 8]"
            @click="tagsMode = 'chart'"
          />
          <el-button
            :color="tagsMode === 'table' ? 'prim' : 'normal'"
            :mode="tagsMode === 'table' ? 'normal' : 'flat'"
            icon="table_rows"
            :label="t('manage.growth.view.table')"
            :size="10"
            :p="[6, 8]"
            @click="tagsMode = 'table'"
          />
        </el-flex>
      </el-flex>

      <el-text v-if="!topTags.length" :size="12" color="normal55">
        {{ t("manage.growth.tags.empty") }}
      </el-text>

      <el-flex v-else-if="tagsMode === 'chart'" rules="ccs" :gap="10" class="w100">
        <el-flex v-for="tag in topTags" :key="tag.slug" rules="ccs" :gap="5" class="w100">
          <el-flex rules="rbc" :gap="12" class="w100">
            <el-text :size="11" :weight="750">#{{ tag.slug }}</el-text>
            <el-flex rules="rcc" :gap="8">
              <el-text :size="9" color="normal55">{{ t("manage.growth.tags.views", { count: number(tag.views) }) }}</el-text>
              <el-text :size="9" color="prim">{{ t("manage.growth.tags.copies", { count: number(tag.copies) }) }}</el-text>
            </el-flex>
          </el-flex>
          <div class="tag-chart-row w100">
            <span class="tag-chart-bar tag-chart-bar--views" :style="{ width: barWidth(tag.views) }" />
            <span class="tag-chart-bar tag-chart-bar--copies" :style="{ width: barWidth(tag.copies) }" />
          </div>
        </el-flex>
        <el-flex rules="rsc" :gap="10" wrap class="w100 growth-chart-legend">
          <span class="legend-dot legend-dot--soft" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.views") }}</el-text>
          <span class="legend-dot legend-dot--primary" /><el-text :size="9" color="normal55">{{ t("manage.growth.daily.copies") }}</el-text>
        </el-flex>
      </el-flex>

      <el-flex v-else rules="ccs" :gap="8" class="w100">
        <el-flex
          v-for="tag in topTags"
          :key="tag.slug"
          rules="rbc"
          :gap="12"
          class="w100"
          bg="normal5"
          :p="10"
          :radius="9">
          <el-text :size="12" :weight="700">#{{ tag.slug }}</el-text>
          <el-flex rules="rcc" :gap="8">
            <el-text :size="10" color="normal55">{{ t("manage.growth.tags.views", { count: number(tag.views) }) }}</el-text>
            <el-text :size="10" color="prim">{{ t("manage.growth.tags.copies", { count: number(tag.copies) }) }}</el-text>
          </el-flex>
        </el-flex>
      </el-flex>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.growth-visual-panel {
  min-width: 0;
}

.daily-chart-scroll,
.growth-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
}

.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 126px;
  padding: 8px 4px 0;
  border-bottom: 1px solid var(--normalText15);
}

.daily-chart--goin {
  height: 96px;
}

.daily-chart__day {
  flex: 1 0 18px;
  min-width: 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.daily-chart__bars {
  width: 100%;
  flex: 1 1 auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  min-height: 0;
}

.daily-chart__bar {
  width: 3px;
  min-height: 2px;
  border-radius: 100px 100px 2px 2px;
  transition: height 220ms ease, opacity 180ms ease;
}

.daily-chart__bar:hover {
  opacity: .7;
}

.daily-chart__bar--primary,
.legend-dot--primary {
  background: var(--themePrimary);
}

.daily-chart__bar--strong,
.legend-dot--strong {
  background: var(--normalText85);
}

.daily-chart__bar--mid,
.legend-dot--mid {
  background: var(--normalText55);
}

.daily-chart__bar--soft,
.legend-dot--soft {
  background: var(--normalText30);
}

.daily-chart__label {
  white-space: nowrap;
  transform: rotate(-35deg);
  transform-origin: center;
  margin-bottom: -1px;
}

.growth-chart-legend {
  align-items: center;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 100px;
  flex: 0 0 auto;
}

.tag-chart-row {
  position: relative;
  height: 12px;
  border-radius: 100px;
  background: var(--normalText8);
  overflow: hidden;
}

.tag-chart-bar {
  position: absolute;
  inset-inline-start: 0;
  border-radius: inherit;
}

.tag-chart-bar--views {
  inset-block: 0;
  background: var(--normalText25);
}

.tag-chart-bar--copies {
  inset-block: 3px;
  height: 6px;
  background: var(--themePrimary);
}

.growth-table {
  display: grid;
  grid-template-columns: minmax(84px, 1.2fr) repeat(6, minmax(72px, 1fr));
  gap: 8px 12px;
  min-width: 680px;
  align-items: center;
}
</style>
