<script setup lang="ts">
import type { SyncedPromptDraftRecord } from "~/types/draftSyncApi";
import { compileCloudDraftOutput } from "~/utils/cloudDraftActions";
import { prepareArchiveImage } from "~/utils/imageProcessing";

const props = defineProps<{
  sourceUserId: string;
  draftId: string;
  draftTitle: string;
  onPromoted?: (payload: { archiveItemId: string; publicId: number }) => void;
}>();

const emit = defineEmits<{ close: [] }>();
const promotionApi = useArchivePromotionApi();
const archiveApi = usePromptDraftApi();
const { locale } = useI18n();

const copy = computed(() => locale.value === "fa"
  ? {
      loading: "در حال آماده‌سازی درفت برای آرشیو...",
      titleEn: "عنوان انگلیسی",
      titleFa: "عنوان فارسی",
      telegramId: "شناسه پست تلگرام",
      telegramOptional: "اختیاری",
      derivedHint: (count: number) => `متن پرامپت از خود درفت ساخته می‌شود و ${count} تصویر پیش‌نمایش نیز در صورت وجود به فضای مستقل آرشیو منتقل می‌شود.`,
      cancel: "لغو",
      add: "افزودن به پرامپت‌ها",
      adding: "در حال افزودن...",
      successTitle: "درفت آرشیو ساخته شد",
      successDescription: (id: number) => `آیتم #${id} به‌صورت Draft در Prompt Archive ساخته شد.`,
      mediaWarning: "آیتم آرشیو ساخته شد، اما انتقال همه تصاویر کامل نشد. می‌توانید تصاویر را در Manage Archive تکمیل کنید.",
      done: "انجام شد",
      sourceError: "خواندن درفت منبع برای انتقال به آرشیو انجام نشد.",
      createError: "ساخت آیتم Prompt Archive انجام نشد.",
    }
  : {
      loading: "Preparing this Draft for Prompt Archive...",
      titleEn: "English title",
      titleFa: "Persian title",
      telegramId: "Telegram post ID",
      telegramOptional: "Optional",
      derivedHint: (count: number) => `Prompt output is compiled from the Draft and ${count} preview image(s) will be copied into Archive-owned media when available.`,
      cancel: "Cancel",
      add: "Add to prompts",
      adding: "Adding...",
      successTitle: "Archive Draft created",
      successDescription: (id: number) => `Item #${id} was created as a Draft in Prompt Archive.`,
      mediaWarning: "The Archive item was created, but not every image could be copied. You can finish the media in Manage Archive.",
      done: "Done",
      sourceError: "Prompt Draft could not read the source Draft for promotion.",
      createError: "Prompt Draft could not create the Prompt Archive item.",
    });

const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref("");
const mediaWarning = ref("");
const compiledPrompt = ref("");
const sourceImageIds = ref<string[]>([]);
const promotedPublicId = ref<number | null>(null);

const form = reactive({
  titleEn: "",
  titleFa: "",
  telegramMessageId: "",
});

const canSubmit = computed(() => {
  if (loading.value || submitting.value || promotedPublicId.value !== null) return false;
  if (!form.titleEn.trim() || !form.titleFa.trim() || !compiledPrompt.value.trim()) return false;
  const telegram = form.telegramMessageId.trim();
  return !telegram || (/^\d+$/.test(telegram) && Number(telegram) > 0);
});

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { message?: unknown; errors?: Array<{ message?: unknown }> } };
  const field = value?.data?.errors?.find(item => typeof item.message === "string")?.message;
  if (typeof field === "string" && field.trim()) return field;
  if (typeof value?.data?.message === "string" && value.data.message.trim()) return value.data.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toCompileRecord(source: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  snapshot: SyncedPromptDraftRecord["snapshot"];
}): SyncedPromptDraftRecord {
  return {
    id: source.id,
    title: source.title,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    serverUpdatedAt: source.updatedAt,
    revision: 0,
    snapshot: source.snapshot,
  };
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("Could not encode Archive image."));
      else resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read Archive image."));
    reader.readAsDataURL(blob);
  });
}

async function loadSource() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await promotionApi.getSourceDraft(props.sourceUserId, props.draftId);
    const source = response.draft;
    compiledPrompt.value = compileCloudDraftOutput(toCompileRecord(source));
    sourceImageIds.value = source.images.map(image => image.id);
    form.titleEn = source.title || props.draftTitle;
    form.titleFa = "";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, copy.value.sourceError);
  } finally {
    loading.value = false;
  }
}

