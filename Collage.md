# Collage Module Guide

This document explains the current structure of the Collage page and where each part of the code lives after refactoring.

The main goal of this structure is to keep `app/pages/collage.vue` clean and move feature logic into focused composables, utilities, constants, and shared types.

---

## Main Page

### `app/pages/collage.vue`

This file should stay as thin as possible.

Responsibilities:

* Render the Collage page template.
* Import and call `useCollagePage`.
* Expose returned state/actions to the template.
* Avoid adding business logic directly here.

Current script should mostly look like:

```ts
<script setup lang="ts">
import { useCollagePage } from '~/composables/collage/useCollagePage'

const {
  // page state, image state, overlay state,
  // video state, render/export actions
} = useCollagePage()
</script>
```

When adding a new feature, avoid placing the logic directly in this file unless it is only template glue.

---

## Main Facade Composable

### `app/composables/collage/useCollagePage.ts`

This is the main coordinator for the Collage page.

Responsibilities:

* Creates shared page state:

  * `canvasRef`
  * `activeMode`
  * `padding`
  * `gap`
  * `backgroundColor`
* Calls and connects all collage composables:

  * `useCollageImages`
  * `useCollageOverlay`
  * `useCollageExport`
  * `useCollageVideo`
  * `useCollageRenderer`
* Handles page-level computed values:

  * `canExport`
  * `canExportImage`
  * `canExportVideo`
* Handles page-level watchers:

  * image mode render watcher
  * video mode preview watcher
  * orientation/mini rotate watcher
* Handles lifecycle:

  * adds/removes global paste event
  * cancels video preview renderer
  * clears rotate timer
  * disposes image object URLs

Edit this file when:

* A new composable needs to be connected to the collage page.
* A new page-level watcher is needed.
* A new value needs to be returned to `collage.vue`.
* A new shared state affects multiple features.
* Orientation/rotation behavior needs to change.
* The page lifecycle needs to change.

Do not put heavy rendering, layout, export, image loading, or overlay drawing logic here.

---

## Image Handling

### `app/composables/collage/useCollageImages.ts`

Handles all image input and image list state.

Responsibilities:

* `fileInputRef`
* `images`
* `isDragging`
* Open file picker.
* Handle file input.
* Add image files.
* Paste images from clipboard.
* Drag/drop images.
* Remove one image.
* Clear all images.
* Revoke object URLs on remove/clear/dispose.
* Notify the page after image changes.

Edit this file when:

* Upload behavior changes.
* Paste behavior changes.
* Drag/drop behavior changes.
* Image validation is added.
* File size/type limits are added.
* Duplicate image detection is added.
* Object URL cleanup behavior changes.

Related utility:

* `app/utils/collage/file.ts`

---

## Overlay, Watermark, QR, Text Overlay

### `app/composables/collage/useCollageOverlay.ts`

Handles all overlay-related state and canvas composition.

Responsibilities:

* Safe area state:

  * `overlaySafeAreaPreset`
  * `overlaySafeAreaOptions`
* Watermark state:

  * `watermarkPosition`
  * `watermarkSize`
  * `watermarkOpacity`
  * `watermarkPositions`
* Brand overlay state:

  * `brandOverlayTheme`
  * `telegramPostId`
  * `brandOverlayGap`
* Text overlay state:

  * `textOverlayEnabled`
  * `textOverlayText`
  * `textOverlayFontSize`
  * `textOverlayColor`
  * `textOverlayGap`
  * `textOverlayMaxWidthRatio`
  * `textOverlayFontFamily`
  * `textOverlayFontWeight`
  * `textOverlayFontValue`
  * `textOverlayFontGroups`
* Creates brand logo canvas.
* Creates QR code canvas.
* Creates text overlay canvas.
* Combines text overlay and brand overlay.
* Calculates overlay placement.
* Draws final overlay on the main canvas.

Edit this file when:

