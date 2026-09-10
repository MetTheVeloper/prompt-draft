<script setup lang="ts">
import type { BlogMediaAsset, BlogMediaFolder } from '~/types/blogMedia'
import {
  prepareArchiveImage,
  validateArchiveImageFile,
} from '~/utils/imageProcessing'
import { blobToBase64 } from '~/utils/blobBase64'

const props = withDefaults(defineProps<{
  initialAsset?: BlogMediaAsset | null
  onConfirm?: (asset: BlogMediaAsset) => void | Promise<void>
}>(), {
  initialAsset: null,
  onConfirm: undefined,
})

const modal = useModal()
const api = useBlogMediaApi()
const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const prefix = ref('')
const parentPrefix = ref<string | null>(null)
const folders = ref<BlogMediaFolder[]>([])
const assets = ref<BlogMediaAsset[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const uploading = ref(false)
const error = ref('')
const selected = ref<BlogMediaAsset | null>(props.initialAsset)
const pendingFile = ref<File | null>(null)
const pendingAlt = ref('')
const pendingPreviewUrl = ref('')
const pendingError = ref('')

const currentFolder = computed(() => prefix.value || t('manage.blog.media.root'))

async function loadFolder(nextPrefix: string, options: { append?: boolean } = {}) {
  const append = Boolean(options.append)
  if (append && (!nextCursor.value || loadingMore.value)) return

  error.value = ''
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const response = await api.browse(
      nextPrefix,
      append ? nextCursor.value : null,
    )
    prefix.value = response.prefix
    parentPrefix.value = response.parentPrefix
    folders.value = append
      ? [...folders.value, ...response.folders.filter(folder => !folders.value.some(item => item.prefix === folder.prefix))]
      : response.folders
    assets.value = append
      ? [...assets.value, ...response.assets.filter(asset => !assets.value.some(item => item.id === asset.id))]
      : response.assets
    hasMore.value = response.pageInfo.hasMore
    nextCursor.value = response.pageInfo.nextCursor
  } catch (browseError) {
    console.error('[Prompt Draft] Blog media browse failed', browseError)
    error.value = t('manage.blog.media.browseError')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function openFilePicker() {
  if (!uploading.value) fileInput.value?.click()
}

function clearPendingUpload() {
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
  pendingFile.value = null
  pendingAlt.value = ''
  pendingPreviewUrl.value = ''
  pendingError.value = ''
}

function stageUpload(file: File) {
  const validation = validateArchiveImageFile(file)
  if (!validation.valid) {
    error.value = t('manage.blog.media.unsupported')
    return
  }

  clearPendingUpload()
  error.value = ''
  pendingFile.value = file
  pendingPreviewUrl.value = URL.createObjectURL(file)
}

async function uploadPendingFile() {
  const file = pendingFile.value
  if (!file || uploading.value) return

  const alt = pendingAlt.value.trim()
  if (!alt) {
    pendingError.value = t('manage.blog.media.uploadAltRequired')
    return
  }

  uploading.value = true
  error.value = ''
  pendingError.value = ''
  try {
    const prepared = await prepareArchiveImage(file)
    const [fullBase64, thumbnailBase64] = await Promise.all([
      blobToBase64(prepared.fullBlob),
      blobToBase64(prepared.thumbnailBlob),
    ])
    const response = await api.upload({
      sourceName: file.name,
      alt,
      full: {
        base64: fullBase64,
        width: prepared.fullWidth,
        height: prepared.fullHeight,
        sizeBytes: prepared.fullSize,
      },
      thumbnail: {
        base64: thumbnailBase64,
        width: prepared.thumbnailWidth,
        height: prepared.thumbnailHeight,
        sizeBytes: prepared.thumbnailSize,
      },
    })

    clearPendingUpload()
    await loadFolder(response.asset.folder)
    selected.value = response.asset
  } catch (uploadError) {
    console.error('[Prompt Draft] Blog media upload failed', uploadError)
    pendingError.value = t('manage.blog.media.uploadError')
  } finally {
    uploading.value = false
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  input.value = ''
  if (file) stageUpload(file)
}

function toggleAsset(asset: BlogMediaAsset) {
  selected.value = selected.value?.id === asset.id ? null : asset
}

async function confirmSelection() {
  if (!selected.value) {
    error.value = t('manage.blog.media.noSelection')
    return
  }

  const asset = selected.value
  // Close the Gallery layer before invoking context-specific callbacks. The
  // Markdown workflow may immediately open an alt-text modal on the same stack.
  modal.close()
  await nextTick()
  await props.onConfirm?.(asset)
}

onMounted(() => {
  void loadFolder('')
})

onBeforeUnmount(() => {
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
})
</script>

<template>
  <el-flex rules="csc" :gap="14" class="w100">
    <input
      ref="fileInput"
      class="dsn"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      @change="handleFileChange"
    >

    <el-flex rules="rbc" :gap="10" class="w100 fw">
      <el-flex rules="ccs" :gap="3">
        <el-text color="normal55" :size="10" :weight="700">
          {{ t('manage.blog.media.currentFolder') }}
        </el-text>
        <el-text :size="12" :weight="700" font="monospace">
          {{ currentFolder }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="8" class="fw">
        <el-button
          v-if="parentPrefix !== null"
          icon="arrow_upward"
          :label="t('manage.blog.media.up')"
          mode="flat"
          :disable="loading || uploading"
          @click="loadFolder(parentPrefix || '')"
        />
        <el-button
          icon="upload"
          :label="uploading ? t('manage.blog.media.uploading') : t('manage.blog.media.upload')"
          color="prim"
          :disable="loading || uploading"
          @click="openFilePicker"
        />
      </el-flex>
    </el-flex>

    <el-divider />

    <el-flex v-if="error" rules="rsc" :gap="8" :p="10" bg="red10" :radius="10" class="w100">
      <el-icon icon="warning" color="red" :size="17" />
      <el-text color="red" :size="11">{{ error }}</el-text>
    </el-flex>

    <el-grid
      v-if="pendingFile"
      cols="180px minmax(0, 1fr)"
      :gap="12"
      align-items="start"
      class="w100 blog-media-upload-stage"
    >
      <img
        :src="pendingPreviewUrl"
        :alt="pendingAlt || pendingFile.name"
        class="blog-media-upload-preview"
      >
      <el-flex rules="css" :gap="8" class="w100">
        <el-text :size="11" :weight="800">{{ pendingFile.name }}</el-text>
        <el-text color="normal55" :size="10">
          {{ t('manage.blog.media.uploadAltHint') }}
        </el-text>
        <el-text-field
          v-model="pendingAlt"
          :actions="false"
          :placeholder="t('manage.blog.media.uploadAltPlaceholder')"
          @input="pendingError = ''"
        />
        <el-text v-if="pendingError" color="red" :size="10">
          {{ pendingError }}
        </el-text>
        <el-flex rules="rsc" :gap="8" class="w100 fw">
          <el-button
            :label="t('manage.blog.actions.cancel')"
            mode="flat"
            :disable="uploading"
            @click="clearPendingUpload"
          />
          <el-button
            icon="upload"
            :label="uploading ? t('manage.blog.media.uploading') : t('manage.blog.media.confirmUpload')"
            color="prim"
            :disable="uploading || !pendingAlt.trim()"
            @click="uploadPendingFile"
          />
        </el-flex>
      </el-flex>
    </el-grid>

    <el-grid
      v-if="folders.length"
      cols="repeat(auto-fill, minmax(150px, 1fr))"
      :gap="8"
      class="w100"
    >
      <el-button
        v-for="folder in folders"
        :key="folder.prefix"
        icon="folder"
        :label="folder.name"
        :mode="undefined"
        color="background"
        text-color="normal"
        icon-color="normal50"
        rules="rsc"
        class="w100"
        :disable="loading || uploading"
        @click="loadFolder(folder.prefix)"
      />
    </el-grid>

    <el-flex rules="css" :gap="8" class="w100">
      <el-text color="normal55" :size="10" :weight="800">
        {{ t('manage.blog.media.assets') }}
      </el-text>

      <el-flex v-if="loading" rules="ccc" :p="28" class="w100">
        <el-text color="normal55">{{ t('manage.blog.loading') }}</el-text>
      </el-flex>

      <el-grid
        v-else-if="assets.length"
        cols="repeat(auto-fill, minmax(170px, 1fr))"
        :gap="10"
        class="w100"
      >
        <el-flex
          v-for="asset in assets"
          :key="asset.id"
          rules="csc"
          :gap="0"
          :br="1"
          :bc="selected?.id === asset.id ? 'prim' : 'normal15'"
          :radius="12"
          class="w100 ofh crp"
          role="button"
          tabindex="0"
          @click="toggleAsset(asset)"
          @keydown.enter.prevent="toggleAsset(asset)"
          @keydown.space.prevent="toggleAsset(asset)"
        >
          <img
            :src="asset.thumbnailUrl"
            :alt="asset.alt || asset.sourceName"
            class="blog-media-gallery-thumb"
            loading="lazy"
          >
          <el-flex rules="ccs" :gap="3" :p="9" class="w100">
            <el-text :size="10" :weight="700" class="w100">
              {{ asset.sourceName }}
            </el-text>
            <el-text color="normal50" :size="9">
              {{ asset.width }} × {{ asset.height }}
            </el-text>
            <el-text v-if="asset.alt" color="normal50" :size="9" class="w100">
              {{ asset.alt }}
            </el-text>
            <el-text v-if="selected?.id === asset.id" color="prim" :size="9" :weight="800" icon="check_circle">
              {{ t('manage.blog.media.selected') }}
            </el-text>
          </el-flex>
        </el-flex>
      </el-grid>

      <el-flex v-else rules="ccc" :gap="6" :p="28" bg="normal5" :radius="12" class="w100">
        <el-icon icon="photo_library" :size="26" />
        <el-text color="normal55" :size="11">{{ t('manage.blog.media.empty') }}</el-text>
      </el-flex>

      <el-button
        v-if="hasMore"
        icon="expand_more"
        :label="t('manage.blog.media.loadMore')"
        mode="flat"
        :disable="loadingMore || uploading"
        @click="loadFolder(prefix, { append: true })"
      />
    </el-flex>

    <el-divider />

    <el-flex rules="rbc" :gap="8" class="w100">
      <el-button
        :label="t('manage.blog.actions.cancel')"
        mode="flat"
        @click="modal.close()"
      />
      <el-button
        icon="check"
        :label="t('manage.blog.media.confirm')"
        color="prim"
        :disable="!selected || uploading"
        @click="confirmSelection"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.blog-media-gallery-thumb,
.blog-media-upload-preview {
  display: block;
  width: 100%;
  object-fit: cover;
  background: var(--normalText5);
}

.blog-media-gallery-thumb {
  aspect-ratio: 4 / 3;
}

.blog-media-upload-preview {
  max-height: 180px;
  border-radius: 12px;
}

@media (max-width: 720px) {
  .blog-media-upload-stage {
    grid-template-columns: 1fr !important;
  }
}
</style>
