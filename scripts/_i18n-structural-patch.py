from pathlib import Path
import json


def replace(path: str, old: str, new: str, expected: int | None = None):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if expected is not None and count != expected:
        raise SystemExit(f"{path}: expected {expected} occurrences, got {count}: {old!r}")
    if not count:
        raise SystemExit(f"{path}: pattern not found: {old!r}")
    p.write_text(text.replace(old, new), encoding="utf-8")
    print(f"{path}: {count} replacement(s)")


replace(
    "app/pages/create.vue",
    'const { t, locale } = useI18n();',
    'const { t, locale, localeProperties } = useI18n();\n\nconst localeLanguage = computed(() => localeProperties.value?.language || locale.value);',
    1,
)
replace("app/pages/create.vue", 'locale.value === "fa" ? "fa-IR" : "en-US",', 'localeLanguage.value,', 1)
replace(
    "app/pages/create.vue",
    'date.toLocaleTimeString(locale.value === "fa" ? "fa-IR" : "en-US", {',
    'date.toLocaleTimeString(localeLanguage.value, {',
    1,
)

replace("app/components/prompts/PromptItem.vue", 'const { t, locale } = useI18n()', 'const { t, locale, localeProperties } = useI18n()', 1)
replace(
    "app/components/prompts/PromptItem.vue",
    "locale.value === 'fa' ? 'fa-IR' : 'en-US',",
    "localeProperties.value?.language || locale.value,",
    1,
)

replace("app/components/prompts/PromptDetail.vue", 'const { t, locale } = useI18n()', 'const { t, locale, localeProperties } = useI18n()', 1)
replace(
    "app/components/prompts/PromptDetail.vue",
    "locale.value === 'fa' ? 'fa-IR' : 'en-US',",
    "localeProperties.value?.language || locale.value,",
    1,
)
replace(
    "app/components/prompts/PromptDetail.vue",
    "const backIcon = computed(() => locale.value === 'fa' ? 'arrow-right' : 'arrow-left')",
    "const backIcon = computed(() => localeProperties.value?.dir === 'rtl' ? 'arrow_forward' : 'arrow_back')",
    1,
)

path = Path("app/components/el/text.vue")
text = path.read_text(encoding="utf-8")
old = '''const toPersianDigits = (str) => {
  return str.replace(/\\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

const toEnglishDigits = (str) => {
  return str.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
};'''
new = '''const toEnglishDigits = (str) => {
  return str
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
};

const toPersianDigits = (str) => {
  return toEnglishDigits(str).replace(/\\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

const toArabicDigits = (str) => {
  return toEnglishDigits(str).replace(/\\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
};'''
if text.count(old) != 1:
    raise SystemExit("app/components/el/text.vue: digit helper block mismatch")
text = text.replace(old, new, 1)
old = '''      if (locale.value === "fa") {
        if (props.localize) {
          text = toPersianDigits(text);
        }
      } else {
        text = toEnglishDigits(text);
      }'''
new = '''      if (locale.value === "fa") {
        if (props.localize) {
          text = toPersianDigits(text);
        }
      } else if (locale.value === "ar") {
        text = props.localize ? toArabicDigits(text) : toEnglishDigits(text);
      } else {
        text = toEnglishDigits(text);
      }'''
if text.count(old) != 1:
    raise SystemExit("app/components/el/text.vue: localizedText block mismatch")
path.write_text(text.replace(old, new, 1), encoding="utf-8")

path = Path("app/assets/css/app.scss")
text = path.read_text(encoding="utf-8")
marker = """html[lang='fa'],
html[lang='ar'] {
  --app-font-family: 'persian', 'Vazirmatn', system-ui, sans-serif;
}
"""
addition = marker + """
html[lang='zh'] {
  --app-font-family: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

html[lang='ru'] {
  --app-font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
"""
if marker not in text:
    raise SystemExit("app/assets/css/app.scss: locale font marker missing")
