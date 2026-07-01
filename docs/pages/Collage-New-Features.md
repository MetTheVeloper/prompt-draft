# Collage UX, Context Menu, and Canvas Controls Update

This document summarizes the Collage improvements implemented during this development pass. The goal of the work was to turn the Collage page into a more complete canvas-based editor while keeping the existing layout algorithm stable and reusable.

---

## Goals

The main goals were:

- Keep the current automatic collage layout behavior intact.
- Add safe ways to reshuffle images and layouts without breaking the existing rendering logic.
- Add canvas cell selection and per-cell actions.
- Add context menus for both canvas cells and the page workspace.
- Improve image fitting with `cover` and `detail` modes.
- Allow panning images inside their cells.
- Add canvas style controls and export controls.
- Persist important Collage settings in `localStorage`.
- Improve empty-state UX.
- Replace native checkboxes with `el-switch`.
- Prevent Chrome native context menu from appearing inside the Collage workspace and while the global menu is open.

---

## Updated / Added Files

The work touched these main areas:

```txt
app/pages/collage.vue
app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageImages.ts
app/composables/collage/useCollageRenderer.ts
app/composables/usePageContextMenu.ts
app/components/el/Switch.vue
app/components/el/global-menu.vue
app/utils/collage/layout.ts
app/utils/collage/shuffle.ts
app/utils/collage/drawing.ts
app/types/collage.ts
```

---

## Layout Tools

A dedicated Layout Tools group was added outside the Canvas group.

### Shuffle Similar Images

Shortcut:

```txt
Shift + S
```

Behavior:

- Keeps the generated layout shape unchanged.
- Groups images or cells by similar aspect ratio.
- Shuffles only images that are visually safe to swap.
- Preserves the overall collage form.

Implementation note:

This should not shuffle the original `images` array before layout generation. Instead, it should apply after layout creation by reassigning images between compatible cells.

### Shuffle Layout

Shortcut:

```txt
Shift + L
```

Behavior:

- Changes the layout seed.
- Allows the layout algorithm to choose a different arrangement.
- Keeps the same uploaded images.

### Constraint Mode

Shortcut:

```txt
Shift + C
```

Modes:

```ts
type CollageLayoutConstraintMode = 'controlled' | 'free'
```

Behavior:

- `controlled`: keeps the previous safer layout behavior.
- `free`: relaxes layout constraints and gives the algorithm more freedom.

---

## Canvas Ratio Lock

A canvas ratio dropdown was added to the Layout Tools group.

Supported values:

```txt
Auto
1:1
16:9
9:16
2:1
3:2
3:1
3:7
```

Behavior:

- `Auto` keeps the previous automatic ratio behavior.
- Fixed ratios lock the output canvas ratio while still using the collage algorithm to populate the cells.

Persisted setting:

```txt
canvasAspectRatioLock
```

---

## Export Quality

An export quality range was added to the Canvas group.

Range:

```txt
30 - 100
```

Behavior:

- `100` keeps PNG-like maximum quality behavior.
- Values below `100` export with reduced image quality for smaller file size.
- A divider was added before Export Quality to visually separate it from layout/style controls.

Persisted setting:

```txt
imageExportQuality
```

---

## Canvas Decorations

A canvas decorations switch was added.

When enabled:

- Inner padding applies.
- Image gap applies.
- Cell corner radius applies.
- Background color applies.
- Related controls are visible.

When disabled:

- Padding becomes ineffective.
- Gap becomes ineffective.
- Cell radius becomes `0`.
- Background does not affect the output.
- Related UI controls are hidden.
- Cells touch each other with no visual spacing.

Persisted settings:

```txt
canvasDecorationsEnabled
padding
gap
cellRadius
backgroundColor
```

---

## Cell Radius

A new range control was added for cell corner radius.

Range:

```txt
0 - 100
```

The value affects canvas rendering only when canvas decorations are enabled.

---

## Cell Selection

Canvas cells can now be selected.

### Single Click

Behavior:

- Clicking a cell selects it.
- Clicking the already selected cell deselects it.
- Clicking the empty wrapper/workspace deselects the current cell.

