# Collage Page New Features Guide

این داکیومنت، تغییرات جدیدی را که روی صفحه کلاژ تصویر اعمال شد توضیح می‌دهد. هدف اصلی این تغییرات این بود که بدون خراب کردن منطق فعلی ساخت layout، کنترل بیشتری روی چینش، تعامل با سلول‌های canvas، نمایش هر تصویر داخل سلول، نسبت خروجی و کیفیت export داشته باشیم.

---

## خلاصه قابلیت‌های اضافه‌شده

قابلیت‌های جدید فعلی:

```txt
Shift + S  → شافل عکس‌های هم‌نسبت بدون تغییر فرم layout
Shift + L  → شافل کلی layout برای تولید چینش جدید
Shift + C  → تغییر حالت الگوریتم بین controlled و free
Right click روی canvas → باز شدن context menu اختصاصی کلاژ
Click روی canvas → تشخیص و انتخاب cell کلیک‌شده
Cover / Detail → کنترل نحوه نمایش تصویر داخل هر cell
Drag در حالت Detail → pan کردن تصویر داخل cell
Canvas Ratio Lock → قفل کردن نسبت خروجی canvas
Image Export Quality → کنترل کیفیت/حجم خروجی تصویر
```

این قابلیت‌ها فقط برای `image` mode طراحی شده‌اند، مگر اینکه در آینده صراحتاً به video preview/export هم وصل شوند.

---

## فایل‌های درگیر

فایل‌های اصلی که در این توسعه تغییر کردند یا به آن‌ها وابسته هستند:

```txt
app/pages/collage.vue

app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageImages.ts
app/composables/collage/useCollageOverlay.ts
app/composables/collage/useCollageExport.ts

app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/utils/collage/shuffle.ts

app/types/collage.ts
```

نقش فایل‌ها:

```txt
collage.vue
  فقط UI، event binding، dropdownها، rangeها و اتصال template به state/actionها.

useCollagePage.ts
  coordinator اصلی صفحه؛ shortcutها، context menu، actionهای layout، export quality، pan pointer flow و اتصال composableها.

useCollageRenderer.ts
  رندر canvas، نگهداری آخرین layout، hit-test سلول‌ها، image transformها، draw mode و pan logic.

layout.ts
  تولید layout، حالت controlled/free، seed-based layout shuffle و ratio candidateها.

drawing.ts
  helperهای canvas drawing، drawImageInCell، محاسبه scale/overflow/pan و backward-compatible drawImageCover.

shuffle.ts
  seeded shuffle و shuffle امن عکس‌های هم‌نسبت داخل cellهای ثابت.

types/collage.ts
  typeهای جدید برای constraint mode، image fit/transform و aspect ratio lock.
```

---

## قانون معماری

اصل مهم این توسعه این است که `collage.vue` نباید منطق سنگین داشته باشد. این فایل فقط کنترل‌های UI را نمایش می‌دهد و actionها را صدا می‌زند.

منطق اصلی باید در این لایه‌ها بماند:

```txt
Vue state و page-level actionها → useCollagePage.ts
Render state و canvas logic → useCollageRenderer.ts
Pure layout calculation → layout.ts
Pure drawing helper → drawing.ts
Pure shuffle helper → shuffle.ts
Shared typeها → types/collage.ts
```

---

# 1. Layout Tools

بخش `Layout Tools` در پنل کلاژ برای کنترل layout خروجی image mode ساخته شد.

قابلیت‌های این بخش:

```txt
Shuffle Similar
Shuffle Layout
Constraint Mode
Canvas Ratio
```

---

## 1.1 Shuffle Similar Images

### هدف

وقتی چند تصویر نسبت نزدیک به هم دارند، بتوانیم فقط جای همان تصاویر مشابه را با هم عوض کنیم، بدون اینکه فرم کلی layout عوض شود.

### Shortcut

```txt
Shift + S
```

### رفتار

