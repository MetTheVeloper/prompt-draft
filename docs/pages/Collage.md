# Collage Page Guide

This document describes the current Collage page implementation, its layout shell, control panel structure, and the surrounding composables/utilities that own the actual feature logic.

The Collage page is no longer only a very thin template wrapper. Heavy feature logic still belongs outside `app/pages/collage.vue`, but the page now intentionally owns a larger amount of UI glue:

- page-level layout shell
- control-panel layout attribute presets
- accordion panel state
- dropdown value adapters
- template-only option lists
- workspace header / canvas viewport controls
- action button placement

The main development rule is still the same: rendering, export, image loading, overlay composition, video encoding, native sharing, and layout algorithms should stay in composables and utilities. `collage.vue` should only coordinate those features visually and expose their controls.

---

## Main Page

### `app/pages/collage.vue`

Current responsibilities:

- Import and call `useCollagePage`.
- Destructure page state, image state, overlay state, video state, render state, zoom state, and export actions.
- Define template-only option arrays for dropdowns.
- Define reusable attribute objects for repeated `el-grid` and `el-flex` layouts.
- Manage accordion state for the Collage control panel.
- Provide small adapter functions for `el-dropdown` model updates.
- Render the page shell:
  - mobile rotate guard
  - side control panel
  - preview/workspace area
  - canvas wrapper
  - floating canvas tools/actions
- Keep all labels localized through `pages.collage.*` translation keys.

Current import/entry shape:

```ts
<script setup lang="ts">
import { useCollagePage } from '~/composables/collage/useCollagePage'
import type { ElDropdownValue } from '~/types/dropdown'

const { locale } = useI18n()

const {
  // orientation / responsive state
  // canvas refs and zoom state
  // image settings
  // layout controls
  // overlay controls
  // video controls
  // renderer state
  // export actions
} = useCollagePage()
</script>
```

Important current note: `locale` is imported in the page, but this file does not manually reorder the side panel based on locale. Left/right placement is expected to come from the app/design-system direction behavior, not from explicit locale logic inside `collage.vue`.

---

## Page Layout Structure

The template has four main regions.

```txt
collage.vue
├─ portrait + mini rotate guard
├─ root el-grid / main page shell
│  ├─ aside control panel
│  ├─ main workspace
│  │  ├─ preview header
│  │  └─ canvas wrapper
│  └─ floating canvas options/actions
```

### Rotate Guard

When the device is both `portrait` and `mini`, the page shows the rotate-your-phone state instead of the main layout.

State used:

```ts
orientation
mini
```

Translation key:

```txt
pages.collage.rotateYourPhone
```

### Root Grid

The main page shell is an `el-grid` with `type="main"`, full width/height, hidden overflow, and drag/drop handlers.

Attribute source:

```ts
const collagePageGridAttrs = computed(() => ({
  p: 24,
  cols: [unref(mini) ? '260px' : '360px', 'minmax(0, 1fr)', 'auto'],
  gap: 8,
}))
```

The root grid receives these upload handlers:

```ts
@drop="handleDrop"
@dragover="handleDragOver"
@dragleave="handleDragLeave"
```

Edit this area when the overall page shell, sidebar width, workspace column, or action column changes.

---

## Centralized UI Attribute Presets

The current `collage.vue` centralizes repeated layout attributes into script-level objects, then applies them with `v-bind`.

Current presets:

```ts
collagePageGridAttrs
collageSidebarAttrs
collageSidebarHeadAttrs
collageDropzoneAttrs
collagePanelAttrs
collagePanelHeaderAttrs
collagePanelBodyAttrs
collageFieldAttrs
collageCheckboxFieldAttrs
collageImageItemAttrs
collageToolBoxAttrs
collageImageActionsAttrs
collageVideoActionsAttrs
```

Purpose:

- make layout experiments faster
- keep repeated `el-grid` / `el-flex` props consistent
- reduce noisy template-level attributes
- make the control panel easier to restyle from one place

When adding repeated layout patterns, create a new preset instead of copying the same props across the template.

Example pattern:

```ts
const collageFieldAttrs = {
  type: 'label',
  rules: 'ccs',
  gap: 8,
} as const
```

Usage:

```vue
<el-flex v-bind="collageFieldAttrs" class="collage-field">
  ...
</el-flex>
```

---

## Label Field Convention

The current page does not use native `<label>` tags for settings rows. Repeated setting rows use `el-flex` with `type: 'label'` through `collageFieldAttrs` or `collageCheckboxFieldAttrs`.

Use this pattern for normal fields:

```vue
<el-flex v-bind="collageFieldAttrs" class="collage-field">
  <el-text type="span" :size="12" color="normal70">
    {{ $t('...') }}
  </el-text>

  <!-- input / dropdown / textarea -->
</el-flex>
```

Use this pattern for checkbox rows:

