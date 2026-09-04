<script setup lang="ts">
import type { PreparedArchiveImage } from "~/types/archiveImage";
import {
  ARCHIVE_IMAGE_FULL_MAX_EDGE,
  ARCHIVE_IMAGE_FULL_WEBP_QUALITY,
  ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE,
  archiveImageExtensionForMime,
  prepareArchiveImage,
  validateArchiveImageFile,
} from "~/utils/imageProcessing";

const props = withDefaults(
  defineProps<{
    modelValue?: PreparedArchiveImage[];
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: PreparedArchiveImage[]): void;
}>();

const modal = useModal();
const { t } = useI18n();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const ownedUrls = new Set<string>();

const items = computed(() => props.modelValue ?? []);
const processingCount = computed(() => items.value.filter(item => item.status === "processing").length);
const readyCount = computed(() => items.value.filter(item => item.status === "ready").length);
const hasErrors = computed(() => items.value.some(item => item.status === "error"));

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ownUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);
  ownedUrls.add(url);
  return url;
}

function revokeUrl(url: string | null | undefined) {
  if (!url || !ownedUrls.has(url)) return;
  URL.revokeObjectURL(url);
  ownedUrls.delete(url);
}

function revokeItemUrls(item: PreparedArchiveImage) {
  revokeUrl(item.previewUrl);
  revokeUrl(item.thumbnailPreviewUrl);
}

function normalizePositions(value: PreparedArchiveImage[]) {
  return value.map((item, index) => ({ ...item, position: index }));
}

function updateItems(value: PreparedArchiveImage[]) {
  emit("update:modelValue", normalizePositions(value));
}

function openFilePicker() {
  if (!props.disabled) fileInput.value?.click();
}

function makeClipboardFile(source: File, index: number) {
  const extension = archiveImageExtensionForMime(source.type);
  if (!extension) return source;

  return new File(
    [source],
    `clipboard-${Date.now()}-${index + 1}.${extension}`,
    {
      type: source.type,
      lastModified: Date.now(),
    },
  );
}

async function addFiles(files: File[]) {
  if (props.disabled || !files.length) return;

  const accepted: File[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    const validation = validateArchiveImageFile(file);
    if (validation.valid) {
      accepted.push(file);
    } else {
      rejected.push(file.name || file.type || "image");
    }
  }

  if (rejected.length) {
    modal.message({
      type: "warning",
      title: t("manage.archive.images.unsupportedTitle"),
      message: t("manage.archive.images.unsupportedMessage", {
        count: rejected.length,
      }),
      actionLabel: t("manage.common.actions.done"),
      width: 500,
    });
  }

  for (const file of accepted) {
    const sourcePreview = ownUrl(file);
    const item: PreparedArchiveImage = {
      id: newId(),
      sourceFile: file,
      sourceName: file.name,
      sourceSize: file.size,
      fullBlob: null,
      fullWidth: null,
      fullHeight: null,
      fullSize: null,
      thumbnailBlob: null,
      thumbnailWidth: null,
      thumbnailHeight: null,
      thumbnailSize: null,
      previewUrl: sourcePreview,
      thumbnailPreviewUrl: null,
      position: items.value.length,
      status: "processing",
      error: null,
    };

    updateItems([...items.value, item]);

    try {
      const output = await prepareArchiveImage(file);
      const current = items.value.find(candidate => candidate.id === item.id);
      if (!current) {
        revokeUrl(sourcePreview);
        continue;
      }

      revokeUrl(sourcePreview);
      const fullPreview = ownUrl(output.fullBlob);
      const thumbnailPreview = ownUrl(output.thumbnailBlob);

      updateItems(items.value.map(candidate => (
        candidate.id === item.id
          ? {
              ...candidate,
              ...output,
              previewUrl: fullPreview,
              thumbnailPreviewUrl: thumbnailPreview,
              status: "ready" as const,
              error: null,
            }
          : candidate
      )));
    } catch (error) {
      console.error("[ArchiveImageManager] image preparation failed", error);
      updateItems(items.value.map(candidate => (
        candidate.id === item.id
          ? {
              ...candidate,
              status: "error" as const,
              error: error instanceof Error ? error.message : "image-processing-failed",
            }
          : candidate
      )));
    }
  }
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  void addFiles(Array.from(input.files || []));
  input.value = "";
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  void addFiles(Array.from(event.dataTransfer?.files || []));
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as Node | null;
  if (relatedTarget && target.contains(relatedTarget)) return;
  isDragging.value = false;
}

function handlePaste(event: ClipboardEvent) {
  if (props.disabled) return;

  const clipboardFiles = Array.from(event.clipboardData?.items || [])
    .filter(item => item.kind === "file")
    .map(item => item.getAsFile())
    .filter((file): file is File => Boolean(file))
    .map(makeClipboardFile);

  if (!clipboardFiles.length) return;
  event.preventDefault();
  void addFiles(clipboardFiles);
}

function removeItem(id: string) {
  const target = items.value.find(item => item.id === id);
  if (target) revokeItemUrls(target);
  updateItems(items.value.filter(item => item.id !== id));
}

function clearAll() {
  items.value.forEach(revokeItemUrls);
  updateItems([]);
}

