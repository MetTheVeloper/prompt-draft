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
* Render template-only controls such as audio picker, soft-wave checkbox, and soft-wave height range.
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

When adding a new feature, avoid placing the logic directly in this file unless it is only template glue. For example, adding the music visualization checkbox or height range belongs here, but audio decoding, wave drawing, and MP4 composition do not.

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
* Returns video export-only settings from `useCollageVideo`, including soft-wave music visualization state.

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
  * `getAudioDurationMs` helper for metadata-based audio duration detection
  * `getRandomAudioStartOffsetMs` helper for randomizing the audio start point
* Music visualization export settings:

  * `videoMusicVisualizationEnabled`
  * `videoMusicVisualizationMaxHeightPercent`
  * automatically enables soft-wave visualization when an audio file is selected
  * disables audio-dependent visualization state when audio is cleared
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
* Calculates random audio start offset before MP4 export when the audio is longer than the video.
* Passes audio, audio start offset, quality, and music visualization options into `exportCanvasSliderMp4`.
* Exports MP4 using `exportCanvasSliderMp4`.
* Applies overlay during MP4 frame rendering.
* Sends final video blob to web download or native share.

Edit this file when:

* Video duration logic changes.
* Repeat/loop/random behavior changes.
* Video preset behavior changes.
* Video quality presets change.
* Audio handling changes.
* Random audio start behavior changes.
* Music visualization UI state changes.
* Music visualization export options change.
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

## MP4 Export, Audio Mixing, and Music Visualization

### `app/utils/exportCanvasSliderMp4.ts`

This utility renders the final MP4 frame-by-frame and handles ffmpeg-based video/audio muxing.

Responsibilities:

* Create the offscreen export canvas.
* Create and drive `CanvasSliderRenderer` for MP4 frames.
* Encode rendered frames for ffmpeg.
* Add optional audio to the exported MP4.
* Loop audio by default when the audio is shorter than the video.
* Start audio from a randomized offset when `audioStartOffsetMs` is provided.
* Apply default audio fade-in and fade-out. Current intended fade duration is `0.3s`.
* Decode the selected audio with `AudioContext` when music visualization is enabled.
* Calculate loudness/RMS from the selected audio at the current exported frame time.
* Smooth loudness so the visualizer motion does not jump harshly between frames.
* Draw the soft-wave music visualization during MP4 export.
* Report MP4 export progress.
* Return the final MP4 `Blob`.

Current music visualization behavior:

* The visualizer is export-only. It is drawn into the MP4 frames and is not shown in the live preview canvas unless preview support is implemented separately.
* The visualizer uses three white soft-wave layers.
* Current layer opacity values are intended to be:

  * `1`
  * `0.5`
  * `0.25`
* Current layer amplitude multipliers are intended to be:

  * `1`
  * `1.2`
  * `1.5`
* `musicVisualizationMaxHeightPercent` is a base maximum height percentage relative to canvas height.
* The default base max height is `5%`.
* The UI range is intended to allow `0` to `50`.
* Each layer applies its own amplitude multiplier to that base max height. For example, with a base value of `5%`:

  * layer `1` => max `5%`
  * layer `1.2` => max `6%`
  * layer `1.5` => max `7.5%`
* Wave speed is driven by the layer `speedA`, `speedB`, and `speedC` values.
* Wave speed can also be multiplied by loudness, so quiet parts move slower and louder parts move faster.
* The drawing function is edge-aware and supports both:

  * `bottom` wave
  * `top` wave
* The current export draws both top and bottom soft waves.

Important MP4 frame layer order:

```txt
1. Canvas slider frame / main visual content
2. Soft-wave music visualization, top and bottom
3. Brand overlay and text overlay
```

This order keeps brand and text above the wave layers. If the drawing order is changed, the wave may cover the brand/text or the overlay may hide the wave.

Edit this file when:

* MP4 frame rendering behavior changes.
* ffmpeg input/output arguments change.
* Audio fade, loop, muxing, or random start behavior changes.
* Music visualization shape, opacity, height, speed, loudness mapping, or top/bottom placement changes.
* MP4 encoder options, progress mapping, or output codec settings change.

Related files:

* `app/composables/collage/useCollageVideo.ts`
* `app/utils/canvasSliderRenderer.ts`
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
  -> calculate random audioStartOffsetMs if audio is longer than video
  -> exportCanvasSliderMp4
  -> getVideoSources
  -> create offscreen export canvas
  -> create CanvasSliderRenderer
  -> draw slider frame
  -> decode audio for visualization when enabled
  -> draw top and bottom soft-wave music visualization when enabled
  -> createCompositeOverlayCanvas
  -> drawOverlayCanvas on exported frames
  -> encode frames
  -> mux audio with loop, random start, and 0.3s fade-in/fade-out
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

Also edit this file when adding or exposing video export UI state such as audio selection, music visualization enabled state, or visualizer height controls.

---

---

### Change MP4 encoder, audio muxing, random audio start, audio fade, or music visualization drawing

Edit:

```txt
app/utils/exportCanvasSliderMp4.ts
```

Optional, if UI state or export options also change:

```txt
app/composables/collage/useCollageVideo.ts
app/pages/collage.vue
app/composables/collage/useCollagePage.ts
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
* Soft-wave music visualization affects MP4 export only, not canvas preview.
* Soft-wave height affects MP4 export only, not canvas preview.
* Safe area currently affects video overlay behavior.


---

## Current Audio and Music Visualization Notes

Audio and soft-wave visualization are currently part of MP4 export, not live preview.

Current intended behavior:

* Selecting an audio file automatically enables `videoMusicVisualizationEnabled`.
* Clearing the audio file disables audio-dependent visualization state.
* If the audio is longer than the generated video, `useCollageVideo.ts` chooses a random audio start offset so repeated exports can use different parts of the same music file.
* If the audio is shorter than the generated video, the MP4 exporter loops the audio input by default.
* Audio fade-in and fade-out are applied by the MP4 exporter. Current intended fade duration is `0.3s`.
* The soft-wave visualizer is only rendered during MP4 export.
* The soft-wave visualizer uses decoded audio loudness to drive wave height and movement.
* Wave height is controlled by `videoMusicVisualizationMaxHeightPercent`, with a default value of `5`.
* The height slider is intended to range from `0` to `50`.
* Layer amplitude multipliers still apply on top of the base height percentage.
* Wave movement speed can be scaled by loudness, so quieter parts move slower and louder parts move faster.
* The visualizer is edge-aware and currently draws both top and bottom waves.
* Brand and text overlays should be drawn after the wave so they remain visually above it.

Related translation keys:

```txt
pages.collage.video.musicVisualizationSoftWave
pages.collage.video.musicVisualizationHeight
```

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
app/utils/canvasSliderRenderer.ts
app/utils/exportCanvasSliderMp4.ts

app/constants/collage.ts
app/types/collage.ts
```

After this refactor, most future Collage development should happen outside `collage.vue`.