async function copySourceImages(archiveItemId: string) {
  let copied = 0;
  for (const [index, imageId] of sourceImageIds.value.entries()) {
    const sourceBlob = await promotionApi.getSourceImage(
      props.sourceUserId,
      props.draftId,
      imageId,
    );
    const file = new File(
      [sourceBlob],
      `draft-preview-${index + 1}.webp`,
      { type: "image/webp", lastModified: Date.now() },
    );
    const prepared = await prepareArchiveImage(file);
    await archiveApi.uploadAdminArchiveImage(archiveItemId, {
      sourceName: file.name,
      full: {
        base64: await blobToBase64(prepared.fullBlob),
        width: prepared.fullWidth,
        height: prepared.fullHeight,
        sizeBytes: prepared.fullSize,
      },
      thumbnail: {
        base64: await blobToBase64(prepared.thumbnailBlob),
        width: prepared.thumbnailWidth,
        height: prepared.thumbnailHeight,
        sizeBytes: prepared.thumbnailSize,
      },
    });
    copied += 1;
  }
  return copied;
}

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  errorMessage.value = "";
  mediaWarning.value = "";

  try {
    const telegramRaw = form.telegramMessageId.trim();
    const response = await promotionApi.promoteDraft({
      sourceUserId: props.sourceUserId,
      sourceDraftId: props.draftId,
      title: { en: form.titleEn.trim(), fa: form.titleFa.trim() },
      telegramMessageId: telegramRaw ? Number(telegramRaw) : null,
      prompt: compiledPrompt.value,
    });

    promotedPublicId.value = response.item.publicId;
    props.onPromoted?.({ archiveItemId: response.item.id, publicId: response.item.publicId });

    if (sourceImageIds.value.length) {
      try { await copySourceImages(response.item.id); }
      catch (error) {
        console.error("[Prompt Draft] promoted Draft media copy failed", error);
        mediaWarning.value = copy.value.mediaWarning;
      }
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, copy.value.createError);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => { void loadSource(); });
</script>

<template>
  <el-flex rules="ccs" class="w100" :gap="14">
    <el-flex v-if="loading" rules="ccc" class="w100" :gap="8" :p="32">
      <el-icon icon="refresh" color="prim" :size="28" />
      <el-text :size="11" color="normal55">{{ copy.loading }}</el-text>
    </el-flex>

    <template v-else-if="promotedPublicId !== null">
      <el-flex rules="ccs" class="w100" :gap="8" :p="16" bg="green10" :radius="14">
        <el-text :size="15" :weight="800" color="green">{{ copy.successTitle }}</el-text>
        <el-text :size="11" color="normal65">{{ copy.successDescription(promotedPublicId) }}</el-text>
        <el-text v-if="mediaWarning" :size="11" color="orange">{{ mediaWarning }}</el-text>
      </el-flex>
      <el-flex rules="rrc" class="w100">
        <el-button :label="copy.done" icon="check" color="green" @click="emit('close')" />
      </el-flex>
    </template>

    <template v-else>
      <el-flex rules="ccs" class="w100" :gap="4">
        <el-text :size="11" :weight="700">{{ copy.titleEn }}</el-text>
        <el-text-field v-model="form.titleEn" :actions="false" :disabled="submitting" />
      </el-flex>

      <el-flex rules="ccs" class="w100" :gap="4">
        <el-text :size="11" :weight="700">{{ copy.titleFa }}</el-text>
        <el-text-field v-model="form.titleFa" :actions="false" :disabled="submitting" />
      </el-flex>

      <el-flex rules="ccs" class="w100" :gap="4">
        <el-text :size="11" :weight="700">{{ copy.telegramId }}</el-text>
        <el-text-field
          v-model="form.telegramMessageId"
          :actions="false"
          :disabled="submitting"
          :placeholder="copy.telegramOptional"
        />
      </el-flex>

      <el-flex rules="rsc" class="w100" :gap="8" :p="10" bg="blue10" :radius="10">
        <el-icon icon="auto_awesome" color="blue" />
        <el-text :size="10" color="blue">{{ copy.derivedHint(sourceImageIds.length) }}</el-text>
      </el-flex>

      <el-text v-if="errorMessage" :size="11" color="red" class="w100">{{ errorMessage }}</el-text>

      <el-flex rules="rbc" class="w100" :gap="8">
        <el-button :label="copy.cancel" mode="flat" color="normal" :disable="submitting" @click="emit('close')" />
        <el-button
          :label="submitting ? copy.adding : copy.add"
          icon="library_add"
          color="prim"
          :disable="!canSubmit"
          @click="submit"
        />
      </el-flex>
    </template>
  </el-flex>
</template>