```vue
<el-flex v-bind="collageCheckboxFieldAttrs" class="collage-checkbox-field">
  <input v-model="someFlag" type="checkbox" />

  <el-text type="span" :size="12" color="normal70">
    {{ $t('...') }}
  </el-text>
</el-flex>
```

Avoid adding raw `<label>` tags unless the design-system convention changes.

---

## Control Panel Accordion

Panel expansion state is controlled locally in `collage.vue`.

Current panel key type:

```ts
type CollagePanelKey = 'images' | 'outputMode' | 'brand' | 'canvas' | 'video'
```

Current default state:

```ts
const expandedPanels = reactive<Record<CollagePanelKey, boolean>>({
  images: false,
  outputMode: true,
  brand: false,
  canvas: false,
  video: false,
})
```

Helpers:

```ts
function isPanelExpanded(panel: CollagePanelKey) {
  return expandedPanels[panel]
}

function togglePanel(panel: CollagePanelKey) {
  expandedPanels[panel] = !expandedPanels[panel]
}

function getPanelToggleSymbol(panel: CollagePanelKey) {
  return isPanelExpanded(panel) ? 'minus' : 'add'
}
```

Accordion header behavior:

- `role="button"`
- `tabindex="0"`
- `:aria-expanded="isPanelExpanded(panelKey)"`
- click toggles the panel
- `Enter` toggles the panel
- `Space` toggles the panel

Current header pattern:

```vue
<el-flex
  v-bind="collagePanelHeaderAttrs"
  class="collage-panel__head"
  role="button"
  tabindex="0"
  :aria-expanded="isPanelExpanded('brand')"
  @click="togglePanel('brand')"
  @keydown.enter.prevent="togglePanel('brand')"
  @keydown.space.prevent="togglePanel('brand')"
>
  <el-text :size="14" weight="700" icon="drop">
    {{ $t('pages.collage.brand.title') }}
  </el-text>

  <el-icon :icon="getPanelToggleSymbol('brand')" :size="20" color="normal55" />
</el-flex>
```

Panel body pattern:

```vue
<el-grid v-show="isPanelExpanded('brand')" v-bind="collagePanelBodyAttrs">
  ...
</el-grid>
```

Current special case: the output mode panel is sticky and currently has its visible header disabled with `v-if="false"`, while `outputMode` defaults to expanded. This makes it behave more like a persistent mode selector than a normal collapsible group. To make it behave like the other panels, show the header and set `outputMode: false` in `expandedPanels`.

---

## Current Control Panel Groups

### 1. Output Mode Panel

Key:

```ts
outputMode
```

Current behavior:

- sticky at the top of the sidebar
- uses `collagePanelAttrs`
- header exists in code but is disabled with `v-if="false"`
- body is visible because `outputMode` defaults to `true`

Main state:

```ts
activeMode
```

Options:

```ts
const collageModeOptions = ['image', 'video']
```

Translations:

```txt
pages.collage.outputMode.title
pages.collage.outputMode.mode
pages.collage.outputMode.modes.image
pages.collage.outputMode.modes.video
```

### 2. Dropzone

The dropzone is outside the accordion panels and opens the hidden file input.

State/actions:

```ts
fileInputRef
isDragging
openFilePicker
handleFileInput
handleDrop
handleDragOver
handleDragLeave
```

Attribute source:

```ts
collageDropzoneAttrs
```

Translations:

```txt
pages.collage.dropzone.title
pages.collage.dropzone.description
```

### 3. Images Panel

Key:

```ts
images
```

Main behavior:

- shows current image count in the header
- renders image thumbnails when images exist
- shows empty text when no images exist
- remove button is centered over each image thumbnail

State/actions:

```ts
images
removeImage
```

Attribute sources:

```ts
collagePanelAttrs
collagePanelHeaderAttrs
collagePanelBodyAttrs
collageImageItemAttrs
```

Translations:

```txt
pages.collage.images.title
pages.collage.images.empty
pages.collage.actions.remove
```

### 4. Brand / Overlay Panel

Key:

```ts
brand
```

This panel combines text overlay, Telegram/QR/brand overlay, watermark placement, and safe-area controls.

Main state/actions:

```ts
textOverlayEnabled
textOverlayText
textOverlayFontSize
textOverlayColor
textOverlayGap
textOverlayMaxWidthRatio
textOverlayFontFamily
textOverlayFontWeight
textOverlayFontValue
textOverlayFontGroups
handleTextOverlayFontChange
getTextOverlayFontOptionValue

brandOverlayTheme
telegramPostId
brandOverlayGap
watermarkPosition
watermarkSize
watermarkOpacity
watermarkPositions

overlaySafeAreaPreset
overlaySafeAreaOptions
handleOverlaySafeAreaChange
```

Template-only options/adapters:

```ts
brandOverlayThemeOptions
textOverlayFontDropdownOptions
updateTextOverlayFontDropdown
updateBrandOverlayTheme
updateWatermarkPosition
updateOverlaySafeAreaPreset
```

