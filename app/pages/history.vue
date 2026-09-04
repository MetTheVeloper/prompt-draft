<script setup lang="ts">
import type {
  WizardRunPageInfo,
  WizardRunRecord,
  WizardRunSummary,
} from "~/types/wizardRunApi";

const route = useRoute();
const { t, locale } = useI18n();
const { mobile, mini } = useScreen();
const { listWizardRuns, getWizardRun } = usePromptDraftApi();

const PAGE_SIZE = 20;

const runs = ref<WizardRunSummary[]>([]);
const pageInfo = ref<WizardRunPageInfo>({
  nextCursor: null,
  hasMore: false,
});
const listPending = ref(false);
const loadMorePending = ref(false);
const listError = ref(false);

const detailRun = ref<WizardRunRecord | null>(null);
const detailPending = ref(false);
const detailError = ref(false);
const copied = ref(false);

let detailRequestId = 0;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const detailRunId = computed(() => {
  const value = route.query.run;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
});

const hasDetailQuery = computed(() => Boolean(detailRunId.value));

useHead(() => ({
  title: hasDetailQuery.value
    ? `${t("history.detail.title")} · Prompt Draft`
    : `${t("history.title")} · Prompt Draft`,
}));

onMounted(() => {
  void loadFirstPage();
});

watch(
  detailRunId,
  (id) => {
    if (!id) {
      detailRequestId += 1;
      detailRun.value = null;
      detailError.value = false;
      detailPending.value = false;
      return;
    }

    void loadDetail(id);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
});

async function loadFirstPage() {
  listPending.value = true;
  listError.value = false;

  try {
    const response = await listWizardRuns({ limit: PAGE_SIZE });
    runs.value = response.runs;
    pageInfo.value = response.pageInfo;
  } catch (error) {
    console.error("[Prompt Draft History] failed to load history", error);
    listError.value = true;
  } finally {
    listPending.value = false;
  }
}

async function loadMore() {
  if (
    loadMorePending.value ||
    !pageInfo.value.hasMore ||
    !pageInfo.value.nextCursor
  ) {
    return;
  }

  loadMorePending.value = true;

  try {
    const response = await listWizardRuns({
      limit: PAGE_SIZE,
      cursor: pageInfo.value.nextCursor,
    });

    const existingIds = new Set(runs.value.map((run) => run.id));
    runs.value.push(
      ...response.runs.filter((run) => !existingIds.has(run.id)),
    );
    pageInfo.value = response.pageInfo;
  } catch (error) {
    console.error("[Prompt Draft History] failed to load more history", error);
    listError.value = true;
  } finally {
    loadMorePending.value = false;
  }
}

async function loadDetail(id: string) {
  const requestId = ++detailRequestId;
  detailPending.value = true;
  detailError.value = false;
  detailRun.value = null;
  copied.value = false;

  try {
    const response = await getWizardRun(id);
    if (requestId !== detailRequestId) return;
    detailRun.value = response.run;
  } catch (error) {
    if (requestId !== detailRequestId) return;
    console.error("[Prompt Draft History] failed to load run detail", error);
    detailError.value = true;
  } finally {
    if (requestId === detailRequestId) {
      detailPending.value = false;
    }
  }
}

async function openRun(id: string) {
  await navigateTo({
    path: "/history",
    query: { run: id },
  });
}

async function closeDetail() {
  await navigateTo("/history");
}

