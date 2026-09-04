<script setup lang="ts">
import ArchiveImageManager from "~/components/manage/ArchiveImageManager.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type {
  AdminArchiveImage,
  AdminArchiveItem,
  AdminArchiveStatus,
  AdminArchiveSummary,
  AdminArchiveUpsertInput,
} from "~/types/adminArchiveApi";
import type { PreparedArchiveImage } from "~/types/archiveImage";
import type { PromptArchiveModel } from "~/types/promptArchive";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.ARCHIVE_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();
const modal = useModal();
const { locale, t } = useI18n();

const items = ref<AdminArchiveSummary[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const listError = ref("");
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const searchText = ref("");
const statusFilter = ref<"" | AdminArchiveStatus>("");
const modelFilter = ref<"" | PromptArchiveModel>("");
const canonicalTags = ref<string[]>([]);

const editorOpen = ref(false);
const editorLoading = ref(false);
const saving = ref(false);
const statusChanging = ref(false);
const mediaMutating = ref(false);
const mediaProgress = ref("");
const editingItem = ref<AdminArchiveItem | null>(null);
const preparedImages = ref<PreparedArchiveImage[]>([]);

const form = reactive({
  telegramMessageId: "",
  titleEn: "",
  titleFa: "",
  sourceTitle: "",
  publishedAt: "",
  prompt: "",
  previewModel: "gpt-image-1" as PromptArchiveModel,
  optimizedFor: ["gpt-image-1"] as PromptArchiveModel[],
  tags: [] as string[],
});

let filterTimer: ReturnType<typeof setTimeout> | null = null;
let listRequestVersion = 0;
let editorRequestVersion = 0;

const canManage = computed(() => auth.can(AUTH_PERMISSIONS.ARCHIVE_MANAGE));
const hasPreparedImages = computed(() => preparedImages.value.length > 0);
const hasPendingPreparedImages = computed(() => (
  preparedImages.value.some(item => item.status !== "ready")
));
const publishBlockedByLocalImages = computed(() => hasPreparedImages.value);
const editorBusy = computed(() => (
  saving.value || statusChanging.value || mediaMutating.value || editorLoading.value
));

const statusFilterItems = computed(() => [
  { value: "draft", label: t("manage.archive.statuses.draft"), icon: "edit_note" },
  { value: "published", label: t("manage.archive.statuses.published"), icon: "public" },
  { value: "archived", label: t("manage.archive.statuses.archived"), icon: "inventory_2" },
]);

const modelItems = computed(() => [
  { value: "gpt-image-1", label: "GPT-Image-1", icon: "image" },
  { value: "dall-e", label: "DALL-E", icon: "image" },
]);

const optimizedForItems = computed(() => modelItems.value);
const tagItems = computed(() => canonicalTags.value.map(tag => ({
  value: tag,
  label: formatTag(tag),
  icon: "sell",
})));

const editorHeading = computed(() => (
  editingItem.value
    ? t("manage.archive.editor.editTitle", { id: editingItem.value.telegramMessageId })
    : t("manage.archive.editor.createTitle")
));

const currentStatusLabel = computed(() => (
  editingItem.value
    ? t(`manage.archive.statuses.${editingItem.value.status}`)
    : t("manage.archive.statuses.draft")
));

const canSave = computed(() => {
  return (
    canManage.value &&
    !editorBusy.value &&
    !hasPendingPreparedImages.value &&
    /^\d+$/.test(form.telegramMessageId.trim()) &&
    Number(form.telegramMessageId) > 0 &&
    Boolean(form.titleEn.trim()) &&
    Boolean(form.titleFa.trim()) &&
    Boolean(form.publishedAt) &&
    Boolean(form.prompt.trim()) &&
    form.optimizedFor.length > 0
  );
});

function formatTag(tag: string) {
  return tag.replaceAll("-", " ");
}

function statusLabel(status: AdminArchiveStatus) {
  return t(`manage.archive.statuses.${status}`);
}

function statusColor(status: AdminArchiveStatus) {
  if (status === "published") return "green";
  if (status === "archived") return "normal55";
  return "orange";
}

function sourceKindLabel(sourceKind: AdminArchiveSummary["sourceKind"]) {
  return sourceKind === "managed"
    ? t("manage.archive.sourceKinds.managed")
    : t("manage.archive.sourceKinds.legacy");
}

function formatDate(value: string) {
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

function toLocalDateTimeInput(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as {
    data?: {
      message?: unknown;
      errors?: Array<{ message?: unknown }>;
    };
  };

  const fieldMessage = value?.data?.errors?.find(
    item => typeof item?.message === "string",
  )?.message;

  if (typeof fieldMessage === "string" && fieldMessage.trim()) return fieldMessage;
  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }
  return fallback;
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error("Could not encode Archive image."));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read Archive image."));
    reader.readAsDataURL(blob);
  });
}