Important implementation note: `textOverlayFontDropdownOptions` flattens grouped font options and preserves group metadata for `el-dropdown`.

Translations include:

```txt
pages.collage.brand.title
pages.collage.textOverlay.enabled
pages.collage.textOverlay.font
pages.collage.textOverlay.text
pages.collage.textOverlay.placeholder
pages.collage.textOverlay.size
pages.collage.textOverlay.color
pages.collage.textOverlay.gap
pages.collage.brand.telegramPostId
pages.collage.brand.telegramPostIdPlaceholder
pages.collage.brand.logoColor
pages.collage.brand.logoThemes.white
pages.collage.brand.logoThemes.black
pages.collage.brand.position
pages.collage.brand.positions.*
pages.collage.safeArea.title
pages.collage.brand.height
pages.collage.brand.opacity
pages.collage.brand.gap
pages.collage.brand.help
```

### 5. Canvas / Image Settings Panel

Key:

```ts
canvas
```

Visible only when:

```vue
v-if="activeMode === 'image'"
```

Main state/actions:

```ts
padding
gap
imageExportQuality
backgroundColor
layoutConstraintMode
canvasAspectRatioLock
shuffleSimilarImages
shuffleLayout
setLayoutConstraintMode
setCanvasAspectRatioLock
```

Template-only options/adapters:

```ts
layoutConstraintModeOptions
canvasAspectRatioLockOptions
updateLayoutConstraintMode
updateCanvasAspectRatioLock
```

Canvas ratio options currently exposed in the page:

```ts
const canvasAspectRatioLockOptions = [
  { value: 'auto', labelKey: 'pages.collage.layoutTools.canvasRatios.auto' },
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '2:1', label: '2:1' },
  { value: '3:2', label: '3:2' },
  { value: '3:1', label: '3:1' },
  { value: '3:7', label: '3:7' },
]
```

Export quality range:

```txt
30 → 100
```

Translations include:

```txt
pages.collage.canvas.title
pages.collage.canvas.padding
pages.collage.canvas.gap
pages.collage.canvas.exportQuality
pages.collage.canvas.backgroundColor
pages.collage.layoutTools.title
pages.collage.layoutTools.shuffleSimilar
pages.collage.layoutTools.shuffleLayout
pages.collage.layoutTools.constraintMode
pages.collage.layoutTools.constraintModes.controlled
pages.collage.layoutTools.constraintModes.free
pages.collage.layoutTools.canvasRatio
pages.collage.layoutTools.canvasRatios.auto
```

### 6. Video Settings Panel

Key:

```ts
video
```

Visible only when:

```vue
v-if="activeMode === 'video'"
```

Main state/actions:

```ts
videoWidth
videoHeight
videoFps
videoInterval
videoTransitionDuration
videoEdgeBlur
videoRandom
videoPreset
videoLoop
videoRepeat

isRecordingVideo
isExportingMp4
mp4ExportProgress
mp4ExportStatus

videoAudioFile
videoAudioLabel
videoQualityPreset
videoQualitySettings
videoMusicVisualizationEnabled
videoMusicVisualizationMaxHeightPercent

videoImageCount
normalizedVideoRepeat
videoTotalSlideCount
videoTransitionCount
videoDurationMs
videoDurationLabel

handleVideoAudioInput
clearVideoAudio
applyVideoPreset
handleVideoPresetChange
```

Template-only options/adapters:

```ts
videoQualityPresetOptions
videoPresetOptions
updateVideoQualityPreset
updateVideoPreset
```

Current presets:

```ts
const videoPresetOptions = [
  { value: '1080x1920', labelKey: 'pages.collage.video.presets.storyReel' },
  { value: '1080x1350', labelKey: 'pages.collage.video.presets.portraitPost' },
  { value: '1080x1080', labelKey: 'pages.collage.video.presets.squarePost' },
  { value: '1920x1080', labelKey: 'pages.collage.video.presets.landscape' },
]
```

Important UI rules:

- audio upload appears in video mode
- selected audio label is shown when `videoAudioFile` exists
- soft-wave visualization checkbox appears only when audio exists
- soft-wave height slider appears only when audio exists and visualization is enabled
- random order is disabled when `videoLoop` is enabled or repeat is greater than `1`

Translations include:

```txt
pages.collage.video.title
pages.collage.video.quality
pages.collage.video.qualityPresets.compact
pages.collage.video.qualityPresets.balanced
pages.collage.video.qualityPresets.high
pages.collage.video.backgroundMusic
pages.collage.video.removeAudio
pages.collage.video.musicVisualizationSoftWave
pages.collage.video.musicVisualizationHeight
pages.collage.video.preset
pages.collage.video.presets.storyReel
pages.collage.video.presets.portraitPost
pages.collage.video.presets.squarePost
pages.collage.video.presets.landscape
pages.collage.video.width
pages.collage.video.height
pages.collage.video.calculatedDuration
pages.collage.video.durationMeta
pages.collage.video.loop
pages.collage.video.repeat
pages.collage.video.fps
pages.collage.video.imageInterval
pages.collage.video.transition
pages.collage.video.edgeBlur
pages.collage.video.randomOrder
pages.collage.video.randomOrderDisabled
```

