<script setup lang="ts">
import TelegramPostComposer from "~/components/manage/TelegramPostComposer.vue";
import type { AdminCampaignDetail } from "~/types/adminCampaignApi";
import type {
  AdminTelegramConfig,
  TelegramPostCtaInput,
  TelegramPublication,
  TelegramPublicationSource,
} from "~/types/adminTelegramApi";

const props = defineProps<{
  campaign: AdminCampaignDetail;
}>();

const telegram = useAdminTelegram();
const modal = useModal();
const { t } = useI18n();

const configLoading = ref(true);
const config = ref<AdminTelegramConfig | null>(null);

const publishedVersion = computed(() => props.campaign.publishedVersion);
const publishedDefinition = computed<Record<string, any>>(() => {
  const definition = publishedVersion.value?.definition;
  return definition && typeof definition === "object" && !Array.isArray(definition)
    ? definition as Record<string, any>
    : {};
});

function localizedContent(locale: "en" | "fa") {
  const experience = publishedDefinition.value.experience;
  const content = experience && typeof experience === "object" && !Array.isArray(experience)
    ? experience.content
    : null;
  const value = content && typeof content === "object" && !Array.isArray(content)
    ? content[locale]
    : null;
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const initialCaption = computed(() => {
  const en = localizedContent("en");
  const fa = localizedContent("fa");
  const titleEn = cleanText(en.title);
  const titleFa = cleanText(fa.title);
  const descriptionEn = cleanText(en.description);
  const descriptionFa = cleanText(fa.description);

  const titles = [titleFa, titleEn].filter(Boolean);
  const sections: string[] = [];

  if (titles.length) sections.push(`${titles.join(" | ")} 👇`);
  if (descriptionFa) sections.push(descriptionFa);
  if (descriptionEn) sections.push(descriptionEn);

  return sections.join("\n\n---\n\n").trim();
});

const source = computed<TelegramPublicationSource>(() => ({
  type: "campaign",
  id: props.campaign.id,
  version: publishedVersion.value ? String(publishedVersion.value.version) : null,
}));

const initialCtas = computed<TelegramPostCtaInput[]>(() => [
  {
    label: "Join Campaign | شرکت در کمپین",
    startParam: `campaign_${props.campaign.slug}`,
  },
  {
    label: "گروه پرسش و پاسخ",
    url: "https://t.me/prompt_draft_group",
  },
]);

const composerKey = computed(() => (
  `${props.campaign.id}:${publishedVersion.value?.id ?? "unpublished"}`
));

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

onMounted(async () => {
  if (!publishedVersion.value) {
    configLoading.value = false;
    return;
  }

  try {
    const response = await telegram.getConfig();
    config.value = response.telegram;
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
});
</script>

<template>
  <el-flex v-if="configLoading" rules="ccc" :p="24" class="w100">
    <el-text color="normal55">{{ t("manage.telegram.loading") }}</el-text>
  </el-flex>

  <TelegramPostComposer
    v-else-if="publishedVersion && config"
    :key="composerKey"
    :config="config"
    :source="source"
    :initial-caption="initialCaption"
    :initial-ctas="initialCtas"
    @published="onPublished"
  />

  <el-flex v-else rules="csc" :gap="6" :p="20" class="w100">
    <el-icon icon="info" color="orange" :size="20" />
    <el-text :size="12" color="normal55">
      {{ t("manage.marketing.editor.notPublishable") }}
    </el-text>
  </el-flex>
</template>