```txt
1. layout طبق منطق فعلی ساخته می‌شود.
2. cellهای ساخته‌شده ثابت می‌مانند.
3. عکس‌های داخل cellها بر اساس نسبت تصویر گروه‌بندی می‌شوند.
4. فقط عکس‌های هر گروه با هم shuffle می‌شوند.
5. x/y/width/height سلول‌ها تغییر نمی‌کند.
```

نتیجه:

```txt
فرم کلاژ ثابت می‌ماند
crop معمولاً منطقی می‌ماند
فقط جای عکس‌های هم‌فرم عوض می‌شود
خروجی بدون تغییر layout، variation می‌گیرد
```

### State اصلی

```ts
const imageShuffleSeed = ref(0)
```

با هر بار اجرای action، seed افزایش پیدا می‌کند:

```ts
function shuffleSimilarImages() {
  if (activeMode.value !== 'image' || imagesApi.images.value.length < 2) return

  imageShuffleSeed.value++
}
```

### محل اصلی پیاده‌سازی

```txt
useCollagePage.ts
useCollageRenderer.ts
utils/collage/shuffle.ts
```

در renderer بعد از ساخت layout:

```ts
const renderedCells = shuffleSimilarRatioCellImages(layout.cells, {
  seed: options.imageShuffleSeed.value,
})
```

---

## 1.2 Shuffle Layout

### هدف

برخلاف `Shuffle Similar`، این قابلیت قرار است فرم کلی چینش را تغییر دهد و یک layout جدید از بین کاندیداهای ممکن بسازد.

### Shortcut

```txt
Shift + L
```

### رفتار

```txt
1. layoutShuffleSeed افزایش پیدا می‌کند.
2. selected cell پاک می‌شود.
3. createCollageLayout با seed جدید اجرا می‌شود.
4. layout جدید می‌تواند فرم متفاوتی داشته باشد.
```

### State اصلی

```ts
const layoutShuffleSeed = ref(0)
```

### Action

```ts
function shuffleLayout() {
  if (activeMode.value !== 'image' || imagesApi.images.value.length < 2) return

  layoutShuffleSeed.value++
  rendererApi.clearSelectedImageCell()
}
```

### محل اصلی پیاده‌سازی

```txt
useCollagePage.ts
useCollageRenderer.ts
utils/collage/layout.ts
```

در renderer، seed به `createCollageLayout` پاس داده می‌شود:

```ts
const layout = createCollageLayout({
  images: options.images.value,
  padding: options.padding.value,
  gap: options.gap.value,
  layoutShuffleSeed: options.layoutShuffleSeed.value,
  constraintMode: options.layoutConstraintMode.value,
  ratios: getCanvasAspectRatioCandidates(options.canvasAspectRatioLock.value),
})
```

---

## 1.3 Constraint Mode

### هدف

کنترل سخت‌گیری الگوریتم layout.

حالت‌ها:

```ts
type CollageLayoutConstraintMode = 'controlled' | 'free'
```

### Controlled

حالت فعلی و امن‌تر الگوریتم است. در این حالت، محدودیت‌ها و penaltyها کمک می‌کنند خروجی متعادل‌تر و قابل پیش‌بینی‌تر باشد.

### Free

در این حالت، محدودیت‌های layout بازتر می‌شوند تا الگوریتم آزادی بیشتری برای انتخاب فرم‌های متنوع‌تر داشته باشد.

### Shortcut

```txt
Shift + C
```

### State

```ts
const layoutConstraintMode = ref<CollageLayoutConstraintMode>('controlled')
```

### Actions

```ts
function setLayoutConstraintMode(mode: CollageLayoutConstraintMode) {
  if (layoutConstraintMode.value === mode) return

  layoutConstraintMode.value = mode
  layoutShuffleSeed.value++
  rendererApi.clearSelectedImageCell()
}

function toggleLayoutConstraintMode() {
  setLayoutConstraintMode(
    layoutConstraintMode.value === 'controlled' ? 'free' : 'controlled',
  )
}
```

