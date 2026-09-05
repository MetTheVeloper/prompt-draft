<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { UserDraftPreviewImage } from "~/types/userProfileApi";
import {
  DRAFT_PREVIEW_IMAGE_MAX_COUNT,
  prepareDraftPreviewImage,
} from "~/utils/draftPreviewImage";

const props = withDefaults(
  defineProps<{
    draftId: string;
    title: string;
    images?: UserDraftPreviewImage[];
    onImagesChange?: (images: UserDraftPreviewImage[]) => void;
  }>(),
  {
    images: () => [],
  },
);

const { t } = useI18n();
const { mobile, tablet, mini } = useScreen();
const api = useUserProfileApi();
const modal = useModal();

const fileInput = ref<HTMLInputElement | null>(null);
const images = ref<UserDraftPreviewImage[]>([...props.images]);
const busy = ref(false);
const deletingImageId = ref<string | null>(null);
const errorMessage = ref("");

const primaryImageId = computed(() => images.value[0]?.id ?? null);
const columns = computed(() => {
  if (mobile.value) return 1;
  if (tablet.value || mini.value) return 2;
  return 3;
});
const canAdd = computed(() => {
  return images.value.length < DRAFT_PREVIEW_IMAGE_MAX_COUNT && !busy.value;
});

watch(
  () => props.images,
  (value) => {
    if (!busy.value) images.value = [...value];
  },
  { deep: true },
);

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : fallback;
}

function commitImages(nextImages: UserDraftPreviewImage[]) {
  images.value = [...nextImages];
  props.onImagesChange?.([...nextImages]);
}

function openPicker() {
  if (!canAdd.value) return;
  errorMessage.value = "";
  if (fileInput.value) fileInput.value.value = "";
  fileInput.value?.click();
}

async function handleFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";

  if (!files.length || busy.value) return;

  const remaining = DRAFT_PREVIEW_IMAGE_MAX_COUNT - images.value.length;
  if (files.length > remaining) {
    errorMessage.value = t("userProfile.drafts.media.errors.limit", {
      max: DRAFT_PREVIEW_IMAGE_MAX_COUNT,
    });
    return;
  }

  busy.value = true;
  errorMessage.value = "";
  let fallback = t("userProfile.drafts.media.errors.prepare");

  try {
    for (const file of files) {
      fallback = t("userProfile.drafts.media.errors.prepare");
      const prepared = await prepareDraftPreviewImage(file);
      fallback = t("userProfile.drafts.media.errors.upload");
      const response = await api.addDraftImage(props.draftId, prepared.blob);
      commitImages(response.images);
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, fallback);
  } finally {
    busy.value = false;
  }
}

async function selectPrimary(image: UserDraftPreviewImage) {
  if (busy.value || image.id === primaryImageId.value) return;

  busy.value = true;
  errorMessage.value = "";

  try {
    const response = await api.makeDraftImagePrimary(props.draftId, image.id);
    commitImages(response.images);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      t("userProfile.drafts.media.errors.primary"),
    );
  } finally {
    busy.value = false;
  }
}

function confirmDeleteImage(image: UserDraftPreviewImage) {
  const confirmationId = modal.open({
    header: {
      icon: "delete",
      title: t("userProfile.drafts.media.deleteTitle"),
      subtitle: props.title,
      color: "red",
      closeButton: true,
    },
    descriptions: [t("userProfile.drafts.media.deleteDescription")],
    actions: [
      {
        label: t("userProfile.drafts.actions.cancel"),
        color: "normal",
        mode: "flat",
      },
      {
        label: t("userProfile.drafts.media.deleteAction"),
        icon: "delete",
        color: "red",
        mode: "flat",
        close: false,
        disable: () => Boolean(deletingImageId.value),
        handler: async () => {
          if (deletingImageId.value) return false;

          deletingImageId.value = image.id;
          errorMessage.value = "";

          try {
            const response = await api.removeDraftImage(props.draftId, image.id);
            commitImages(response.images);
            modal.close(confirmationId);
          } catch (error) {
            errorMessage.value = getApiErrorMessage(
              error,
              t("userProfile.drafts.media.errors.remove"),
            );
          } finally {
            deletingImageId.value = null;
          }

          return false;
        },
      },
    ],
    options: {
      width: 460,
    },
  });
}
</script>

