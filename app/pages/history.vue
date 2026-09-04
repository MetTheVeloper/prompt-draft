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
const snapshotOpen = ref(false);

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
    snapshotOpen.value = false;

    if (!id) {
      detailRequestId += 1;
      detailRun.value = null;
      detailError.value = false;
      detailPending.value = false;
      copied.value = false;
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
  if (listPending.value) return;

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
  listError.value = false;

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
  snapshotOpen.value = false;

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

function copyTextFallback(value: string) {
  if (!import.meta.client) return;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

async function copyOutput() {
  if (!import.meta.client || !detailRun.value) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(detailRun.value.output);
    } else {
      copyTextFallback(detailRun.value.output);
    }

    copied.value = true;

    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch (error) {
    console.error("[Prompt Draft History] failed to copy output", error);

    try {
      copyTextFallback(detailRun.value.output);
      copied.value = true;
    } catch {
      return;
    }
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

function formatWizardLabel(
  run: Pick<WizardRunSummary, "wizardId" | "wizardVersion">,
) {
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
    class="history-page w100"
    :gap="18">
    <el-flex rules="rbc" class="w100" :gap="12" wrap>
      <el-button
        :label="t('history.actions.back')"
        icon="arrow_back"
        mode="flat"
        color="normal"
        :size="12"
        :p="[8, 10]"
        @click="closeDetail"
      />

      <el-button
        v-if="detailRun"
        :label="copied ? t('history.actions.copied') : t('history.actions.copy')"
        :icon="copied ? 'check' : 'content_copy'"
        :color="copied ? 'green' : 'prim'"
        :mode="copied ? 'flat' : 'normal'"
        :size="12"
        :p="[8, 12]"
        @click="copyOutput"
      />
    </el-flex>

    <el-flex
      v-if="detailPending"
      rules="ccc"
      class="w100"
      :gap="8"
      :p="40">
      <el-icon icon="history" :size="28" color="normal35" />
      <el-text :size="13" color="normal55">
        {{ t("history.detail.loading") }}
      </el-text>
    </el-flex>

    <el-flex
      v-else-if="detailError || !detailRun"
      rules="ccc"
      class="w100"
      :gap="10"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15"
      :p="40">
      <el-icon icon="warning" :size="30" color="red" />
      <el-text type="h1" :size="mini ? 21 : 24" :weight="850">
        {{ t("history.detail.errorTitle") }}
      </el-text>
      <el-text type="p" :size="13" color="normal55" class="tc">
        {{ t("history.detail.errorDescription") }}
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

    <template v-else>
      <el-flex rules="ccs" class="w100" :gap="6">
        <el-text type="h1" :size="mini ? 24 : 30" :weight="850">
          {{ t("history.detail.title") }}
        </el-text>
        <el-text type="p" :size="13" color="normal55">
          {{ t("history.detail.description") }}
        </el-text>
      </el-flex>

      <el-grid
        :cols="mini ? 1 : 3"
        :gap="10"
        class="w100">
        <el-flex
          rules="ccs"
          :gap="4"
          bg="surface"
          :radius="12"
          :br="1"
          bc="normal15"
          :p="14">
          <el-text :size="10" :weight="800" color="normal45">
            {{ t("history.fields.wizard") }}
          </el-text>
          <el-text :size="13" :weight="750">
            {{ formatWizardLabel(detailRun) }}
          </el-text>
        </el-flex>

        <el-flex
          rules="ccs"
          :gap="4"
          bg="surface"
          :radius="12"
          :br="1"
          bc="normal15"
          :p="14">
          <el-text :size="10" :weight="800" color="normal45">
            {{ t("history.fields.created") }}
          </el-text>
          <el-text :size="13">
            {{ formatCreatedAt(detailRun.createdAt) }}
          </el-text>
        </el-flex>

        <el-flex
          rules="ccs"
          :gap="4"
          bg="surface"
          :radius="12"
          :br="1"
          bc="normal15"
          :p="14">
          <el-text :size="10" :weight="800" color="normal45">
            {{ t("history.fields.runId") }}
          </el-text>
          <el-text
            :size="11"
            color="normal55"
            class="history-run-id">
            {{ detailRun.id }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-flex
        rules="csc"
        class="w100"
        bg="surface"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" class="w100" :gap="12" :p="[12, 16]">
          <el-flex rules="rsc" :gap="8">
            <el-icon icon="description" color="prim" :size="18" />
            <el-text :size="12" :weight="800">
              {{ t("history.detail.output") }}
            </el-text>
          </el-flex>

          <el-button
            :label="copied ? t('history.actions.copied') : t('history.actions.copy')"
            :icon="copied ? 'check' : 'content_copy'"
            :color="copied ? 'green' : 'normal'"
            mode="flat"
            :size="11"
            @click="copyOutput"
          />
        </el-flex>

        <el-divider />

        <div class="history-code-wrap w100">
          <pre class="history-code">{{ detailRun.output }}</pre>
        </div>
      </el-flex>

      <el-flex rules="csc" class="w100" :gap="10">
        <el-button
          :label="snapshotOpen ? t('history.actions.hideSnapshot') : t('history.actions.showSnapshot')"
          :icon="snapshotOpen ? 'expand_less' : 'expand_more'"
          mode="flat"
          color="normal"
          :size="12"
          @click="snapshotOpen = !snapshotOpen"
        />

        <el-flex
          v-if="snapshotOpen"
          rules="csc"
          class="w100"
          bg="surface"
          :radius="14"
          :br="1"
          bc="normal15">
          <el-flex rules="rsc" class="w100" :gap="8" :p="[12, 16]">
            <el-icon icon="data_object" color="normal55" :size="18" />
            <el-text :size="12" :weight="800">
              {{ t("history.detail.snapshot") }}
            </el-text>
          </el-flex>

          <el-divider />

          <div class="history-code-wrap history-snapshot-wrap w100">
            <pre class="history-code">{{ JSON.stringify(detailRun.snapshot, null, 2) }}</pre>
          </div>
        </el-flex>
      </el-flex>
    </template>
  </el-flex>

  <el-flex
    v-else
    rules="csc"
    class="history-page w100"
    :gap="18">
    <el-flex rules="rbc" class="w100" :gap="14" wrap>
      <el-flex rules="ccs" :gap="5">
        <el-text type="h1" :size="mini ? 24 : 30" :weight="850">
          {{ t("history.title") }}
        </el-text>
        <el-text type="p" :size="13" color="normal55">
          {{ t("history.subtitle") }}
        </el-text>
      </el-flex>

      <el-button
        :label="t('history.actions.refresh')"
        icon="refresh"
        mode="flat"
        color="normal"
        :size="12"
        :disable="listPending || loadMorePending"
        @click="loadFirstPage"
      />
    </el-flex>

    <el-flex
      v-if="listError && runs.length"
      rules="rbc"
      class="w100"
      :gap="10"
      bg="red10"
      :radius="10"
      :p="12"
      wrap>
      <el-flex rules="rsc" :gap="8">
        <el-icon icon="warning" color="red" :size="18" />
        <el-text color="red" :size="12">
          {{ t("history.error.loadMore") }}
        </el-text>
      </el-flex>

      <el-button
        :label="t('history.actions.retry')"
        icon="refresh"
        mode="flat"
        color="red"
        :size="11"
        @click="loadMore"
      />
    </el-flex>

    <el-flex
      rules="csc"
      class="w100"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15">
      <template v-if="listPending && runs.length === 0">
        <el-flex rules="ccc" class="w100" :gap="8" :p="40">
          <el-icon icon="history" :size="28" color="normal35" />
          <el-text :size="13" color="normal55">
            {{ t("history.loading") }}
          </el-text>
        </el-flex>
      </template>

      <template v-else-if="listError && runs.length === 0">
        <el-flex rules="ccc" class="w100" :gap="10" :p="40">
          <el-icon icon="warning" :size="30" color="red" />
          <el-text type="h1" :size="mini ? 21 : 24" :weight="850">
            {{ t("history.error.title") }}
          </el-text>
          <el-text type="p" :size="13" color="normal55" class="tc">
            {{ t("history.error.description") }}
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
      </template>

      <template v-else-if="runs.length === 0">
        <el-flex rules="ccc" class="w100" :gap="10" :p="40">
          <el-icon icon="history" :size="32" color="normal35" />
          <el-text type="h1" :size="mini ? 21 : 24" :weight="850">
            {{ t("history.empty.title") }}
          </el-text>
          <el-text type="p" :size="13" color="normal55" class="tc">
            {{ t("history.empty.description") }}
          </el-text>
        </el-flex>
      </template>

      <template v-else>
        <template v-if="!mini">
          <el-grid
            cols="minmax(220px, 1fr) minmax(190px, .7fr) minmax(260px, 1.15fr) 44px"
            :gap="12"
            align-items="center"
            class="w100"
            :p="[12, 16]">
            <el-text color="normal55" :size="11" :weight="800">
              {{ t("history.fields.wizard") }}
            </el-text>
            <el-text color="normal55" :size="11" :weight="800">
              {{ t("history.fields.created") }}
            </el-text>
            <el-text color="normal55" :size="11" :weight="800">
              {{ t("history.fields.runId") }}
            </el-text>
            <el-text color="normal55" :size="11" :weight="800">
              {{ t("history.fields.actions") }}
            </el-text>
          </el-grid>

          <el-divider />

          <template v-for="(run, index) in runs" :key="run.id">
            <el-grid
              cols="minmax(220px, 1fr) minmax(190px, .7fr) minmax(260px, 1.15fr) 44px"
              :gap="12"
              align-items="center"
              class="history-row w100"
              :p="[12, 16]"
              @click="openRun(run.id)">
              <el-flex rules="rsc" :gap="9">
                <el-icon icon="history" color="prim" :size="17" />
                <el-text :size="13" :weight="750">
                  {{ formatWizardLabel(run) }}
                </el-text>
              </el-flex>

              <el-text :size="12" color="normal60">
                {{ formatCreatedAt(run.createdAt) }}
              </el-text>

              <el-text
                :size="10"
                color="normal45"
                class="history-run-id">
                {{ run.id }}
              </el-text>

              <el-button
                type="fab"
                mode="flat"
                color="prim"
                icon="arrow_forward"
                :tooltip="t('history.actions.open')"
                :size="11"
                @click.stop="openRun(run.id)"
              />
            </el-grid>

            <el-divider v-if="index < runs.length - 1" />
          </template>
        </template>

        <template v-else>
          <template v-for="(run, index) in runs" :key="run.id">
            <el-flex
              rules="rbc"
              class="history-row w100"
              :gap="12"
              :p="14"
              @click="openRun(run.id)">
              <el-flex rules="ccs" class="fg100" :gap="5">
                <el-text :size="13" :weight="800">
                  {{ formatWizardLabel(run) }}
                </el-text>
                <el-text :size="11" color="normal55">
                  {{ formatCreatedAt(run.createdAt) }}
                </el-text>
                <el-text
                  :size="9"
                  color="normal40"
                  class="history-run-id">
                  {{ run.id }}
                </el-text>
              </el-flex>

              <el-button
                type="fab"
                mode="flat"
                color="prim"
                icon="arrow_forward"
                :size="11"
                @click.stop="openRun(run.id)"
              />
            </el-flex>

            <el-divider v-if="index < runs.length - 1" />
          </template>
        </template>
      </template>
    </el-flex>

    <el-flex v-if="pageInfo.hasMore" rules="rcc" class="w100">
      <el-button
        :label="loadMorePending ? t('history.loadingMore') : t('history.actions.loadMore')"
        icon="expand_more"
        color="prim"
        mode="flat"
        :size="12"
        :disable="loadMorePending"
        @click="loadMore"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.history-page {
  max-width: 1120px;
  margin: 0 auto;
}

.history-row {
  cursor: pointer;
  transition: background 140ms ease;
}

.history-row:hover {
  background: rgba(127, 127, 127, 0.055);
}

.history-run-id,
.history-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.history-run-id {
  overflow-wrap: anywhere;
}

.history-code-wrap {
  max-height: 58vh;
  overflow: auto;
  padding: 16px;
}

.history-snapshot-wrap {
  max-height: 44vh;
}

.history-code {
  width: 100%;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
  line-height: 1.75;
  color: inherit;
}

@media (max-width: 760px) {
  .history-code-wrap {
    padding: 13px;
  }
}
</style>
