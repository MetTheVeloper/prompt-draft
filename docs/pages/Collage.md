# Collage Developer Handoff

این سند برای ادامه توسعه صفحه Collage نوشته شده است. هدف این فایل این است که در چت‌های بعدی به عنوان context فنی خوانده شود تا بدون نیاز به مرور کل تاریخچه، ساختار فعلی، تصمیم‌های معماری و نقاط حساس مشخص باشند.

---

## فایل‌های اصلی

مسیرهای اصلی مرتبط با Collage:

```txt
app/pages/collage.vue

app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageImages.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageOverlay.ts
app/composables/collage/useCollageCanvasView.ts
app/composables/collage/useCollageVideo.ts
app/composables/collage/useCollageExport.ts

app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/utils/collage/file.ts
app/utils/collage/shuffle.ts
app/utils/collage/nativeShare.ts
app/utils/exportCanvasSliderMp4.ts
app/utils/canvasSliderRenderer.ts

app/types/collage.ts
app/constants/collage.ts

app/composables/usePageContextMenu.ts

app/components/collage/CellContextMenu.vue
app/components/collage/PipContextMenu.vue
app/components/collage/PipPositionIcon.vue
```

`collage.vue` باید تا حد امکان template و glue logic باشد. منطق سنگین باید در composableها یا utils بماند.

---

## جریان کلی داده

```txt
collage.vue
  -> useCollagePage
    -> useCollageImages
    -> useCollageOverlay
    -> useCollageRenderer
    -> useCollageCanvasView
    -> useCollageExport
    -> useCollageVideo
```

Renderer برای image mode از این مسیر استفاده می‌کند:

```txt
renderCanvas
  -> createCollageLayout
  -> apply similar-image shuffle if needed
  -> draw cells
  -> draw per-image PIP overlays
  -> draw brand overlay OR brand footer
  -> update preview/cell metadata
```

---

## اصول معماری مهم

1. الگوریتم layout اصلی را برای featureهای UI تغییر نده.
2. اگر چیزی فقط ظاهر canvas را تغییر می‌دهد، در renderer/drawing پیاده شود.
3. اگر چیزی stateful است و با UI تعامل دارد، در `useCollagePage.ts` یا composable اختصاصی قرار بگیرد.
4. اگر چیزی pure calculation است، در `utils` بماند.
5. هر چیزی که خروجی canvas را تغییر می‌دهد باید در watcher مناسب trigger render داشته باشد.
6. object URLها باید همیشه cleanup شوند.
7. selection overlay و UI-only overlay نباید داخل export canvas کشیده شوند.
8. PIP و image transform به `image.id` وصل هستند، نه به cell index.
9. در حالت shuffle مشابه‌ها، فرم layout ثابت می‌ماند و فقط assignment تصویر داخل cell تغییر می‌کند.
10. در حالت shuffle layout، seed وارد ساخت layout می‌شود تا فرم کلی تغییر کند.

---

## Types مهم

Types در `app/types/collage.ts` نگهداری می‌شوند.

مفاهیم فعلی:

```ts
type CollageMode = 'image' | 'video'
type CollageLayoutConstraintMode = 'controlled' | 'free'
type CollageCanvasAspectRatioLock = 'auto' | '1:1' | '16:9' | '9:16' | '2:1' | '3:2' | '3:1' | '3:7'
type CollageCanvasOutputSize = 'small' | 'medium' | 'large'
type CollageImageFitMode = 'cover' | 'detail'
type CollageBrandMode = 'overlay' | 'footer'
type CollageBrandFooterAlign = 'left' | 'center' | 'right'
type CollagePipPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
type CollagePipSize = 'small' | 'medium' | 'large'
```

PIP و transformها per-image هستند و با `image.id` map می‌شوند.

---

## Layout و canvas ratio

`createCollageLayout()` در `app/utils/collage/layout.ts` مسئول ساخت layout است.

نکات مهم:

- layout باید pure بماند.
- از DOM یا Vue ref داخل آن استفاده نشود.
- layout از `padding` پشتیبانی می‌کند.
- padding اکنون می‌تواند عدد ساده یا padding جهت‌دار باشد.
- برای Brand Footer، padding پایین بخش کلاژ صفر می‌شود تا فاصله اضافه بین cellها و footer ایجاد نشود.

### Canvas aspect ratio

رفتار فعلی:

- در حالت `auto`، نسبت خروجی بر اساس layout طبیعی محاسبه می‌شود.
- در حالت locked ratio، نسبت خروجی باید روی کل canvas نهایی اعمال شود.

### Brand Footer و ratio

در حالت Brand Footer:

```txt
final canvas = collage area + footer area
```

اگر ratio روی مقدار قفل‌شده باشد، نسبت انتخابی روی کل خروجی نهایی اعمال می‌شود، نه فقط بخش کلاژ.

```txt
finalCanvasRatio = selectedRatio
footerHeight = contentHeight + footerPadding * 2
collageAreaHeight = finalCanvasHeight - footerHeight
```

اگر ratio روی `auto` باشد، کلاژ با منطق فعلی ساخته می‌شود و footer به پایین خروجی اضافه می‌شود.

---

## Canvas output size

کاربر می‌تواند max side خروجی را انتخاب کند:

```txt
small  = 800
medium = 1200
large  = 2048
```

پیش‌فرض باید `large` باشد تا رفتار قدیمی 2048 حفظ شود.

این مقدار باید در render image mode و export image mode لحاظ شود. اگر تغییر می‌کند، view باید fit/reset شود.

---

## Export quality

کیفیت خروجی بین 30 تا 100 است.

رفتار فعلی:

- 100 یعنی کیفیت کامل مثل قبل.
- کمتر از 100 یعنی خروجی compressed برای حجم کمتر.

این setting در بخش Canvas قرار دارد و در localStorage ذخیره می‌شود.

---

## Canvas decorations

`canvasDecorationsEnabled` تعیین می‌کند که padding/gap/radius/background اعمال شوند یا نه.

اگر false باشد:

```txt
padding = 0
gap = 0
cell radius = 0
background visually ineffective / disabled in output
```

در UI هم کنترل‌های مربوط به padding/gap/radius/background مخفی می‌شوند.

---

## Cell radius

Cell radius از 0 تا 100 قابل تنظیم است و در drawing استفاده می‌شود. وقتی decorations disabled باشد، radius باید صفر شود.

---

## Drawing utilities

`app/utils/collage/drawing.ts` شامل helperهای canvas drawing است.

مسئولیت‌ها:

- rounded rect
- image cover
- image cover/detail with transform
- PIP drawing
- clipping داخل cell

هر تغییر در ظاهر cell، PIP، radius، image fit یا pan معمولاً این فایل را درگیر می‌کند.

---

## Cover / Detail

هر تصویر داخل سلول می‌تواند `cover` یا `detail` باشد.

- Cover: تصویر با cover معمولی داخل cell کشیده می‌شود.
- Detail: اگر تصویر اصلی بزرگ‌تر از cell باشد، scale نزدیک‌تر به 1:1 استفاده می‌شود تا جزئیات بیشتر دیده شود.

Pan در حالت detail با drag و keyboard انجام می‌شود. Pan باید clamp شود تا فضای خالی داخل cell دیده نشود.

Double click روی cell بین cover/detail toggle می‌کند.

---

## Selected cell

Renderer آخرین layout/cells را نگه می‌دارد و hit-test انجام می‌دهد.

رفتار:

- single click: select/deselect
- click روی فضای خالی wrapper: deselect
- selected-cell overlay فقط UI است و داخل export canvas نیست.

هر تغییری که مختصات نمایش canvas را تغییر دهد، باید selected-cell overlay را با view transform هماهنگ نگه دارد.

---

## Canvas view / navigation

`useCollageCanvasView.ts` مسئول zoom/pan/fit view است.

امکانات:

- wheel zoom around cursor
- middle mouse drag pan
- pan tool برای left-drag pan
- fit/reset هنگام تغییر تصاویر
- جلوگیری از cell selection هنگام panning

نکات حساس:

- هنگام اضافه/حذف/replace/clear تصاویر، view باید دوباره fit شود.
- اگر user در حال pan باشد، click action نباید اجرا شود.
- zoom باید حول cursor انجام شود.
- empty state باید canvas را با `v-show` مخفی کند.

---

## Context menu system

سیستم context menu با global menu پروژه کار می‌کند:

```ts
const { $menu } = useNuxtApp()
$menu.open({ mode: 'point', event, items })
```

برای page-level behavior از `app/composables/usePageContextMenu.ts` استفاده می‌شود.

### usePageContextMenu

این composable کمک می‌کند:

- native context menu در محدوده صفحه بسته شود.
- targetهای خاص مثل input/textarea/button/overlay نادیده گرفته شوند.
- منوی عمومی صفحه و منوهای اختصاصی item جدا شوند.
- از `items` یا `component + props` پشتیبانی شود.

### Menu layers

Current menu levels:

```txt
Default page menu:
  save | copy | clear | refresh

Empty wrapper/checkerboard menu:
  add image | shuffle images | shuffle layout | controlled/free | pan tool | toggle image/video | save | copy | clear

Cell menu:
  replace | select/replace PIP | cover/detail | reset position | remove

PIP menu:
  replace PIP | remove PIP | position | size
```

Cell و PIP از custom component menu استفاده می‌کنند:

```txt
app/components/collage/CellContextMenu.vue
app/components/collage/PipContextMenu.vue
app/components/collage/PipPositionIcon.vue
```

منوهای custom نباید width ثابت داشته باشند؛ عرض باید با محتوا هماهنگ شود.

---

## CellContextMenu.vue

منوی اختصاصی cell باید فشرده و تک‌خطی باشد.

ساختار UI فعلی:

```txt
[Select/Replace PIP] | [el-switch Cover] | [Replace] [Reset] [Remove]
```

نام فایل باید کوتاه شود و extension حفظ شود. فرمت پیشنهادی:

```txt
name... .ext
max ~16 chars
```

---

## PipContextMenu.vue

منوی PIP فقط optionهای PIP را نشان می‌دهد و نباید آیتم‌های عمومی یا cell actions را append کند.

ساختار:

- نام کوتاه فایل
- replace/remove PIP
- size: small / medium / large
- position selector با آیکون‌های داینامیک

چیدمان position باید معنایی و 3×3 باشد:

```txt
top-left     top-center     top-right
center-left  empty          center-right
bottom-left  bottom-center  bottom-right
```

---

## PipPositionIcon.vue

کامپوننت آیکون پوزیشن PIP با `el-grid` ساخته می‌شود.

ایده:

- wrapper مربع
- یک دایره وسط
- borderهای فعال بر اساس position
- `bc` می‌تواند آرایه رنگ داشته باشد:

```ts
bc: [top, right, bottom, left]
```

رنگ‌ها:

```txt
active border: normal
inactive border: normal0
center dot bg: normal
```

این کامپوننت باید purely visual باشد و behavior را parent کنترل کند.

---

## PIP overlay

PIP به `image.id` وصل است، نه به cell.

مزیت:

- اگر با Shift + S تصویر بین cellهای هم‌نسبت جابه‌جا شود، PIP همراه همان تصویر می‌ماند.

ویژگی‌ها:

- داخل canvas رندر می‌شود.
- در export دیده می‌شود.
- همیشه مربع است.
- تصویر داخل آن cover می‌شود.
- default position = bottom-right
- default size = small
- radius و shadow سبک دارد.

Object URL مربوط به PIP باید هنگام replace/remove/clear/unmount cleanup شود.

---

## Brand system

Brand دیگر فقط overlay نیست. ساختار فعلی:

```txt
brandOverlayEnabled: boolean
brandMode: overlay | footer
```

### Overlay mode

- رفتار قبلی.
- روی خود collage draw می‌شود.
- canvas dimensions را تغییر نمی‌دهد.

### Footer mode

- فقط برای image mode کامل شده است.
- footer پایین خروجی اضافه می‌شود.
- background از `backgroundColor` می‌آید.
- padding مستقل دارد.
- align مستقل دارد: left / center / right
- ratio locked روی کل final canvas اعمال می‌شود.
- bottom padding بخش کلاژ در این حالت صفر است.

### Brand panel UI

Brand panel به چند گروه UI تقسیم شده:

```txt
Mode / Placement
Text
Logo / QR
```

حداقل range ارتفاع لوگو باید 20 باشد.

عنوان پنل بهتر است عمومی باشد، مثل `Brand`، نه فقط `Brand Overlay`.

---

## LocalStorage persistence

تنظیمات editor در localStorage ذخیره می‌شوند.

نمونه موارد مهم:

```txt
activeMode
brandOverlayEnabled
brandMode
brandFooterPadding
brandFooterAlign
padding
gap
cellRadius
backgroundColor
canvasDecorationsEnabled
layoutConstraintMode
canvasAspectRatioLock
canvasOutputSize
imageExportQuality
collagePanelDocked
collagePanelVisible
```

نکته: تنظیمات per-image مثل PIP file object یا image object URL نباید ساده در localStorage ذخیره شوند.

---

## Shortcutها

Shortcutهای فعلی:

```txt
Shift + S = shuffle similar images
Shift + L = shuffle layout
Shift + C = toggle controlled/free
Arrow keys = pan selected detail image
Shift + Arrow = fast pan
```

هنگام focus روی input/textarea/select/contenteditable shortcutها نباید اجرا شوند.

---

## Image shuffle

دو نوع shuffle داریم:

### Similar image shuffle