async function copyOutput() {
  if (!import.meta.client || !detailRun.value) return;

  try {
    await navigator.clipboard.writeText(detailRun.value.output);
    copied.value = true;

    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch (error) {
    console.error("[Prompt Draft History] failed to copy output", error);
  }
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatWizardLabel(run: Pick<WizardRunSummary, "wizardId" | "wizardVersion">) {
  return t("history.run.wizard", {
    id: run.wizardId,
    version: run.wizardVersion,
  });
}
</script>

<template>
  <el-flex
    v-if="hasDetailQuery"
    rules="csc"
    class="history-page w100 h100 ofya"
    :gap="16">
    <el-flex
      rules="rbc"
      class="w100"
      :gap="12"
      wrap>
      <el-button
        :label="t('history.actions.back')"
        icon="arrow_back"
        mode="flat"
        color="normal"
        :size="12"
        :p="[9, 12]"
        @click="closeDetail"
      />

      <el-button
        v-if="detailRun"
        :label="copied ? t('history.actions.copied') : t('history.actions.copy')"
        :icon="copied ? 'check' : 'content_copy'"
        :color="copied ? 'green' : 'prim'"
        :mode="copied ? 'flat' : 'normal'"
        :size="12"
        :p="[9, 12]"
        @click="copyOutput"
      />
    </el-flex>

    <el-flex
      v-if="detailPending"
      rules="ccc"
      class="history-state w100 fg100"
      :gap="10">
      <el-icon icon="refresh" :size="32" color="prim" />
      <el-text :size="13" color="normal60">
        {{ t('history.detail.loading') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else-if="detailError || !detailRun"
      rules="ccc"
      class="history-state w100 fg100"
      :gap="10">
      <el-icon icon="warning" :size="36" color="red" />
      <el-text type="h1" :size="mini ? 22 : 28" :weight="850">
        {{ t('history.detail.errorTitle') }}
      </el-text>
      <el-text type="p" :size="13" color="normal55" class="tc">
        {{ t('history.detail.errorDescription') }}
      </el-text>
      <el-button
        v-if="detailRunId"
        :label="t('history.actions.retry')"
        icon="refresh"
        mode="flat"
        color="red"
        :size="12"
        @click="loadDetail(detailRunId)"
      />
    </el-flex>

    <el-flex
      v-else
      rules="csc"
      class="history-detail w100"
      :gap="18">
      <el-grid :gap="6" class="w100">
        <el-text type="h1" :size="mini ? 24 : 32" :weight="850">
          {{ t('history.detail.title') }}
        </el-text>
        <el-text type="p" :size="13" color="normal55">
          {{ formatWizardLabel(detailRun) }} · {{ formatCreatedAt(detailRun.createdAt) }}
        </el-text>
        <el-text type="span" :size="11" color="normal45" class="history-run-id">
          {{ detailRun.id }}
        </el-text>
      </el-grid>

      <el-flex
        rules="csc"
        class="history-panel w100"
        :gap="10"
        :p="mobile ? 14 : 18"
        br="12">
        <el-text :size="12" :weight="800" color="normal70">
          {{ t('history.detail.output') }}
        </el-text>
        <pre class="history-output">{{ detailRun.output }}</pre>
      </el-flex>

      <details class="history-snapshot w100">
        <summary>{{ t('history.detail.snapshot') }}</summary>
        <pre>{{ JSON.stringify(detailRun.snapshot, null, 2) }}</pre>
      </details>
    </el-flex>
  </el-flex>

  <el-flex
    v-else
    rules="csc"
    class="history-page w100 h100 ofya"
    :gap="20">
    <el-flex
      rules="rbc"
      class="w100"
      :gap="12"
      wrap>
      <el-grid :gap="4">
        <el-text type="h1" :size="mini ? 24 : 32" :weight="850">
          {{ t('history.title') }}
        </el-text>
        <el-text type="p" :size="13" color="normal55">
          {{ t('history.subtitle') }}
        </el-text>
      </el-grid>

      <el-button
        :label="t('history.actions.refresh')"
        icon="refresh"
        mode="flat"
        color="normal"
        :size="12"
        :disabled="listPending"
        @click="loadFirstPage"
      />
    </el-flex>

    <el-flex
      v-if="listPending && runs.length === 0"
      rules="ccc"
      class="history-state w100 fg100"
      :gap="10">
      <el-icon icon="refresh" :size="32" color="prim" />
      <el-text :size="13" color="normal60">
        {{ t('history.loading') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else-if="listError && runs.length === 0"
      rules="ccc"
      class="history-state w100 fg100"
      :gap="10">
      <el-icon icon="warning" :size="36" color="red" />
      <el-text type="h1" :size="mini ? 22 : 28" :weight="850">
        {{ t('history.error.title') }}
      </el-text>
      <el-text type="p" :size="13" color="normal55" class="tc">
        {{ t('history.error.description') }}
      </el-text>
      <el-button
        :label="t('history.actions.retry')"
        icon="refresh"
        mode="flat"
        color="red"
        :size="12"
        @click="loadFirstPage"
      />
    </el-flex>

    <el-flex
      v-else-if="runs.length === 0"
      rules="ccc"
      class="history-state w100 fg100"
      :gap="10">
      <el-icon icon="history" :size="40" color="normal35" />
      <el-text type="h1" :size="mini ? 22 : 28" :weight="850">
        {{ t('history.empty.title') }}
      </el-text>
      <el-text type="p" :size="13" color="normal55" class="tc">
        {{ t('history.empty.description') }}
      </el-text>
    </el-flex>

    <el-flex
      v-else
      rules="csc"
      class="history-list w100"
      :gap="10">
      <el-flex
        v-for="run in runs"
        :key="run.id"
        rules="rbc"
        class="history-card w100"
        :gap="16"
        :p="mobile ? 14 : 16"
        br="12"
        wrap
        @click="openRun(run.id)">
        <el-grid :gap="5" class="fg100">
          <el-text :size="14" :weight="800">
            {{ formatWizardLabel(run) }}
          </el-text>
          <el-text type="span" :size="12" color="normal55">
            {{ formatCreatedAt(run.createdAt) }}
          </el-text>
          <el-text type="span" :size="10" color="normal40" class="history-run-id">
            {{ run.id }}
          </el-text>
        </el-grid>

        <el-button
          :label="t('history.actions.open')"
          icon="arrow_forward"
          mode="flat"
          color="prim"
          :type="mobile ? 'fab' : 'default'"
          :size="12"
          @click.stop="openRun(run.id)"
        />
      </el-flex>

      <el-flex
        v-if="listError"
        rules="rbc"
        class="history-inline-error w100"
        :gap="12"
        :p="12"
        br="10"
        wrap>
        <el-text :size="12" color="red">
          {{ t('history.error.loadMore') }}
        </el-text>
        <el-button
          :label="t('history.actions.retry')"
          icon="refresh"
          mode="flat"
          color="red"
          :size="11"
          @click="listError = false; loadMore()"
        />
      </el-flex>

      <el-flex
        v-if="pageInfo.hasMore"
        rules="rcc"
        class="w100"
        :p="[8, 0]">
        <el-button
          :label="loadMorePending ? t('history.loadingMore') : t('history.actions.loadMore')"
          icon="expand_more"
          color="prim"
          mode="flat"
          :size="12"
          :disabled="loadMorePending"
          @click="loadMore"
        />
      </el-flex>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.history-page {
  max-width: 1040px;
  margin: 0 auto;
}

.history-state {
  min-height: 320px;
}

.history-card,
.history-panel,
.history-snapshot,
.history-inline-error {
  border: 1px solid rgba(127, 127, 127, 0.18);
  background: rgba(127, 127, 127, 0.055);
}

.history-card {
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.history-card:hover {
  transform: translateY(-1px);
  border-color: rgba(127, 127, 127, 0.34);
  background: rgba(127, 127, 127, 0.09);
}

.history-run-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow-wrap: anywhere;
}

.history-output,
.history-snapshot pre {
  width: 100%;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  color: inherit;
}

.history-output {
  max-height: 56vh;
  overflow: auto;
}

.history-snapshot {
  border-radius: 12px;
  overflow: hidden;
}

.history-snapshot summary {
  cursor: pointer;
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 800;
}

.history-snapshot pre {
  max-height: 42vh;
  overflow: auto;
  padding: 0 16px 16px;
}
</style>