### Watcher

`layoutConstraintMode` باید در watcher مربوط به image render باشد، چون خروجی canvas را تغییر می‌دهد.

---

## 1.4 Shortcut Guard

برای اینکه shortcutها داخل input، textarea، select، button یا contenteditable اجرا نشوند، guard جداگانه استفاده می‌شود.

رفتار مورد انتظار:

```txt
Shift + S / L / C فقط وقتی اجرا شود که کاربر در حال تایپ یا تعامل با کنترل‌های فرم نیست.
```

نمونه منطق:

```ts
function canRunCollageShortcut(event: KeyboardEvent) {
  if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
    return false
  }

  const target = event.target as HTMLElement | null

  if (
    target?.closest(
      'input, textarea, select, button, [contenteditable="true"]',
    )
  ) {
    return false
  }

  return true
}
```

---

# 2. Canvas Cell Interaction

## هدف

تشخیص اینکه کاربر روی کدام سلول canvas کلیک یا راست‌کلیک کرده است.

این قابلیت پایه‌ی context menu و actionهای آینده مثل replace/remove/lock/inspect است.

---

## Stateهای اصلی

در `useCollageRenderer.ts`:

```ts
const lastImageLayout = ref<CollageLayoutResult | null>(null)
const selectedImageCell = ref<CollageLayoutCell | null>(null)
```

`lastImageLayout` آخرین layout رندرشده را نگه می‌دارد. `selectedImageCell` سلول انتخاب‌شده توسط کاربر را نگه می‌دارد.

---

## تبدیل مختصات pointer به canvas

از آنجا که canvas ممکن است در UI scale شده باشد، مختصات موس باید از فضای viewport به مختصات واقعی canvas تبدیل شود.

```ts
function getCanvasPointFromPointerEvent(event: MouseEvent) {
  const canvas = options.canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()

  if (!rect.width || !rect.height) return null

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  }
}
```

---

## Hit-test روی cellها

```ts
function getImageCellAtCanvasPoint(x: number, y: number) {
  const layout = lastImageLayout.value
  if (!layout) return null

  return (
    layout.cells.find((cell) => {
      return (
        x >= cell.x &&
        x <= cell.x + cell.width &&
        y >= cell.y &&
        y <= cell.y + cell.height
      )
    }) || null
  )
}
```

---

## Click behavior

در template canvas:

```vue
<canvas
  ref="canvasRef"
  @pointerdown="handleCanvasPointerDown"
/>
```

در renderer:

```ts
function handleCanvasPointerDown(event: MouseEvent) {
  if (options.activeMode.value !== 'image') return

  selectedImageCell.value = getImageCellAtPointerEvent(event)
}
```

---

# 3. Canvas Context Menu

## هدف

با راست‌کلیک روی canvas، یک context menu اختصاصی باز شود که هم actionهای عمومی کلاژ را داشته باشد و هم در صورت راست‌کلیک روی یک cell، actionهای مربوط به همان تصویر را نمایش دهد.

این پیاده‌سازی از global menu system پروژه استفاده می‌کند.

---

## Event در template

```vue
<canvas
  ref="canvasRef"
  @pointerdown="handleCanvasPointerDown"
  @contextmenu="handleCanvasContextMenu"
/>
```

---

## باز کردن menu

در `useCollagePage.ts`:

```ts
function handleCanvasContextMenu(event: MouseEvent) {
  if (activeMode.value !== 'image') return

  event.preventDefault()

  rendererApi.selectedImageCell.value =
    rendererApi.getImageCellAtPointerEvent(event)

  $menu.open({
    mode: 'point',
    event,
    options: {
      minWidth: 220,
      closeOnScroll: false,
    },
    items: createCanvasContextMenuItems(),
  })
}
```

---

## آیتم‌های فعلی context menu

وقتی روی canvas راست‌کلیک شود:

```txt
Add images
Shuffle similar      Shift + S
Shuffle layout       Shift + L
Controlled mode
Free mode
Save
Copy
Clear
```