path.write_text(text.replace(marker, addition, 1), encoding="utf-8")

validator = """import en from '../i18n/locales/en'\nimport fa from '../i18n/locales/fa'\nimport zh from '../i18n/locales/zh'\nimport ar from '../i18n/locales/ar'\nimport ru from '../i18n/locales/ru'\n\ntype Messages = Record<string, unknown>\n\nfunction flatten(value: Messages, prefix = '', out: Record<string, string> = {}) {\n  for (const [key, child] of Object.entries(value)) {\n    const path = prefix ? `${prefix}.${key}` : key\n    if (typeof child === 'string') out[path] = child\n    else if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child as Messages, path, out)\n  }\n  return out\n}\n\nconst source = flatten(en as Messages)\nconst sourceKeys = Object.keys(source).sort()\nconst interpolationPattern = /\\{[^{}]+\\}/g\nconst tokens = (value: string) => [...(value.match(interpolationPattern) || [])].sort()\n\nfunction validateLocale(code: string, messages: Messages) {\n  const target = flatten(messages)\n  const targetKeys = Object.keys(target).sort()\n  const missing = sourceKeys.filter(key => !(key in target))\n  const extra = targetKeys.filter(key => !(key in source))\n  const interpolationErrors = sourceKeys.filter(key => key in target && tokens(source[key]).join('|') !== tokens(target[key]).join('|'))\n  console.log(`[i18n] ${code}: ${targetKeys.length} strings`)\n  if (missing.length) console.error(`[i18n] ${code}: missing`, missing.slice(0, 30))\n  if (extra.length) console.error(`[i18n] ${code}: extra`, extra.slice(0, 30))\n  if (interpolationErrors.length) console.error(`[i18n] ${code}: interpolation`, interpolationErrors.slice(0, 30))\n  return !missing.length && !extra.length && !interpolationErrors.length\n}\n\nconst locales: Record<string, Messages> = { fa: fa as Messages, zh: zh as Messages, ar: ar as Messages, ru: ru as Messages }\nif (!Object.entries(locales).every(([code, messages]) => validateLocale(code, messages))) process.exit(1)\nconsole.log(`[i18n] OK: all locales match canonical en.ts (${sourceKeys.length} strings)`)\n"""
Path("scripts/validate-i18n.ts").write_text(validator, encoding="utf-8")

package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package.setdefault("scripts", {})["i18n:validate"] = "tsx scripts/validate-i18n.ts"
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

doc = """# Internationalization

English (`i18n/locales/en.ts`) is the canonical translation key tree. Prompt Draft ships with `en` (LTR), `fa` (RTL), `zh` Simplified Chinese (LTR), `ar` (RTL), and `ru` (LTR).

Locale metadata (`code`, display `name`, BCP-47 `language`, and `dir`) lives in `nuxt.config.ts`; messages are registered in `i18n/i18n.config.ts`.

## Direction and formatting

`app/plugins/locale-dom.client.ts` synchronizes `lang` and `dir` on `html`, `body`, and `#teleports`. Use `localeProperties.dir` for direction-dependent behavior instead of `locale === 'fa'`. Use `localeProperties.language` for locale-aware dates and times.

Persian and Arabic use the existing local Persian/Vazirmatn stack. Chinese and Russian use offline-safe system UI stacks.

## Updating translations

Add new keys to `en.ts` first, then mirror the same key/nesting into every locale. Preserve interpolation tokens such as `{count}`, `{name}`, `{size}`, and `{progress}` exactly.

Validate after translation changes:

```bash
pnpm i18n:validate
pnpm generate
```

The validator checks `fa`, `zh`, `ar`, and `ru` against `en.ts` for missing/extra keys and interpolation mismatches.

`scripts/merge-i18n.ts` already accepts `--locale`, so the existing patch workflow can be used for all locale files.
"""
Path("docs/i18n.md").write_text(doc, encoding="utf-8")

print("multilingual structural patch prepared")
