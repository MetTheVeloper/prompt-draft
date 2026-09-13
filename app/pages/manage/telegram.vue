<script setup lang="ts">
import TelegramPostComposer from "~/components/manage/TelegramPostComposer.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type {
  AdminTelegramConfig,
  TelegramPublication,
  TelegramPublicationStatus,
} from "~/types/adminTelegramApi";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.TELEGRAM_MANAGE,
});

const { t, locale } = useI18n();
const auth = useAuth();
const telegram = useAdminTelegram();
const modal = useModal();

const config = ref<AdminTelegramConfig | null>(null);
const publications = ref<TelegramPublication[]>([]);
const loading = ref(true);
const loadError = ref("");
const retryingId = ref<string | null>(null);

function errorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : fallback;
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

function statusColor(status: TelegramPublicationStatus) {
  if (status === "published") return "green";
  if (status === "failed") return "red";
  if (status === "delivery_unknown") return "orange";
  if (status === "publishing") return "blue";
  return "normal55";
}

function sourceLabel(publication: TelegramPublication) {
  const source = publication.source;
  const label = t(`manage.telegram.sources.${source.type}`);
  return source.id ? `${label} · ${source.id}` : label;
}

function captionPreview(publication: TelegramPublication) {
  const caption = publication.payload?.post?.caption?.trim() || "";
  if (!caption) return t("manage.telegram.history.noCaption");
  return caption.length > 180 ? `${caption.slice(0, 180)}…` : caption;
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    const [configResponse, historyResponse] = await Promise.all([
      telegram.getConfig(),
      telegram.listPublications(30),
    ]);
    config.value = configResponse.telegram;
    publications.value = historyResponse.publications;
  } catch (error) {
    loadError.value = errorMessage(error, t("manage.telegram.loadError"));
  } finally {
    loading.value = false;
  }
}

