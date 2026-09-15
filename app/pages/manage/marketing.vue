<script setup lang="ts">
import CampaignDefinitionForm from "~/components/manage/CampaignDefinitionForm.vue";
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type {
  AdminCampaignDefinition,
  AdminCampaignStatus,
  AdminCampaignValidationIssue,
} from "~/types/adminCampaignApi";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.MARKETING_CAMPAIGNS_VIEW,
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const campaignsApi = useAdminCampaigns();
const modal = useModal();
const { t, locale } = useI18n();
const { mobile, tablet } = useScreen();

const statusFilter = ref<"" | AdminCampaignStatus>("");
const editorOpen = ref(false);
const creating = ref(false);
const routeSyncReady = ref(false);
const feedback = ref("");
const definitionDraft = ref<AdminCampaignDefinition>({});
const loadedDefinitionSnapshot = ref("{}");
const rawEditorOpen = ref(false);
const rawDefinitionText = ref("{}");
const rawJsonError = ref("");

const createForm = reactive({
  slug: "",
  internalName: "",
});

const statuses: AdminCampaignStatus[] = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "ended",
  "archived",
];

const canManage = computed(() => auth.can(AUTH_PERMISSIONS.MARKETING_CAMPAIGNS_MANAGE));
const canPublish = computed(() => auth.can(AUTH_PERMISSIONS.MARKETING_CAMPAIGNS_PUBLISH));
const selectedCampaign = computed(() => campaignsApi.selected.value);
const metricColumns = computed(() => mobile.value ? 1 : tablet.value ? 2 : 5);
const definitionDirty = computed(() => (
  serializeDefinition(definitionDraft.value) !== loadedDefinitionSnapshot.value
));
const builderIssues = computed(() => (
  definitionDirty.value
    ? []
    : selectedCampaign.value?.validation.errors ?? []
));

const canCreate = computed(() => (
  canManage.value &&
  Boolean(createForm.slug.trim()) &&
  Boolean(createForm.internalName.trim()) &&
  !campaignsApi.mutating.value
));

const canSaveDraft = computed(() => (
  canManage.value &&
  Boolean(selectedCampaign.value) &&
  definitionDirty.value &&
  !campaignsApi.mutating.value
));

const canValidate = computed(() => (
  canManage.value &&
  Boolean(selectedCampaign.value) &&
  !definitionDirty.value &&
  !campaignsApi.mutating.value
));

const canPublishDraft = computed(() => (
  canPublish.value &&
  Boolean(selectedCampaign.value?.validation.publishable) &&
  !definitionDirty.value &&
  !campaignsApi.mutating.value
));

const runtimeCards = computed(() => {
  const campaign = selectedCampaign.value;
  if (!campaign) return [];

  return [
    {
      key: "participants",
      label: t("manage.marketing.fields.participants"),
      value: formatNumber(campaign.summary.participants),
      icon: "groups",
      color: "blue",
    },
    {
      key: "completed",
      label: t("manage.marketing.fields.completed"),
      value: formatNumber(campaign.summary.completed),
      icon: "task_alt",
      color: "green",
    },
    {
      key: "qualified",
      label: t("manage.marketing.fields.qualified"),
      value: formatNumber(campaign.summary.qualified),
      icon: "verified",
      color: "prim",
    },
    {
      key: "rewarded",
      label: t("manage.marketing.fields.rewarded"),
      value: formatNumber(campaign.summary.rewarded),
      icon: "redeem",
      color: "orange",
    },
    {
      key: "goin",
      label: t("manage.marketing.fields.goinGranted"),
      value: formatNumber(campaign.summary.goinGranted),
      icon: "paid",
      color: "prim",
    },
  ];
});