---

## Sidebar Action Bars

The sidebar renders action buttons below the control panels.

Image mode action grid:

```ts
collageImageActionsAttrs
```

Actions:

```ts
downloadCanvas
copyCanvas
clearImages
```

Video mode action grid:

```ts
collageVideoActionsAttrs
```

Actions:

```ts
exportSliderMp4
clearImages
```

`exportSliderVideo` / WebM UI still exists but is currently disabled with `v-if="false"`.

Translations:

```txt
pages.collage.actions.save
pages.collage.actions.copy
pages.collage.actions.clear
pages.collage.actions.exportWebm
pages.collage.actions.exportMp4
pages.collage.actions.exportingMp4
pages.collage.actions.recording
```

---

## Workspace and Canvas Area

The workspace is the main preview area next to the sidebar.

Structure:

```txt
collage-workspace
├─ collage-preview-head
└─ collage-canvas-wrap
   └─ canvas
```

### Preview Header

The preview header shows:

- current output dimensions from `previewInfo`
- image grid metadata in image mode
- video metadata in video mode
- selected cell name when an image cell is selected
- rendering status
- recording status
- MP4 export progress/status

State used:

```ts
previewInfo
activeMode
selectedImageCell
isRendering
isRecordingVideo
isExportingMp4
mp4ExportProgress
mp4ExportStatus
videoWidth
videoHeight
videoDurationLabel
videoFps
normalizedVideoRepeat
videoLoop
```

Translations:

```txt
pages.collage.preview.grid
pages.collage.preview.videoMeta
pages.collage.preview.loopSuffix
pages.collage.preview.selectedCell
pages.collage.preview.rendering
pages.collage.preview.recordingVideo
```

### Canvas Wrapper

The canvas wrapper owns the visible canvas viewport and pointer interactions.

Refs/state/actions:

```ts
canvasWrapRef
canvasRef
canvasDisplayStyle
handleCanvasPointerDown
handleCanvasPointerMove
handleCanvasPointerUp
handleCanvasContextMenu
```

The wrapper has a checkerboard background and scrollable overflow. The canvas uses `canvasDisplayStyle`, which comes from `useCollagePage` and is controlled by the zoom state.

### Floating Canvas Options

The third root-grid column renders canvas controls:

- fit zoom
- actual-size zoom
- vertical zoom range
- current zoom percentage
- duplicate image/video actions for quick access

Zoom state/actions:

```ts
canvasZoom
canvasZoomMin
canvasZoomMax
setCanvasZoom
setCanvasActualSize
fitCanvasToWrap
```

Translations:

```txt
pages.collage.zoom.fit
pages.collage.zoom.actual
```

---

## Dropdown Adapter Pattern

The page uses `el-dropdown`, whose emitted model value type is `ElDropdownValue`. Small adapter helpers convert this value into the string/event shapes expected by the existing state handlers.

Helpers:

```ts
function getDropdownString(value: ElDropdownValue, fallback = '') {
  return String(value || fallback)
}

function createDropdownChangeEvent(value: ElDropdownValue) {
  return {
    target: {
      value: getDropdownString(value),
    },
  } as unknown as Event
}
```

Direct value setters:

```ts
updateActiveMode
updateBrandOverlayTheme
updateWatermarkPosition
updateVideoQualityPreset
updateLayoutConstraintMode
updateCanvasAspectRatioLock
```

Event-shape adapters:

```ts
updateTextOverlayFontDropdown
updateOverlaySafeAreaPreset
updateVideoPreset
```

Use this pattern when a composable still expects a native `Event` but the UI control is an `el-dropdown`.

---

## Main Facade Composable

### `app/composables/collage/useCollagePage.ts`

This is the main coordinator for the Collage page.

Responsibilities:

- create shared page state
- connect all Collage composables
- expose state/actions needed by `collage.vue`
- handle page-level computed values
- handle render watchers
- handle responsive/orientation behavior
- handle lifecycle cleanup
- expose canvas zoom and display style state
- expose selected image-cell pointer handlers
- expose layout control state/actions

Current state groups returned to the page include:

```txt
orientation / mini
canvas refs
mode state
image render settings
layout constraint controls
selected cell pointer controls
export capability flags
image input/list controls
overlay / safe-area controls
watermark / brand controls
text overlay controls
video settings/export controls
renderer state
canvas viewport / zoom controls
export actions
```

Edit this file when:

- a new composable needs to be connected
- a new setting must be returned to `collage.vue`
- a new setting needs a render watcher
- a setting affects both image and video preview
- orientation / mini behavior changes
- canvas zoom/display behavior changes
- selected-cell interaction changes
- lifecycle cleanup changes

