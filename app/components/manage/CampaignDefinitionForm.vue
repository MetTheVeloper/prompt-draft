<script setup lang="ts">
import type {
  AdminCampaignDefinition,
  AdminCampaignValidationIssue,
} from "~/types/adminCampaignApi";

type JsonObject = Record<string, any>;
type CampaignLocale = "en" | "fa";
type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const props = withDefaults(defineProps<{
  modelValue: AdminCampaignDefinition;
  slug: string;
  internalName: string;
  headEditable?: boolean;
  disabled?: boolean;
  issues?: AdminCampaignValidationIssue[];
}>(), {
  headEditable: false,
  disabled: false,
  issues: () => [],
});

const emit = defineEmits<{
  (event: "update:modelValue", value: AdminCampaignDefinition): void;
  (event: "update:slug", value: string): void;
  (event: "update:internalName", value: string): void;
}>();

const { t } = useI18n();
const { mini } = useScreen();
const localeContentColumns = computed(() => mini.value ? 1 : 2);

const OBJECTIVE_TYPES = [
  "acquisition",
  "activation",
  "education",
  "engagement",
  "retention",
  "reactivation",
  "referral",
  "conversion",
  "monetization",
  "other",
] as const;

const objectiveItems = computed(() => OBJECTIVE_TYPES.map(value => ({
  value,
  label: t(`manage.marketing.builder.objectives.${value}`),
  description: t(`manage.marketing.builder.objectiveDescriptions.${value}`),
})));

const rendererItems = computed(() => [
  {
    value: "builtin:campaign-default-v1",
    label: t("manage.marketing.builder.renderers.default"),
    description: "campaign-default-v1",
  },
]);

const localeItems = computed(() => [
  { value: "en", label: t("manage.marketing.builder.locales.en") },
  { value: "fa", label: t("manage.marketing.builder.locales.fa") },
]);

const seoIndexingItems = computed(() => [
  { value: "noindex", label: t("manage.marketing.builder.indexing.noindex") },
  { value: "index", label: t("manage.marketing.builder.indexing.index") },
]);

const seoEndBehaviorItems = computed(() => [
  { value: "archive", label: t("manage.marketing.builder.endBehavior.archive") },
  { value: "gone", label: t("manage.marketing.builder.endBehavior.gone") },
  { value: "redirect", label: t("manage.marketing.builder.endBehavior.redirect") },
]);