وقتی روی cell راست‌کلیک شود، این‌ها هم اضافه می‌شوند:

```txt
Selected cell: {name}
Cover
Detail
Reset position
```

---

## رفتار active/disabled

برای حالت‌هایی مثل `controlled/free` و `cover/detail` از `active` استفاده می‌شود تا آیتم فعلی در menu مشخص باشد.

برای actionهایی که تصویر کافی ندارند یا export ممکن نیست، `disabled` استفاده می‌شود.

---

# 4. Per-image Cover / Detail

## هدف

تا قبل از این تغییر، همه تصاویر با منطق cover داخل cell رسم می‌شدند. حالا هر تصویر می‌تواند حالت نمایش خودش را داشته باشد:

```ts
type CollageImageFitMode = 'cover' | 'detail'
```

---

## تفاوت حالت‌ها

### Cover

همان رفتار قبلی:

```txt
scale = max(cellWidth / imageWidth, cellHeight / imageHeight)
```

تصویر کل cell را پر می‌کند و ممکن است crop شود.

### Detail

هدف این حالت نمایش جزئیات بیشتر تصویر است.

```txt
scale = max(coverScale, 1)
```

یعنی اگر تصویر اصلی از cell بزرگ‌تر باشد، تصویر نزدیک‌تر به scale واقعی خودش نمایش داده می‌شود. cell خالی نمی‌ماند، ولی ممکن است مقدار crop بیشتر شود. این حالت برای بررسی جزئیات خروجی پرامپت مفید است.

---

## Typeهای جدید

در `types/collage.ts`:

```ts
export type CollageImageFitMode = 'cover' | 'detail'

export type CollageImageTransform = {
  fit: CollageImageFitMode
  panX: number
  panY: number
}
```

---

## نگهداری transformها

در `useCollageRenderer.ts`:

```ts
const imageTransforms = ref<Record<string, CollageImageTransform>>({})
```

transformها بر اساس `image.id` ذخیره می‌شوند، نه cell. این تصمیم مهم است، چون وقتی عکس‌ها با `Shift + S` بین cellهای مشابه جابه‌جا می‌شوند، حالت `detail` و pan همراه خود عکس باقی می‌ماند.

---

## APIهای اصلی transform

```ts
getImageTransform(imageId)
setImageTransform(imageId, transform)
setImageFitMode(imageId, fit)
resetImageTransform(imageId)
cleanupImageTransforms()
panImageTransform(imageId, cell, deltaX, deltaY)
```

کاربردها:

```txt
getImageTransform
  گرفتن transform موثر تصویر با fallback به حالت default.

setImageFitMode
  تغییر cover/detail از context menu.

resetImageTransform
  برگشت به cover و pan صفر.

cleanupImageTransforms
  حذف transform تصاویر حذف‌شده از حافظه.

panImageTransform
  محاسبه pan جدید بر اساس drag.
```

---

# 5. Pan داخل cell

## هدف

وقتی تصویر در حالت `detail` است، کاربر بتواند با drag کردن داخل همان cell، موقعیت تصویر را تنظیم کند.

---

## Pan model

```txt
panX: -1  → تصویر تا حد ممکن به چپ
panX:  0  → وسط
panX:  1  → تصویر تا حد ممکن به راست

panY: -1  → بالا
panY:  0  → وسط
panY:  1  → پایین
```

این مقدارها clamp می‌شوند تا همیشه بین `-1` و `1` بمانند.

---

## شرط فعال شدن pan

Pan فقط وقتی شروع می‌شود که:

```txt
activeMode === 'image'
روی یک cell کلیک شده باشد
تصویر آن cell در حالت detail باشد
pointer اصلی/left button باشد
```

این تصمیم باعث می‌شود رفتار عادی canvas شلوغ نشود و کاربر فقط وقتی واقعاً جزئیات را فعال کرده، وارد حالت pan شود.

---

## Render throttling برای pan