Do not put heavy rendering, layout algorithm, export encoding, image decoding, native sharing, or overlay drawing logic here.

---

## Image Handling

### `app/composables/collage/useCollageImages.ts`

Handles image input and image list state.

Responsibilities:

- `fileInputRef`
- `images`
- `isDragging`
- open file picker
- handle file input
- add image files
- paste images from clipboard
- drag/drop images
- remove one image
- clear all images
- revoke object URLs on remove/clear/dispose
- notify the page after image changes

Edit this file when:

- upload behavior changes
- paste behavior changes
- drag/drop behavior changes
- image validation is added
- file size/type limits are added
- duplicate image detection is added
- object URL cleanup behavior changes

Related utility:

```txt
app/utils/collage/file.ts
```

---

## Overlay, Watermark, QR, and Text Overlay

### `app/composables/collage/useCollageOverlay.ts`

Handles overlay-related state and canvas composition.

Responsibilities:

- safe area state/options
- watermark position/size/opacity/options
- brand overlay theme, Telegram post id, brand gap
- text overlay state
- text overlay font groups/value handling
- brand logo canvas creation
- QR canvas creation
- text overlay canvas creation
- combined overlay canvas creation
- overlay placement calculation
- final overlay drawing on the main canvas

Edit this file when:

- logo/watermark behavior changes
- QR generation changes
- Telegram URL normalization changes
- text overlay rendering changes
- text wrapping changes
- font loading changes
- overlay placement/safe-area behavior changes
- overlay shadow/opacity/drawing style changes

Related files:

```txt
app/constants/collage.ts
app/utils/overlayPlacement.ts
app/utils/collage/drawing.ts
```

---

## Canvas Rendering

### `app/composables/collage/useCollageRenderer.ts`

Handles rendering into the visible canvas.

Responsibilities:

- `isRendering`
- `previewInfo`
- render image collage mode
- render video preview mode
- draw empty video state
- start/stop/destroy `CanvasSliderRenderer`
- cancel outdated async video preview renders
- apply overlay during image render
- apply overlay during video preview render
- update preview dimensions/ratio/columns/rows

Edit this file when:

- canvas rendering behavior changes
- empty state design changes
- preview info calculation changes
- video preview renderer behavior changes
- render cancellation behavior changes
- overlay drawing changes during preview
- main canvas background drawing changes
- image cell drawing behavior changes

Related files:

```txt
app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/utils/canvasSliderRenderer.ts
app/composables/collage/useCollageOverlay.ts
```

---

## Layout Algorithm

### `app/utils/collage/layout.ts`

Pure utility for choosing the best collage layout.

Responsibilities:

- receive images, padding, gap, max side, and candidate ratios
- calculate candidate layouts
- support multiple layout strategies
- score layouts based on crop, max crop, area variance, and penalties
- return `CollageLayoutResult`

Current related page controls:

```ts
layoutConstraintMode
canvasAspectRatioLock
shuffleSimilarImages
shuffleLayout
selectedImageCell
```

Main exported function:

```ts
createCollageLayout({
  images,
  padding,
  gap,
})
```

Edit this file when:

- layout behavior changes
- candidate aspect ratios change at algorithm level
- a new layout strategy is added
- layout scoring changes
- crop scoring changes
- padding/gap interpretation changes
- treemap behavior changes
- grid behavior changes
- portrait/landscape grouping changes

Important rule: this file should remain independent from Vue refs and browser DOM APIs.

Related files:

```txt
app/types/collage.ts
app/constants/collage.ts
```

---

## Video Settings and Export

### `app/composables/collage/useCollageVideo.ts`

Handles video-specific state, duration calculation, audio, quality, WebM export, and MP4 export.

Responsibilities:

- video dimensions and presets
- FPS, interval, transition, edge blur, random order, loop, repeat
- video quality presets/settings
- recording/export state
- MP4 progress/status
- audio input and clearing
- audio duration detection
- random audio start offset when source audio is longer than output video
- soft-wave music visualization state
- video duration/count computed values
- source generation from Collage images
- WebM recording
- MP4 export through `exportCanvasSliderMp4`
- overlay application during MP4 frame rendering
- final web download or native share

Edit this file when:

- video duration logic changes
- repeat/loop/random behavior changes
- video preset behavior changes
- video quality presets change
- audio handling changes
- random audio start behavior changes
- music visualization UI/export state changes
- MP4 progress mapping changes
- WebM recording behavior changes
- MP4 export options change
- video export error messages change

Related files:

```txt
app/utils/exportCanvasSliderMp4.ts
app/utils/canvasSliderRenderer.ts
app/composables/collage/useCollageExport.ts
app/composables/collage/useCollageOverlay.ts
```

---

## MP4 Export, Audio Mixing, and Music Visualization

### `app/utils/exportCanvasSliderMp4.ts`

This utility renders the final MP4 frame-by-frame and handles ffmpeg-based video/audio muxing.

Responsibilities:

