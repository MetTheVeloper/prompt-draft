<script setup lang="ts">
import type { PreparedManagedImage } from "~/types/managedImage";
import {
  managedImageExtensionForMime,
  prepareManagedImage,
  validateManagedImageFile,
} from "~/utils/managedImageProcessing";

type ManagedImageUploaderLabels = {
  title: string;
  rules: string;
  add: string;
  clear: string;
  empty: string;
  pasteHint: string;
  processing: string;
  failed: string;
  thumbnail: string;
  readyCount: (ready: number, total: number) => string;
  processingCount: (count: number) => string;
  errorHint: string;
  invalidFiles: (count: number) => string;
  limitExceeded: (max: number) => string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: PreparedManagedImage[];
    disabled?: boolean;
    maxImages?: number;
    showThumbnailDetails?: boolean;
    labels: ManagedImageUploaderLabels;
  }>(),
  {
    modelValue: () => [],
    disabled: false,
    maxImages: 100,
    showThumbnailDetails: true,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: PreparedManagedImage[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const notice = ref("");
const ownedUrls = new Set<string>();

const items = computed(() => props.modelValue ?? []);
const processingCount = computed(() => items.value.filter(item => item.status === "processing").length);
const readyCount = computed(() => items.value.filter(item => item.status === "ready").length);
const hasErrors = computed(() => items.value.some(item => item.status === "error"));
const atLimit = computed(() => items.value.length >= props.maxImages);

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

function revokeItemUrls(item: PreparedManagedImage) {
  revokeUrl(item.previewUrl);
  revokeUrl(item.thumbnailPreviewUrl);
}

function normalizePositions(value: PreparedManagedImage[]) {
  return value.map((item, index) => ({ ...item, position: index }));
}

function updateItems(value: PreparedManagedImage[]) {
  emit("update:modelValue", normalizePositions(value));
}

async function updateItemsAndFlush(value: PreparedManagedImage[]) {
  updateItems(value);
  await nextTick();
}

function openFilePicker() {
  if (!props.disabled && !atLimit.value) fileInput.value?.click();
}

function makeClipboardFile(source: File, index: number) {
  const extension = managedImageExtensionForMime(source.type);
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
  notice.value = "";

  const accepted: File[] = [];
  let rejected = 0;

  for (const file of files) {
    if (validateManagedImageFile(file).valid) accepted.push(file);
    else rejected += 1;
  }

  if (rejected) notice.value = props.labels.invalidFiles(rejected);

  const remaining = Math.max(0, props.maxImages - items.value.length);
  if (accepted.length > remaining) {
    notice.value = props.labels.limitExceeded(props.maxImages);
  }

  for (const file of accepted.slice(0, remaining)) {
    const sourcePreview = ownUrl(file);
    const item: PreparedManagedImage = {
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

    await updateItemsAndFlush([...items.value, item]);

    try {
      const output = await prepareManagedImage(file);
      const current = items.value.find(candidate => candidate.id === item.id);
      if (!current) {
        revokeUrl(sourcePreview);
        continue;
      }

      revokeUrl(sourcePreview);
      const fullPreview = ownUrl(output.fullBlob);
      const thumbnailPreview = ownUrl(output.thumbnailBlob);

      await updateItemsAndFlush(items.value.map(candidate => (
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
      console.error("[ManagedImageUploader] image preparation failed", error);
      await updateItemsAndFlush(items.value.map(candidate => (
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
  notice.value = "";
}

function clearAll() {
  items.value.forEach(revokeItemUrls);
  updateItems([]);
  notice.value = "";
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

watch(
  items,
  currentItems => {
    const activeUrls = new Set(
      currentItems.flatMap(item => [item.previewUrl, item.thumbnailPreviewUrl]).filter(Boolean),
    );
    for (const url of [...ownedUrls]) {
      if (!activeUrls.has(url)) revokeUrl(url);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  for (const url of ownedUrls) URL.revokeObjectURL(url);
  ownedUrls.clear();
});
</script>

<template>
  <div
    class="managed-image-uploader"
    :class="{ 'is-dragging': isDragging, 'is-disabled': disabled }"
    tabindex="0"
    @paste="handlePaste"
    @dragenter.prevent="isDragging = !disabled && !atLimit"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      class="managed-image-uploader-input"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      :multiple="maxImages > 1"
      :disabled="disabled || atLimit"
      @change="handleInputChange"
    >

    <el-flex rules="rsc" :gap="10" class="w100 fw">
      <el-flex rules="ccs" :gap="4" class="managed-image-uploader-heading">
        <el-text :size="14" :weight="700" icon="photo_library" marker="blue40">
          {{ labels.title }}
        </el-text>
        <el-text :size="11" color="normal60">{{ labels.rules }}</el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="8" class="fw">
        <el-button
          icon="add_photo_alternate"
          color="prim"
          mode="flat"
          :label="labels.add"
          :disable="disabled || atLimit"
          :size="11"
          :p="[8, 10]"
          @click="openFilePicker"
        />
        <el-button
          v-if="items.length"
          icon="delete_sweep"
          color="red"
          mode="flat"
          :label="labels.clear"
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
      class="managed-image-uploader-empty w100"
      @click="openFilePicker"
    >
      <el-icon icon="add_photo_alternate" :size="30" />
      <el-text :size="13" :weight="600">{{ labels.empty }}</el-text>
      <el-text :size="11" color="normal60">{{ labels.pasteHint }}</el-text>
    </el-flex>

    <div v-else class="managed-image-uploader-grid">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="managed-image-uploader-card"
      >
        <div class="managed-image-uploader-preview">
          <img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.sourceName">
          <el-flex v-else rules="ccc" class="w100 h100">
            <el-icon icon="image" :size="28" />
          </el-flex>

          <el-flex class="managed-image-uploader-position" rules="rcc">
            {{ index + 1 }}
          </el-flex>
        </div>

        <el-flex rules="ccs" :gap="5" :p="10" class="w100">
          <el-text :size="11" :weight="600" class="managed-image-uploader-name">
            {{ item.sourceName }}
          </el-text>

          <el-text v-if="item.status === 'processing'" :size="10" color="normal60" icon="progress_activity">
            {{ labels.processing }}
          </el-text>
          <el-text v-else-if="item.status === 'error'" :size="10" color="red" icon="error">
            {{ labels.failed }}
          </el-text>
          <template v-else>
            <el-text :size="9" color="normal55">
              {{ item.fullWidth }}×{{ item.fullHeight }} · {{ formatBytes(item.fullSize) }}
            </el-text>
            <el-text v-if="showThumbnailDetails" :size="9" color="normal55">
              {{ labels.thumbnail }}: {{ item.thumbnailWidth }}×{{ item.thumbnailHeight }} · {{ formatBytes(item.thumbnailSize) }}
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

    <el-text v-if="notice" :size="10" color="orange">{{ notice }}</el-text>

    <el-flex v-if="items.length" rules="rsc" :gap="12" class="w100 fw">
      <el-text :size="10" color="normal60">
        {{ labels.readyCount(readyCount, items.length) }}
      </el-text>
      <el-text v-if="processingCount" :size="10" color="normal60">
        {{ labels.processingCount(processingCount) }}
      </el-text>
      <el-text v-if="hasErrors" :size="10" color="red">
        {{ labels.errorHint }}
      </el-text>
    </el-flex>
  </div>
</template>

<style scoped>
.managed-image-uploader {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  outline: none;
}

.managed-image-uploader.is-dragging {
  outline: 1px dashed currentColor;
  outline-offset: 6px;
  border-radius: 18px;
}

.managed-image-uploader.is-disabled {
  opacity: 0.65;
}

.managed-image-uploader-input {
  display: none;
}

.managed-image-uploader-heading {
  flex: 1 1 300px;
}

.managed-image-uploader-empty {
  min-height: 150px;
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  cursor: pointer;
  text-align: center;
}

.managed-image-uploader-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}

.managed-image-uploader-card {
  overflow: hidden;
  border-radius: 14px;
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.managed-image-uploader-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.managed-image-uploader-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.managed-image-uploader-position {
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

.managed-image-uploader-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