function moveItem(id: string, direction: -1 | 1) {
  const index = items.value.findIndex(item => item.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.value.length) return;

  const reordered = [...items.value];
  const [target] = reordered.splice(index, 1);
  reordered.splice(nextIndex, 0, target);
  updateItems(reordered);
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

onBeforeUnmount(() => {
  for (const url of ownedUrls) URL.revokeObjectURL(url);
  ownedUrls.clear();
});
</script>

<template>
  <div
    class="archive-image-manager"
    :class="{ 'is-dragging': isDragging, 'is-disabled': disabled }"
    tabindex="0"
    @paste="handlePaste"
    @dragenter.prevent="isDragging = !disabled"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      class="archive-image-manager-input"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      multiple
      :disabled="disabled"
      @change="handleInputChange"
    >

    <el-flex rules="rsc" :gap="10" class="w100 fw">
      <el-flex rules="ccs" :gap="4" class="archive-image-manager-heading">
        <el-text :size="14" :weight="700" icon="photo_library" marker="blue40">
          {{ t("manage.archive.images.title") }}
        </el-text>
        <el-text :size="11" color="normal60">
          {{ t("manage.archive.images.rules", {
            fullEdge: ARCHIVE_IMAGE_FULL_MAX_EDGE,
            thumbnailEdge: ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE,
            quality: Math.round(ARCHIVE_IMAGE_FULL_WEBP_QUALITY * 100),
          }) }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="8" class="fw">
        <el-button
          icon="add_photo_alternate"
          color="prim"
          mode="flat"
          :label="t('manage.archive.images.add')"
          :disable="disabled"
          :size="11"
          :p="[8, 10]"
          @click="openFilePicker"
        />
        <el-button
          v-if="items.length"
          icon="delete_sweep"
          color="red"
          mode="flat"
          :label="t('manage.archive.images.clear')"
          :disable="disabled"
          :size="11"
          :p="[8, 10]"
          @click="clearAll"
        />
      </el-flex>
    </el-flex>

    <el-flex
      v-if="!items.length"
      rules="ccc"
      :gap="8"
      :p="24"
      bg="normal5"
      :radius="16"
      class="archive-image-manager-empty w100"
      @click="openFilePicker"
    >
      <el-icon icon="add_photo_alternate" :size="30" />
      <el-text :size="13" :weight="600">{{ t("manage.archive.images.empty") }}</el-text>
      <el-text :size="11" color="normal60">{{ t("manage.archive.images.pasteHint") }}</el-text>
    </el-flex>

    <div v-else class="archive-image-manager-grid">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="archive-image-manager-card"
      >
        <div class="archive-image-manager-preview">
          <img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.sourceName">
          <el-flex v-else rules="ccc" class="w100 h100">
            <el-icon icon="image" :size="28" />
          </el-flex>

          <el-flex class="archive-image-manager-position" rules="rcc">
            {{ index + 1 }}
          </el-flex>
        </div>

        <el-flex rules="ccs" :gap="5" :p="10" class="w100">
          <el-text :size="11" :weight="600" class="archive-image-manager-name">
            {{ item.sourceName }}
          </el-text>

          <el-text v-if="item.status === 'processing'" :size="10" color="normal60" icon="progress_activity">
            {{ t("manage.archive.images.processing") }}
          </el-text>
          <el-text v-else-if="item.status === 'error'" :size="10" color="red" icon="error">
            {{ t("manage.archive.images.failed") }}
          </el-text>
          <template v-else>
            <el-text :size="9" color="normal55">
              {{ item.fullWidth }}×{{ item.fullHeight }} · {{ formatBytes(item.fullSize) }}
            </el-text>
            <el-text :size="9" color="normal55">
              {{ t("manage.archive.images.thumbnail") }}: {{ item.thumbnailWidth }}×{{ item.thumbnailHeight }} · {{ formatBytes(item.thumbnailSize) }}
            </el-text>
          </template>

          <el-flex rules="rsc" :gap="4" class="w100">
            <el-button
              icon="arrow_back"
              mode="flat"
              :disable="disabled || index === 0"
              :size="10"
              :p="[6, 8]"
              @click="moveItem(item.id, -1)"
            />
            <el-button
              icon="arrow_forward"
              mode="flat"
              :disable="disabled || index === items.length - 1"
              :size="10"
              :p="[6, 8]"
              @click="moveItem(item.id, 1)"
            />
            <el-button
              icon="delete"
              color="red"
              mode="flat"
              :disable="disabled"
              :size="10"
              :p="[6, 8]"
              @click="removeItem(item.id)"
            />
          </el-flex>
        </el-flex>
      </div>
    </div>

    <el-flex v-if="items.length" rules="rsc" :gap="12" class="w100 fw">
      <el-text :size="10" color="normal60">
        {{ t("manage.archive.images.readyCount", { ready: readyCount, total: items.length }) }}
      </el-text>
      <el-text v-if="processingCount" :size="10" color="normal60">
        {{ t("manage.archive.images.processingCount", { count: processingCount }) }}
      </el-text>
      <el-text v-if="hasErrors" :size="10" color="red">
        {{ t("manage.archive.images.errorHint") }}
      </el-text>
    </el-flex>
  </div>
</template>

<style scoped>
.archive-image-manager {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  outline: none;
}

.archive-image-manager.is-dragging {
  outline: 1px dashed currentColor;
  outline-offset: 6px;
  border-radius: 18px;
}

.archive-image-manager.is-disabled {
  opacity: 0.65;
}

.archive-image-manager-input {
  display: none;
}

.archive-image-manager-heading {
  flex: 1 1 300px;
}

.archive-image-manager-empty {
  min-height: 150px;
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  cursor: pointer;
  text-align: center;
}

.archive-image-manager-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}

.archive-image-manager-card {
  overflow: hidden;
  border-radius: 14px;
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.archive-image-manager-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.archive-image-manager-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.archive-image-manager-position {
  position: absolute;
  top: 7px;
  inset-inline-start: 7px;
  min-width: 22px;
  height: 22px;
  padding-inline: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  color: white;
  font-size: 10px;
}

.archive-image-manager-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