- فرم layout ثابت می‌ماند.
- تصاویر با نسبت مشابه داخل cellهای هم‌گروه جابه‌جا می‌شوند.
- از seed استفاده می‌شود.

### Layout shuffle

- seed وارد layout algorithm می‌شود.
- فرم کلی layout می‌تواند تغییر کند.

---

## Empty state

وقتی image وجود ندارد:

- canvas باید با `v-show` مخفی باشد.
- empty state CTA نمایش داده شود.
- add image button باید file picker را باز کند.
- drag/drop و paste همچنان فعال باشند.

---

## Panel layout

پنل Collage Builder قابلیت dock/floating دارد.

ترتیب layout فعلی:

```txt
1. canvas options
2. panel
3. main box
```

رفتارها:

- switch کنار Collage Builder برای dock/floating.
- button در بالای canvas options برای باز/بستن پنل.
- در حالت undocked، پنل روی main box نمایش داده می‌شود.
- در حالت docked، پنل در کنار canvas options و قبل از main box قرار می‌گیرد.
- اگر docked ولی بسته باشد، ستون پنل نباید فضا اشغال کند.

---

## Video mode notes

فعلاً همه قابلیت‌های جدید کامل به video mode منتقل نشده‌اند.

قابلیت‌هایی که فعلاً image-first هستند:

- PIP overlay
- Brand footer mode
- بعضی context-specific export behaviors

برای افزودن به ویدئو باید این فایل‌ها بررسی شوند:

```txt
app/composables/collage/useCollageVideo.ts
app/utils/exportCanvasSliderMp4.ts
app/utils/canvasSliderRenderer.ts
```

و باید مشخص شود که frame dimensions و footer در MP4 چطور اعمال شوند.

---

## Translation keys مهم

کلیدهای جدید در namespaceهای زیر هستند:

```txt
pages.collage.canvas.*
pages.collage.layoutTools.*
pages.collage.brand.*
pages.collage.pip.*
pages.collage.actions.*
pages.collage.panel.*
pages.collage.zoom.*
pages.collage.emptyCanvas.*
```

در توسعه بعدی از متن hardcoded داخل template خودداری شود.

---

## نکات مهم برای پچ‌های آینده

قبل از ساخت هر پچ جدید، آخرین نسخه این فایل‌ها را بگیر:

```txt
app/pages/collage.vue
app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageOverlay.ts
app/composables/collage/useCollageCanvasView.ts
app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/types/collage.ts
```

اگر تغییر مربوط به image input یا PIP file cleanup باشد:

```txt
app/composables/collage/useCollageImages.ts
app/utils/collage/file.ts
```

اگر تغییر مربوط به menu custom باشد:

```txt
app/composables/usePageContextMenu.ts
app/components/collage/CellContextMenu.vue
app/components/collage/PipContextMenu.vue
app/components/collage/PipPositionIcon.vue
```

اگر تغییر به export/share مربوط باشد:

```txt
app/composables/collage/useCollageExport.ts
app/utils/collage/nativeShare.ts
```

اگر تغییر به video مربوط باشد:

```txt
app/composables/collage/useCollageVideo.ts
app/utils/exportCanvasSliderMp4.ts
app/utils/canvasSliderRenderer.ts
```

---

## خط قرمزهای توسعه

- `collage.vue` را با business logic سنگین پر نکن.
- layout algorithm را برای UI stateهای غیرضروری پیچیده نکن.
- object URL را بدون cleanup نساز.
- selected-cell overlay را وارد export نکن.
- PIP را به index سلول وصل نکن؛ باید با `image.id` بماند.
- تغییر zoom/pan نباید selection و context menu را خراب کند.
- تغییر footer نباید locked ratio را بشکند.
- تغییر brand overlay نباید video mode را ناخواسته خراب کند.
- menuهای custom نباید width ثابت غیرضروری داشته باشند.
- هنگام تغییر images، view باید fit/reset شود تا canvas گم یا deform نشود.

---

## وضعیت فعلی قابل اتکا

در آخرین وضعیت تاییدشده:

- image collage و export درست کار می‌کند.
- smart layout و ratio lock درست کار می‌کند.
- Brand overlay/footer در image mode کار می‌کند.
- PIP در image mode کار می‌کند و export می‌شود.
- context menu عمومی، cell و PIP درست تفکیک شده‌اند.
- zoom/pan و pan tool درست کار می‌کنند.
- dock/floating panel درست کار می‌کند.
- empty state و v-show canvas درست هستند.
- footer bottom padding fix اعمال شده است.

این فایل را در شروع چت‌های بعدی ارسال کن تا ادامه توسعه با context دقیق انجام شود.
