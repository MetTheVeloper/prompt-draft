# i18n Patches Guide

این فایل راهنمای سیستم پیدا کردن، ساختن و مرج کردن کلیدهای ترجمه‌ی گم‌شده در پروژه‌ی Prompt Draft است.

هدف این فایل این است که اگر بعدا دوباره با warningهای مربوط به i18n روبه‌رو شدیم، بدون توضیح دوباره بتوانیم بفهمیم:

* کلیدهای missing از کجا جمع‌آوری می‌شوند
* فایل‌های patch کجا باید ساخته شوند
* ساختار فایل‌های patch چطور است
* چطور patchها داخل فایل‌های اصلی ترجمه merge می‌شوند
* برای تغییر هر بخش باید کدام فایل را ویرایش کنیم

---

## مسیرهای مهم

### پلاگین جمع‌آوری کلیدهای missing

```txt
app/plugins/collect-missing-i18n-keys.client.ts
```

این پلاگین فقط در حالت dev اجرا می‌شود:

```ts
if (!import.meta.dev) return
```

کار این پلاگین این است که warningهای مربوط به i18n را از `console.warn` بخواند و کلیدهای ترجمه‌ای را که در فایل locale وجود ندارند، جمع کند.

فرمت warning مورد انتظار:

```txt
'modules.example.key' key in 'en' locale messages
```

در نسخه‌ی فعلی، پلاگین فقط کلیدهای missing مربوط به locale انگلیسی را جمع می‌کند:

```ts
if (locale === 'en') {
  missingKeys.add(key)
}
```

چون ساختار `en.ts` و `fa.ts` باید یکسان باشد، معمولا جمع کردن کلیدهای missing از `en` کافی است و بعدا همان کلیدها برای هر دو فایل `en.missing.ts` و `fa.missing.ts` ساخته می‌شوند.

---

### اسکریپت merge کردن patchها

```txt
scripts/merge-i18n.ts
```

این اسکریپت فایل patch را می‌خواند، کلیدهای flat را به ساختار nested تبدیل می‌کند و بعد آن‌ها را داخل فایل اصلی locale merge می‌کند.

برای مثال این کلید flat:

```ts
"modules.style.fields.visualTreatment.placeholder"
```

در نهایت داخل فایل اصلی locale به این ساختار تبدیل می‌شود:

```ts
modules: {
  style: {
    fields: {
      visualTreatment: {
        placeholder: "..."
      }
    }
  }
}
```

---

### پوشه‌ی patchها

```txt
scripts/i18n-patches
```

داخل این پوشه باید فایل‌های missing ساخته شوند:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

---

## روند کامل اصلاح کلیدهای missing

### 1. اجرای پروژه در حالت dev

ابتدا پروژه را در حالت dev اجرا کن:

```bash
pnpm dev
```

بعد داخل مرورگر در صفحات مختلف پروژه بچرخ.

نکته مهم:

کلیدهای missing فقط زمانی warning می‌دهند که همان بخش از UI واقعا render شده باشد. پس برای جمع‌آوری کامل‌تر باید بخش‌های مختلف را باز کنی، مثلا:

* صفحات اصلی پروژه
* صفحه create
* صفحه guide
* صفحه collage
* پنل‌های module
* selectها و presetها
* حالت‌های مختلف prompt mode
* بخش‌هایی که با شرط `v-if` نمایش داده می‌شوند
* modalها، dropdownها، empty stateها و validation messageها

---

### 2. گرفتن لیست کلیدهای missing از console

بعد از اینکه در بخش‌های مختلف پروژه چرخیدی، در Console مرورگر این دستور را اجرا کن:

```js
dumpMissingI18nKeys()
```

این دستور:

* لیست کلیدهای missing را sort می‌کند
* آن‌ها را با `console.table` نمایش می‌دهد
* تلاش می‌کند کل لیست را در clipboard کپی کند
* اگر clipboard کار نکند، لیست را در console چاپ می‌کند

خروجی معمولا چیزی شبیه این است:

```txt
modules.colorPalette.fields.customText.label
modules.colorPalette.fields.customText.placeholder
modules.colorPalette.fields.paletteAssignments.placeholder
modules.style.fields.visualTreatment.placeholder
```

---

## ساخت فایل‌های patch

بعد از گرفتن لیست کلیدها، باید برای هر locale یک فایل patch بسازیم.

### فایل انگلیسی

مسیر:

```txt
scripts/i18n-patches/en.missing.ts
```

ساختار:

```ts
export default {
  "modules.colorPalette.fields.customText.label": "Custom Color Palette Override",
  "modules.colorPalette.fields.customText.placeholder": "Write a complete custom color palette description...",
  "modules.colorPalette.fields.paletteAssignments.placeholder": "Select palette assignments",
  "modules.style.fields.visualTreatment.placeholder": "Select visual treatment",
}
```