const FALLBACK_TIMEZONES = [
  "UTC",
  "Asia/Tehran",
  "Asia/Dubai",
  "Asia/Istanbul",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

function supportedTimezones() {
  try {
    const values = (Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }).supportedValuesOf?.("timeZone");
    return values?.length ? values : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
}

function cloneDefinition(value: AdminCampaignDefinition): JsonObject {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function getPath(path: string[], fallback: any = undefined) {
  let current: any = props.modelValue ?? {};
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

function ensureObjectPath(root: JsonObject, path: string[]) {
  let current = root;
  for (const key of path) {
    const existing = current[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) current[key] = {};
    current = current[key];
  }
  return current;
}

function patchDefinition(mutator: (next: JsonObject) => void) {
  const next = cloneDefinition(props.modelValue);
  mutator(next);
  emit("update:modelValue", next);
}

function setPath(path: string[], value: any) {
  if (!path.length) return;
  patchDefinition((next) => {
    const parent = ensureObjectPath(next, path.slice(0, -1));
    const finalKey = path[path.length - 1];
    if (value === undefined) delete parent[finalKey];
    else parent[finalKey] = value;
  });
}

function issuesFor(prefixes: string[]) {
  return props.issues.filter((issue) => {
    const path = issue.path || issue.field || "";
    return prefixes.some(prefix => path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`));
  });
}

function issueLabel(issue: AdminCampaignValidationIssue) {
  const path = issue.path || issue.field;
  return path ? `${path}: ${issue.message}` : issue.message;
}

const basicsIssues = computed(() => issuesFor(["schemaVersion", "identity"]));
const objectiveIssues = computed(() => issuesFor(["objective"]));
const scheduleIssues = computed(() => issuesFor(["lifecycle"]));
const eligibilityIssues = computed(() => issuesFor(["eligibility"]));
const experienceIssues = computed(() => issuesFor(["experience"]));

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateTimeLocal(value: string): DateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function partsInTimeZone(timestamp: number, zone: string): DateTimeParts | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestamp))
        .filter(part => part.type !== "literal")
        .map(part => [part.type, part.value]),
    );
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
    };
  } catch {
    return null;
  }
}

function isoToLocalDateTime(iso: string, zone: string) {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "";
  const parts = partsInTimeZone(timestamp, zone);
  if (!parts) return "";
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

function localDateTimeToIso(value: string, zone: string) {
  const target = parseDateTimeLocal(value);
  if (!target) return "";

  const targetAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  let guess = targetAsUtc;

  for (let index = 0; index < 4; index += 1) {
    const projected = partsInTimeZone(guess, zone);
    if (!projected) return "";
    const projectedAsUtc = Date.UTC(
      projected.year,
      projected.month - 1,
      projected.day,
      projected.hour,
      projected.minute,
    );
    const delta = targetAsUtc - projectedAsUtc;
    guess += delta;
    if (!delta) break;
  }

  const verified = partsInTimeZone(guess, zone);
  if (!verified || Object.keys(target).some(key => verified[key as keyof DateTimeParts] !== target[key as keyof DateTimeParts])) {
    return "";
  }
  return new Date(guess).toISOString();
}

const slugModel = computed({
  get: () => props.slug,
  set: (value: string) => {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    emit("update:slug", normalized);
    setPath(["identity", "slug"], normalized);
  },
});

const internalNameModel = computed({
  get: () => props.internalName,
  set: (value: string) => {
    emit("update:internalName", value);
    setPath(["identity", "internalName"], value);
  },
});

const schemaVersion = computed({
  get: () => String(getPath(["schemaVersion"], "campaign.v1")),
  set: (value: string) => setPath(["schemaVersion"], value),
});

const objectiveType = computed({
  get: () => String(getPath(["objective", "type"], "engagement")),
  set: (value: string | number | boolean | null) => setPath(["objective", "type"], String(value ?? "engagement")),
});

const timezone = computed({
  get: () => String(getPath(["lifecycle", "timezone"], "Asia/Tehran")),
  set: (value: string | number | boolean | null) => {
    const nextZone = String(value ?? "UTC");
    const previousZone = String(getPath(["lifecycle", "timezone"], "Asia/Tehran"));
    const startsWallTime = isoToLocalDateTime(String(getPath(["lifecycle", "startsAt"], "")), previousZone);
    const endsWallTime = isoToLocalDateTime(String(getPath(["lifecycle", "endsAt"], "") ?? ""), previousZone);

    patchDefinition((next) => {
      const lifecycle = ensureObjectPath(next, ["lifecycle"]);
      lifecycle.timezone = nextZone;
      if (startsWallTime) lifecycle.startsAt = localDateTimeToIso(startsWallTime, nextZone) || lifecycle.startsAt;
      if (endsWallTime) lifecycle.endsAt = localDateTimeToIso(endsWallTime, nextZone) || lifecycle.endsAt;
    });
  },
});

const timezoneItems = computed(() => {
  const current = timezone.value;
  const values = Array.from(new Set([...supportedTimezones(), current])).filter(Boolean).sort();
  return values.map(value => ({ value, label: value }));
});

const startsAtLocal = computed({
  get: () => isoToLocalDateTime(String(getPath(["lifecycle", "startsAt"], "")), timezone.value),
  set: (value: string) => {
    const iso = localDateTimeToIso(value, timezone.value);
    if (iso) setPath(["lifecycle", "startsAt"], iso);
  },
});

const endsAtLocal = computed({
  get: () => isoToLocalDateTime(String(getPath(["lifecycle", "endsAt"], "") ?? ""), timezone.value),
  set: (value: string) => {
    if (!value) {
      setPath(["lifecycle", "endsAt"], null);
      return;
    }
    const iso = localDateTimeToIso(value, timezone.value);
    if (iso) setPath(["lifecycle", "endsAt"], iso);
  },
});

const authenticated = computed({
  get: () => getPath(["eligibility", "authenticated"], true) === true,
  set: (value: boolean) => setPath(["eligibility", "authenticated"], value),
});

const hasEligibilityRules = computed(() => {
  const rules = getPath(["eligibility", "rules"], null);
  return Boolean(rules && typeof rules === "object");
});

const rendererRef = computed({
  get: () => {
    const kind = String(getPath(["experience", "renderer", "kind"], "builtin"));
    const key = String(getPath(["experience", "renderer", "key"], "campaign-default-v1"));
    return `${kind}:${key}`;
  },
  set: (value: string | number | boolean | null) => {
    const raw = String(value ?? "builtin:campaign-default-v1");
    const separator = raw.indexOf(":");
    setPath(["experience", "renderer"], {
      kind: separator >= 0 ? raw.slice(0, separator) : "builtin",
      key: separator >= 0 ? raw.slice(separator + 1) : raw,
    });
  },
});

const locales = computed<CampaignLocale[]>({
  get: () => {
    const value = getPath(["experience", "locales"], ["en", "fa"]);
    if (!Array.isArray(value)) return ["en", "fa"];
    return value.filter((locale): locale is CampaignLocale => locale === "en" || locale === "fa");
  },
  set: (value) => {
    const normalized = value.filter((locale): locale is CampaignLocale => locale === "en" || locale === "fa");
    const selected = normalized.length ? normalized : ["en"];
    patchDefinition((next) => {
      const experience = ensureObjectPath(next, ["experience"]);
      experience.locales = selected;
      const currentDefault = typeof experience.defaultLocale === "string" ? experience.defaultLocale : "en";
      if (!selected.includes(currentDefault as CampaignLocale)) experience.defaultLocale = selected[0];
    });
  },
});

const defaultLocaleItems = computed(() => localeItems.value.filter(item => locales.value.includes(item.value as CampaignLocale)));
const defaultLocale = computed({
  get: () => String(getPath(["experience", "defaultLocale"], locales.value[0] || "en")),
  set: (value: string | number | boolean | null) => setPath(["experience", "defaultLocale"], String(value ?? "en")),
});

function localizedContentField(locale: CampaignLocale, field: "title" | "description") {
  return computed({
    get: () => String(getPath(["experience", "content", locale, field], "")),
    set: (value: string) => setPath(["experience", "content", locale, field], value),
  });
}

const titleEn = localizedContentField("en", "title");
const descriptionEn = localizedContentField("en", "description");
const titleFa = localizedContentField("fa", "title");
const descriptionFa = localizedContentField("fa", "description");

const seoIndexing = computed({
  get: () => String(getPath(["experience", "seo", "indexing"], "noindex")),
  set: (value: string | number | boolean | null) => setPath(["experience", "seo", "indexing"], String(value ?? "noindex")),
});
const seoEndBehavior = computed({
  get: () => String(getPath(["experience", "seo", "endBehavior"], "archive")),
  set: (value: string | number | boolean | null) => setPath(["experience", "seo", "endBehavior"], String(value ?? "archive")),
});
const seoRedirectPath = computed({
  get: () => String(getPath(["experience", "seo", "redirectPath"], "")),
  set: (value: string) => setPath(["experience", "seo", "redirectPath"], value.trim() || undefined),
});

const currentRendererItems = computed(() => {
  if (rendererItems.value.some(item => item.value === rendererRef.value)) return rendererItems.value;
  return [{ value: rendererRef.value, label: rendererRef.value, description: t("manage.marketing.builder.renderers.legacy") }, ...rendererItems.value];
});
</script>

<template>
  <el-flex rules="css" :gap="14" class="w100" :class="{ 'campaign-definition-form--mini': mini }">
    <el-flex rules="css" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex :rules="mini ? 'css' : 'rbs'" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8"><el-icon icon="badge" :size="18" color="prim" /><el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.basics") }}</el-text></el-flex>
        <el-text :size="11" color="normal55" :class="{ w100: mini }">{{ t("manage.marketing.builder.hints.basics") }}</el-text>
      </el-flex>
      <el-grid cols="repeat(auto-fit, minmax(220px, 1fr))" :gap="12" class="w100">
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.fields.slug") }}</el-text><el-text-field v-model="slugModel" :actions="false" :disabled="disabled || !headEditable" dir="ltr" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.fields.internalName") }}</el-text><el-text-field v-model="internalNameModel" :actions="false" :disabled="disabled || !headEditable" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.schemaVersion") }}</el-text><el-dropdown v-model="schemaVersion" :items="[{ value: 'campaign.v1', label: 'campaign.v1' }]" :disabled="disabled" /></el-flex>
      </el-grid>
      <el-text v-if="!headEditable" :size="10" color="normal45">{{ t("manage.marketing.builder.hints.headLocked") }}</el-text>
      <el-text v-for="(issue, index) in basicsIssues" :key="`basics-${index}`" :size="10" color="red">• {{ issueLabel(issue) }}</el-text>
    </el-flex>

    <el-flex rules="css" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex :rules="mini ? 'css' : 'rbs'" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8"><el-icon icon="track_changes" :size="18" color="blue" /><el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.objective") }}</el-text></el-flex>
        <el-text :size="11" color="normal55" :class="{ w100: mini }">{{ t("manage.marketing.builder.hints.objective") }}</el-text>
      </el-flex>
      <el-flex rules="css" :gap="6" class="w100"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.objectiveType") }}</el-text><el-dropdown v-model="objectiveType" class="campaign-objective-dropdown" :items="objectiveItems" :disabled="disabled" /></el-flex>
      <el-text v-for="(issue, index) in objectiveIssues" :key="`objective-${index}`" :size="10" color="red">• {{ issueLabel(issue) }}</el-text>
    </el-flex>

    <el-flex rules="css" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex :rules="mini ? 'css' : 'rbs'" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8"><el-icon icon="schedule" :size="18" color="orange" /><el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.schedule") }}</el-text></el-flex>
        <el-text :size="11" color="normal55" :class="{ w100: mini }">{{ t("manage.marketing.builder.hints.schedule") }}</el-text>
      </el-flex>
      <el-grid cols="repeat(auto-fit, minmax(230px, 1fr))" :gap="12" class="w100">
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.startsAt") }}</el-text><el-date-time-field v-model="startsAtLocal" :disabled="disabled" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.endsAt") }}</el-text><el-date-time-field v-model="endsAtLocal" :disabled="disabled" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.timezone") }}</el-text><el-dropdown v-model="timezone" :items="timezoneItems" :disabled="disabled" /></el-flex>
      </el-grid>
      <el-text :size="10" color="normal45">{{ t("manage.marketing.builder.hints.scheduleLocalTime") }}</el-text>
      <el-text v-for="(issue, index) in scheduleIssues" :key="`schedule-${index}`" :size="10" color="red">• {{ issueLabel(issue) }}</el-text>
    </el-flex>

    <el-flex rules="css" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex :rules="mini ? 'css' : 'rbs'" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8"><el-icon icon="verified_user" :size="18" color="green" /><el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.eligibility") }}</el-text></el-flex>
        <el-text :size="11" color="normal55" :class="{ w100: mini }">{{ t("manage.marketing.builder.hints.eligibility") }}</el-text>
      </el-flex>
      <el-switch v-model="authenticated" icon="lock_person" :label="t('manage.marketing.builder.fields.authenticated')" :disable="disabled" />
      <el-flex v-if="hasEligibilityRules" rules="rsc" :gap="8" class="w100" bg="blue10" :p="10" :radius="10"><el-icon icon="info" color="blue" :size="16" /><el-text :size="10" color="normal55">{{ t("manage.marketing.builder.hints.rulesPreserved") }}</el-text></el-flex>
      <el-text v-for="(issue, index) in eligibilityIssues" :key="`eligibility-${index}`" :size="10" color="red">• {{ issueLabel(issue) }}</el-text>
    </el-flex>

    <el-flex rules="css" :gap="14" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex :rules="mini ? 'css' : 'rbs'" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8"><el-icon icon="web" :size="18" color="prim" /><el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.experience") }}</el-text></el-flex>
        <el-text :size="11" color="normal55" :class="{ w100: mini }">{{ t("manage.marketing.builder.hints.experience") }}</el-text>
      </el-flex>
      <el-grid cols="repeat(auto-fit, minmax(230px, 1fr))" :gap="12" class="w100">
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.renderer") }}</el-text><el-dropdown v-model="rendererRef" :items="currentRendererItems" :disabled="disabled" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.locales") }}</el-text><el-multi-select v-model="locales" :items="localeItems" :disabled="disabled" /></el-flex>
        <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.defaultLocale") }}</el-text><el-dropdown v-model="defaultLocale" :items="defaultLocaleItems" :disabled="disabled" /></el-flex>
      </el-grid>

      <el-grid :cols="localeContentColumns" :gap="12" class="w100">
        <el-flex v-if="locales.includes('en')" rules="css" :gap="10" class="w100" bg="normal5" :p="12" :radius="12" dir="ltr">
          <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.locales.en") }}</el-text>
          <el-flex rules="css" :gap="6" class="w100"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.title") }}</el-text><el-text-field v-model="titleEn" :actions="false" :disabled="disabled" dir="ltr" /></el-flex>
          <el-flex rules="css" :gap="6" class="w100"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.description") }}</el-text><el-text-field v-model="descriptionEn" type="textarea" :rows="3" :actions="false" :disabled="disabled" dir="ltr" /></el-flex>
        </el-flex>
        <el-flex v-if="locales.includes('fa')" rules="css" :gap="10" class="w100" bg="normal5" :p="12" :radius="12" dir="rtl">
          <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.locales.fa") }}</el-text>
          <el-flex rules="css" :gap="6" class="w100"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.title") }}</el-text><el-text-field v-model="titleFa" :actions="false" :disabled="disabled" dir="rtl" /></el-flex>
          <el-flex rules="css" :gap="6" class="w100"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.description") }}</el-text><el-text-field v-model="descriptionFa" type="textarea" :rows="3" :actions="false" :disabled="disabled" dir="rtl" /></el-flex>
        </el-flex>
      </el-grid>

      <el-divider />
      <el-flex rules="css" :gap="10" class="w100">
        <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.sections.seo") }}</el-text>
        <el-grid cols="repeat(auto-fit, minmax(220px, 1fr))" :gap="12" class="w100">
          <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.indexing") }}</el-text><el-dropdown v-model="seoIndexing" :items="seoIndexingItems" :disabled="disabled" /></el-flex>
          <el-flex rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.endBehavior") }}</el-text><el-dropdown v-model="seoEndBehavior" :items="seoEndBehaviorItems" :disabled="disabled" /></el-flex>
          <el-flex v-if="seoEndBehavior === 'redirect'" rules="css" :gap="6"><el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.redirectPath") }}</el-text><el-text-field v-model="seoRedirectPath" :actions="false" :disabled="disabled" dir="ltr" /></el-flex>
        </el-grid>
        <el-text :size="10" color="normal45">{{ seoIndexing === 'index' ? t('manage.marketing.builder.hints.canonicalAutomatic', { path: `/campaign/${slug}` }) : t('manage.marketing.builder.hints.canonicalDisabled') }}</el-text>
      </el-flex>
      <el-text v-for="(issue, index) in experienceIssues" :key="`experience-${index}`" :size="10" color="red">• {{ issueLabel(issue) }}</el-text>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.campaign-definition-form--mini .campaign-objective-dropdown :deep(.wsnw) {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
}
</style>