- create the offscreen export canvas
- create and drive `CanvasSliderRenderer` for MP4 frames
- encode rendered frames for ffmpeg
- add optional audio to the exported MP4
- loop audio when the audio is shorter than the video
- start audio from a randomized offset when `audioStartOffsetMs` is provided
- apply default audio fade-in/fade-out
- decode selected audio with `AudioContext` when visualization is enabled
- calculate loudness/RMS for the current exported frame time
- smooth loudness so wave motion is not harsh
- draw soft-wave visualization during MP4 export
- report MP4 export progress
- return the final MP4 `Blob`

Current music visualization behavior:

- export-only, not live-preview unless preview support is added separately
- uses decoded audio loudness to drive wave height/movement
- controlled by `videoMusicVisualizationEnabled`
- height controlled by `videoMusicVisualizationMaxHeightPercent`
- current UI range is `0` to `50`
- visualizer is edge-aware and currently supports top/bottom waves
- brand and text overlays should be drawn above the wave

Important MP4 frame layer order:

```txt
1. Canvas slider frame / main visual content
2. Soft-wave music visualization, top and bottom
3. Brand overlay and text overlay
```

Edit this file when:

- MP4 frame rendering behavior changes
- ffmpeg input/output arguments change
- audio fade/loop/muxing/random start behavior changes
- music visualization shape, opacity, height, speed, loudness mapping, or placement changes
- MP4 encoder options, progress mapping, or output codec settings change

Related files:

```txt
app/composables/collage/useCollageVideo.ts
app/utils/canvasSliderRenderer.ts
app/composables/collage/useCollageOverlay.ts
```

---

## Export and Sharing

### `app/composables/collage/useCollageExport.ts`

Handles image export, copy, video blob download, and native sharing.

Responsibilities:

- convert canvas to export blob
- download image on web
- copy image to clipboard on web
- save image to native gallery
- share image on native platform
- download WebM video on web
- share WebM video on native platform
- download MP4 video on web
- share MP4 video on native platform

Edit this file when:

- image export behavior changes
- copy-to-clipboard behavior changes
- download file names change
- native share text/title/dialog changes
- gallery save behavior changes
- WebM/MP4 download behavior changes

Related utility files:

```txt
app/utils/collage/file.ts
app/utils/collage/nativeShare.ts
```

---

## Drawing Utilities

### `app/utils/collage/drawing.ts`

Small canvas drawing helpers.

Responsibilities:

- draw rounded rectangles
- draw images with `cover` behavior inside a rectangle

Exports:

```ts
drawRoundedRect()
drawImageCover()
```

Edit this file when:

- rounded rectangle drawing changes
- image crop/cover behavior changes
- shared canvas drawing helpers are added

Used by:

```txt
useCollageRenderer.ts
useCollageOverlay.ts
```

---

## File and Blob Utilities

### `app/utils/collage/file.ts`

Generic browser file/canvas/blob helpers.

Responsibilities:

- load uploaded image files into `CollageImageItem`
- convert canvas to Blob
- convert Blob to Data URL
- download Blob as a file

Exports:

```ts
loadCollageImageFile()
canvasToBlob()
blobToDataUrl()
downloadBlob()
```

Edit this file when:

- image file loading behavior changes
- object URL/image loading behavior changes
- canvas export type/quality handling changes
- generic blob download behavior changes

Used by:

```txt
useCollageImages.ts
useCollageExport.ts
nativeShare.ts
```

---

## Native Sharing Utilities

### `app/utils/collage/nativeShare.ts`

Capacitor/native platform helpers.

Responsibilities:

- detect native platform
- write Blob to Capacitor cache
- share Blob using native share sheet
- create/find Prompt Draft gallery album
- save photo Blob to gallery

Exports:

```ts
isNativePlatform()
writeBlobToNativeCache()
shareBlobNative()
savePhotoBlobToGalleryNative()
```

Edit this file when:

- Capacitor share behavior changes
- native cache writing changes
- native gallery save behavior changes
- album name/creation behavior changes
- native platform detection changes

Used by:

```txt
useCollageExport.ts
useCollageVideo.ts
```

---

## Constants

### `app/constants/collage.ts`

Shared constants and UI options for the Collage feature.

Responsibilities:

- default page values
- canvas/layout constants
- candidate ratios
- watermark position options
- overlay safe area options
- text overlay font groups
- Telegram channel base URL
- logo aspect ratio
- any shared video preset data, if moved out of the page

Current note: several UI-only option lists still live in `collage.vue`, including mode options, brand theme options, quality preset options, layout constraint options, canvas ratio lock options, and video preset options. Move them to `app/constants/collage.ts` only when they become shared or too noisy for the page.

Edit constants when:

- default background/padding/gap changes
- candidate aspect ratios change globally
- watermark position labels/options change
- overlay safe area options change
- text overlay fonts or weights change
- Telegram channel base changes
- logo dimensions/aspect ratio change
- shared video preset list changes