هنگام drag، ممکن است تعداد eventها زیاد باشد. برای جلوگیری از render بیش از حد، render با `requestAnimationFrame` کنترل می‌شود.

رفتار کلی:

```txt
pointermove
  → panImageTransform
  → scheduleImagePanRender
  → requestAnimationFrame
  → renderCanvas
```

---

## Drawing logic

در `drawing.ts` helper جدید داریم:

```ts
export function drawImageInCell(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ImageCellDrawOptions = {},
)
```

این helper اول metrics را حساب می‌کند:

```ts
export function getImageCellDrawMetrics(...) {
  const coverScale = Math.max(width / imageWidth, height / imageHeight)
  const scale = options.fit === 'detail' ? Math.max(coverScale, 1) : coverScale

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  const overflowX = Math.max(0, drawWidth - width)
  const overflowY = Math.max(0, drawHeight - height)

  const drawX = x - overflowX * ((panX + 1) / 2)
  const drawY = y - overflowY * ((panY + 1) / 2)

  return { scale, drawWidth, drawHeight, drawX, drawY, overflowX, overflowY }
}
```

سپس تصویر با `drawImage` در همان محدوده cell رسم می‌شود. قبل از drawing، cell با rounded rect clip می‌شود، بنابراین تصویر از مرز cell بیرون نمی‌زند.

---

# 6. Canvas Ratio Lock

## هدف

کاربر بتواند نسبت خروجی canvas را از پنل قفل کند.

گزینه‌ها:

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

---

## Type

در `types/collage.ts`:

```ts
export type CollageCanvasAspectRatioLock =
  | 'auto'
  | '1:1'
  | '16:9'
  | '9:16'
  | '2:1'
  | '3:2'
  | '3:1'
  | '3:7'
```

---

## State

در `useCollagePage.ts`:

```ts
const canvasAspectRatioLock = ref<CollageCanvasAspectRatioLock>('auto')
```

---

## Action

```ts
function setCanvasAspectRatioLock(lock: CollageCanvasAspectRatioLock) {
  if (canvasAspectRatioLock.value === lock) return

  canvasAspectRatioLock.value = lock
  rendererApi.clearSelectedImageCell()
}
```

---

## اتصال به renderer

در `useCollageRenderer.ts`:

```ts
const CANVAS_ASPECT_RATIO_VALUES = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '2:1': 2 / 1,
  '3:2': 3 / 2,
  '3:1': 3 / 1,
  '3:7': 3 / 7,
}

function getCanvasAspectRatioCandidates(lock: CollageCanvasAspectRatioLock) {
  if (lock === 'auto') return undefined

  return [CANVAS_ASPECT_RATIO_VALUES[lock]]
}
```

در حالت `auto`، همان candidate ratioهای پیش‌فرض الگوریتم استفاده می‌شوند. در حالت قفل‌شده، فقط همان نسبت به `createCollageLayout` داده می‌شود.

---

# 7. Image Export Quality

## هدف

کنترل کیفیت و حجم خروجی تصویر.

محدوده UI:

```txt
30 تا 100
```

معنی مقدارها:

```txt
100 → خروجی PNG با کیفیت کامل، مشابه رفتار قبلی
30 تا 99 → خروجی JPEG با quality همان درصد برای حجم کمتر
```

---

## State

```ts
const imageExportQuality = ref(100)
```

---

## Normalization

```ts
function normalizeImageExportQuality(value = imageExportQuality.value) {
  return Math.max(30, Math.min(100, Math.round(value || 100)))
}
```

---

## Export config

```ts
function getImageExportConfig() {
  const normalizedQuality = normalizeImageExportQuality()

  if (normalizedQuality >= 100) {
    return {
      mimeType: 'image/png',
      extension: 'png',
      quality: undefined,
    }
  }

  return {
    mimeType: 'image/jpeg',
    extension: 'jpg',
    quality: normalizedQuality / 100,
  }
}
```

---

## نکته درباره Copy

