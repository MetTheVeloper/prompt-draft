<script setup lang="ts">
import type { ImageVectorizerBackgroundPick } from '~/types/imageVectorizer'

const props = withDefaults(
  defineProps<{
    sourceUrl?: string
    sourceName?: string
    rasterUrl?: string
    svgUrl?: string
    loading?: boolean
    pickingBackground?: boolean
    backgroundColor?: string | null
  }>(),
  {
    sourceUrl: '',
    sourceName: '',
    rasterUrl: '',
    svgUrl: '',
    loading: false,
    pickingBackground: false,
    backgroundColor: null,
  },
)

const emit = defineEmits<{
  (event: 'pick-background', value: ImageVectorizerBackgroundPick): void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const sourceCanvas = ref<HTMLCanvasElement | null>(null)
const sourceLoadError = ref(false)

const previewCols = computed(() => mobile.value ? 1 : 3)

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}

async function drawSource() {
  sourceLoadError.value = false

  const canvas = sourceCanvas.value

  if (!canvas || !props.sourceUrl) return

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Could not load source preview.'))
      element.src = props.sourceUrl
    })

    const maxEdge = 2048
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    if (!context) throw new Error('Canvas 2D context is unavailable.')

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  } catch (error) {
    console.error('[ImageVectorizerPreview] Failed to draw source:', error)
    sourceLoadError.value = true
  }
}

function handleSourceClick(event: MouseEvent) {
  if (!props.pickingBackground) return

  const canvas = sourceCanvas.value
  const context = canvas?.getContext('2d', {
    willReadFrequently: true,
  })

  if (!canvas || !context) return

  const bounds = canvas.getBoundingClientRect()
  const x = Math.max(
    0,
    Math.min(
      canvas.width - 1,
      Math.floor((event.clientX - bounds.left) * (canvas.width / bounds.width)),
    ),
  )
  const y = Math.max(
    0,
    Math.min(
      canvas.height - 1,
      Math.floor((event.clientY - bounds.top) * (canvas.height / bounds.height)),
    ),
  )
  const pixel = context.getImageData(x, y, 1, 1).data
  const color = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`

  emit('pick-background', {
    color,
    x,
    y,
  })
}

watch(
  () => props.sourceUrl,
  () => nextTick(drawSource),
  { immediate: true },
)

onMounted(drawSource)
</script>

<template>
  <el-grid :cols="previewCols" :gap="12" class="image-vectorizer-preview">
    <el-flex rules="csc" :gap="8" bg="normal5" :p="12" :radius="18" class="image-vectorizer-preview-card">
      <el-flex rules="rbc" :gap="8" class="w100">
        <el-text :size="12" :weight="500" icon="image" marker="blue40">
          {{ t('tools.imageVectorizer.preview.original') }}
        </el-text>

        <el-flex v-if="backgroundColor" rules="rsc" :gap="6">
          <span
            class="image-vectorizer-preview-swatch"
            :style="{ backgroundColor }"
          />
          <el-text :size="10" :weight="300" color="normal60">
            {{ backgroundColor.toUpperCase() }}
          </el-text>
        </el-flex>
      </el-flex>

      <div
        class="image-vectorizer-preview-stage checkerboard"
        :class="{ 'is-picking': pickingBackground }"
      >
        <canvas
          v-show="sourceUrl && !sourceLoadError"
          ref="sourceCanvas"
          class="image-vectorizer-preview-canvas"
          :aria-label="sourceName || t('tools.imageVectorizer.preview.original')"
          @click="handleSourceClick"
        />

        <el-flex v-if="!sourceUrl || sourceLoadError" rules="ccc" :gap="6" class="image-vectorizer-preview-empty">
          <el-icon icon="gallery" :size="26" color="normal50" />
          <el-text :size="11" :weight="300" color="normal60">
            {{ t('tools.imageVectorizer.preview.empty') }}
          </el-text>
        </el-flex>

        <el-flex
          v-if="pickingBackground && sourceUrl"
          rules="ccc"
          :gap="4"
          class="image-vectorizer-preview-picker-hint"
          bg="surface90"
          :p="8"
          :radius="12"
        >
          <el-text :size="10" :weight="500" icon="color-swatch">
            {{ t('tools.imageVectorizer.preview.pickHint') }}
          </el-text>
        </el-flex>
      </div>
    </el-flex>

    <el-flex rules="csc" :gap="8" bg="normal5" :p="12" :radius="18" class="image-vectorizer-preview-card">
      <el-text :size="12" :weight="500" icon="magic-star" marker="blue40">
        {{ t('tools.imageVectorizer.preview.quantized') }}
      </el-text>

      <div class="image-vectorizer-preview-stage checkerboard">
        <img
          v-if="rasterUrl"
          :src="rasterUrl"
          :alt="t('tools.imageVectorizer.preview.quantized')"
          class="image-vectorizer-preview-image"
        />

        <el-flex v-else rules="ccc" :gap="6" class="image-vectorizer-preview-empty">
          <el-icon :icon="loading ? 'refresh-circle' : 'image'" :size="26" color="normal50" />
          <el-text :size="11" :weight="300" color="normal60">
            {{ loading ? t('tools.imageVectorizer.status.processing') : t('tools.imageVectorizer.preview.pending') }}
          </el-text>
        </el-flex>
      </div>
    </el-flex>

    <el-flex rules="csc" :gap="8" bg="normal5" :p="12" :radius="18" class="image-vectorizer-preview-card">
      <el-text :size="12" :weight="500" icon="shapes" marker="blue40">
        {{ t('tools.imageVectorizer.preview.vector') }}
      </el-text>

      <div class="image-vectorizer-preview-stage checkerboard">
        <img
          v-if="svgUrl"
          :src="svgUrl"
          :alt="t('tools.imageVectorizer.preview.vector')"
          class="image-vectorizer-preview-image"
        />

        <el-flex v-else rules="ccc" :gap="6" class="image-vectorizer-preview-empty">
          <el-icon :icon="loading ? 'refresh-circle' : 'shapes'" :size="26" color="normal50" />
          <el-text :size="11" :weight="300" color="normal60">
            {{ loading ? t('tools.imageVectorizer.status.processing') : t('tools.imageVectorizer.preview.pending') }}
          </el-text>
        </el-flex>
      </div>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.image-vectorizer-preview {
  width: 100%;
}

.image-vectorizer-preview-card {
  width: 100%;
  min-width: 0;
}

.image-vectorizer-preview-stage {
  position: relative;
  width: 100%;
  min-height: 220px;
  max-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.checkerboard {
  background-color: color-mix(in srgb, currentColor 3%, transparent);
  background-image:
    linear-gradient(45deg, color-mix(in srgb, currentColor 7%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in srgb, currentColor 7%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in srgb, currentColor 7%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in srgb, currentColor 7%, transparent) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
}

.image-vectorizer-preview-stage.is-picking {
  cursor: crosshair;
  outline: 2px dashed color-mix(in srgb, currentColor 35%, transparent);
  outline-offset: -6px;
}

.image-vectorizer-preview-canvas,
.image-vectorizer-preview-image {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: contain;
}

.image-vectorizer-preview-canvas {
  height: auto;
}

.image-vectorizer-preview-empty {
  min-height: 220px;
  width: 100%;
  text-align: center;
}

.image-vectorizer-preview-picker-hint {
  position: absolute;
  inset-inline: 12px;
  bottom: 12px;
  pointer-events: none;
  text-align: center;
  box-shadow: 0 10px 35px rgb(0 0 0 / 20%);
}

.image-vectorizer-preview-swatch {
  width: 18px;
  height: 18px;
  display: inline-block;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
}
</style>