### Visual Selection Overlay

The selected cell is shown using a UI-only overlay.

Important rule:

```txt
The selection overlay must not be drawn into the export canvas.
```

The overlay is only for editor feedback and should not appear in downloaded or copied output.

---

## Cell Hit Testing

The renderer stores the latest rendered layout/cells and exposes hit testing.

The hit test converts pointer coordinates from displayed canvas coordinates into actual canvas coordinates, then checks which layout cell contains the point.

This enables:

- click selection
- double-click actions
- context menu targeting
- drag/pan behavior
- future per-cell actions

---

## Cover / Detail Image Fit

Each image can now have its own display mode.

Type shape:

```ts
type CollageImageFitMode = 'cover' | 'detail'
```

### Cover

The previous behavior.

The image is scaled to cover the cell using the minimum required cover scale.

### Detail

The image is rendered closer to real/original scale when possible, while still preventing empty cell areas.

This mode is useful for inspecting details in generated images.

### Double Click

Double-clicking a cell toggles between:

```txt
Cover <-> Detail
```

---

## Pan Inside Cell

Images in `detail` mode can be panned inside their cell.

Supported inputs:

- pointer drag inside the selected/detail cell
- keyboard arrow keys for the selected cell
- `Shift + Arrow` for faster panning

Pan values are normalized:

```txt
panX: -1 left, 0 center, 1 right
panY: -1 top,  0 center, 1 bottom
```

The drawing logic clamps the final image position so empty space is not revealed inside the cell.

---

## Per-Image Transform State

Fit mode and pan are stored by image id, not by layout cell.

Reason:

- If Shuffle Similar swaps images between cells, the transform should follow the image.
- Replace image can preserve state by keeping the same image id.

This keeps user edits attached to the image identity instead of the temporary layout position.

---

## Cell Context Menu

Right-clicking a cell opens a cell-aware context menu.

Cell-specific actions include:

```txt
Replace image
Remove image
Cover
Detail
Reset position
```

General collage actions are also available from the same menu.

---

## Replace Selected Image

The selected image can be replaced from the context menu.

Behavior:

- Opens a file picker.
- Loads the replacement image.
- Keeps the previous image id when replacing.
- Preserves compatibility with transform state and selection behavior.
- Cleans up the previous object URL.

---

## Remove Selected Image

The selected image can be removed from the context menu.

Behavior:

- Removes the selected image from the image list.
- Revokes the object URL.
- Clears selected cell state as needed.
- Re-renders the collage.

---

## Page-Level Context Menu

A reusable composable was added:

```txt
app/composables/usePageContextMenu.ts
```

Purpose:

- Provide a page-level right-click menu pattern.
- Prevent native browser context menus where desired.
- Allow item-specific context menus to coexist with page-level menus.
- Ignore native form controls and overlays.

The Collage page uses this to show a default context menu when right-clicking empty workspace areas.

Default actions include:

```txt
Add images
Shuffle similar
Shuffle layout
Controlled mode
Free mode
Save
Copy
Clear
Refresh page
```

---

## Native Browser Context Menu Fix

The global menu renderer was updated so that when the custom menu is open:

- right-clicking outside the menu does not open Chrome native context menu
- right-clicking inside the menu does not open Chrome native context menu
- right-clicking outside can close the custom menu cleanly

Updated file:

```txt
app/components/el/global-menu.vue
```

This fixed the case where the first right-click opened the custom menu correctly, but a second right-click while the menu was already open showed the native browser menu.

---

## Brand Overlay Switch

The Brand Overlay group now uses an `el-switch` in the group header.

Behavior:

- Switch off: brand/text/QR overlay is not rendered into canvas.
- Switch off: the group does not expand.
- Switch on: previous overlay behavior works normally.

Persisted setting:

```txt
brandOverlayEnabled
```

---

## `el-switch` v-model Support

`el-switch` was updated to support `v-model`.

This makes page templates cleaner and avoids repetitive manual click toggles.

Expected usage:

```vue
<el-switch v-model="enabled" />
```

Manual usage is still possible when needed:

```vue
<el-switch :value="enabled" @click="enabled = !enabled" />
```

---

## Replacing Native Checkboxes

All checkbox usages inside `collage.vue` were replaced with `el-switch`.

Reason:

- Visual consistency with the project design system.
- Cleaner interaction model.
- Better alignment with other panel controls.

---

## Persisted Settings

Collage now persists important editor settings in `localStorage`.

Persisted values:

```txt
activeMode
brandOverlayEnabled
padding
gap
cellRadius
backgroundColor
canvasDecorationsEnabled
layoutConstraintMode
canvasAspectRatioLock
imageExportQuality
```

Rules:

- Persist only UI/editor settings, not uploaded image blobs.
- Restore settings on page load.
- Avoid breaking defaults when old storage values are missing or invalid.

---

## Improved Empty State

The canvas workspace now has a better empty state.

Features:

- Centered CTA card.
- Add Images button.
- Drag-and-drop instruction.
- Paste hint.
- Keyboard access with Enter/Space on the empty-state CTA.

This makes the first-use experience clearer and reduces confusion when the canvas is empty.

---

## Translation Keys Added

The following keys were added or recommended during the update.

```txt
pages.collage.layoutTools.title
pages.collage.layoutTools.shuffleSimilar
pages.collage.layoutTools.shuffleLayout
pages.collage.layoutTools.constraintMode
pages.collage.layoutTools.constraintModes.controlled
pages.collage.layoutTools.constraintModes.free
pages.collage.layoutTools.canvasRatio
pages.collage.layoutTools.canvasRatios.auto

pages.collage.preview.selectedCell

pages.collage.canvas.exportQuality
pages.collage.canvas.decorationsEnabled
pages.collage.canvas.cellRadius

pages.collage.imageFit.mode
pages.collage.imageFit.cover
pages.collage.imageFit.detail
pages.collage.imageFit.resetPosition

pages.collage.actions.replaceImage
pages.collage.actions.removeImage
pages.collage.actions.refreshPage

pages.collage.emptyCanvas.title
pages.collage.emptyCanvas.description
pages.collage.emptyCanvas.pasteHint
pages.collage.emptyCanvas.action
```

---

## Important Rendering Rules

1. Layout generation and image drawing should remain separate.
2. Shuffle Similar should not mutate image order before layout generation.
3. Selection overlays must remain UI-only and must not be exported.
4. Per-image transforms should be keyed by image id.
5. Replace image should keep the same id when the intent is to preserve transform state.
6. Brand overlay rendering should be skipped completely when disabled.
7. Canvas decorations should be ignored when disabled, not merely hidden in UI.
8. Native context menu prevention should ignore form controls and overlays unless explicitly handled.
9. LocalStorage should persist editor settings, not heavy runtime objects.

---

## Future Ideas

Possible next improvements:

```txt
Undo for remove / replace / clear
Lock selected image from shuffle
Move image to another cell
Duplicate selected image
Show image info / dimensions / ratio
Per-image zoom slider
Floating mini toolbar for selected cell
Toast feedback after keyboard shortcuts
Keyboard shortcut hint panel
Persist per-image transform presets if images become project-based
```

---

## Suggested Commit Message

```txt
feat(collage): add advanced canvas controls and context menu UX

- add layout tools for similar-image shuffle, layout shuffle, and constraint mode
- add canvas ratio locking and export quality control
- add canvas decoration toggle, cell radius control, and spacing/background disabling
- add cell hit testing, selection state, and UI-only selected-cell overlay
- add cover/detail image fit modes with drag and keyboard pan support
- add double-click cover/detail toggle for canvas cells
- add context menu actions for replace, remove, fit mode, and reset position
- add page-level context menu infrastructure with default Collage actions
- prevent native browser context menu while the global menu is open
- deselect selected cell when clicking empty canvas wrapper space
- add localStorage persistence for Collage editor settings
- improve empty canvas state with drag/drop, paste, and add-image CTA
- replace Collage checkbox controls with el-switch
- add v-model support to el-switch
- add brand overlay switch and skip overlay rendering when disabled
```