---

### فایل فارسی

مسیر:

```txt
scripts/i18n-patches/fa.missing.ts
```

ساختار:

```ts
export default {
  "modules.colorPalette.fields.customText.label": "جایگزین دستی پالت رنگ",
  "modules.colorPalette.fields.customText.placeholder": "توضیح کامل پالت رنگ را به صورت دستی بنویس...",
  "modules.colorPalette.fields.paletteAssignments.placeholder": "نحوه پخش رنگ‌ها را انتخاب کن",
  "modules.style.fields.visualTreatment.placeholder": "نوع پرداخت بصری را انتخاب کن",
}
```

---

## قانون مهم برای ساخت patch

فایل‌های patch باید flat باشند، نه nested.

درست:

```ts
export default {
  "modules.style.fields.visualTreatment.placeholder": "Select visual treatment",
}
```

اشتباه:

```ts
export default {
  modules: {
    style: {
      fields: {
        visualTreatment: {
          placeholder: "Select visual treatment",
        },
      },
    },
  },
}
```

دلیلش این است که خود اسکریپت `merge-i18n.ts` کلیدهای flat را با تابع `flatToNested` به ساختار nested تبدیل می‌کند.

---

## اجرای اسکریپت merge

### اجرای تستی بدون تغییر فایل اصلی

برای انگلیسی:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
```

برای فارسی:

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa
```

در این حالت اسکریپت فایل اصلی را تغییر نمی‌دهد و خروجی تستی می‌سازد:

```txt
i18n/locales/en.merged.ts
i18n/locales/fa.merged.ts
```

از این حالت برای بررسی امن استفاده می‌کنیم.

---

### merge واقعی داخل فایل‌های اصلی

برای انگلیسی:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write
```

برای فارسی:

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa --write
```

در این حالت فایل‌های اصلی تغییر می‌کنند:

```txt
i18n/locales/en.ts
i18n/locales/fa.ts
```

قبل از تغییر، اسکریپت به صورت خودکار backup می‌سازد:

```txt
i18n/locales/en.ts.bak.<timestamp>
i18n/locales/fa.ts.bak.<timestamp>
```

---

### merge با overwrite

به صورت پیش‌فرض اگر کلیدی از قبل در فایل locale وجود داشته باشد، اسکریپت آن را تغییر نمی‌دهد و در بخش `Skipped existing` نمایش می‌دهد.

اگر بخواهیم مقدارهای موجود هم با مقدارهای patch جایگزین شوند:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write --overwrite
```

```bash
pnpm tsx scripts/merge-i18n.ts --locale fa --write --overwrite
```

از `--overwrite` فقط وقتی استفاده کن که مطمئن هستی مقدارهای جدید باید جایگزین مقدارهای قبلی شوند.

---

## اجرای اسکریپت با مسیر سفارشی

اگر لازم شد فایل locale یا patch را دستی مشخص کنی:

```bash
pnpm tsx scripts/merge-i18n.ts \
  --locale en \
  --file i18n/locales/en.ts \
  --patch scripts/i18n-patches/en.missing.ts \
  --write
```

برای فارسی:

```bash
pnpm tsx scripts/merge-i18n.ts \
  --locale fa \
  --file i18n/locales/fa.ts \
  --patch scripts/i18n-patches/fa.missing.ts \
  --write
```

---

## خروجی اسکریپت چه معنی دارد؟

بعد از اجرا، اسکریپت اطلاعاتی شبیه این نمایش می‌دهد:

```txt
Locale: en
Patch: scripts/i18n-patches/en.missing.ts
Output: /project/i18n/locales/en.ts