در پیاده‌سازی فعلی، کنترل export quality برای download/save تصویر استفاده می‌شود. اگر لازم باشد copy هم از همین کیفیت پیروی کند، باید `copyCanvas` هم از مسیر export config یا یک نسخه quality-aware عبور کند.

---

# 8. UI Controls

## بخش Canvas

زیر تنظیمات `Image gap`، کنترل جدید `Image Export Quality` اضافه شد.

نمونه label:

```txt
Export quality: 100%
کیفیت خروجی: ۱۰۰٪
```

---

## بخش Layout Tools

زیر `Constraint Mode`، dropdown جدید `Canvas Ratio` اضافه شد.

گزینه‌ها:

```txt
Automatic
1:1
16:9
9:16
2:1
3:2
3:1
3:7
```

نسبت‌های عددی نیاز به ترجمه ندارند و مستقیم نمایش داده می‌شوند. فقط `auto` ترجمه‌پذیر است.

---

# 9. Watcher Notes

هر stateای که خروجی image canvas را تغییر دهد باید در watcher image mode قرار بگیرد.

موارد اضافه‌شده به watcher image mode:

```txt
imageShuffleSeed
layoutShuffleSeed
layoutConstraintMode
canvasAspectRatioLock
imageTransforms
```

نکته: بسته به ساختار دقیق کد، `imageTransforms` ممکن است مستقیم watcher نشود و به جای آن actionهای مربوط به transform خودشان `renderCanvas()` را صدا بزنند. برای pan، بهتر است render با `requestAnimationFrame` throttle شود.

---

# 10. Translation Keys

کلیدهای جدید یا مرتبط با این توسعه:

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

pages.collage.imageFit.mode
pages.collage.imageFit.cover
pages.collage.imageFit.detail
pages.collage.imageFit.resetPosition

pages.collage.canvas.exportQuality
```

---

## پیشنهاد ترجمه فارسی

```json
{
  "pages": {
    "collage": {
      "layoutTools": {
        "title": "کنترل چیدمان",
        "shuffleSimilar": "شافل مشابه‌ها",
        "shuffleLayout": "شافل چیدمان",
        "constraintMode": "حالت الگوریتم",
        "constraintModes": {
          "controlled": "کنترل‌شده",
          "free": "آزاد"
        },
        "canvasRatio": "نسبت کنوس",
        "canvasRatios": {
          "auto": "اتوماتیک"
        }
      },
      "preview": {
        "selectedCell": "سلول انتخاب‌شده: {name}"
      },
      "imageFit": {
        "mode": "حالت نمایش تصویر",
        "cover": "کاور",
        "detail": "جزئیات",
        "resetPosition": "ریست موقعیت"
      },
      "canvas": {
        "exportQuality": "کیفیت خروجی: {value}%"
      }
    }
  }
}
```

---

## پیشنهاد ترجمه انگلیسی

```json
{
  "pages": {
    "collage": {
      "layoutTools": {
        "title": "Layout controls",
        "shuffleSimilar": "Shuffle similar",
        "shuffleLayout": "Shuffle layout",
        "constraintMode": "Algorithm mode",
        "constraintModes": {
          "controlled": "Controlled",
          "free": "Free"
        },
        "canvasRatio": "Canvas ratio",
        "canvasRatios": {
          "auto": "Automatic"
        }
      },
      "preview": {
        "selectedCell": "Selected cell: {name}"
      },
      "imageFit": {
        "mode": "Image display mode",
        "cover": "Cover",
        "detail": "Detail",
        "resetPosition": "Reset position"
      },
      "canvas": {
        "exportQuality": "Export quality: {value}%"
      }
    }
  }
}
```

---

# 11. Current Interaction Flow

## Render flow با layout tools

```txt
images/settings change
  → useCollagePage watcher
  → useCollageRenderer.renderCanvas
  → createCollageLayout
      receives: images, padding, gap, layoutShuffleSeed, constraintMode, ratios
  → shuffleSimilarRatioCellImages
      receives: layout.cells, imageShuffleSeed
  → lastImageLayout updated
  → draw each cell with drawImageInCell
  → draw overlay
  → previewInfo updated
