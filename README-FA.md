# پچ Offline Package برای Prompt Draft

این پچ سیستم آفلاین PWA را به‌صورت opt-in اضافه می‌کند. Service Worker ثبت می‌شود، اما دانلود کامل پروژه فقط بعد از تأیید کاربر داخل نسخه نصب‌شده PWA شروع خواهد شد.

## فایل‌های پچ

فایل‌ها را با حفظ مسیر روی پروژه جایگزین یا اضافه کن:

```text
package.json
app/components/Header.vue
app/components/el/pwa.vue
app/composables/useOfflinePackage.ts
app/plugins/service-worker.client.ts
app/pages/index.vue
public/sw.js
scripts/generate-offline-manifest.ts
```

فایل‌های `translations/en.ts` و `translations/fa.ts` نسخه‌های پچ‌شده همان فایل‌های ترجمه‌ای هستند که ارسال کردی. چون مسیر اصلی این دو فایل داخل tree ارسالی دیده نمی‌شد، آن‌ها را در مسیر فعلی localeهای پروژه خودت جایگزین کن.

## Build و Deploy

همان دستور قبلی را اجرا کن:

```bash
pnpm generate
```

بعد از پایان Nuxt Generate، اسکریپت جدید تمام فایل‌های `.output/public` را اسکن می‌کند و این فایل را می‌سازد:

```text
.output/public/offline-manifest.json
```

سپس مثل قبل تمام محتوای این مسیر را Deploy کن:

```text
.output/public
```

در خروجی Build باید هر دو فایل زیر وجود داشته باشند:

```text
sw.js
offline-manifest.json
```

## رفتار سیستم

- Service Worker از مسیر صحیح `/sw.js` ثبت می‌شود.
- پیشنهاد دانلود بسته آفلاین فقط در حالت `standalone` یعنی نسخه نصب‌شده PWA نمایش داده می‌شود.
- با تأیید کاربر، تمام فایل‌های خروجی شامل ۹۴ تصویر اسلایدر، فونت‌ها، FFmpeg، صفحات و فایل‌های `_nuxt` دانلود می‌شوند.
- درصد پیشرفت بر اساس تعداد فایل‌های کامل‌شده در Header نمایش داده می‌شود.
- دانلود ناقص داخل cache نسخه فعلی باقی می‌ماند و دفعه بعد ادامه پیدا می‌کند.
- نسخه کامل قبلی تا پایان موفق دانلود نسخه جدید حذف نمی‌شود.
- نسخه بسته از hash محتوای واقعی Build ساخته می‌شود؛ افزایش دستی `CACHE_VERSION` لازم نیست.
- هنگام آفلاین بودن، مسیرهایی مثل `/create` و `/vectorizer` به HTML کش‌شده همان صفحه یا App Shell برمی‌گردند.

## تست پیشنهادی

1. نسخه جدید را Deploy کن.
2. DevTools > Application > Service Workers را باز کن و بررسی کن `/sw.js` ثبت شده باشد.
3. PWA را نصب و از آیکون نصب‌شده باز کن.
4. مودال دانلود آفلاین را تأیید کن.
5. صبر کن Header به ۱۰۰٪ برسد.
6. در Application > Cache Storage وجود cache با نام `prompt-draft-offline-...` را بررسی کن.
7. اینترنت را قطع یا DevTools را روی Offline قرار بده و صفحات `/`، `/create`، `/collage` و `/vectorizer` را تست کن.

## نکته مرورگر موبایل

دانلود در Service Worker و بدون قفل‌کردن رابط انجام می‌شود. تا وقتی اپ باز است روند دانلود ادامه دارد؛ اگر سیستم‌عامل اپ را کاملاً suspend یا terminate کند، فایل‌های دانلودشده از بین نمی‌روند و اجرای بعدی از همان cache ناقص ادامه می‌دهد.
