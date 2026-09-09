<script setup lang="ts">
import AdminCreatorReviewModal from "~/components/manage/AdminCreatorReviewModal.vue";
import type {
  CreatorAdminSummary,
  CreatorReviewStatus,
} from "~/types/creatorAdmin";

const { locale, t } = useI18n();
const api = useCreatorAdmin();
const modal = useModal();

const creators = ref<CreatorAdminSummary[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const errorMessage = ref("");
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const searchText = ref("");
const statusFilter = ref<CreatorReviewStatus | "">("pending");

const statusItems = computed(() => [
  { value: "pending", label: t("manage.creators.filters.pending"), icon: "hourglass_top" },
  { value: "approved", label: t("manage.creators.filters.approved"), icon: "verified" },
  { value: "rejected", label: t("manage.creators.filters.rejected"), icon: "cancel" },
  { value: "suspended", label: t("manage.creators.filters.suspended"), icon: "block" },
]);

let filterTimer: ReturnType<typeof setTimeout> | null = null;
let requestVersion = 0;

function accountLabel(creator: CreatorAdminSummary) {
  return creator.username || creator.email || creator.id;
}

function statusColor(status: CreatorReviewStatus) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "suspended") return "orange";
  return "blue";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : t("manage.creators.loadError");
}

async function load(options: { append?: boolean } = {}) {
  const append = Boolean(options.append);
  if (append && (!hasMore.value || !nextCursor.value || loadingMore.value)) return;

  const version = ++requestVersion;
  errorMessage.value = "";
  if (append) loadingMore.value = true;
  else loading.value = true;

  try {
    const response = await api.list({
      limit: 12,
      cursor: append ? nextCursor.value ?? undefined : undefined,
      query: searchText.value.trim() || undefined,
      status: statusFilter.value || undefined,
    });

    if (version !== requestVersion) return;
    creators.value = append
      ? [...creators.value, ...response.creators]
      : response.creators;
    nextCursor.value = response.pageInfo.nextCursor;
    hasMore.value = response.pageInfo.hasMore;
  } catch (error) {
    if (version !== requestVersion) return;
    errorMessage.value = getApiErrorMessage(error);
    if (!append) {
      creators.value = [];
      nextCursor.value = null;
      hasMore.value = false;
    }
  } finally {
    if (version === requestVersion) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function scheduleReload() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    nextCursor.value = null;
    hasMore.value = false;
    void load();
  }, 300);
}

function openReview(creator: CreatorAdminSummary) {
  modal.open({
    header: {
      icon: "workspace_premium",
      title: t("manage.creators.review.title"),
      subtitle: accountLabel(creator),
      color: statusColor(creator.creatorStatus),
    },
    component: AdminCreatorReviewModal,
    props: {
      userId: creator.id,
      onUpdated: () => void load(),
    },
    actions: [
      {
        label: t("manage.common.actions.close"),
        icon: "close",
        color: "normal",
        mode: "flat",
        close: true,
      },
    ],
    options: {
      width: 920,
      closeOnBackdrop: false,
      closeOnEsc: true,
      blur: true,
    },
  });
}

watch(searchText, scheduleReload);
watch(statusFilter, scheduleReload);

onMounted(() => void load());
onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer);
});
</script>

