<script setup lang="ts">
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { AdminEconomySettings } from "~/types/economy";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.SYSTEM_SETTINGS_MANAGE,
});

const auth = useAuth();
const adminEconomy = useAdminEconomy();
const { t, locale } = useI18n();
const { mobile, tablet } = useScreen();

const form = reactive({
  referenceValueToman: "",
  accountCreated: "",
  profileEmailAdded: "",
  referralJoined: "",
  referralReward: "",
  draftCreated: "",
  promptArchiveUnlock: "",
});

const saveFeedback = ref<"" | "saved" | "unchanged">("");

const summaryColumns = computed(() => {
  if (mobile.value) return 1;
  if (tablet.value) return 2;
  return 4;
});

const editorColumns = computed(() => (mobile.value ? 1 : 2));

function syncForm(settings: AdminEconomySettings) {
  form.referenceValueToman = String(settings.goinReferenceValueToman);
  form.accountCreated = String(settings.issuance.accountCreated);
  form.profileEmailAdded = String(settings.issuance.profileEmailAdded);
  form.referralJoined = String(settings.issuance.referralJoined);
  form.referralReward = String(settings.issuance.referralReward);
  form.draftCreated = String(settings.issuance.draftCreated);
  form.promptArchiveUnlock = String(settings.sinks.promptArchiveUnlock.costGoin);
  saveFeedback.value = "";
}

function parseWholeNumber(value: string, minimum: number) {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) return null;
  return parsed;
}

const parsedForm = computed(() => ({
  referenceValueToman: parseWholeNumber(form.referenceValueToman, 1),
  accountCreated: parseWholeNumber(form.accountCreated, 0),
  profileEmailAdded: parseWholeNumber(form.profileEmailAdded, 0),
  referralJoined: parseWholeNumber(form.referralJoined, 0),
  referralReward: parseWholeNumber(form.referralReward, 0),
  draftCreated: parseWholeNumber(form.draftCreated, 0),
  promptArchiveUnlock: parseWholeNumber(form.promptArchiveUnlock, 0),
}));

const formValid = computed(() => {
  return Object.values(parsedForm.value).every(value => value !== null);
});

const referenceInvalid = computed(() => {
  return parseWholeNumber(form.referenceValueToman, 1) === null;
});

const issuanceInvalid = computed(() => {
  return [
    form.accountCreated,
    form.profileEmailAdded,
    form.referralJoined,
    form.referralReward,
    form.draftCreated,
  ].some(value => parseWholeNumber(value, 0) === null);
});

const sinkInvalid = computed(() => {
  return parseWholeNumber(form.promptArchiveUnlock, 0) === null;
});

const dirty = computed(() => {
  const settings = adminEconomy.settings.value;
  const values = parsedForm.value;
  if (!settings || !formValid.value) return false;

  return (
    values.referenceValueToman !== settings.goinReferenceValueToman ||
    values.accountCreated !== settings.issuance.accountCreated ||
    values.profileEmailAdded !== settings.issuance.profileEmailAdded ||
    values.referralJoined !== settings.issuance.referralJoined ||
    values.referralReward !== settings.issuance.referralReward ||
    values.draftCreated !== settings.issuance.draftCreated ||
    values.promptArchiveUnlock !== settings.sinks.promptArchiveUnlock.costGoin
  );
});

const summaryCards = computed(() => {
  const settings = adminEconomy.settings.value;
  if (!settings) return [];

  return [
    {
      key: "reference",
      label: t("manage.economy.summary.referenceValue.label"),
      value: `${formatNumber(settings.goinReferenceValueToman)} ${t("manage.economy.units.toman")}`,
      icon: "paid",
      color: "green",
      helper: t("manage.economy.summary.referenceValue.helper"),
    },
    {
      key: "issuance-rule",
      label: t("manage.economy.summary.issuanceRule.label"),
      value: t("manage.economy.units.ruleVersion", {
        version: settings.issuance.ruleVersion,
      }),
      icon: "add_circle",
      color: "blue",
      helper: t("manage.economy.summary.issuanceRule.helper"),
    },
    {
      key: "sink-rule",
      label: t("manage.economy.summary.sinkRule.label"),
      value: t("manage.economy.units.ruleVersion", {
        version: settings.sinks.ruleVersion,
      }),
      icon: "remove_circle",
      color: "orange",
      helper: t("manage.economy.summary.sinkRule.helper"),
    },
    {
      key: "prompt-unlock",
      label: t("manage.economy.summary.promptUnlock.label"),
      value: `${formatNumber(settings.sinks.promptArchiveUnlock.costGoin)} goin`,
      icon: "lock_open",
      color: "prim",
      helper: t("manage.economy.summary.promptUnlock.helper"),
    },
  ];
});

