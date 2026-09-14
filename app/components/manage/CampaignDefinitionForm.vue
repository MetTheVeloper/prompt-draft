<script setup lang="ts">
import type {
  AdminCampaignDefinition,
  AdminCampaignValidationIssue,
} from "~/types/adminCampaignApi";

type JsonObject = Record<string, any>;
type CampaignLocale = "en" | "fa";

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

const objectiveItems = computed(() => [
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
].map(value => ({
  value,
  label: t(`manage.marketing.builder.objectives.${value}`),
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

function cloneDefinition(value: AdminCampaignDefinition): JsonObject {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function getPath(path: string[], fallback: any = undefined) {
  let current: any = props.modelValue ?? {};
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return fallback;
    }
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

function setPath(path: string[], value: any) {
  if (!path.length) return;

  const next = cloneDefinition(props.modelValue);
  let current: JsonObject = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const existing = current[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[key] = {};
    }
    current = current[key];
  }

  const finalKey = path[path.length - 1];
  if (value === undefined) delete current[finalKey];
  else current[finalKey] = value;

  emit("update:modelValue", next);
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

const startsAt = computed({
  get: () => String(getPath(["lifecycle", "startsAt"], "")),
  set: (value: string) => setPath(["lifecycle", "startsAt"], value.trim()),
});

const endsAt = computed({
  get: () => String(getPath(["lifecycle", "endsAt"], "") ?? ""),
  set: (value: string) => setPath(["lifecycle", "endsAt"], value.trim() || null),
});

const timezone = computed({
  get: () => String(getPath(["lifecycle", "timezone"], "Asia/Tehran")),
  set: (value: string) => setPath(["lifecycle", "timezone"], value.trim()),
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
    const kind = separator >= 0 ? raw.slice(0, separator) : "builtin";
    const key = separator >= 0 ? raw.slice(separator + 1) : raw;
    setPath(["experience", "renderer"], { kind, key });
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
    const next = normalized.length ? normalized : ["en"];
    setPath(["experience", "locales"], next);

    const currentDefault = String(getPath(["experience", "defaultLocale"], "en"));
    if (!next.includes(currentDefault as CampaignLocale)) {
      setPath(["experience", "defaultLocale"], next[0]);
    }
  },
});

const defaultLocaleItems = computed(() => (
  localeItems.value.filter(item => locales.value.includes(item.value as CampaignLocale))
));

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

const seoCanonicalPath = computed({
  get: () => String(getPath(["experience", "seo", "canonicalPath"], "")),
  set: (value: string) => setPath(["experience", "seo", "canonicalPath"], value.trim() || undefined),
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
  return [
    {
      value: rendererRef.value,
      label: rendererRef.value,
      description: t("manage.marketing.builder.renderers.legacy"),
    },
    ...rendererItems.value,
  ];
});
</script>

<template>
  <el-flex rules="csc" :gap="14" class="w100">
    <el-flex rules="csc" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex rules="rbc" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8">
          <el-icon icon="badge" :size="18" color="prim" />
          <el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.basics") }}</el-text>
        </el-flex>
        <el-text :size="11" color="normal55">{{ t("manage.marketing.builder.hints.basics") }}</el-text>
      </el-flex>

      <el-grid cols="repeat(auto-fit, minmax(220px, 1fr))" :gap="12" class="w100">
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.fields.slug") }}</el-text>
          <el-text-field v-model="slugModel" :actions="false" :disabled="disabled || !headEditable" dir="ltr" />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.fields.internalName") }}</el-text>
          <el-text-field v-model="internalNameModel" :actions="false" :disabled="disabled || !headEditable" />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.schemaVersion") }}</el-text>
          <el-dropdown
            v-model="schemaVersion"
            :items="[{ value: 'campaign.v1', label: 'campaign.v1' }]"
            :disabled="disabled"
          />
        </el-flex>
      </el-grid>

      <el-text v-if="!headEditable" :size="10" color="normal45">
        {{ t("manage.marketing.builder.hints.headLocked") }}
      </el-text>
      <el-text v-for="(issue, index) in basicsIssues" :key="`basics-${index}`" :size="10" color="red">
        • {{ issueLabel(issue) }}
      </el-text>
    </el-flex>

    <el-flex rules="csc" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex rules="rbc" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8">
          <el-icon icon="track_changes" :size="18" color="blue" />
          <el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.objective") }}</el-text>
        </el-flex>
        <el-text :size="11" color="normal55">{{ t("manage.marketing.builder.hints.objective") }}</el-text>
      </el-flex>

      <el-flex rules="ccs" :gap="6" class="w100">
        <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.objectiveType") }}</el-text>
        <el-dropdown v-model="objectiveType" :items="objectiveItems" :disabled="disabled" />
      </el-flex>
      <el-text v-for="(issue, index) in objectiveIssues" :key="`objective-${index}`" :size="10" color="red">
        • {{ issueLabel(issue) }}
      </el-text>
    </el-flex>

    <el-flex rules="csc" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex rules="rbc" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8">
          <el-icon icon="schedule" :size="18" color="orange" />
          <el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.schedule") }}</el-text>
        </el-flex>
        <el-text :size="11" color="normal55">{{ t("manage.marketing.builder.hints.schedule") }}</el-text>
      </el-flex>

      <el-grid cols="repeat(auto-fit, minmax(230px, 1fr))" :gap="12" class="w100">
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.startsAt") }}</el-text>
          <el-text-field
            v-model="startsAt"
            :actions="false"
            :disabled="disabled"
            dir="ltr"
            :placeholder="t('manage.marketing.builder.placeholders.timestamp')"
          />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.endsAt") }}</el-text>
          <el-text-field
            v-model="endsAt"
            :actions="false"
            :disabled="disabled"
            dir="ltr"
            :placeholder="t('manage.marketing.builder.placeholders.optionalTimestamp')"
          />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.timezone") }}</el-text>
          <el-text-field
            v-model="timezone"
            :actions="false"
            :disabled="disabled"
            dir="ltr"
            :placeholder="t('manage.marketing.builder.placeholders.timezone')"
          />
        </el-flex>
      </el-grid>
      <el-text v-for="(issue, index) in scheduleIssues" :key="`schedule-${index}`" :size="10" color="red">
        • {{ issueLabel(issue) }}
      </el-text>
    </el-flex>

    <el-flex rules="csc" :gap="12" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex rules="rbc" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8">
          <el-icon icon="verified_user" :size="18" color="green" />
          <el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.eligibility") }}</el-text>
        </el-flex>
        <el-text :size="11" color="normal55">{{ t("manage.marketing.builder.hints.eligibility") }}</el-text>
      </el-flex>

      <el-switch
        v-model="authenticated"
        icon="lock_person"
        :label="t('manage.marketing.builder.fields.authenticated')"
        :disable="disabled"
      />

      <el-flex v-if="hasEligibilityRules" rules="rsc" :gap="8" class="w100" bg="blue10" :p="10" :radius="10">
        <el-icon icon="info" color="blue" :size="16" />
        <el-text :size="10" color="normal55">{{ t("manage.marketing.builder.hints.rulesPreserved") }}</el-text>
      </el-flex>
      <el-text v-for="(issue, index) in eligibilityIssues" :key="`eligibility-${index}`" :size="10" color="red">
        • {{ issueLabel(issue) }}
      </el-text>
    </el-flex>

    <el-flex rules="csc" :gap="14" class="w100" bg="surface" :p="16" :radius="14" :br="1" bc="normal15">
      <el-flex rules="rbc" :gap="10" class="w100" wrap>
        <el-flex rules="rsc" :gap="8">
          <el-icon icon="web" :size="18" color="prim" />
          <el-text :size="15" :weight="800">{{ t("manage.marketing.builder.sections.experience") }}</el-text>
        </el-flex>
        <el-text :size="11" color="normal55">{{ t("manage.marketing.builder.hints.experience") }}</el-text>
      </el-flex>

      <el-grid cols="repeat(auto-fit, minmax(230px, 1fr))" :gap="12" class="w100">
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.renderer") }}</el-text>
          <el-dropdown v-model="rendererRef" :items="currentRendererItems" :disabled="disabled" />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.locales") }}</el-text>
          <el-multi-select v-model="locales" :items="localeItems" :disabled="disabled" />
        </el-flex>
        <el-flex rules="ccs" :gap="6">
          <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.defaultLocale") }}</el-text>
          <el-dropdown v-model="defaultLocale" :items="defaultLocaleItems" :disabled="disabled" />
        </el-flex>
      </el-grid>

      <el-flex v-if="locales.includes('en')" rules="csc" :gap="8" class="w100" bg="normal5" :p="12" :radius="12">
        <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.locales.en") }}</el-text>
        <el-grid cols="repeat(auto-fit, minmax(260px, 1fr))" :gap="10" class="w100">
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.title") }}</el-text>
            <el-text-field v-model="titleEn" :actions="false" :disabled="disabled" />
          </el-flex>
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.description") }}</el-text>
            <el-text-field v-model="descriptionEn" type="textarea" :rows="3" :actions="false" :disabled="disabled" />
          </el-flex>
        </el-grid>
      </el-flex>

      <el-flex v-if="locales.includes('fa')" rules="csc" :gap="8" class="w100" bg="normal5" :p="12" :radius="12">
        <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.locales.fa") }}</el-text>
        <el-grid cols="repeat(auto-fit, minmax(260px, 1fr))" :gap="10" class="w100">
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.title") }}</el-text>
            <el-text-field v-model="titleFa" :actions="false" :disabled="disabled" dir="rtl" />
          </el-flex>
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.description") }}</el-text>
            <el-text-field v-model="descriptionFa" type="textarea" :rows="3" :actions="false" :disabled="disabled" dir="rtl" />
          </el-flex>
        </el-grid>
      </el-flex>

      <el-divider />

      <el-flex rules="ccs" :gap="10" class="w100">
        <el-text :size="12" :weight="800">{{ t("manage.marketing.builder.sections.seo") }}</el-text>
        <el-grid cols="repeat(auto-fit, minmax(220px, 1fr))" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.indexing") }}</el-text>
            <el-dropdown v-model="seoIndexing" :items="seoIndexingItems" :disabled="disabled" />
          </el-flex>
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.canonicalPath") }}</el-text>
            <el-text-field v-model="seoCanonicalPath" :actions="false" :disabled="disabled" dir="ltr" placeholder="/campaign/..." />
          </el-flex>
          <el-flex rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.endBehavior") }}</el-text>
            <el-dropdown v-model="seoEndBehavior" :items="seoEndBehaviorItems" :disabled="disabled" />
          </el-flex>
          <el-flex v-if="seoEndBehavior === 'redirect'" rules="ccs" :gap="6">
            <el-text :size="11" :weight="700">{{ t("manage.marketing.builder.fields.redirectPath") }}</el-text>
            <el-text-field v-model="seoRedirectPath" :actions="false" :disabled="disabled" dir="ltr" />
          </el-flex>
        </el-grid>
      </el-flex>

      <el-text v-for="(issue, index) in experienceIssues" :key="`experience-${index}`" :size="10" color="red">
        • {{ issueLabel(issue) }}
      </el-text>
    </el-flex>
  </el-flex>
</template>