* Logo/watermark behavior changes.
* QR generation changes.
* Telegram URL normalization changes.
* Text overlay rendering changes.
* Text wrapping changes.
* Font loading changes.
* Overlay placement or safe area behavior changes.
* Overlay shadow/opacity/drawing style changes.

Related files:

* `app/constants/collage.ts`
* `app/utils/overlayPlacement.ts`
* `app/utils/collage/drawing.ts`

---

## Canvas Rendering

### `app/composables/collage/useCollageRenderer.ts`

Handles rendering into the canvas.

Responsibilities:

* `isRendering`
* `previewInfo`
* Render image collage mode.
* Render video preview mode.
* Draw empty video state.
* Start/stop/destroy `CanvasSliderRenderer`.
* Cancel outdated async video preview renders.
* Apply overlay during image render.
* Apply overlay during video preview render.
* Update preview dimensions/ratio/columns/rows.

Edit this file when:

* Canvas rendering behavior changes.
* Empty state design changes.
* Preview info calculation changes.
* Video preview renderer behavior changes.
* Render cancellation behavior changes.
* Overlay needs to be drawn differently during preview.
* Main canvas background drawing changes.
* Image cells need new drawing behavior.

Related files:

* `app/utils/collage/layout.ts`
* `app/utils/collage/drawing.ts`
* `app/utils/canvasSliderRenderer.ts`
* `app/composables/collage/useCollageOverlay.ts`

---

## Video Settings and Export

### `app/composables/collage/useCollageVideo.ts`

Handles video-specific state, duration calculation, audio, quality, WebM export, and MP4 export.

Responsibilities:

* Video dimensions:

  * `videoWidth`
  * `videoHeight`
  * `videoPreset`
* Video playback/export settings:

  * `videoFps`
  * `videoInterval`
  * `videoTransitionDuration`
  * `videoEdgeBlur`
  * `videoRandom`
  * `videoLoop`
  * `videoRepeat`
* Video export state:

  * `isRecordingVideo`
  * `isExportingMp4`
  * `mp4ExportProgress`
  * `mp4ExportStatus`
* Audio:

  * `videoAudioFile`
  * `videoAudioLabel`
  * `handleVideoAudioInput`
  * `clearVideoAudio`
* Quality:

  * `videoQualityPreset`
  * `videoQualitySettings`
* Duration/count computed values:

  * `videoImageCount`
  * `normalizedVideoRepeat`
  * `videoTotalSlideCount`
  * `videoTransitionCount`
  * `videoDurationMs`
  * `videoDurationLabel`
* Builds video sources from collage images.
* Records canvas as WebM.
* Exports MP4 using `exportCanvasSliderMp4`.
* Applies overlay during MP4 frame rendering.
* Sends final video blob to web download or native share.

Edit this file when:

* Video duration logic changes.
* Repeat/loop/random behavior changes.
* Video preset behavior changes.
* Video quality presets change.
* Audio handling changes.
* MP4 progress mapping changes.
* WebM recording behavior changes.
* MP4 export options change.
* Video export error messages change.

Related files:

* `app/utils/exportCanvasSliderMp4.ts`
* `app/utils/canvasSliderRenderer.ts`
* `app/composables/collage/useCollageExport.ts`
* `app/composables/collage/useCollageOverlay.ts`

---

## Export and Sharing

### `app/composables/collage/useCollageExport.ts`

Handles image export, copy, video blob download, and native sharing.

Responsibilities:

* Convert canvas to export blob.
* Download image as PNG on web.
* Copy image to clipboard on web.
* Save image to native gallery.
* Share image on native platform.
* Download WebM video on web.
* Share WebM video on native platform.
* Download MP4 video on web.
* Share MP4 video on native platform.

Edit this file when:

* Image export behavior changes.
* Copy-to-clipboard behavior changes.
* Download file names change.
* Native share text/title/dialog changes.
* Gallery save behavior changes.
* WebM/MP4 download behavior changes.