async function loadTags() {
  try {
    const response = await api.getAdminArchiveTags();
    canonicalTags.value = response.tags;
  } catch (error) {
    console.error("[Manage Archive] Failed to load tag catalog", error);
  }
}

async function loadArchive(options: { append?: boolean } = {}) {
  const append = Boolean(options.append);
  if (append && (!hasMore.value || !nextCursor.value || loadingMore.value)) return;

  const requestVersion = ++listRequestVersion;
  listError.value = "";
  if (append) loadingMore.value = true;
  else loading.value = true;

  try {
    const response = await api.listAdminArchive({
      limit: 20,
      cursor: append ? nextCursor.value ?? undefined : undefined,
      query: searchText.value.trim() || undefined,
      status: statusFilter.value || undefined,
      model: modelFilter.value || undefined,
    });

    if (requestVersion !== listRequestVersion) return;
    items.value = append ? [...items.value, ...response.items] : response.items;
    nextCursor.value = response.pageInfo.nextCursor;
    hasMore.value = response.pageInfo.hasMore;
  } catch (error) {
    if (requestVersion !== listRequestVersion) return;
    listError.value = getApiErrorMessage(error, t("manage.archive.loadError"));
    if (!append) {
      items.value = [];
      nextCursor.value = null;
      hasMore.value = false;
    }
  } finally {
    if (requestVersion === listRequestVersion) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function scheduleFilterReload() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    nextCursor.value = null;
    hasMore.value = false;
    void loadArchive();
  }, 350);
}

function resetForm() {
  form.telegramMessageId = "";
  form.titleEn = "";
  form.titleFa = "";
  form.sourceTitle = "";
  form.publishedAt = toLocalDateTimeInput(new Date());
  form.prompt = "";
  form.previewModel = "gpt-image-1";
  form.optimizedFor = ["gpt-image-1"];
  form.tags = [];
}

function populateForm(item: AdminArchiveItem) {
  form.telegramMessageId = String(item.telegramMessageId);
  form.titleEn = item.title.en;
  form.titleFa = item.title.fa;
  form.sourceTitle = item.sourceTitle || "";
  form.publishedAt = toLocalDateTimeInput(item.publishedAt);
  form.prompt = item.prompt;
  form.previewModel = item.previewModel;
  form.optimizedFor = [...item.optimizedFor];
  form.tags = [...item.tags];
}

async function refreshEditingItem(itemId = editingItem.value?.id) {
  if (!itemId) return;
  const response = await api.getAdminArchive(itemId);
  editingItem.value = response.item;
  populateForm(response.item);
}

function openCreate() {
  editingItem.value = null;
  preparedImages.value = [];
  mediaProgress.value = "";
  resetForm();
  editorOpen.value = true;
}

