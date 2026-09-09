<script setup lang="ts">
import type { ProfileManagementResponse } from "~/types/profileManagement";

const props = defineProps<{
  creator: ProfileManagementResponse["creator"];
}>();

const emit = defineEmits<{
  (event: "updated"): void;
}>();

const { t } = useI18n();
const profileApi = useProfileManagement();
const modal = useModal();
const requesting = ref(false);

const status = computed(() => props.creator.status);
const ready = computed(() => Boolean(props.creator.readiness.ready));
const canRequest = computed(() => {
  return ready.value && (status.value === "none" || status.value === "rejected");
});
const showRequestAction = computed(() => status.value === "none" || status.value === "rejected");
const actionLabel = computed(() => status.value === "rejected"
  ? t("manage.profile.creator.actions.reapply")
  : t("manage.profile.creator.actions.request"));
const statusTitle = computed(() => {
  if (status.value === "pending") return t("manage.profile.creator.pendingTitle");
  if (status.value === "approved") return t("manage.profile.creator.approvedTitle");
  if (status.value === "rejected") return t("manage.profile.creator.rejectedTitle");
  if (status.value === "suspended") return t("manage.profile.creator.suspendedTitle");
  return ready.value
    ? t("manage.profile.creator.ready")
    : t("manage.profile.creator.notReady");
});
const statusDescription = computed(() => {
  if (status.value === "pending") return t("manage.profile.creator.pendingDescription");
  if (status.value === "approved") return t("manage.profile.creator.approvedDescription");
  if (status.value === "rejected") return t("manage.profile.creator.rejectedDescription");
  if (status.value === "suspended") return t("manage.profile.creator.suspendedDescription");
  return ready.value
    ? t("manage.profile.creator.readyDescription")
    : t("manage.profile.creator.notReadyDescription");
});

function getApiErrorMessage(error: unknown) {
  const value = error as {
    data?: {
      message?: unknown;
      errors?: Array<{ message?: unknown }>;
    };
  };

  const fieldMessage = value?.data?.errors?.find(
    item => typeof item?.message === "string",
  )?.message;
  if (typeof fieldMessage === "string" && fieldMessage.trim()) return fieldMessage;
  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }
  return t("manage.profile.creator.requestFailed");
}

async function requestCreatorAccount() {
  if (!canRequest.value || requesting.value) return;
  requesting.value = true;

  try {
    await profileApi.requestCreator();
    emit("updated");
    modal.message({
      type: "success",
      title: t("manage.profile.creator.requestedTitle"),
      message: t("manage.profile.creator.requestedMessage"),
      actionLabel: t("manage.common.actions.done"),
    });
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.profile.creator.requestFailedTitle"),
      message: getApiErrorMessage(error),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    requesting.value = false;
  }
}
</script>

<template>
  <el-flex
    rules="rbc"
    :gap="12"
    :p="18"
    bg="surface"
    :radius="16"
    :br="1"
    bc="normal15"
    class="w100 fw">
    <el-flex rules="ccs" :gap="5" style="flex: 1 1 360px;">
      <el-flex rules="rsc" :gap="7" wrap>
        <el-text :size="14" :weight="800">{{ statusTitle }}</el-text>
        <el-text
          :marker="ready ? 'green15' : status === 'rejected' ? 'red15' : 'normal15'"
          :size="10"
          :weight="700">
          {{ t(`manage.profile.creator.statuses.${status}`) }}
        </el-text>
      </el-flex>
      <el-text :size="10" color="normal55">{{ statusDescription }}</el-text>
      <el-text
        v-if="showRequestAction"
        :size="9"
        color="normal45">
        {{ t("manage.profile.creator.savedProfileHint") }}
      </el-text>
      <el-text
        v-if="showRequestAction && !ready && creator.readiness.missingFields.length"
        :size="10"
        color="orange">
        {{ creator.readiness.missingFields.join(" · ") }}
      </el-text>
    </el-flex>

    <el-button
      v-if="showRequestAction"
      color="prim"
      icon="workspace_premium"
      :label="actionLabel"
      :disable="requesting || !canRequest"
      @click="requestCreatorAccount"
    />
  </el-flex>
</template>