const updatedLabel = computed(() => {
  const value = adminEconomy.settings.value?.updatedAt;
  if (!value) return t("manage.economy.neverUpdated");

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("manage.economy.neverUpdated");

  const formatted = date.toLocaleString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return t("manage.economy.lastUpdated", { date: formatted });
});

function formatNumber(value: number) {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
}

async function loadSettings() {
  saveFeedback.value = "";
  const settings = await adminEconomy.load();
  if (settings) syncForm(settings);
}

async function saveSettings() {
  const values = parsedForm.value;
  if (!formValid.value || !dirty.value) return;

  const response = await adminEconomy.save({
    goinReferenceValueToman: values.referenceValueToman!,
    issuance: {
      accountCreated: values.accountCreated!,
      profileEmailAdded: values.profileEmailAdded!,
      referralJoined: values.referralJoined!,
      referralReward: values.referralReward!,
      draftCreated: values.draftCreated!,
    },
    sinks: {
      promptArchiveUnlock: {
        costGoin: values.promptArchiveUnlock!,
      },
    },
  });

  if (!response) return;

  syncForm(response.settings);
  saveFeedback.value = response.changed ? "saved" : "unchanged";
}

onMounted(async () => {
  await auth.initialize();
  await loadSettings();
});
</script>

<template>
  <el-flex rules="ccs" :gap="16" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100" wrap>
      <el-text :size="11" color="normal45">
        {{ updatedLabel }}
      </el-text>

      <el-flex rules="rcc" :gap="8">
        <el-button
          mode="flat"
          color="normal"
          icon="refresh"
          :label="t('manage.economy.actions.reload')"
          :disable="adminEconomy.loading.value || adminEconomy.saving.value"
          @click="loadSettings"
        />
        <el-button
          color="prim"
          icon="save"
          :label="adminEconomy.saving.value
            ? t('manage.economy.actions.saving')
            : t('manage.economy.actions.save')"
          :disable="!formValid || !dirty || adminEconomy.loading.value || adminEconomy.saving.value"
          @click="saveSettings"
        />
      </el-flex>
    </el-flex>

    <el-flex
      rules="rsc"
      :gap="8"
      class="w100"
      bg="orange10"
      :p="12"
      :radius="12">
      <el-icon icon="science" color="orange" :size="18" />
      <el-text :size="12" color="normal" class="fg100">
        {{ t("manage.economy.simulationNotice") }}
      </el-text>
    </el-flex>

    <el-flex
      rules="rsc"
      :gap="8"
      class="w100"
      bg="blue10"
      :p="12"
      :radius="12">
      <el-icon icon="history" color="blue" :size="18" />
      <el-text :size="12" color="normal" class="fg100">
        {{ t("manage.economy.historyNotice") }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="adminEconomy.loadError.value || adminEconomy.saveError.value"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="12">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">
        {{ adminEconomy.saveError.value || adminEconomy.loadError.value || t("manage.economy.loadError") }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="saveFeedback"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="green10"
      :p="12"
      :radius="12">
      <el-icon icon="check_circle" color="green" :size="18" />
      <el-text color="green" :size="12">
        {{ saveFeedback === "saved"
          ? t("manage.economy.saved")
          : t("manage.economy.unchanged") }}
      </el-text>
    </el-flex>

    <el-flex
      v-if="adminEconomy.loading.value && !adminEconomy.settings.value"
      rules="ccc"
      class="w100"
      :p="28">
      <el-text color="normal55" :size="13">
        {{ t("manage.economy.loading") }}
      </el-text>
    </el-flex>

    <template v-else-if="adminEconomy.settings.value">
      <el-grid
        :cols="summaryColumns"
        :gap="12"
        align-items="stretch"
        class="w100">
        <ManageMetricCard
          v-for="card in summaryCards"
          :key="card.key"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :color="card.color"
          :helper="card.helper"
        />
      </el-grid>

      <el-flex
        rules="ccs"
        :gap="14"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="ccs" :gap="4" class="w100">
          <el-text :size="18" :weight="800">
            {{ t("manage.economy.sections.reference.title") }}
          </el-text>
          <el-text :size="12" color="normal55">
            {{ t("manage.economy.sections.reference.description") }}
          </el-text>
        </el-flex>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="12" :weight="700">
            {{ t("manage.economy.fields.referenceValueToman.label") }}
          </el-text>
          <el-text-field
            v-model="form.referenceValueToman"
            :actions="false"
            inputmode="numeric"
            pattern="[0-9]*"
            :disabled="adminEconomy.saving.value"
          />
          <el-text :size="10" :color="referenceInvalid ? 'red' : 'normal45'">
            {{ referenceInvalid
              ? t("manage.economy.validation.reference")
              : t("manage.economy.fields.referenceValueToman.helper") }}
          </el-text>
        </el-flex>
      </el-flex>

      <el-flex
        rules="ccs"
        :gap="14"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="12" class="w100" wrap>
          <el-flex rules="ccs" :gap="4" class="fg100">
            <el-text :size="18" :weight="800">
              {{ t("manage.economy.sections.issuance.title") }}
            </el-text>
            <el-text :size="12" color="normal55">
              {{ t("manage.economy.sections.issuance.description") }}
            </el-text>
          </el-flex>
          <el-text :size="11" marker="blue10" color="blue" :p="[4, 7]" :radius="100">
            {{ t("manage.economy.units.ruleVersion", {
              version: adminEconomy.settings.value.issuance.ruleVersion,
            }) }}
          </el-text>
        </el-flex>

        <el-grid :cols="editorColumns" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6" class="w100">
            <el-text :size="12" :weight="700">{{ t("manage.economy.fields.accountCreated.label") }}</el-text>
            <el-text-field v-model="form.accountCreated" :actions="false" inputmode="numeric" pattern="[0-9]*" :disabled="adminEconomy.saving.value" />
            <el-text :size="10" color="normal45">{{ t("manage.economy.fields.accountCreated.helper") }}</el-text>
          </el-flex>

          <el-flex rules="ccs" :gap="6" class="w100">
            <el-text :size="12" :weight="700">{{ t("manage.economy.fields.profileEmailAdded.label") }}</el-text>
            <el-text-field v-model="form.profileEmailAdded" :actions="false" inputmode="numeric" pattern="[0-9]*" :disabled="adminEconomy.saving.value" />
            <el-text :size="10" color="normal45">{{ t("manage.economy.fields.profileEmailAdded.helper") }}</el-text>
          </el-flex>

          <el-flex rules="ccs" :gap="6" class="w100">
            <el-text :size="12" :weight="700">{{ t("manage.economy.fields.referralJoined.label") }}</el-text>
            <el-text-field v-model="form.referralJoined" :actions="false" inputmode="numeric" pattern="[0-9]*" :disabled="adminEconomy.saving.value" />
            <el-text :size="10" color="normal45">{{ t("manage.economy.fields.referralJoined.helper") }}</el-text>
          </el-flex>

          <el-flex rules="ccs" :gap="6" class="w100">
            <el-text :size="12" :weight="700">{{ t("manage.economy.fields.referralReward.label") }}</el-text>
            <el-text-field v-model="form.referralReward" :actions="false" inputmode="numeric" pattern="[0-9]*" :disabled="adminEconomy.saving.value" />
            <el-text :size="10" color="normal45">{{ t("manage.economy.fields.referralReward.helper") }}</el-text>
          </el-flex>

          <el-flex rules="ccs" :gap="6" class="w100">
            <el-text :size="12" :weight="700">{{ t("manage.economy.fields.draftCreated.label") }}</el-text>
            <el-text-field v-model="form.draftCreated" :actions="false" inputmode="numeric" pattern="[0-9]*" :disabled="adminEconomy.saving.value" />
            <el-text :size="10" color="normal45">{{ t("manage.economy.fields.draftCreated.helper") }}</el-text>
          </el-flex>
        </el-grid>

        <el-text v-if="issuanceInvalid" :size="10" color="red">
          {{ t("manage.economy.validation.nonNegative") }}
        </el-text>
      </el-flex>

      <el-flex
        rules="ccs"
        :gap="14"
        class="w100"
        bg="surface"
        :p="16"
        :radius="14"
        :br="1"
        bc="normal15">
        <el-flex rules="rbc" :gap="12" class="w100" wrap>
          <el-flex rules="ccs" :gap="4" class="fg100">
            <el-text :size="18" :weight="800">
              {{ t("manage.economy.sections.sinks.title") }}
            </el-text>
            <el-text :size="12" color="normal55">
              {{ t("manage.economy.sections.sinks.description") }}
            </el-text>
          </el-flex>
          <el-text :size="11" marker="orange10" color="orange" :p="[4, 7]" :radius="100">
            {{ t("manage.economy.units.ruleVersion", {
              version: adminEconomy.settings.value.sinks.ruleVersion,
            }) }}
          </el-text>
        </el-flex>

        <el-flex rules="ccs" :gap="6" class="w100">
          <el-text :size="12" :weight="700">
            {{ t("manage.economy.fields.promptArchiveUnlock.label") }}
          </el-text>
          <el-text-field
            v-model="form.promptArchiveUnlock"
            :actions="false"
            inputmode="numeric"
            pattern="[0-9]*"
            :disabled="adminEconomy.saving.value"
          />
          <el-text :size="10" :color="sinkInvalid ? 'red' : 'normal45'">
            {{ sinkInvalid
              ? t("manage.economy.validation.nonNegative")
              : t("manage.economy.fields.promptArchiveUnlock.helper") }}
          </el-text>
        </el-flex>
      </el-flex>
    </template>
  </el-flex>
</template>
