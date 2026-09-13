<script setup lang="ts">
import TelegramPostComposer from "~/components/manage/TelegramPostComposer.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { AdminArchiveItem } from "~/types/adminArchiveApi";
import type {
  AdminTelegramConfig,
  TelegramPostCtaInput,
  TelegramPublication,
  TelegramPublicationSource,
} from "~/types/adminTelegramApi";

const props = defineProps<{
  item: AdminArchiveItem;
}>();

const auth = useAuth();
const telegram = useAdminTelegram();
const modal = useModal();
const { locale, t } = useI18n();

const composerOpen = ref(false);
const configLoading = ref(false);
const config = ref<AdminTelegramConfig | null>(null);

const canManageTelegram = computed(() => auth.can(AUTH_PERMISSIONS.TELEGRAM_MANAGE));
const available = computed(() => canManageTelegram.value && props.item.status === "published");

function isPublicHttpsUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const localizedTitle = computed(() => (
  locale.value === "fa" ? props.item.title.fa : props.item.title.en
));

const localizedDescription = computed(() => (
  locale.value === "fa"
    ? props.item.description.fa ?? ""
    : props.item.description.en ?? ""
));

const initialCaption = computed(() => (
  [localizedTitle.value.trim(), localizedDescription.value.trim()]
    .filter(Boolean)
    .join("\n\n")
));

const initialMedia = computed(() => {
  const maximum = config.value?.maxMedia ?? 10;
  return props.item.images
    .map(image => image.fullUrl || image.thumbnailUrl)
    .filter(isPublicHttpsUrl)
    .slice(0, maximum);
});

const source = computed<TelegramPublicationSource>(() => ({
  type: "prompt_archive",
  id: props.item.id,
}));

const initialCtas = computed<TelegramPostCtaInput[]>(() => [{
  label: t("manage.telegram.composer.defaultCta"),
  startParam: `prompt_${props.item.publicId}`,
}]);

const composerKey = computed(() => (
  `${props.item.id}:${props.item.updatedAt}:${locale.value}`
));

async function openComposer() {
  if (!available.value || configLoading.value) return;
  if (config.value) {
    composerOpen.value = true;
    return;
  }

  configLoading.value = true;
  try {
    const response = await telegram.getConfig();
    config.value = response.telegram;
    composerOpen.value = true;
  } catch (error) {
    const value = error as { data?: { message?: unknown } };
    modal.message({
      type: "error",
      title: t("manage.telegram.loadError"),
      message: typeof value?.data?.message === "string" && value.data.message.trim()
        ? value.data.message
        : t("manage.telegram.loadError"),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    configLoading.value = false;
  }
}

function closeComposer() {
  composerOpen.value = false;
}

function onPublished(publication: TelegramPublication, duplicate: boolean) {
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

watch(
  () => props.item.id,
  () => {
    composerOpen.value = false;
    config.value = null;
  },
);

watch(
  () => props.item.status,
  status => {
    if (status !== "published") composerOpen.value = false;
  },
);
</script>

<template>
  <el-flex v-if="available" rules="csc" :gap="10" class="w100">
    <el-flex rules="rsc" :gap="10" class="w100 fw">
      <el-flex rules="ccs" :gap="3" style="flex: 1 1 280px;">
        <el-text :size="13" :weight="800" icon="send" marker="blue40">
          {{ t("manage.telegram.sources.prompt_archive") }} · #{{ item.publicId }}
        </el-text>
        <el-text :size="10" color="normal55">
          {{ t("manage.telegram.composer.subtitle") }}
        </el-text>
      </el-flex>

      <el-button
        v-if="!composerOpen"
        icon="send"
        mode="outline"
        color="prim"
        :label="t('manage.sections.telegram.label')"
        :disable="configLoading"
        @click="openComposer"
      />
      <el-button
        v-else
        icon="close"
        mode="flat"
        :label="t('manage.common.actions.close')"
        @click="closeComposer"
      />
    </el-flex>

    <el-flex v-if="configLoading" rules="ccc" :p="18" class="w100">
      <el-text color="normal55">{{ t("manage.telegram.loading") }}</el-text>
    </el-flex>

    <TelegramPostComposer
      v-else-if="composerOpen && config"
      :key="composerKey"
      :config="config"
      :source="source"
      :initial-caption="initialCaption"
      :initial-media="initialMedia"
      :initial-ctas="initialCtas"
      @published="onPublished"
    />
  </el-flex>
</template>