<template>
  <el-flex rules="ccs" class="draft-preview-manager w100" :gap="14">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      multiple
      class="draft-preview-manager__input"
      @change="handleFilesSelected"
    >

    <el-flex rules="rbc" class="w100" :gap="10" wrap>
      <el-flex rules="ccs" :gap="2" class="fg100">
        <el-text :size="12" :weight="700">
          {{ t("userProfile.drafts.media.manageHint") }}
        </el-text>
        <el-text :size="10" color="normal50">
          {{ t("userProfile.drafts.media.count", {
            count: images.length,
            max: DRAFT_PREVIEW_IMAGE_MAX_COUNT,
          }) }}
        </el-text>
      </el-flex>

      <el-button
        icon="add_photo_alternate"
        color="blue"
        mode="flat"
        :label="t('userProfile.drafts.media.add')"
        :disable="!canAdd"
        @click="openPicker"
      />
    </el-flex>

    <el-text
      v-if="errorMessage"
      :size="11"
      color="red"
      class="w100">
      {{ errorMessage }}
    </el-text>

    <el-grid v-if="images.length" :cols="columns" :gap="12" class="w100">
      <el-flex
        v-for="image in images"
        :key="image.id"
        type="button"
        rules="ccs"
        class="draft-preview-manager__item w100 por"
        :gap="0"
        :radius="14"
        :br="2"
        :bc="image.id === primaryImageId ? 'prim' : 'normal15'"
        :disable="busy"
        @click="selectPrimary(image)">
        <img
          :src="image.url"
          :alt="title"
          class="draft-preview-manager__image"
          loading="lazy"
          decoding="async"
          draggable="false"
        >

        <el-text
          v-if="image.id === primaryImageId"
          class="draft-preview-manager__primary"
          :size="9"
          :weight="800"
          marker="blue"
          color="white"
          :p="[4, 7]"
          :radius="100">
          {{ t("userProfile.drafts.media.primary") }}
        </el-text>

        <el-button
          class="draft-preview-manager__delete"
          type="fab"
          icon="delete"
          color="red"
          mode="flat"
          :size="10"
          :p="7"
          :tooltip="t('userProfile.drafts.media.deleteAction')"
          :disable="busy || Boolean(deletingImageId)"
          @click.stop="confirmDeleteImage(image)"
        />
      </el-flex>
    </el-grid>

    <button
      v-else
      type="button"
      class="draft-preview-manager__empty w100"
      :disabled="!canAdd"
      @click="openPicker">
      <el-icon icon="wallpaper" color="normal45" :size="34" />
      <el-text :size="12" :weight="700">
        {{ t("userProfile.drafts.media.empty") }}
      </el-text>
      <el-text :size="10" color="normal50">
        {{ t("userProfile.drafts.media.manageHint") }}
      </el-text>
    </button>
  </el-flex>
</template>

<style scoped>
.draft-preview-manager {
  min-width: 0;
}

.draft-preview-manager__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.draft-preview-manager__item {
  aspect-ratio: 16 / 10;
  padding: 0 !important;
  overflow: hidden;
  background: var(--normalText5);
  cursor: pointer;
  transition: border-color 180ms ease, transform 180ms ease;
}

.draft-preview-manager__item:hover {
  transform: translateY(-2px);
}

.draft-preview-manager__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
}

.draft-preview-manager__primary,
.draft-preview-manager__delete {
  position: absolute;
  z-index: 2;
  inset-block-start: 8px;
}

.draft-preview-manager__primary {
  inset-inline-start: 8px;
}

.draft-preview-manager__delete {
  inset-inline-end: 8px;
}

.draft-preview-manager__empty {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  border: 1px dashed var(--normalText15);
  border-radius: 16px;
  color: inherit;
  background: var(--normalText5);
  appearance: none;
  cursor: pointer;
}

.draft-preview-manager__empty:hover {
  border-color: var(--normalText50);
}
</style>
