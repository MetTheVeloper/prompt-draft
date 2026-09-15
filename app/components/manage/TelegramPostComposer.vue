<script setup lang="ts">
import ManagedImageUploader from "~/components/manage/ManagedImageUploader.vue";
import type { PreparedManagedImage } from "~/types/managedImage";
import type {
  AdminTelegramConfig,
  TelegramPostCtaInput,
  TelegramPublication,
  TelegramPublicationSource,
} from "~/types/adminTelegramApi";
import {
  MANAGED_IMAGE_FULL_MAX_EDGE,
  MANAGED_IMAGE_FULL_WEBP_QUALITY,
  MANAGED_IMAGE_THUMBNAIL_MAX_EDGE,
} from "~/utils/managedImageProcessing";

const props = withDefaults(defineProps<{
  config: AdminTelegramConfig;
  source?: TelegramPublicationSource;
  initialCaption?: string;
  initialMedia?: string[];
  initialCtas?: TelegramPostCtaInput[];
  initialMultiMediaCtaText?: string;
  disable?: boolean;
}>(), {
  source: () => ({ type: "manual" }),
  initialCaption: "",
  initialMedia: () => [],
  initialCtas: () => [],
  initialMultiMediaCtaText: "",
  disable: false,
});

const emit = defineEmits<{
  published: [publication: TelegramPublication, duplicate: boolean];
}>();

const { t } = useI18n();
const telegram = useAdminTelegram();
const managedMedia = useAdminManagedMedia();

const caption = ref(props.initialCaption);
const mediaUrls = ref([...props.initialMedia]);
const preparedMedia = ref<PreparedManagedImage[]>([]);
const uploadedPreparedUrls = new Map<string, string>();
const externalMediaOpen = ref(false);
const ctas = ref<TelegramPostCtaInput[]>(
  props.initialCtas.length
    ? props.initialCtas.map(item => ({ ...item }))
    : [{ label: t("manage.telegram.composer.defaultCta"), startParam: "" }],
);
const multiMediaCtaText = ref(props.initialMultiMediaCtaText);
const publishing = ref(false);
const publishError = ref("");

function createIdempotencyKey() {
  const random = import.meta.client && typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `telegram-ui:${random}`;
}

const idempotencyKey = ref(createIdempotencyKey());

const normalizedMedia = computed(() => (
  mediaUrls.value.map(value => value.trim()).filter(Boolean)
));
const totalMediaCount = computed(() => normalizedMedia.value.length + preparedMedia.value.length);
const maxPreparedMedia = computed(() => Math.max(0, props.config.maxMedia - normalizedMedia.value.length));
const normalizedCtas = computed<TelegramPostCtaInput[]>(() => (
  ctas.value.map(item => ({
    label: item.label.trim(),
    ...(item.url !== undefined
      ? { url: item.url.trim() }
      : { startParam: (item.startParam ?? "").trim() }),
  }))
));
const captionLimit = computed(() => totalMediaCount.value ? 1024 : 4096);
const previewMedia = computed(() => [
  ...normalizedMedia.value,
  ...preparedMedia.value
    .map(item => item.previewUrl || "")
    .filter(Boolean),
]);
const firstPreviewMedia = computed(() => previewMedia.value[0] || "");
const extraMediaCount = computed(() => Math.max(0, previewMedia.value.length - 1));

const managedImageLabels = computed(() => ({
  title: t("manage.telegram.composer.uploadMediaTitle"),
  rules: t("manage.telegram.composer.uploadMediaRules", {
    fullEdge: MANAGED_IMAGE_FULL_MAX_EDGE,
    thumbnailEdge: MANAGED_IMAGE_THUMBNAIL_MAX_EDGE,
    quality: Math.round(MANAGED_IMAGE_FULL_WEBP_QUALITY * 100),
    max: props.config.maxMedia,
  }),
  add: t("manage.telegram.composer.uploadMediaAdd"),
  clear: t("manage.telegram.composer.uploadMediaClear"),
  empty: t("manage.telegram.composer.uploadMediaEmpty"),
  pasteHint: t("manage.telegram.composer.uploadMediaPasteHint"),
  processing: t("manage.telegram.composer.uploadMediaProcessing"),
  failed: t("manage.telegram.composer.uploadMediaFailed"),
  thumbnail: t("manage.telegram.composer.uploadMediaThumbnail"),
  readyCount: (ready: number, total: number) => t("manage.telegram.composer.uploadMediaReadyCount", { ready, total }),
  processingCount: (count: number) => t("manage.telegram.composer.uploadMediaProcessingCount", { count }),
  errorHint: t("manage.telegram.composer.uploadMediaErrorHint"),
  invalidFiles: (count: number) => t("manage.telegram.composer.uploadMediaInvalid", { count }),
  limitExceeded: (max: number) => t("manage.telegram.composer.tooManyMedia", { max }),
}));

function validHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const validationMessage = computed(() => {
  const text = caption.value.trim();
  if (!props.config.configured) return t("manage.telegram.composer.notConfigured");
  if (!text && totalMediaCount.value === 0) return t("manage.telegram.composer.captionRequired");
  if (text.length > captionLimit.value) return t("manage.telegram.composer.captionTooLong", { max: captionLimit.value });
  if (totalMediaCount.value > props.config.maxMedia) return t("manage.telegram.composer.tooManyMedia", { max: props.config.maxMedia });
  if (preparedMedia.value.some(item => item.status === "processing")) return t("manage.telegram.composer.uploadMediaWait");
  if (preparedMedia.value.some(item => item.status === "error")) return t("manage.telegram.composer.uploadMediaErrorHint");
  if (normalizedMedia.value.some(url => !validHttpsUrl(url))) return t("manage.telegram.composer.mediaHttpsOnly");
  if (ctas.value.length < 1 || ctas.value.length > props.config.maxCtas) return t("manage.telegram.composer.ctaCount", { max: props.config.maxCtas });
  if (normalizedCtas.value.some(item => !item.label || item.label.length > 64)) return t("manage.telegram.composer.ctaLabelInvalid");
  if (normalizedCtas.value.some(item => (
    item.url !== undefined
      ? !validHttpsUrl(item.url)
      : !/^[A-Za-z0-9_-]{1,512}$/.test(item.startParam ?? "")
  ))) return t("manage.telegram.composer.startParamInvalid");
  if (multiMediaCtaText.value.trim().length > 256) return t("manage.telegram.composer.multiMediaTextTooLong");
  return "";
});

const canPublish = computed(() => (
  !props.disable && !publishing.value && !validationMessage.value
));

function addExternalMedia() {
  if (preparedMedia.value.length + mediaUrls.value.length >= props.config.maxMedia) return;
  mediaUrls.value.push("");
  externalMediaOpen.value = true;
}

function removeMedia(index: number) {
  mediaUrls.value.splice(index, 1);
}

function addCta() {
  if (ctas.value.length >= props.config.maxCtas) return;
  ctas.value.push({ label: "", startParam: "" });
}

function removeCta(index: number) {
  if (ctas.value.length <= 1) return;
  ctas.value.splice(index, 1);
}

function resetDraft() {
  caption.value = props.initialCaption;
  mediaUrls.value = [...props.initialMedia];
  preparedMedia.value = [];
  uploadedPreparedUrls.clear();
  externalMediaOpen.value = false;
  ctas.value = props.initialCtas.length
    ? props.initialCtas.map(item => ({ ...item }))
    : [{ label: t("manage.telegram.composer.defaultCta"), startParam: "" }];
  multiMediaCtaText.value = props.initialMultiMediaCtaText;
  publishError.value = "";
  idempotencyKey.value = createIdempotencyKey();
}

watch(
  [caption, mediaUrls, preparedMedia, ctas, multiMediaCtaText],
  () => {
    publishError.value = "";
    idempotencyKey.value = createIdempotencyKey();

    const activePreparedIds = new Set(preparedMedia.value.map(item => item.id));
    for (const id of [...uploadedPreparedUrls.keys()]) {
      if (!activePreparedIds.has(id)) uploadedPreparedUrls.delete(id);
    }
  },
  { deep: true },
);

async function uploadPreparedMedia() {
  const urls: string[] = [];

  for (const image of preparedMedia.value) {
    const cached = uploadedPreparedUrls.get(image.id);
    if (cached) {
      urls.push(cached);
      continue;
    }

    const response = await managedMedia.uploadPreparedImage("telegram", image);
    uploadedPreparedUrls.set(image.id, response.image.fullUrl);
    urls.push(response.image.fullUrl);
  }

  return urls;
}

async function publish() {
  if (!canPublish.value) return;
  publishing.value = true;
  publishError.value = "";

  try {
    const uploadedMedia = await uploadPreparedMedia();
    const publicationMedia = [...normalizedMedia.value, ...uploadedMedia];
    const response = await telegram.publish({
      idempotencyKey: idempotencyKey.value,
      source: props.source,
      post: {
        caption: caption.value.trim(),
        media: publicationMedia.map(url => ({ type: "photo" as const, url })),
        ctas: normalizedCtas.value,
        multiMediaCtaText: multiMediaCtaText.value.trim() || null,
      },
    });
    emit("published", response.publication, response.duplicate);
  } catch (error) {
    const value = error as { data?: { message?: unknown; errors?: Array<{ message?: unknown }> } };
    const fieldMessage = value?.data?.errors?.find(item => typeof item?.message === "string")?.message;
    publishError.value = typeof fieldMessage === "string"
      ? fieldMessage
      : typeof value?.data?.message === "string"
        ? value.data.message
        : t("manage.telegram.composer.publishFailed");
  } finally {
    publishing.value = false;
  }
}
</script>