async function openEdit(item: AdminArchiveSummary) {
  const requestVersion = ++editorRequestVersion;
  editorOpen.value = true;
  editorLoading.value = true;
  editingItem.value = null;
  preparedImages.value = [];
  mediaProgress.value = "";
  resetForm();

  try {
    const response = await api.getAdminArchive(item.id);
    if (requestVersion !== editorRequestVersion) return;
    editingItem.value = response.item;
    populateForm(response.item);
  } catch (error) {
    if (requestVersion !== editorRequestVersion) return;
    editorOpen.value = false;
    modal.message({
      type: "error",
      title: t("manage.archive.editor.loadFailedTitle"),
      message: getApiErrorMessage(error, t("manage.archive.editor.loadFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    if (requestVersion === editorRequestVersion) editorLoading.value = false;
  }
}

function closeEditor() {
  editorRequestVersion += 1;
  editorOpen.value = false;
  editorLoading.value = false;
  editingItem.value = null;
  preparedImages.value = [];
  mediaProgress.value = "";
}

function buildInput(): AdminArchiveUpsertInput {
  return {
    telegramMessageId: Number(form.telegramMessageId),
    title: {
      en: form.titleEn.trim(),
      fa: form.titleFa.trim(),
    },
    sourceTitle: form.sourceTitle.trim() || null,
    publishedAt: new Date(form.publishedAt).toISOString(),
    prompt: form.prompt,
    previewModel: form.previewModel,
    optimizedFor: [...form.optimizedFor],
    tags: [...form.tags],
  };
}

async function uploadPreparedMedia(itemId: string) {
  if (!preparedImages.value.length) return;
  if (hasPendingPreparedImages.value) {
    throw new Error(t("manage.archive.images.waitForPreparation"));
  }

  mediaMutating.value = true;
  const total = preparedImages.value.length;
  let completed = 0;

  try {
    while (preparedImages.value.length) {
      const image = preparedImages.value[0];
      if (
        !image.fullBlob ||
        !image.thumbnailBlob ||
        !image.fullWidth ||
        !image.fullHeight ||
        !image.thumbnailWidth ||
        !image.thumbnailHeight ||
        image.fullSize == null ||
        image.thumbnailSize == null
      ) {
        throw new Error(t("manage.archive.images.preparedPayloadMissing"));
      }

      mediaProgress.value = t("manage.archive.images.uploadProgress", {
        current: completed + 1,
        total,
      });

      await api.uploadAdminArchiveImage(itemId, {
        sourceName: image.sourceName,
        full: {
          base64: await blobToBase64(image.fullBlob),
          width: image.fullWidth,
          height: image.fullHeight,
          sizeBytes: image.fullSize,
        },
        thumbnail: {
          base64: await blobToBase64(image.thumbnailBlob),
          width: image.thumbnailWidth,
          height: image.thumbnailHeight,
          sizeBytes: image.thumbnailSize,
        },
      });

      preparedImages.value = preparedImages.value.filter(candidate => candidate.id !== image.id);
      completed += 1;
    }
  } finally {
    mediaMutating.value = false;
    mediaProgress.value = "";
  }
}

async function saveMetadata() {
  if (!canSave.value) return;
  saving.value = true;

  try {
    const response = editingItem.value
      ? await api.updateAdminArchive(editingItem.value.id, buildInput())
      : await api.createAdminArchive(buildInput());

    editingItem.value = response.item;
    populateForm(response.item);

    if (preparedImages.value.length) {
      try {
        await uploadPreparedMedia(response.item.id);
      } catch (error) {
        await refreshEditingItem(response.item.id);
        await loadArchive();
        modal.message({
          type: "error",
          title: t("manage.archive.editor.mediaUploadFailedTitle"),
          message: getApiErrorMessage(error, t("manage.archive.editor.mediaUploadFailed")),
          actionLabel: t("manage.common.actions.close"),
        });
        return;
      }
    }

    await refreshEditingItem(response.item.id);
    await loadArchive();

    modal.message({
      type: "success",
      title: t("manage.archive.editor.savedTitle"),
      message: t("manage.archive.editor.savedWithMedia"),
      actionLabel: t("manage.common.actions.done"),
    });
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.archive.editor.saveFailedTitle"),
      message: getApiErrorMessage(error, t("manage.archive.editor.saveFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    saving.value = false;
  }
}

async function changeStatus(action: "draft" | "publish" | "archive") {
  const item = editingItem.value;
  if (!item || !canManage.value || editorBusy.value) return;

  if (action === "publish" && publishBlockedByLocalImages.value) {
    modal.message({
      type: "warning",
      title: t("manage.archive.editor.publishBlockedTitle"),
      message: t("manage.archive.editor.publishBlockedLocalImages"),
      actionLabel: t("manage.common.actions.done"),
    });
    return;
  }

  statusChanging.value = true;
  try {
    const response = await api.setAdminArchiveStatus(item.id, action);
    editingItem.value = response.item;
    populateForm(response.item);
    await loadArchive();

    modal.message({
      type: "success",
      title: t("manage.archive.editor.statusUpdatedTitle"),
      message: t("manage.archive.editor.statusUpdated", {
        status: statusLabel(response.item.status),
      }),
      actionLabel: t("manage.common.actions.done"),
    });
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.archive.editor.statusFailedTitle"),
      message: getApiErrorMessage(error, t("manage.archive.editor.statusFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    statusChanging.value = false;
  }
}

async function deletePersistedImage(image: AdminArchiveImage) {
  const item = editingItem.value;
  if (!item || editorBusy.value || !canManage.value) return;
  if (!window.confirm(t("manage.archive.images.deleteConfirm"))) return;

  mediaMutating.value = true;
  try {
    const response = await api.deleteAdminArchiveImage(item.id, image.id);
    if (response.cleanupFailures?.length) {
      console.warn("[Manage Archive] storage cleanup warnings", response.cleanupFailures);
    }
    await refreshEditingItem(item.id);
    await loadArchive();
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.archive.images.mutationFailedTitle"),
      message: getApiErrorMessage(error, t("manage.archive.images.mutationFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    mediaMutating.value = false;
  }
}

async function movePersistedImage(imageId: string, direction: -1 | 1) {
  const item = editingItem.value;
  if (!item || editorBusy.value || !canManage.value) return;

  const currentIndex = item.images.findIndex(image => image.id === imageId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= item.images.length) return;

  const reordered = [...item.images];
  const [target] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, target);

  mediaMutating.value = true;
  try {
    await api.reorderAdminArchiveImages(item.id, {
      imageIds: reordered.map(image => image.id),
    });
    await refreshEditingItem(item.id);
    await loadArchive();
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.archive.images.mutationFailedTitle"),
      message: getApiErrorMessage(error, t("manage.archive.images.mutationFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    mediaMutating.value = false;
  }
}

watch(searchText, scheduleFilterReload);
watch(statusFilter, scheduleFilterReload);
watch(modelFilter, scheduleFilterReload);

onMounted(async () => {
  await auth.initialize();
  await Promise.all([loadTags(), loadArchive()]);
});

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer);
});
</script>

<template>
  <el-flex v-if="editorOpen" rules="csc" :gap="16" class="w100">
    <el-flex rules="rsc" :gap="10" class="w100 fw">
      <el-flex rules="ccs" :gap="4" style="flex: 1 1 300px;">
        <el-text :size="19" :weight="800">{{ editorHeading }}</el-text>
        <el-text :size="11" color="normal55">
          {{ t("manage.archive.editor.saveDraftHint") }}
        </el-text>
      </el-flex>
      <el-button
        icon="arrow_back"
        mode="flat"
        :label="t('manage.archive.actions.backToList')"
        :disable="editorBusy"
        @click="closeEditor"
      />
    </el-flex>

    <el-flex v-if="editorLoading" rules="ccc" class="w100" :p="30">
      <el-text color="normal55">{{ t("manage.archive.editor.loading") }}</el-text>
    </el-flex>

    <template v-else>
      <el-flex
        rules="csc"
        :gap="16"
        :p="18"
        bg="surface"
        :radius="16"
        :br="1"
        bc="normal15"
        class="w100">
        <el-flex rules="rsc" :gap="10" class="w100 fw">
          <el-flex rules="rcc" :gap="6">
            <el-text :size="11" color="normal55">{{ t("manage.archive.fields.status") }}</el-text>
            <el-text
              :size="12"
              :weight="800"
              :color="editingItem ? statusColor(editingItem.status) : 'orange'">
              {{ currentStatusLabel }}
            </el-text>
          </el-flex>
          <el-text v-if="editingItem" :size="10" color="normal45">
            {{ sourceKindLabel(editingItem.sourceKind) }} · {{ editingItem.id }}
          </el-text>
        </el-flex>

        <el-grid cols="minmax(180px, .55fr) minmax(260px, 1fr) minmax(260px, 1fr)" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.telegramId") }}</el-text>
            <el-text-field
              v-model="form.telegramMessageId"
              :actions="false"
              :disabled="!canManage || editorBusy"
              :placeholder="t('manage.archive.placeholders.telegramId')"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.titleEn") }}</el-text>
            <el-text-field
              v-model="form.titleEn"
              :actions="false"
              :disabled="!canManage || editorBusy"
              :placeholder="t('manage.archive.placeholders.titleEn')"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.titleFa") }}</el-text>
            <el-text-field
              v-model="form.titleFa"
              :actions="false"
              :disabled="!canManage || editorBusy"
              :placeholder="t('manage.archive.placeholders.titleFa')"
            />
          </el-flex>
        </el-grid>

        <el-grid cols="minmax(220px, .8fr) minmax(220px, .8fr) minmax(260px, 1fr)" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.publishedAt") }}</el-text>
            <input
              v-model="form.publishedAt"
              type="datetime-local"
              class="archive-native-input"
              :disabled="!canManage || editorBusy"
            >
          </el-flex>

          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.previewModel") }}</el-text>
            <el-dropdown
              v-model="form.previewModel"
              :items="modelItems"
              :disabled="!canManage || editorBusy"
              icon="image"
            />
          </el-flex>

          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.archive.fields.optimizedFor") }}</el-text>
            <el-multi-select
              v-model="form.optimizedFor"
              :items="optimizedForItems"
              :disabled="!canManage || editorBusy"
              icon="tune"
              :placeholder="t('manage.archive.placeholders.optimizedFor')"
            />
          </el-flex>
        </el-grid>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="11" :weight="700">{{ t("manage.archive.fields.tags") }}</el-text>
          <el-multi-select
            v-model="form.tags"
            :items="tagItems"
            :disabled="!canManage || editorBusy"
            icon="sell"
            :placeholder="t('manage.archive.placeholders.tags')"
          />
        </el-flex>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="11" :weight="700">{{ t("manage.archive.fields.sourceTitle") }}</el-text>
          <el-text-field
            v-model="form.sourceTitle"
            type="textarea"
            :rows="3"
            :actions="false"
            :disabled="!canManage || editorBusy"
            :placeholder="t('manage.archive.placeholders.sourceTitle')"
          />
        </el-flex>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="11" :weight="700">{{ t("manage.archive.fields.prompt") }}</el-text>
          <el-text-field
            v-model="form.prompt"
            type="textarea"
            :rows="10"
            :actions="false"
            :disabled="!canManage || editorBusy"
            :placeholder="t('manage.archive.placeholders.prompt')"
          />
        </el-flex>
      </el-flex>

      <el-flex
        v-if="editingItem?.images.length"
        rules="csc"
        :gap="10"
        :p="16"
        bg="surface"
        :radius="16"
        :br="1"
        bc="normal15"
        class="w100">
        <el-flex rules="rsc" :gap="8" class="w100">
          <el-text :size="13" :weight="800">{{ t("manage.archive.images.existingTitle") }}</el-text>
          <el-text :size="10" color="normal50">{{ t("manage.archive.images.persistedHint") }}</el-text>
        </el-flex>
        <div class="archive-existing-images">
          <div
            v-for="(image, imageIndex) in editingItem.images"
            :key="image.id"
            class="archive-existing-image-card">
            <div class="archive-existing-image">
              <img v-if="image.thumbnailUrl || image.fullUrl" :src="image.thumbnailUrl || image.fullUrl || ''" alt="">
              <el-flex v-else rules="ccc" class="w100 h100"><el-icon icon="hide_image" /></el-flex>
              <span>#{{ image.position + 1 }}</span>
            </div>
            <el-flex rules="rcc" :gap="5" class="w100">
              <el-button
                type="fab"
                mode="flat"
                icon="arrow_back"
                :disable="editorBusy || imageIndex === 0"
                @click="movePersistedImage(image.id, -1)"
              />
              <el-button
                type="fab"
                mode="flat"
                icon="arrow_forward"
                :disable="editorBusy || imageIndex === editingItem.images.length - 1"
                @click="movePersistedImage(image.id, 1)"
              />
              <el-button
                type="fab"
                mode="flat"
                color="red"
                icon="delete"
                :disable="editorBusy"
                @click="deletePersistedImage(image)"
              />
            </el-flex>
          </div>
        </div>
      </el-flex>

      <el-flex
        rules="csc"
        :gap="10"
        :p="16"
        bg="surface"
        :radius="16"
        :br="1"
        bc="normal15"
        class="w100">
        <ArchiveImageManager
          v-model="preparedImages"
          :disabled="!canManage || editorBusy"
        />
        <el-flex rules="rsc" :gap="8" bg="blue10" :p="10" :radius="10" class="w100">
          <el-icon icon="cloud_upload" color="blue" />
          <el-text :size="10" color="blue">
            {{ mediaProgress || t("manage.archive.images.storageNotice") }}
          </el-text>
        </el-flex>
      </el-flex>

      <el-flex rules="rsc" :gap="8" class="w100 fw archive-editor-actions">
        <el-button
          v-if="canManage"
          color="prim"
          icon="save"
          :label="t('manage.archive.actions.saveDraft')"
          :disable="!canSave"
          @click="saveMetadata"
        />

        <template v-if="editingItem && canManage">
          <el-button
            v-if="editingItem.status !== 'published'"
            color="green"
            icon="public"
            :label="t('manage.archive.actions.publish')"
            :disable="editorBusy || publishBlockedByLocalImages || hasPendingPreparedImages"
            @click="changeStatus('publish')"
          />
          <el-button
            v-if="editingItem.status === 'published'"
            color="orange"
            mode="flat"
            icon="edit_note"
            :label="t('manage.archive.actions.moveToDraft')"
            :disable="editorBusy"
            @click="changeStatus('draft')"
          />
          <el-button
            v-if="editingItem.status !== 'archived'"
            color="red"
            mode="flat"
            icon="inventory_2"
            :label="t('manage.archive.actions.archive')"
            :disable="editorBusy"
            @click="changeStatus('archive')"
          />
          <el-button
            v-if="editingItem.status === 'archived'"
            color="orange"
            mode="flat"
            icon="edit_note"
            :label="t('manage.archive.actions.restoreDraft')"
            :disable="editorBusy"
            @click="changeStatus('draft')"
          />
        </template>
      </el-flex>
    </template>
  </el-flex>

  <el-flex v-else rules="csc" :gap="16" class="w100">
    <el-grid
      cols="minmax(240px, 1fr) minmax(150px, 210px) minmax(150px, 210px) auto auto"
      :gap="10"
      align-items="center"
      class="w100">
      <el-text-field
        v-model="searchText"
        :actions="false"
        :placeholder="t('manage.archive.searchPlaceholder')"
      />
      <el-dropdown
        v-model="statusFilter"
        :items="statusFilterItems"
        clearable
        icon="filter_alt"
        :placeholder="t('manage.archive.filters.allStatuses')"
      />
      <el-dropdown
        v-model="modelFilter"
        :items="modelItems"
        clearable
        icon="image"
        :placeholder="t('manage.archive.filters.allModels')"
      />
      <el-button
        mode="flat"
        icon="refresh"
        :label="t('manage.common.actions.refresh')"
        :disable="loading || loadingMore"
        @click="loadArchive()"
      />
      <el-button
        v-if="canManage"
        color="prim"
        icon="add"
        :label="t('manage.archive.actions.newPrompt')"
        @click="openCreate"
      />
    </el-grid>

    <el-flex
      v-if="listError"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="10">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ listError }}</el-text>
    </el-flex>

    <el-flex
      rules="csc"
      class="w100"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15">
      <el-grid
        cols="90px minmax(220px, 1.5fr) 110px 120px 90px minmax(160px, 1fr) 150px 48px"
        :gap="12"
        align-items="center"
        class="w100"
        :p="[12, 16]">
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.telegramId") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.title") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.status") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.previewModel") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.images") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.tags") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.archive.fields.updated") }}</el-text>
        <el-text color="normal55" :size="10" :weight="800">{{ t("manage.common.fields.actions") }}</el-text>
      </el-grid>

      <el-divider />

      <el-flex v-if="loading" rules="ccc" class="w100" :p="28">
        <el-text color="normal55">{{ t("manage.archive.loading") }}</el-text>
      </el-flex>

      <template v-else-if="items.length">
        <template v-for="(item, index) in items" :key="item.id">
          <el-grid
            cols="90px minmax(220px, 1.5fr) 110px 120px 90px minmax(160px, 1fr) 150px 48px"
            :gap="12"
            align-items="center"
            class="w100"
            :p="[12, 16]">
            <el-text :size="11" :weight="800">#{{ item.telegramMessageId }}</el-text>
            <el-flex rules="ccs" :gap="3" class="w100">
              <el-text :size="12" :weight="700">{{ locale === 'fa' ? item.title.fa : item.title.en }}</el-text>
              <el-text :size="9" color="normal45">{{ sourceKindLabel(item.sourceKind) }}</el-text>
            </el-flex>
            <el-text :size="11" :weight="700" :color="statusColor(item.status)">
              {{ statusLabel(item.status) }}
            </el-text>
            <el-text :size="11">{{ item.previewModel === 'gpt-image-1' ? 'GPT-Image-1' : 'DALL-E' }}</el-text>
            <el-text :size="11" :localize="true">{{ item.imageCount }}</el-text>
            <el-text :size="10" color="normal60" class="archive-tags-cell">
              {{ item.tags.slice(0, 4).map(formatTag).join(' · ') || '—' }}
            </el-text>
            <el-text :size="10">{{ formatDate(item.updatedAt) }}</el-text>
            <el-button
              type="fab"
              mode="flat"
              icon="edit"
              :tooltip="t('manage.archive.actions.edit')"
              @click="openEdit(item)"
            />
          </el-grid>
          <el-divider v-if="index < items.length - 1" />
        </template>
      </template>

      <el-flex v-else rules="ccc" class="w100" :p="28">
        <el-text color="normal55">{{ t("manage.archive.empty") }}</el-text>
      </el-flex>
    </el-flex>

    <el-button
      v-if="hasMore"
      mode="flat"
      color="prim"
      icon="expand_more"
      :label="t('manage.common.actions.loadMore')"
      :disable="loadingMore"
      @click="loadArchive({ append: true })"
    />
  </el-flex>
</template>

<style scoped>
.archive-native-input {
  width: 100%;
  min-height: 42px;
  padding: 8px 11px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 11px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  color: inherit;
  font: inherit;
  outline: none;
}

.archive-native-input:focus {
  border-color: color-mix(in srgb, currentColor 38%, transparent);
}

.archive-existing-images {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
  gap: 8px;
}

.archive-existing-image-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.archive-existing-image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.archive-existing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.archive-existing-image span {
  position: absolute;
  left: 6px;
  top: 6px;
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  color: white;
  font-size: 9px;
}

.archive-editor-actions {
  padding-bottom: 8px;
}

.archive-tags-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  :deep(.el-grid) {
    overflow-x: auto;
  }
}
</style>