Related utility files:

* `app/utils/collage/file.ts`
* `app/utils/collage/nativeShare.ts`

---

## Layout Algorithm

### `app/utils/collage/layout.ts`

Pure utility for choosing the best collage layout.

Responsibilities:

* Receives:

  * images
  * padding
  * gap
  * max side
  * candidate ratios
* Calculates best layout from multiple strategies:

  * treemap layout
  * grid layout
  * side hero layout
  * split group layout
  * adaptive column layout
* Scores layouts based on:

  * crop score
  * max crop
  * area variance
  * penalties
* Returns `CollageLayoutResult`.

Main exported function:

```ts
createCollageLayout({
  images,
  padding,
  gap,
})
```

Edit this file when:

* Layout behavior changes.
* Candidate aspect ratios change at algorithm level.
* A new layout strategy is added.
* Layout scoring changes.
* Crop scoring changes.
* Padding/gap interpretation changes.
* Treemap behavior changes.
* Grid behavior changes.
* Portrait/landscape grouping changes.

Related files:

* `app/types/collage.ts`
* `app/constants/collage.ts`

Important note:

This file should stay independent from Vue refs and browser DOM APIs. It should work as a pure TypeScript utility.

---

## Drawing Utilities

### `app/utils/collage/drawing.ts`

Small canvas drawing helpers.

Responsibilities:

* Draw rounded rectangles.
* Draw images with `cover` behavior inside a rectangle.

Exports:

```ts
drawRoundedRect()
drawImageCover()
```

Edit this file when:

* Rounded rectangle drawing changes.
* Image crop/cover behavior changes.
* Shared canvas drawing helpers are added.

Used by:

* `useCollageRenderer.ts`
* `useCollageOverlay.ts`

---

## File and Blob Utilities

### `app/utils/collage/file.ts`

Generic browser file/canvas/blob helpers.

Responsibilities:

* Load uploaded image files into `CollageImageItem`.
* Convert canvas to Blob.
* Convert Blob to Data URL.
* Download Blob as a file.

Exports:

```ts
loadCollageImageFile()
canvasToBlob()
blobToDataUrl()
downloadBlob()
```

Edit this file when:

* Image file loading behavior changes.
* Object URL/image loading behavior changes.
* Canvas export type/quality handling changes.
* Generic blob download behavior changes.

Used by:

* `useCollageImages.ts`
* `useCollageExport.ts`
* `nativeShare.ts`

---

## Native Sharing Utilities

### `app/utils/collage/nativeShare.ts`

Capacitor/native platform helpers.

Responsibilities:

* Detect native platform.
* Write Blob to Capacitor cache.
* Share Blob using native share sheet.
* Create/find Prompt Draft gallery album.
* Save photo Blob to gallery.

Exports:

```ts
isNativePlatform()
writeBlobToNativeCache()
shareBlobNative()
savePhotoBlobToGalleryNative()
```

Edit this file when:

* Capacitor share behavior changes.
* Native cache writing changes.
* Native gallery save behavior changes.
* Album name/creation behavior changes.
* Native platform detection changes.

Used by:

* `useCollageExport.ts`
* `useCollageVideo.ts`

---

## Constants

### `app/constants/collage.ts`

Shared constants and UI options for the Collage feature.

Responsibilities:

* Default page values:

  * background color
  * padding
  * gap
* Canvas/layout constants:

  * max side
  * candidate ratios
* Watermark position options.
* Overlay safe area options.
* Text overlay font groups.
* Telegram channel base URL.
* Logo aspect ratio.
* Video preset options, if used by the template.

Edit this file when:

* Default background/padding/gap changes.
* Candidate aspect ratios change globally.
* Watermark position labels/options change.
* Overlay safe area options change.
* Text overlay fonts or weights change.
* Telegram channel base changes.
* Logo dimensions/aspect ratio change.
* Video preset list changes.

