<script setup lang="ts">
import ManagedImageUploader from "~/components/manage/ManagedImageUploader.vue";
import type { PreparedArchiveImage } from "~/types/archiveImage";
import {
  MANAGED_IMAGE_FULL_MAX_EDGE,
  MANAGED_IMAGE_FULL_WEBP_QUALITY,
  MANAGED_IMAGE_THUMBNAIL_MAX_EDGE,
} from "~/utils/managedImageProcessing";

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

const { t } = useI18n();

const labels = computed(() => ({
  title: t("manage.archive.images.title"),
  rules: t("manage.archive.images.rules", {
    fullEdge: MANAGED_IMAGE_FULL_MAX_EDGE,
    thumbnailEdge: MANAGED_IMAGE_THUMBNAIL_MAX_EDGE,
    quality: Math.round(MANAGED_IMAGE_FULL_WEBP_QUALITY * 100),
  }),
  add: t("manage.archive.images.add"),
  clear: t("manage.archive.images.clear"),
  empty: t("manage.archive.images.empty"),
  pasteHint: t("manage.archive.images.pasteHint"),
  processing: t("manage.archive.images.processing"),
  failed: t("manage.archive.images.failed"),
  thumbnail: t("manage.archive.images.thumbnail"),
  readyCount: (ready: number, total: number) => t("manage.archive.images.readyCount", { ready, total }),
  processingCount: (count: number) => t("manage.archive.images.processingCount", { count }),
  errorHint: t("manage.archive.images.errorHint"),
  invalidFiles: (count: number) => t("manage.archive.images.unsupportedMessage", { count }),
  limitExceeded: (max: number) => `Archive items support up to ${max} prepared images.`,
}));
</script>

<template>
  <ManagedImageUploader
    :model-value="props.modelValue"
    :disabled="props.disabled"
    :max-images="100"
    :labels="labels"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