<template>
  <el-flex
    rules="csc"
    :gap="12"
    :p="14"
    bg="surface"
    :radius="14"
    :br="1"
    bc="normal15"
    class="w100">
    <el-flex rules="rbc" :gap="12" class="w100 fw">
      <el-flex rules="ccs" :gap="3">
        <el-text :size="15" :weight="900" icon="workspace_premium">
          {{ t("manage.creators.title") }}
        </el-text>
        <el-text :size="10" color="normal50">{{ t("manage.creators.description") }}</el-text>
      </el-flex>
      <el-button
        mode="flat"
        color="normal"
        icon="refresh"
        :label="t('manage.common.actions.refresh')"
        :disable="loading || loadingMore"
        @click="load()"
      />
    </el-flex>

    <el-grid cols="minmax(220px, 1fr) minmax(180px, 260px)" :gap="8" class="w100 admin-creator-panel__filters">
      <el-text-field
        v-model="searchText"
        type="text"
        :actions="false"
        :placeholder="t('manage.creators.searchPlaceholder')"
      />
      <el-dropdown
        v-model="statusFilter"
        :items="statusItems"
        clearable
        icon="filter_alt"
        :placeholder="t('manage.creators.filters.all')"
      />
    </el-grid>

    <el-flex v-if="errorMessage" rules="rsc" :gap="8" bg="red10" :p="10" :radius="10" class="w100">
      <el-icon icon="warning" color="red" :size="16" />
      <el-text color="red" :size="10">{{ errorMessage }}</el-text>
    </el-flex>

    <el-text v-if="loading" color="normal50" :size="11">
      {{ t("manage.creators.loading") }}
    </el-text>

    <el-flex v-else-if="!creators.length" rules="ccc" :p="18" class="w100">
      <el-text color="normal50" :size="11">{{ t("manage.creators.empty") }}</el-text>
    </el-flex>

    <el-flex v-else rules="csc" :gap="6" class="w100">
      <el-grid
        cols="minmax(210px, 1.25fr) minmax(130px, .6fr) minmax(150px, .7fr) minmax(150px, .7fr) 44px"
        :gap="10"
        align-items="center"
        class="w100 admin-creator-panel__header"
        :p="[4, 10]">
        <el-text :size="9" :weight="800" color="normal45">{{ t("manage.creators.fields.account") }}</el-text>
        <el-text :size="9" :weight="800" color="normal45">{{ t("manage.creators.fields.status") }}</el-text>
        <el-text :size="9" :weight="800" color="normal45">{{ t("manage.creators.fields.requested") }}</el-text>
        <el-text :size="9" :weight="800" color="normal45">{{ t("manage.creators.fields.updated") }}</el-text>
        <el-text :size="9" :weight="800" color="normal45">{{ t("manage.creators.fields.actions") }}</el-text>
      </el-grid>

      <el-grid
        v-for="creator in creators"
        :key="creator.id"
        cols="minmax(210px, 1.25fr) minmax(130px, .6fr) minmax(150px, .7fr) minmax(150px, .7fr) 44px"
        :gap="10"
        align-items="center"
        class="w100 admin-creator-panel__row"
        :p="10"
        :radius="10"
        bg="surface50"
        @dblclick="openReview(creator)">
        <el-flex rules="rsc" :gap="8" class="minw0">
          <el-avatar :src="creator.avatarUrl" :name="accountLabel(creator)" size="mini" />
          <el-flex rules="ccs" :gap="2" class="minw0">
            <el-text :size="11" :weight="800">{{ accountLabel(creator) }}</el-text>
            <el-text :size="8" color="normal40">{{ creator.id }}</el-text>
          </el-flex>
        </el-flex>
        <el-text
          :size="10"
          :weight="800"
          :color="statusColor(creator.creatorStatus)"
          :marker="`${statusColor(creator.creatorStatus)}10`">
          {{ t(`manage.creators.statuses.${creator.creatorStatus}`) }}
        </el-text>
        <el-text :size="9">{{ formatDate(creator.requestedAt) }}</el-text>
        <el-text :size="9">{{ formatDate(creator.creatorUpdatedAt) }}</el-text>
        <el-button
          type="fab"
          mode="flat"
          color="blue"
          icon="rate_review"
          :tooltip="t('manage.creators.actions.review')"
          @click="openReview(creator)"
        />
      </el-grid>
    </el-flex>

    <el-button
      v-if="hasMore"
      mode="flat"
      color="prim"
      icon="expand_more"
      :label="t('manage.common.actions.loadMore')"
      :disable="loadingMore"
      @click="load({ append: true })"
    />
  </el-flex>
</template>

<style scoped>
@media (max-width: 760px) {
  .admin-creator-panel__filters,
  .admin-creator-panel__header,
  .admin-creator-panel__row {
    grid-template-columns: 1fr !important;
  }

  .admin-creator-panel__header {
    display: none !important;
  }
}
</style>