async function refreshHistory() {
  try {
    const response = await telegram.listPublications(30);
    publications.value = response.publications;
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.telegram.history.refreshFailedTitle"),
      message: errorMessage(error, t("manage.telegram.history.refreshFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  }
}

async function onPublished(publication: TelegramPublication, duplicate: boolean) {
  await refreshHistory();

  if (publication.status === "published") {
    modal.message({
      type: "success",
      title: duplicate
        ? t("manage.telegram.result.duplicateTitle")
        : t("manage.telegram.result.publishedTitle"),
      message: duplicate
        ? t("manage.telegram.result.duplicateMessage")
        : t("manage.telegram.result.publishedMessage"),
      actionLabel: t("manage.common.actions.done"),
    });
    return;
  }

  modal.message({
    type: publication.status === "delivery_unknown" ? "warning" : "error",
    title: publication.status === "delivery_unknown"
      ? t("manage.telegram.result.unknownTitle")
      : t("manage.telegram.result.failedTitle"),
    message: publication.lastErrorMessage || t("manage.telegram.result.failedMessage"),
    actionLabel: t("manage.common.actions.close"),
  });
}

async function retry(publication: TelegramPublication) {
  if (publication.status !== "failed" || retryingId.value) return;
  retryingId.value = publication.id;
  try {
    const response = await telegram.retry(publication.id);
    await refreshHistory();
    await onPublished(response.publication, false);
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.telegram.history.retryFailedTitle"),
      message: errorMessage(error, t("manage.telegram.history.retryFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    retryingId.value = null;
  }
}

onMounted(async () => {
  await auth.initialize();
  await load();
});
</script>

<template>
  <el-flex rules="csc" :gap="18" class="w100">
    <el-flex
      v-if="loading"
      rules="ccc"
      :p="28"
      bg="surface"
      :radius="16"
      :br="1"
      bc="normal15"
      class="w100">
      <el-text color="normal55">{{ t("manage.telegram.loading") }}</el-text>
    </el-flex>

    <el-flex
      v-else-if="loadError"
      rules="csc"
      :gap="10"
      :p="18"
      bg="surface"
      :radius="16"
      :br="1"
      bc="normal15"
      class="w100">
      <el-text color="red" :weight="700">{{ loadError }}</el-text>
      <el-button
        icon="refresh"
        mode="outline"
        :label="t('manage.common.actions.refresh')"
        @click="load"
      />
    </el-flex>

    <template v-else-if="config">
      <el-flex
        rules="rsc"
        :gap="12"
        :p="14"
        bg="surface"
        :radius="14"
        :br="1"
        bc="normal15"
        class="w100 fw">
        <el-flex rules="ccs" :gap="3" style="flex: 1 1 260px;">
          <el-text :size="12" :weight="800">{{ t("manage.telegram.configuration.title") }}</el-text>
          <el-text :size="10" color="normal55">
            {{ config.configured
              ? t("manage.telegram.configuration.ready")
              : t("manage.telegram.configuration.missing") }}
          </el-text>
        </el-flex>
        <el-text :size="10" color="normal55">
          {{ config.destinationChatId || "—" }}
        </el-text>
        <el-text :size="10" color="normal55">
          {{ config.botUsername ? `@${config.botUsername}` : "—" }}
        </el-text>
        <el-text :size="11" :weight="800" :color="config.configured ? 'green' : 'orange'">
          {{ config.configured
            ? t("manage.telegram.configuration.configured")
            : t("manage.telegram.configuration.notConfigured") }}
        </el-text>
      </el-flex>

      <TelegramPostComposer
        :config="config"
        :source="{ type: 'manual' }"
        @published="onPublished"
      />

      <el-flex rules="csc" :gap="10" class="w100">
        <el-flex rules="rsc" :gap="10" class="w100 fw">
          <el-flex rules="ccs" :gap="3" style="flex: 1 1 260px;">
            <el-text :size="16" :weight="800">{{ t("manage.telegram.history.title") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.telegram.history.subtitle") }}</el-text>
          </el-flex>
          <el-button
            icon="refresh"
            mode="flat"
            :label="t('manage.common.actions.refresh')"
            @click="refreshHistory"
          />
        </el-flex>

        <el-flex
          v-if="!publications.length"
          rules="ccc"
          :p="24"
          bg="surface"
          :radius="14"
          :br="1"
          bc="normal15"
          class="w100">
          <el-text color="normal55">{{ t("manage.telegram.history.empty") }}</el-text>
        </el-flex>

        <el-flex
          v-for="publication in publications"
          :key="publication.id"
          rules="csc"
          :gap="10"
          :p="14"
          bg="surface"
          :radius="14"
          :br="1"
          bc="normal15"
          class="w100">
          <el-flex rules="rsc" :gap="10" class="w100 fw">
            <el-flex rules="ccs" :gap="2" style="flex: 1 1 260px; min-width: 0;">
              <el-text :size="11" :weight="800">{{ sourceLabel(publication) }}</el-text>
              <el-text :size="10" color="normal45">{{ publication.id }}</el-text>
            </el-flex>
            <el-text :size="11" :weight="800" :color="statusColor(publication.status)">
              {{ t(`manage.telegram.statuses.${publication.status}`) }}
            </el-text>
          </el-flex>

          <el-text :size="11" style="white-space: pre-wrap;">
            {{ captionPreview(publication) }}
          </el-text>

          <el-flex rules="rsc" :gap="12" class="w100 fw">
            <el-text :size="10" color="normal55">
              {{ t("manage.telegram.history.mediaCount", { count: publication.payload.post.media.length }) }}
            </el-text>
            <el-text :size="10" color="normal55">
              {{ t("manage.telegram.history.ctaCount", { count: publication.payload.post.ctas.length }) }}
            </el-text>
            <el-text :size="10" color="normal55">
              {{ t("manage.telegram.history.attempts", { count: publication.attemptCount }) }}
            </el-text>
            <el-text :size="10" color="normal55">
              {{ formatDate(publication.publishedAt || publication.createdAt) }}
            </el-text>
          </el-flex>

          <el-flex v-if="publication.lastErrorMessage" rules="ccs" :gap="2" class="w100">
            <el-text :size="10" color="red">{{ publication.lastErrorCode || t("manage.telegram.history.error") }}</el-text>
            <el-text :size="10" color="normal55">{{ publication.lastErrorMessage }}</el-text>
          </el-flex>

          <el-flex v-if="publication.status === 'failed'" rules="rcc" class="w100">
            <el-button
              icon="refresh"
              mode="outline"
              color="orange"
              :label="t('manage.telegram.history.retry')"
              :disable="Boolean(retryingId)"
              @click="retry(publication)"
            />
          </el-flex>

          <el-text v-else-if="publication.status === 'delivery_unknown'" :size="10" color="orange">
            {{ t("manage.telegram.history.unknownNoRetry") }}
          </el-text>
        </el-flex>
      </el-flex>
    </template>
  </el-flex>
</template>