<template>
  <el-flex rules="rss" :gap="16" class="w100 fw">
    <el-flex
      rules="csc"
      :gap="16"
      :p="18"
      bg="surface"
      :radius="16"
      :br="1"
      bc="normal15"
      style="flex: 1 1 520px; min-width: 0;">
      <el-flex rules="rsc" :gap="10" class="w100 fw">
        <el-flex rules="ccs" :gap="3" style="flex: 1 1 260px;">
          <el-text :size="15" :weight="800">{{ t("manage.telegram.composer.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.telegram.composer.subtitle") }}</el-text>
        </el-flex>
        <el-button
          icon="restart_alt"
          mode="flat"
          :label="t('manage.telegram.composer.reset')"
          :disable="publishing"
          @click="resetDraft"
        />
      </el-flex>

      <el-flex rules="ccs" :gap="6" class="w100">
        <el-flex rules="rsc" class="w100" :gap="8">
          <el-text :size="11" :weight="700">{{ t("manage.telegram.composer.caption") }}</el-text>
          <el-text :size="10" color="normal45">{{ caption.length }} / {{ captionLimit }}</el-text>
        </el-flex>
        <el-text-field
          v-model="caption"
          type="textarea"
          :rows="6"
          :actions="false"
          :disabled="publishing"
          :placeholder="t('manage.telegram.composer.captionPlaceholder')"
        />
      </el-flex>

      <el-divider />

      <el-flex rules="csc" :gap="10" class="w100">
        <el-flex rules="rsc" :gap="8" class="w100 fw">
          <el-flex rules="ccs" :gap="2" style="flex: 1 1 220px;">
            <el-text :size="12" :weight="800">{{ t("manage.telegram.composer.media") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.telegram.composer.mediaHint", { max: config.maxMedia }) }}</el-text>
          </el-flex>
          <el-button
            icon="link"
            mode="flat"
            :label="externalMediaOpen
              ? t('manage.telegram.composer.hideExternalMedia')
              : t('manage.telegram.composer.showExternalMedia', { count: normalizedMedia.length })"
            :disable="publishing"
            @click="externalMediaOpen = !externalMediaOpen"
          />
        </el-flex>

        <ManagedImageUploader
          v-model="preparedMedia"
          :disabled="publishing || maxPreparedMedia <= 0"
          :max-images="maxPreparedMedia"
          :show-thumbnail-details="false"
          :labels="managedImageLabels"
        />

        <el-flex
          v-if="externalMediaOpen"
          rules="csc"
          :gap="8"
          :p="12"
          :radius="12"
          :br="1"
          bc="normal15"
          class="w100">
          <el-flex rules="rsc" :gap="8" class="w100 fw">
            <el-flex rules="ccs" :gap="2" class="fg100">
              <el-text :size="11" :weight="800">{{ t("manage.telegram.composer.externalMedia") }}</el-text>
              <el-text :size="10" color="normal55">{{ t("manage.telegram.composer.externalMediaHint") }}</el-text>
            </el-flex>
            <el-button
              icon="add_link"
              mode="flat"
              :label="t('manage.telegram.composer.addMedia')"
              :disable="publishing || preparedMedia.length + mediaUrls.length >= config.maxMedia"
              @click="addExternalMedia"
            />
          </el-flex>

          <el-flex
            v-for="(_, index) in mediaUrls"
            :key="`media-${index}`"
            rules="rsc"
            :gap="8"
            class="w100">
            <el-text-field
              v-model="mediaUrls[index]"
              :actions="false"
              :disabled="publishing"
              :placeholder="t('manage.telegram.composer.mediaPlaceholder')"
              style="flex: 1 1 auto;"
            />
            <el-button
              icon="delete"
              mode="flat"
              color="red"
              :disable="publishing"
              @click="removeMedia(index)"
            />
          </el-flex>
        </el-flex>
      </el-flex>

      <el-divider />

      <el-flex rules="csc" :gap="10" class="w100">
        <el-flex rules="rsc" :gap="8" class="w100 fw">
          <el-flex rules="ccs" :gap="2" style="flex: 1 1 220px;">
            <el-text :size="12" :weight="800">{{ t("manage.telegram.composer.ctas") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.telegram.composer.ctaHint", { max: config.maxCtas }) }}</el-text>
          </el-flex>
          <el-button
            icon="add_link"
            mode="flat"
            :label="t('manage.telegram.composer.addCta')"
            :disable="publishing || ctas.length >= config.maxCtas"
            @click="addCta"
          />
        </el-flex>

        <el-flex
          v-for="(cta, index) in ctas"
          :key="`cta-${index}`"
          rules="rsc"
          :gap="8"
          class="w100 fw">
          <el-text-field
            v-model="cta.label"
            :actions="false"
            :disabled="publishing"
            :placeholder="t('manage.telegram.composer.ctaLabelPlaceholder')"
            style="flex: 1 1 180px;"
          />
          <el-text-field
            v-if="cta.url !== undefined"
            v-model="cta.url"
            :actions="false"
            :disabled="publishing"
            placeholder="https://..."
            style="flex: 1 1 220px;"
          />
          <el-text-field
            v-else
            v-model="cta.startParam"
            :actions="false"
            :disabled="publishing"
            :placeholder="t('manage.telegram.composer.startParamPlaceholder')"
            style="flex: 1 1 220px;"
          />
          <el-button
            icon="delete"
            mode="flat"
            color="red"
            :disable="publishing || ctas.length <= 1"
            @click="removeCta(index)"
          />
        </el-flex>
      </el-flex>

      <el-flex v-if="totalMediaCount > 1" rules="ccs" :gap="6" class="w100">
        <el-text :size="11" :weight="700">{{ t("manage.telegram.composer.multiMediaCtaText") }}</el-text>
        <el-text-field
          v-model="multiMediaCtaText"
          :actions="false"
          :disabled="publishing"
          :placeholder="t('manage.telegram.composer.multiMediaCtaPlaceholder')"
        />
        <el-text :size="10" color="normal45">{{ multiMediaCtaText.length }} / 256</el-text>
      </el-flex>

      <el-flex rules="rsc" :gap="10" class="w100 fw">
        <el-text
          v-if="publishError || validationMessage"
          :size="11"
          :color="publishError ? 'red' : 'orange'"
          style="flex: 1 1 260px;">
          {{ publishError || validationMessage }}
        </el-text>
        <el-text v-else :size="10" color="normal45" style="flex: 1 1 260px;">
          {{ t("manage.telegram.composer.idempotencyHint") }}
        </el-text>
        <el-button
          icon="send"
          color="prim"
          :label="publishing ? t('manage.telegram.composer.publishing') : t('manage.telegram.composer.publish')"
          :disable="!canPublish"
          @click="publish"
        />
      </el-flex>
    </el-flex>

    <el-flex
      rules="csc"
      :gap="12"
      :p="18"
      bg="surface"
      :radius="16"
      :br="1"
      bc="normal15"
      style="flex: 0.75 1 340px; min-width: 0; align-self: flex-start;">
      <el-flex rules="ccs" :gap="3" class="w100">
        <el-text :size="15" :weight="800">{{ t("manage.telegram.preview.title") }}</el-text>
        <el-text :size="10" color="normal55">{{ t("manage.telegram.preview.subtitle") }}</el-text>
      </el-flex>

      <img
        v-if="firstPreviewMedia"
        :src="firstPreviewMedia"
        :alt="t('manage.telegram.preview.imageAlt')"
        class="telegram-post-preview-image"
      />
      <el-text v-if="extraMediaCount" :size="10" color="normal55">
        {{ t("manage.telegram.preview.moreMedia", { count: extraMediaCount }) }}
      </el-text>

      <el-text v-if="caption.trim()" :size="12" style="white-space: pre-wrap;">
        {{ caption.trim() }}
      </el-text>
      <el-text v-else :size="11" color="normal45">
        {{ t("manage.telegram.preview.emptyCaption") }}
      </el-text>

      <el-flex v-if="normalizedCtas.length" rules="csc" :gap="6" class="w100">
        <el-button
          v-for="(cta, index) in normalizedCtas"
          :key="`preview-cta-${index}`"
          icon="open_in_new"
          mode="outline"
          color="prim"
          :label="cta.label || t('manage.telegram.preview.unnamedCta')"
          :disable="true"
          class="w100"
        />
      </el-flex>

      <el-text v-if="totalMediaCount > 1 && multiMediaCtaText.trim()" :size="10" color="normal55">
        {{ multiMediaCtaText.trim() }}
      </el-text>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.telegram-post-preview-image {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 12px;
}
</style>