function cloneDefinition(value: AdminCampaignDefinition): AdminCampaignDefinition {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function serializeDefinition(value: AdminCampaignDefinition) {
  return JSON.stringify(value ?? {});
}

function prettyDefinition(value: AdminCampaignDefinition) {
  return JSON.stringify(value ?? {}, null, 2);
}

function createStarterDefinition(slug = "", internalName = ""): AdminCampaignDefinition {
  return {
    schemaVersion: "campaign.v1",
    identity: {
      slug,
      internalName,
    },
    objective: {
      type: "engagement",
    },
    lifecycle: {
      startsAt: "",
      endsAt: null,
      timezone: "Asia/Tehran",
    },
    eligibility: {
      authenticated: true,
    },
    experience: {
      renderer: {
        kind: "builtin",
        key: "campaign-default-v1",
      },
      locales: ["en", "fa"],
      defaultLocale: "en",
      content: {
        en: {
          title: "",
          description: "",
        },
        fa: {
          title: "",
          description: "",
        },
      },
      seo: {
        indexing: "noindex",
        endBehavior: "archive",
      },
    },
    promotions: [],
    mechanics: [],
    completion: null,
    rewards: [],
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: AdminCampaignStatus) {
  return t(`manage.marketing.statuses.${status}`);
}

function statusColor(status: AdminCampaignStatus) {
  if (status === "active") return "green";
  if (status === "scheduled") return "blue";
  if (status === "paused") return "orange";
  if (status === "draft") return "normal55";
  return "normal45";
}

function issueLabel(issue: AdminCampaignValidationIssue) {
  const path = issue.path || issue.field;
  return path ? `${path}: ${issue.message}` : issue.message;
}

function parseCampaignId(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
    ? raw
    : null;
}

function syncRawFromDefinition() {
  rawDefinitionText.value = prettyDefinition(definitionDraft.value);
  rawJsonError.value = "";
}

function syncDefinitionFromSelected() {
  const campaign = selectedCampaign.value;
  const definition = cloneDefinition(campaign?.draftDefinition ?? {});
  definitionDraft.value = definition;
  loadedDefinitionSnapshot.value = serializeDefinition(definition);
  syncRawFromDefinition();
}

function toggleRawEditor() {
  rawEditorOpen.value = !rawEditorOpen.value;
  if (rawEditorOpen.value) syncRawFromDefinition();
}

function applyRawDefinition() {
  try {
    const parsed = JSON.parse(rawDefinitionText.value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      rawJsonError.value = t("manage.marketing.editor.invalidJson");
      return;
    }

    definitionDraft.value = cloneDefinition(parsed as AdminCampaignDefinition);
    rawDefinitionText.value = prettyDefinition(definitionDraft.value);
    rawJsonError.value = "";
    feedback.value = t("manage.marketing.editor.rawApplied");
  } catch {
    rawJsonError.value = t("manage.marketing.editor.invalidJson");
  }
}

async function setEditQuery(id: string | null, mode: "push" | "replace" = "replace") {
  const query = { ...route.query };
  if (id) query.edit = id;
  else delete query.edit;
  await router[mode]({ path: route.path, query });
}

async function loadList(append = false) {
  feedback.value = "";
  await campaignsApi.list({
    status: statusFilter.value,
    append,
  });
}

async function syncEditorFromRoute() {
  const id = parseCampaignId(route.query.edit);
  if (!id) {
    if (!creating.value) editorOpen.value = false;
    return;
  }

  creating.value = false;
  editorOpen.value = true;
  rawEditorOpen.value = false;
  feedback.value = "";
  const campaign = await campaignsApi.get(id);
  if (campaign) syncDefinitionFromSelected();
}

async function openCampaign(id: string) {
  await setEditQuery(id, "push");
}

async function openCreate() {
  campaignsApi.clearSelected();
  createForm.slug = "";
  createForm.internalName = "";
  definitionDraft.value = createStarterDefinition();
  loadedDefinitionSnapshot.value = serializeDefinition(definitionDraft.value);
  rawEditorOpen.value = false;
  syncRawFromDefinition();
  feedback.value = "";
  creating.value = true;
  editorOpen.value = true;
  await setEditQuery(null, "replace");
}

async function closeEditor() {
  creating.value = false;
  editorOpen.value = false;
  rawEditorOpen.value = false;
  campaignsApi.clearSelected();
  feedback.value = "";
  await setEditQuery(null, "replace");
}

async function createCampaign() {
  if (!canCreate.value) return;

  const definition = cloneDefinition(definitionDraft.value) as Record<string, any>;
  definition.schemaVersion = definition.schemaVersion || "campaign.v1";
  definition.identity = {
    ...(definition.identity && typeof definition.identity === "object" ? definition.identity : {}),
    slug: createForm.slug.trim(),
    internalName: createForm.internalName.trim(),
  };

  const campaign = await campaignsApi.create({
    slug: createForm.slug.trim(),
    internalName: createForm.internalName.trim(),
    definition,
  });
  if (!campaign) return;

  creating.value = false;
  feedback.value = t("manage.marketing.editor.created");
  syncDefinitionFromSelected();
  await Promise.all([
    setEditQuery(campaign.id, "replace"),
    loadList(),
  ]);
}

async function reloadSelected() {
  const campaign = selectedCampaign.value;
  if (!campaign) return;
  feedback.value = "";
  if (await campaignsApi.get(campaign.id)) syncDefinitionFromSelected();
}

async function saveDraft() {
  const campaign = selectedCampaign.value;
  if (!campaign || !canSaveDraft.value) return;

  const response = await campaignsApi.saveDraft(
    campaign.id,
    campaign.draftRevision,
    cloneDefinition(definitionDraft.value),
  );
  if (!response) {
    if (campaignsApi.errorCode.value === "CAMPAIGN_DRAFT_REVISION_CONFLICT") {
      feedback.value = t("manage.marketing.editor.conflict");
    }
    return;
  }

  loadedDefinitionSnapshot.value = serializeDefinition(definitionDraft.value);
  syncRawFromDefinition();
  feedback.value = response.changed
    ? t("manage.marketing.editor.saved")
    : t("manage.marketing.editor.unchanged");
  await loadList();
}

async function validateDraft() {
  const campaign = selectedCampaign.value;
  if (!campaign || !canValidate.value) return;

  const response = await campaignsApi.validate(campaign.id, campaign.draftRevision);
  if (!response) return;
  feedback.value = response.publishable
    ? t("manage.marketing.editor.publishable")
    : t("manage.marketing.editor.notPublishable");

  const issueDescriptions = [
    ...response.errors.map(issue => `${t("manage.marketing.validation.errors")}: ${issueLabel(issue)}`),
    ...response.warnings.map(issue => `${t("manage.marketing.validation.warnings")}: ${issueLabel(issue)}`),
  ];
  modal.open({
    header: {
      icon: response.publishable ? "check_circle" : "warning",
      title: t("manage.marketing.validation.modalTitle"),
      color: response.publishable ? "green" : "orange",
    },
    title: response.publishable
      ? t("manage.marketing.validation.successTitle")
      : t("manage.marketing.validation.failureTitle"),
    descriptions: [
      response.publishable
        ? t("manage.marketing.validation.successDetail")
        : t("manage.marketing.validation.failureDetail"),
      ...issueDescriptions,
    ],
    actions: [{
      label: t("components.modal.actions.close"),
      icon: "check_circle",
      color: response.publishable ? "green" : "orange",
      close: true,
    }],
    options: { width: 620 },
  });
}

async function publishDraft() {
  const campaign = selectedCampaign.value;
  if (!campaign || !canPublishDraft.value) return;

  const response = await campaignsApi.publish(campaign.id, campaign.draftRevision);
  if (!response) return;
  syncDefinitionFromSelected();
  feedback.value = t("manage.marketing.editor.published");
  await loadList();
}

async function changeLifecycle(action: "pause" | "resume" | "end" | "archive") {
  const campaign = selectedCampaign.value;
  if (!campaign || !canPublish.value || campaignsApi.mutating.value) return;

  if (action === "end" && !window.confirm(t("manage.marketing.editor.confirmEnd"))) return;
  if (action === "archive" && !window.confirm(t("manage.marketing.editor.confirmArchive"))) return;

  const updated = await campaignsApi.lifecycle(campaign.id, action);
  if (!updated) return;
  syncDefinitionFromSelected();
  feedback.value = t("manage.marketing.editor.lifecycleUpdated");
  await loadList();
}

watch(statusFilter, () => {
  if (!editorOpen.value) void loadList();
});

watch(
  () => route.query.edit,
  () => {
    if (routeSyncReady.value) void syncEditorFromRoute();
  },
);

onMounted(async () => {
  await auth.initialize();
  await loadList();
  routeSyncReady.value = true;
  await syncEditorFromRoute();
});
</script>

<template>
  <el-flex v-if="editorOpen" rules="css" :gap="16" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100" wrap>
      <el-flex rules="css" :gap="4" class="fg100">
        <el-text :size="19" :weight="800">
          {{ creating
            ? t("manage.marketing.editor.createTitle")
            : t("manage.marketing.editor.editTitle", { name: selectedCampaign?.internalName || "—" }) }}
        </el-text>
        <el-text :size="11" color="normal55">
          {{ t("manage.marketing.editor.definitionHint") }}
        </el-text>
      </el-flex>
      <el-button
        mode="flat"
        icon="arrow_back"
        :label="t('manage.marketing.actions.back')"
        :disable="campaignsApi.mutating.value"
        @click="closeEditor"
      />
    </el-flex>

    <el-flex
      v-if="!canManage"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="blue10"
      :p="12"
      :radius="12">
      <el-icon icon="visibility" color="blue" :size="18" />
      <el-text :size="12" class="fg100">
        {{ t("manage.marketing.editor.readOnlyHint") }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="campaignsApi.error.value"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="12">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text :size="12" color="red" class="fg100">
        {{ campaignsApi.error.value }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="feedback"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="green10"
      :p="12"
      :radius="12">
      <el-icon icon="check_circle" color="green" :size="18" />
      <el-text :size="12" color="green">{{ feedback }}</el-text>
    </el-flex>

    <el-flex v-if="!creating && campaignsApi.loadingDetail.value" rules="ccc" class="w100" :p="30">
      <el-text color="normal55">{{ t("manage.marketing.loading") }}</el-text>
    </el-flex>

    <template v-else>
      <el-flex
        v-if="selectedCampaign"
        rules="css"
        :gap="12"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="10" class="w100" wrap>
          <el-flex rules="rcc" :gap="8" wrap>
            <el-text :size="12" :weight="800">{{ selectedCampaign.internalName }}</el-text>
            <el-text :size="11" color="normal45">{{ selectedCampaign.slug }}</el-text>
            <el-text
              :size="11"
              :weight="800"
              :color="statusColor(selectedCampaign.status)"
              marker="normal10"
              :p="[4, 7]"
              :radius="100">
              {{ statusLabel(selectedCampaign.status) }}
            </el-text>
          </el-flex>
          <el-text :size="10" color="normal45">{{ selectedCampaign.id }}</el-text>
        </el-flex>

        <el-grid cols="repeat(auto-fit, minmax(150px, 1fr))" :gap="10" class="w100">
          <el-flex rules="css" :gap="3">
            <el-text :size="10" color="normal45">{{ t("manage.marketing.fields.version") }}</el-text>
            <el-text :size="12" :weight="700">{{ selectedCampaign.publishedVersion?.version ?? "—" }}</el-text>
          </el-flex>
          <el-flex rules="css" :gap="3">
            <el-text :size="10" color="normal45">{{ t("manage.marketing.fields.draftRevision") }}</el-text>
            <el-text :size="12" :weight="700">{{ selectedCampaign.draftRevision }}</el-text>
          </el-flex>
          <el-flex rules="css" :gap="3">
            <el-text :size="10" color="normal45">{{ t("manage.marketing.fields.updatedAt") }}</el-text>
            <el-text :size="12" :weight="700">{{ formatDate(selectedCampaign.updatedAt) }}</el-text>
          </el-flex>
        </el-grid>
      </el-flex>

      <el-flex v-if="selectedCampaign" rules="css" :gap="10" class="w100">
        <el-text :size="16" :weight="800">{{ t("manage.marketing.metrics.title") }}</el-text>
        <el-grid :cols="metricColumns" :gap="10" class="w100">
          <ManageMetricCard
            v-for="card in runtimeCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
          />
        </el-grid>
      </el-flex>

      <CampaignDefinitionForm
        v-if="creating"
        v-model="definitionDraft"
        v-model:slug="createForm.slug"
        v-model:internal-name="createForm.internalName"
        :head-editable="true"
        :disabled="campaignsApi.mutating.value"
      />

      <CampaignDefinitionForm
        v-else-if="selectedCampaign"
        v-model="definitionDraft"
        :slug="selectedCampaign.slug"
        :internal-name="selectedCampaign.internalName"
        :head-editable="false"
        :disabled="!canManage || campaignsApi.mutating.value"
        :issues="builderIssues"
      />

      <el-flex
        rules="css"
        :gap="10"
        class="w100"
        bg="surface"
        :p="14"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="10" class="w100" wrap>
          <el-flex rules="css" :gap="3" class="fg100">
            <el-text :size="13" :weight="800">{{ t("manage.marketing.advanced.title") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.marketing.advanced.hint") }}</el-text>
          </el-flex>
          <el-button
            mode="flat"
            icon="data_object"
            :label="rawEditorOpen ? t('manage.marketing.actions.hideRaw') : t('manage.marketing.actions.showRaw')"
            @click="toggleRawEditor"
          />
        </el-flex>

        <template v-if="rawEditorOpen">
          <el-text-field
            v-model="rawDefinitionText"
            type="textarea"
            :rows="16"
            :actions="false"
            dir="ltr"
            :disabled="!canManage || campaignsApi.mutating.value"
          />
          <el-text v-if="rawJsonError" :size="11" color="red">{{ rawJsonError }}</el-text>
          <el-flex rules="rsc" :gap="8" class="w100" wrap>
            <el-button
              color="prim"
              icon="sync"
              :label="t('manage.marketing.actions.applyRaw')"
              :disable="!canManage || campaignsApi.mutating.value"
              @click="applyRawDefinition"
            />
            <el-button
              mode="flat"
              icon="restart_alt"
              :label="t('manage.marketing.actions.resetRaw')"
              @click="syncRawFromDefinition"
            />
          </el-flex>
        </template>
      </el-flex>

      <el-flex
        rules="rbc"
        :gap="10"
        class="w100"
        bg="surface"
        :p="14"
        :radius="14"
        :br="1"
        bc="normal15"
        wrap>
        <el-flex rules="rsc" :gap="8" wrap>
          <el-text v-if="definitionDirty" :size="11" color="orange">
            {{ t("manage.marketing.editor.unsavedForm") }}
          </el-text>
          <el-text v-else-if="selectedCampaign" :size="11" color="normal55">
            {{ t("manage.marketing.editor.savedForm") }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" :gap="8" wrap>
          <el-button
            v-if="selectedCampaign"
            mode="flat"
            icon="refresh"
            :label="t('manage.marketing.actions.reload')"
            :disable="campaignsApi.mutating.value"
            @click="reloadSelected"
          />
          <el-button
            v-if="creating"
            color="prim"
            icon="add_circle"
            :label="t('manage.marketing.actions.create')"
            :disable="!canCreate"
            @click="createCampaign"
          />
          <el-button
            v-if="selectedCampaign && canManage"
            color="prim"
            icon="save"
            :label="t('manage.marketing.actions.saveDraft')"
            :disable="!canSaveDraft"
            @click="saveDraft"
          />
          <el-button
            v-if="selectedCampaign && canManage"
            mode="flat"
            icon="fact_check"
            :label="t('manage.marketing.actions.validate')"
            :disable="!canValidate"
            @click="validateDraft"
          />
          <el-button
            v-if="selectedCampaign && canPublish"
            color="green"
            icon="publish"
            :label="t('manage.marketing.actions.publish')"
            :disable="!canPublishDraft"
            @click="publishDraft"
          />
        </el-flex>
      </el-flex>

      <el-flex
        v-if="selectedCampaign"
        rules="css"
        :gap="10"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="8" class="w100" wrap>
          <el-text :size="16" :weight="800">{{ t("manage.marketing.validation.title") }}</el-text>
          <el-text
            :size="11"
            :weight="700"
            :color="selectedCampaign.validation.publishable ? 'green' : 'orange'">
            {{ selectedCampaign.validation.publishable
              ? t("manage.marketing.editor.publishable")
              : t("manage.marketing.editor.notPublishable") }}
          </el-text>
        </el-flex>

        <el-flex v-if="definitionDirty" rules="rsc" :gap="8" class="w100" bg="orange10" :p="10" :radius="10">
          <el-icon icon="edit_note" color="orange" :size="16" />
          <el-text :size="10" color="normal55">{{ t("manage.marketing.validation.stale") }}</el-text>
        </el-flex>

        <el-text
          v-else-if="!selectedCampaign.validation.errors.length && !selectedCampaign.validation.warnings.length"
          :size="12"
          color="normal55">
          {{ t("manage.marketing.validation.noIssues") }}
        </el-text>

        <el-flex v-if="!definitionDirty && selectedCampaign.validation.errors.length" rules="css" :gap="5" class="w100">
          <el-text :size="12" :weight="800" color="red">{{ t("manage.marketing.validation.errors") }}</el-text>
          <el-text
            v-for="(issue, index) in selectedCampaign.validation.errors"
            :key="`error-${index}`"
            :size="11"
            color="red">
            • {{ issueLabel(issue) }}
          </el-text>
        </el-flex>

        <el-flex v-if="!definitionDirty && selectedCampaign.validation.warnings.length" rules="css" :gap="5" class="w100">
          <el-text :size="12" :weight="800" color="orange">{{ t("manage.marketing.validation.warnings") }}</el-text>
          <el-text
            v-for="(issue, index) in selectedCampaign.validation.warnings"
            :key="`warning-${index}`"
            :size="11"
            color="orange">
            • {{ issueLabel(issue) }}
          </el-text>
        </el-flex>
      </el-flex>

      <el-flex
        v-if="canPublish && selectedCampaign?.publishedVersion"
        rules="css"
        :gap="12"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="10" class="w100" wrap>
          <el-flex rules="css" :gap="3" class="fg100">
            <el-text :size="15" :weight="800">{{ t("manage.marketing.operations.title") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.marketing.operations.hint") }}</el-text>
          </el-flex>
          <el-text
            :size="11"
            :weight="800"
            :color="statusColor(selectedCampaign.status)"
            marker="normal10"
            :p="[4, 7]"
            :radius="100">
            {{ t("manage.marketing.operations.currentStatus", { status: statusLabel(selectedCampaign.status) }) }}
          </el-text>
        </el-flex>
        <el-divider />
        <el-flex rules="rsc" :gap="8" class="w100" wrap>
          <el-button
            v-if="selectedCampaign.status === 'active' || selectedCampaign.status === 'scheduled'"
            mode="flat"
            color="orange"
            icon="pause_circle"
            :label="t('manage.marketing.actions.pause')"
            :disable="campaignsApi.mutating.value"
            @click="changeLifecycle('pause')"
          />
          <el-button
            v-if="selectedCampaign.status === 'paused'"
            mode="flat"
            color="green"
            icon="play_circle"
            :label="t('manage.marketing.actions.resume')"
            :disable="campaignsApi.mutating.value"
            @click="changeLifecycle('resume')"
          />
          <el-button
            v-if="selectedCampaign.status !== 'ended' && selectedCampaign.status !== 'archived'"
            mode="flat"
            color="orange"
            icon="stop_circle"
            :label="t('manage.marketing.actions.end')"
            :disable="campaignsApi.mutating.value"
            @click="changeLifecycle('end')"
          />
          <el-button
            v-if="selectedCampaign.status !== 'archived'"
            mode="flat"
            color="red"
            icon="inventory_2"
            :label="t('manage.marketing.actions.archive')"
            :disable="campaignsApi.mutating.value"
            @click="changeLifecycle('archive')"
          />
        </el-flex>
      </el-flex>
    </template>
  </el-flex>

  <el-flex v-else rules="css" :gap="16" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100" wrap>
      <el-flex rules="css" :gap="4" class="fg100">
        <el-text :size="20" :weight="800">{{ t("manage.marketing.title") }}</el-text>
        <el-text :size="12" color="normal55">{{ t("manage.marketing.subtitle") }}</el-text>
      </el-flex>
      <el-flex rules="rcc" :gap="8">
        <el-button
          mode="flat"
          icon="refresh"
          :label="t('manage.marketing.actions.refresh')"
          :disable="campaignsApi.loading.value"
          @click="loadList()"
        />
        <el-button
          v-if="canManage"
          color="prim"
          icon="add_circle"
          :label="t('manage.marketing.actions.newCampaign')"
          @click="openCreate"
        />
      </el-flex>
    </el-flex>

    <el-flex rules="rsc" :gap="6" class="w100" wrap>
      <el-button
        mode="flat"
        :color="statusFilter === '' ? 'prim' : 'normal'"
        :label="t('manage.marketing.filters.all')"
        @click="statusFilter = ''"
      />
      <el-button
        v-for="status in statuses"
        :key="status"
        mode="flat"
        :color="statusFilter === status ? 'prim' : 'normal'"
        :label="statusLabel(status)"
        @click="statusFilter = status"
      />
    </el-flex>

    <el-flex
      v-if="campaignsApi.error.value"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="12">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text :size="12" color="red">{{ campaignsApi.error.value }}</el-text>
    </el-flex>

    <el-flex v-if="campaignsApi.loading.value && !campaignsApi.campaigns.value.length" rules="ccc" class="w100" :p="30">
      <el-text color="normal55">{{ t("manage.marketing.loading") }}</el-text>
    </el-flex>

    <el-flex v-else-if="!campaignsApi.campaigns.value.length" rules="ccc" class="w100" :p="30">
      <el-text color="normal55">{{ t("manage.marketing.empty") }}</el-text>
    </el-flex>

    <el-grid v-else cols="repeat(auto-fit, minmax(280px, 1fr))" :gap="12" class="w100">
      <el-flex
        v-for="campaign in campaignsApi.campaigns.value"
        :key="campaign.id"
        rules="css"
        :gap="12"
        bg="surface"
        :p="14"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="8" class="w100">
          <el-flex rules="css" :gap="3" class="fg100">
            <el-text :size="14" :weight="800">{{ campaign.internalName }}</el-text>
            <el-text :size="10" color="normal45">{{ campaign.slug }}</el-text>
          </el-flex>
          <el-text
            :size="10"
            :weight="800"
            :color="statusColor(campaign.status)"
            marker="normal10"
            :p="[4, 7]"
            :radius="100">
            {{ statusLabel(campaign.status) }}
          </el-text>
        </el-flex>

        <el-grid cols="1fr 1fr" :gap="8" class="w100">
          <el-flex rules="css" :gap="2">
            <el-text :size="9" color="normal45">{{ t("manage.marketing.fields.participants") }}</el-text>
            <el-text :size="12" :weight="700">{{ formatNumber(campaign.participants) }}</el-text>
          </el-flex>
          <el-flex rules="css" :gap="2">
            <el-text :size="9" color="normal45">{{ t("manage.marketing.fields.goinGranted") }}</el-text>
            <el-text :size="12" :weight="700">{{ formatNumber(campaign.goinGranted) }}</el-text>
          </el-flex>
          <el-flex rules="css" :gap="2">
            <el-text :size="9" color="normal45">{{ t("manage.marketing.fields.version") }}</el-text>
            <el-text :size="12" :weight="700">{{ campaign.currentVersion ?? "—" }}</el-text>
          </el-flex>
          <el-flex rules="css" :gap="2">
            <el-text :size="9" color="normal45">{{ t("manage.marketing.fields.draftRevision") }}</el-text>
            <el-text :size="12" :weight="700">{{ campaign.draftRevision }}</el-text>
          </el-flex>
        </el-grid>

        <el-flex rules="rbc" :gap="8" class="w100">
          <el-text :size="9" color="normal45">{{ formatDate(campaign.updatedAt) }}</el-text>
          <el-button
            mode="flat"
            icon="arrow_forward"
            :label="t('manage.marketing.actions.open')"
            @click="openCampaign(campaign.id)"
          />
        </el-flex>
      </el-flex>
    </el-grid>

    <el-flex v-if="campaignsApi.hasMore.value" rules="ccc" class="w100">
      <el-button
        mode="flat"
        icon="expand_more"
        :label="t('manage.marketing.actions.loadMore')"
        :disable="campaignsApi.loading.value"
        @click="loadList(true)"
      />
    </el-flex>
  </el-flex>
</template>