Added: 12
Skipped existing: 3
Overwritten: 0
```

معنی بخش‌ها:

### Added

کلیدهایی که قبلا در فایل locale وجود نداشتند و اضافه شدند.

### Skipped existing

کلیدهایی که از قبل وجود داشتند و چون `--overwrite` نداده بودیم، تغییر نکردند.

### Overwritten

کلیدهایی که از قبل وجود داشتند ولی به خاطر استفاده از `--overwrite` با مقدار جدید جایگزین شدند.

---

## نکات مهم هنگام ساخت ترجمه‌ها

### 1. کلیدهای en و fa باید یکی باشند

اگر در `en.missing.ts` این کلید را داریم:

```ts
"modules.style.fields.visualTreatment.placeholder"
```

باید در `fa.missing.ts` هم دقیقا همین کلید وجود داشته باشد.

فقط مقدار ترجمه فرق می‌کند.

---

### 2. کلیدها را دستی nested نکن

همیشه patchها را flat نگه دار.

---

### 3. برای labelها متن کوتاه استفاده کن

مثال خوب:

```ts
"modules.camera.fields.lens.label": "Lens"
```

```ts
"modules.camera.fields.lens.label": "لنز"
```

---

### 4. برای placeholderها جمله‌ی راهنما بنویس

مثال خوب:

```ts
"modules.camera.fields.lens.placeholder": "Select camera lens"
```

```ts
"modules.camera.fields.lens.placeholder": "لنز دوربین را انتخاب کن"
```

---

### 5. برای descriptionها توضیح کمی کامل‌تر بده

مثال:

```ts
"modules.style.presets.cinematic_realism.description": "Realistic cinematic look with dramatic lighting and polished detail"
```

```ts
"modules.style.presets.cinematic_realism.description": "ظاهر سینمایی واقع‌گرا با نورپردازی دراماتیک و جزئیات پرداخت‌شده"
```

---

### 6. لحن ترجمه فارسی

در پروژه Prompt Draft بهتر است فارسی:

* روان باشد
* خیلی رسمی نباشد
* برای UI کوتاه و قابل فهم باشد
* برای placeholderها حالت راهنمایی داشته باشد
* برای توضیحات moduleها کمی توصیفی‌تر باشد

مثال:

```ts
"Select visual treatment"
```

ترجمه بهتر:

```ts
"نوع پرداخت بصری را انتخاب کن"
```

نه خیلی خشک:

```ts
"پردازش تصویری را انتخاب نمایید"
```

---

## وقتی دوباره از ChatGPT کمک می‌گیریم

اگر در آینده دوباره خواستی برای اصلاح ترجمه‌ها کمک بگیری، کافی است این موارد را بدهی:

1. لیست کلیدهای خروجی از:

```js
dumpMissingI18nKeys()
```

2. اگر لازم بود، موضوع یا context آن بخش از UI

بعد ChatGPT باید برایت دو فایل بسازد:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

با ساختار flat:

```ts
export default {
  "some.missing.key": "Translated value",
}
```

بعد با اسکریپت merge می‌کنی.

---

## چک‌لیست سریع

### مرحله 1

پروژه را اجرا کن:

```bash
pnpm dev
```

### مرحله 2

در UI بچرخ و بخش‌های مختلف را باز کن.

### مرحله 3

در Console اجرا کن:

```js
dumpMissingI18nKeys()
```

### مرحله 4

لیست کلیدها را تبدیل کن به:

```txt
scripts/i18n-patches/en.missing.ts
scripts/i18n-patches/fa.missing.ts
```

### مرحله 5

اول dry-run بگیر:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
pnpm tsx scripts/merge-i18n.ts --locale fa
```

### مرحله 6

اگر خروجی درست بود، merge واقعی انجام بده:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --write
pnpm tsx scripts/merge-i18n.ts --locale fa --write
```

### مرحله 7

دوباره پروژه را تست کن و ببین warningها رفع شده‌اند یا نه.

---

## اگر `pnpm tsx` کار نکرد

اگر دستور زیر خطا داد:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en
```

احتمالا `tsx` در dev dependencies نصب نیست.

نصب:

```bash
pnpm add -D tsx
```

بعد دوباره اجرا کن.

---

## خلاصه فایل‌ها

| مسیر                                              | کاربرد                                              |
| ------------------------------------------------- | --------------------------------------------------- |
| `app/plugins/collect-missing-i18n-keys.client.ts` | جمع‌آوری warningهای missing i18n در حالت dev        |
| `scripts/merge-i18n.ts`                           | merge کردن فایل‌های patch داخل فایل‌های اصلی locale |
| `scripts/i18n-patches/en.missing.ts`              | patch کلیدهای missing انگلیسی                       |
| `scripts/i18n-patches/fa.missing.ts`              | patch کلیدهای missing فارسی                         |
| `i18n/locales/en.ts`                              | فایل اصلی ترجمه انگلیسی                             |
| `i18n/locales/fa.ts`                              | فایل اصلی ترجمه فارسی                               |

---

## نکته برای آینده

اگر بعدا لازم شد کلیدهای missing مربوط به locale فارسی هم جداگانه جمع‌آوری شوند، می‌توانیم پلاگین را از این حالت:

```ts
if (locale === 'en') {
  missingKeys.add(key)
}
```

به یکی از این حالت‌ها تغییر بدهیم:

### فقط فارسی

```ts
if (locale === 'fa') {
  missingKeys.add(key)
}
```

### همه‌ی localeها

```ts
missingKeys.add(`${locale}:${key}`)
```

اما در حالت فعلی، چون هدف ما یکسان نگه داشتن ساختار `en.ts` و `fa.ts` است، جمع‌آوری کلیدهای missing از `en` معمولا کافی و تمیزتر است.