```

---

## Context menu flow

```txt
right click on canvas
  → handleCanvasContextMenu
  → getImageCellAtPointerEvent
  → selectedImageCell updated
  → $menu.open({ mode: 'point' })
  → user selects action
  → action mutates state
  → canvas rerenders if needed
```

---

## Detail + pan flow

```txt
right click on cell
  → choose Detail
  → setImageFitMode(image.id, 'detail')
  → renderCanvas

left drag on same image/cell
  → pointerdown starts imagePanState
  → pointermove calculates delta
  → panImageTransform updates panX/panY
  → scheduleImagePanRender
  → renderCanvas

Reset position
  → resetImageTransform(image.id)
  → renderCanvas
```

---

# 12. Future Extension Points

این زیرساخت برای قابلیت‌های بعدی آماده است.

قابلیت‌های پیشنهادی آینده:

```txt
Replace selected image
Remove selected image
Lock selected image from shuffle
Move image to another cell
Duplicate selected image
Show image info / dimensions / ratio
Per-image zoom slider
Double click to toggle cover/detail
Keyboard arrow pan for selected cell
Context menu item for copying selected image name
Persist collage settings in localStorage
Apply image transform to video preview/export if needed
```

---

# 13. Development Rules

هنگام توسعه قابلیت‌های بعدی این قوانین را رعایت کن:

```txt
1. منطق جدید را مستقیم داخل collage.vue ننویس.
2. هر چیزی که خروجی canvas را تغییر می‌دهد باید render trigger داشته باشد.
3. اگر state مربوط به تصویر خاص است، ترجیحاً آن را با image.id نگه دار، نه cell index.
4. اگر layout shuffle باعث تغییر cellها می‌شود، selected cell را sync یا clear کن.
5. برای pointer و drag، render مستقیم در هر move نزن؛ از requestAnimationFrame استفاده کن.
6. برای context menu از $menu.open({ mode: 'point' }) استفاده کن.
7. برای dropdownهای پنل از el-dropdown استفاده کن، نه native select.
8. utilityهای محاسباتی را pure نگه دار.
9. cleanup object URLها و transformهای تصاویر حذف‌شده را فراموش نکن.
10. هر key جدید UI باید در fa/en اضافه شود.
```

---

# 14. Quick Checklist برای ادامه توسعه

وقتی قابلیت جدیدی به بخش کلاژ اضافه می‌شود:

```txt
[ ] آیا فقط UI است؟ → collage.vue
[ ] آیا state/action صفحه‌ای دارد؟ → useCollagePage.ts
[ ] آیا روی canvas drawing اثر دارد؟ → useCollageRenderer.ts / drawing.ts
[ ] آیا روی انتخاب layout اثر دارد؟ → layout.ts
[ ] آیا به shuffle یا randomization نیاز دارد؟ → shuffle.ts
[ ] آیا type جدید لازم دارد؟ → types/collage.ts
[ ] آیا خروجی canvas را تغییر می‌دهد؟ → watcher/render trigger
[ ] آیا متن قابل ترجمه دارد؟ → fa/en keys
[ ] آیا از context menu استفاده می‌کند؟ → createCanvasContextMenuItems
[ ] آیا باید فقط در image mode فعال باشد؟ → activeMode guard
```

---

## وضعیت نهایی

بعد از این توسعه، صفحه کلاژ فقط یک layout generator ساده نیست؛ حالا یک editor سبک برای تصویر خروجی هم هست:

```txt
layout قابل shuffle است
الگوریتم دو mode دارد
canvas نسبت قابل قفل شدن دارد
هر cell قابل شناسایی است
هر تصویر display mode و pan مستقل دارد
context menu آماده توسعه اکشن‌های آینده است
export تصویر quality-aware شده است
```