---

## Shared Types

### `app/types/collage.ts`

Shared TypeScript types for the Collage feature.

Responsibilities:

- image item type
- layout result type
- watermark position type
- page mode type
- video quality preset type
- text overlay font types
- treemap helper types
- overlay alignment type
- layout constraint / canvas ratio lock types, if shared outside page/composable
- selected image-cell type, if shared outside renderer/page

Edit this file when:

- a shared Collage type is added
- existing Collage data shape changes
- a composable or utility needs a shared type
- layout cell data changes
- video preset/quality type changes
- overlay/text/font type changes

---

## Current Data Flow

High-level flow:

```txt
collage.vue
  -> useCollagePage
    -> useCollageImages
    -> useCollageOverlay
    -> useCollageExport
    -> useCollageVideo
    -> useCollageRenderer
      -> createCollageLayout
      -> drawImageCover / drawRoundedRect
```

Image render flow:

```txt
images/settings change
  -> useCollageImages / useCollagePage state
  -> useCollagePage watcher or render trigger
  -> useCollageRenderer.renderCanvas
  -> createCollageLayout
  -> draw cells
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas
  -> update previewInfo
```

Image layout interaction flow:

```txt
canvas pointer event
  -> handleCanvasPointerDown / Move / Up / ContextMenu
  -> selectedImageCell state
  -> layout/image-cell operation in page/composable layer
  -> render update
```

Video preview flow:

```txt
video setting changes
  -> useCollagePage video watcher
  -> useCollageRenderer.renderVideoPreview
  -> createCanvasSliderRenderer
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas after each frame
  -> update previewInfo
```

Image export flow:

```txt
download/copy button
  -> useCollageExport
  -> canvasToBlob
  -> web download / clipboard
  -> or native gallery/share
```

MP4 export flow:

```txt
export MP4 button
  -> useCollageVideo.exportSliderMp4
  -> calculate random audioStartOffsetMs if audio is longer than video
  -> exportCanvasSliderMp4
  -> getVideoSources
  -> create offscreen export canvas
  -> create CanvasSliderRenderer
  -> draw slider frame
  -> decode audio for visualization when enabled
  -> draw top/bottom soft-wave music visualization when enabled
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas on exported frames
  -> encode frames
  -> mux audio with loop/random start/fade
  -> web download / native share
```

---

## Watcher Notes

The main watchers should live in:

```txt
app/composables/collage/useCollagePage.ts
```

Image-mode watcher should include any setting that changes the final image render.

Video-mode watcher should include any setting that changes video preview.

If a new setting affects both image and video, add it to both watchers.

If a new setting only affects export and not preview, it may not need a watcher.

Examples:

- text overlay font size affects image and video preview
- background color affects image and video preview
- padding/gap affects image render
- layout constraint mode affects image render
- canvas aspect ratio lock affects image render
- image export quality affects export only, not preview
- MP4 quality preset affects export only, not preview
- audio file affects MP4 export only, not canvas preview
- soft-wave music visualization affects MP4 export only, not canvas preview
- soft-wave height affects MP4 export only, not canvas preview
- safe area affects overlay placement behavior

---

## Current Audio and Music Visualization Notes

Audio and soft-wave visualization are currently part of MP4 export, not live preview.

Current intended behavior:

- selecting an audio file enables audio-dependent video export features
- clearing the audio file disables audio-dependent visualization state
- if the audio is longer than the generated video, `useCollageVideo.ts` can choose a random audio start offset
- if the audio is shorter than the generated video, the MP4 exporter loops the audio input
- audio fade-in/fade-out is applied by the MP4 exporter
- the soft-wave visualizer is only rendered during MP4 export
- the soft-wave visualizer uses decoded audio loudness to drive wave height and movement
- wave height is controlled by `videoMusicVisualizationMaxHeightPercent`
- the UI height slider currently ranges from `0` to `50`
- brand and text overlays should be drawn after the wave so they remain above it

Related translation keys:

```txt
pages.collage.video.musicVisualizationSoftWave
pages.collage.video.musicVisualizationHeight
```

---

## Where Should I Edit?

### Change the control-panel visual layout

Edit:

```txt
app/pages/collage.vue
```

Focus areas:

```txt
collageSidebarAttrs
collagePanelAttrs
collagePanelHeaderAttrs
collagePanelBodyAttrs
collageFieldAttrs
collageCheckboxFieldAttrs
collageToolBoxAttrs
```

### Add a new accordion panel

Edit:

```txt
app/pages/collage.vue
```

Steps:

1. Add a key to `CollagePanelKey`.
2. Add its default state to `expandedPanels`.
3. Add a panel header using `collagePanelHeaderAttrs`.
4. Add keyboard handlers for click/Enter/Space.
5. Add a body with `v-show="isPanelExpanded('newKey')"`.
6. Use `el-flex` with `type="label"` / preset bindings for fields.
7. Add translation keys under `pages.collage.*`.