---

## Shared Types

### `app/types/collage.ts`

Shared TypeScript types for the Collage feature.

Responsibilities:

* Image item type.
* Layout result type.
* Watermark position type.
* Page mode type.
* Video quality preset type.
* Text overlay font types.
* Treemap helper types.
* Overlay alignment type.

Edit this file when:

* A shared Collage type is added.
* Existing Collage data shape changes.
* A composable or utility needs a shared type.
* Layout cell data changes.
* Video preset/quality type changes.
* Overlay/text/font type changes.

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
images change
  -> useCollageImages
  -> useCollagePage watcher / onChange
  -> useCollageRenderer.renderCanvas
  -> createCollageLayout
  -> draw cells
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas
```

Video preview flow:

```txt
video setting changes
  -> useCollagePage video watcher
  -> useCollageRenderer.renderVideoPreview
  -> createCanvasSliderRenderer
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas after each frame
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
  -> exportCanvasSliderMp4
  -> getVideoSources
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas on exported frames
  -> web download / native share
```

---

## Where Should I Edit?

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

---

### Change rounded corners or image crop behavior

Edit:

```txt
app/utils/collage/drawing.ts
```

---

### Change upload, paste, drag/drop, remove, clear

Edit:

```txt
app/composables/collage/useCollageImages.ts
```

---

### Change watermark logo, QR, text overlay, font, safe area

Edit:

```txt
app/composables/collage/useCollageOverlay.ts
app/constants/collage.ts
```

---

### Change image rendering or video preview rendering

Edit:

```txt
app/composables/collage/useCollageRenderer.ts
```

---

### Change video duration, loop, repeat, quality, audio, export MP4/WebM

Edit:

```txt
app/composables/collage/useCollageVideo.ts
```

---

### Change image download/copy/share behavior

Edit:

```txt
app/composables/collage/useCollageExport.ts
```

---

### Change native save/share behavior

Edit:

```txt
app/utils/collage/nativeShare.ts
```

---

### Change default options or UI select options

Edit:

```txt
app/constants/collage.ts
```

---

### Change or add shared types

Edit:

```txt
app/types/collage.ts
```

---

### Add a new Collage setting visible in the template

Usually edit in this order:

1. Add state to the relevant composable.
2. Return the state/action from that composable.
3. Return it from `useCollagePage.ts`.
4. Destructure it in `app/pages/collage.vue`.
5. Use it in the template.
6. Add it to the correct watcher in `useCollagePage.ts` if it should trigger render.

---

## Watcher Notes

The main watchers live in:

```txt
app/composables/collage/useCollagePage.ts
```

Image-mode watcher should include any setting that changes the final image render.

Video-mode watcher should include any setting that changes video preview.

If a new setting affects both image and video, add it to both watchers.

If a new setting only affects export and not preview, it may not need a watcher.

Examples:

* Text overlay font size affects image and video preview.
* MP4 CRF affects export only, not preview.
* Background color affects image and video preview.
* Audio file affects MP4 export only, not canvas preview.
* Safe area currently affects video overlay behavior.

---

## Important Development Rules

1. Keep `app/pages/collage.vue` thin.
2. Do not put feature logic directly in the page.
3. Put pure calculations in `utils`.
4. Put Vue stateful logic in `composables`.
5. Put repeated static options in `constants`.
6. Put shared data shapes in `types`.
7. If a value changes the canvas output, make sure it is watched in `useCollagePage.ts`.
8. If a composable creates object URLs, it must also clean them up.
9. If an async render can become outdated, use a token/cancel pattern like video preview does.
10. Native-specific code should stay inside `nativeShare.ts` or a native-specific helper, not inside the page.

---

## Refactor Status

The Collage page has been split into:

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

app/constants/collage.ts
app/types/collage.ts
```

After this refactor, most future Collage development should happen outside `collage.vue`.