### Change page shell, sidebar width, or action-column layout

Edit:

```txt
app/pages/collage.vue
```

Focus area:

```txt
collagePageGridAttrs
collageSidebarAttrs
collageImageActionsAttrs
collageVideoActionsAttrs
collage-canvas-options styles
```

### Change zoom / viewport behavior

Usually edit:

```txt
app/composables/collage/useCollagePage.ts
```

Also check:

```txt
app/pages/collage.vue
```

### Change collage layout behavior

Edit:

```txt
app/utils/collage/layout.ts
```

Optional:

```txt
app/constants/collage.ts
app/types/collage.ts
```

### Change layout tools UI only

Edit:

```txt
app/pages/collage.vue
```

For state/render behavior, also edit:

```txt
app/composables/collage/useCollagePage.ts
app/utils/collage/layout.ts
```

### Change rounded corners or image crop behavior

Edit:

```txt
app/utils/collage/drawing.ts
```

### Change upload, paste, drag/drop, remove, or clear behavior

Edit:

```txt
app/composables/collage/useCollageImages.ts
```

### Change watermark logo, QR, text overlay, font, or safe area

Edit:

```txt
app/composables/collage/useCollageOverlay.ts
app/constants/collage.ts
```

Also edit `collage.vue` when adding/changing visible controls.

### Change image rendering or video preview rendering

Edit:

```txt
app/composables/collage/useCollageRenderer.ts
```

### Change video duration, loop, repeat, quality, audio, MP4/WebM export

Edit:

```txt
app/composables/collage/useCollageVideo.ts
```

Also edit `collage.vue` when adding/changing visible video controls.

### Change MP4 encoder, audio muxing, random audio start, audio fade, or music visualization drawing

Edit:

```txt
app/utils/exportCanvasSliderMp4.ts
```

Optional if UI state or export options also change:

```txt
app/composables/collage/useCollageVideo.ts
app/composables/collage/useCollagePage.ts
app/pages/collage.vue
```

### Change image download/copy/share behavior

Edit:

```txt
app/composables/collage/useCollageExport.ts
```

### Change native save/share behavior

Edit:

```txt
app/utils/collage/nativeShare.ts
```

### Change default options or shared select options

Edit:

```txt
app/constants/collage.ts
```

For page-local options that are not shared yet, edit:

```txt
app/pages/collage.vue
```

### Change or add shared types

Edit:

```txt
app/types/collage.ts
```

---

## Adding a New Collage Setting

Use this order:

1. Decide ownership:
   - rendering/layout/export behavior belongs in a composable or utility
   - visual-only panel layout belongs in `collage.vue`
2. Add state to the relevant composable.
3. Return the state/action from that composable.
4. Return it from `useCollagePage.ts`.
5. Destructure it in `app/pages/collage.vue`.
6. Add UI inside the correct accordion panel.
7. Use centralized attribute presets for repeated fields.
8. Add translation keys under `pages.collage.*`.
9. Add the setting to the correct watcher if it changes preview/output.
10. Add or update shared types/constants if the value is reused outside the page.

---

## Development Rules

1. Keep heavy feature logic outside `app/pages/collage.vue`.
2. Keep presentational layout experiments centralized in page-level attribute presets.
3. Use `el-flex` with `type="label"` for setting rows instead of raw `<label>` tags.
4. Add accordion panels through `CollagePanelKey` and `expandedPanels`.
5. Preserve keyboard accessibility for collapsible panel headers.
6. Put pure calculations in `utils`.
7. Put Vue stateful feature logic in `composables`.
8. Put repeated shared static options in `constants`.
9. Put shared data shapes in `types`.
10. If a value changes canvas output, make sure it is watched in `useCollagePage.ts`.
11. If a composable creates object URLs, it must also clean them up.
12. If an async render can become outdated, use a token/cancel pattern.
13. Native-specific code should stay inside `nativeShare.ts` or a native-specific helper.
14. Keep translation keys stable and scoped under `pages.collage.*`.
15. Do not rely on hardcoded visual text in the template unless it is a developer shortcut note.

---

## Current Refactor Status

The Collage feature is currently split across:

```txt
app/pages/collage.vue

app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageImages.ts
app/composables/collage/useCollageOverlay.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageVideo.ts
app/composables/collage/useCollageExport.ts

app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/utils/collage/file.ts
app/utils/collage/nativeShare.ts
app/utils/canvasSliderRenderer.ts
app/utils/exportCanvasSliderMp4.ts

app/constants/collage.ts
app/types/collage.ts
```

Current page-specific additions in `collage.vue`:

```txt
centralized layout attrs
accordion panel state
mode/theme/quality/preset options
dropdown adapters
control-panel template
workspace header template
floating zoom/action controls
```

Most future feature development should still happen outside `collage.vue`; most future control-panel layout experiments can happen inside `collage.vue` by changing the centralized attribute presets and panel template structure.
