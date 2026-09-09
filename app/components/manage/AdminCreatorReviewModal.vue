<script setup lang="ts">
import type {
  CreatorAdminAction,
  CreatorAdminEvent,
  CreatorAdminReview,
} from "~/types/creatorAdmin";

const props = defineProps<{
  userId: string;
}>();

const emit = defineEmits<{
  (event: "updated"): void;
}>();

const { locale, t } = useI18n();
const auth = useAuth();
const api = useCreatorAdmin();
const modal = useModal();

const review = ref<CreatorAdminReview | null>(null);
const events = ref<CreatorAdminEvent[]>([]);
const loading = ref(true);
const acting = ref(false);
const errorMessage = ref("");
const note = ref("");

const isSelf = computed(() => auth.user.value?.id === props.userId);
const creatorStatus = computed(() => review.value?.creator.status ?? "pending");
const accountLabel = computed(() => {
  const account = review.value?.account;
  return account?.username || account?.email || account?.id || props.userId;
});
const activeSkills = computed(() => (review.value?.profile.skills ?? []).filter(skill => skill.active));

function statusColor(status: CreatorAdminReview["creator"]["status"]) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "suspended") return "orange";
  return "blue";
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

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as {
    data?: {
      message?: unknown;
      errors?: Array<{ message?: unknown }>;
    };
  };
  const fieldMessage = value?.data?.errors?.find(item => typeof item?.message === "string")?.message;
  if (typeof fieldMessage === "string" && fieldMessage.trim()) return fieldMessage;
  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }
  return fallback;
}

function successMessage(action: CreatorAdminAction) {
  return t(`manage.creators.success.${action === "approve"
    ? "approved"
    : action === "reject"
      ? "rejected"
      : action === "suspend"
        ? "suspended"
        : "unsuspended"}`);
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [reviewResponse, eventsResponse] = await Promise.all([
      api.getReview(props.userId),
      api.getEvents(props.userId),
    ]);
    review.value = reviewResponse.review;
    events.value = eventsResponse.events;
    note.value = reviewResponse.review.creator.reviewNote ?? "";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, t("manage.creators.review.loadError"));
  } finally {
    loading.value = false;
  }
}

async function refreshEvents() {
  try {
    events.value = (await api.getEvents(props.userId)).events;
  } catch {
    // The main review state is authoritative; history refresh failure is non-destructive.
  }
}

async function applyAction(action: CreatorAdminAction) {
  if (!review.value || acting.value || isSelf.value) return;
  if (action === "approve" && !review.value.readiness.ready) return;

  acting.value = true;
  try {
    const actionNote = action === "approve" || action === "reject"
      ? note.value.trim() || null
      : null;
    const response = await api.applyAction(props.userId, action, actionNote);
    review.value = response.review;
    note.value = response.review.creator.reviewNote ?? "";
    await refreshEvents();
    emit("updated");
    modal.message({
      type: "success",
      title: t("manage.users.updatedTitle"),
      message: successMessage(action),
      actionLabel: t("manage.common.actions.done"),
    });
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.creators.actionFailedTitle"),
      message: getApiErrorMessage(error, t("manage.creators.actionFailed")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    acting.value = false;
  }
}

onMounted(async () => {
  await auth.initialize();
  await load();
});
</script>

<template>
  <el-flex rules="ccs" :gap="14" class="w100 admin-creator-review">
    <el-text v-if="loading" color="normal55" :size="13">
      {{ t("manage.creators.review.loading") }}
    </el-text>

    <el-flex
      v-else-if="errorMessage"
      rules="rsc"
      :gap="8"
      bg="red10"
      :p="12"
      :radius="10"
      class="w100">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ errorMessage }}</el-text>
    </el-flex>

    <template v-else-if="review">
      <el-flex rules="rbc" :gap="12" class="w100 fw">
        <el-flex rules="rsc" :gap="10" class="minw0">
          <el-avatar
            :name="accountLabel"
            size="small"
          />
          <el-flex rules="ccs" :gap="2" class="minw0">
            <el-text :size="15" :weight="900">{{ accountLabel }}</el-text>
            <el-text :size="9" color="normal45">{{ review.account.id }}</el-text>
          </el-flex>
        </el-flex>
        <el-text
          :size="11"
          :weight="800"
          :color="statusColor(review.creator.status)"
          :marker="`${statusColor(review.creator.status)}15`">
          {{ t(`manage.creators.statuses.${review.creator.status}`) }}
        </el-text>
      </el-flex>

      <el-grid cols="repeat(3, minmax(0, 1fr))" :gap="8" class="w100 admin-creator-review__summary">
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10">
          <el-text :size="9" color="normal45">{{ t("manage.creators.review.accountStatus") }}</el-text>
          <el-text :size="11" :weight="800" :color="review.account.status === 'active' ? 'green' : 'red'">
            {{ t(`manage.common.statuses.${review.account.status}`) }}
          </el-text>
        </el-flex>
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10">
          <el-text :size="9" color="normal45">{{ t("manage.creators.review.creatorStatus") }}</el-text>
          <el-text :size="11" :weight="800" :color="statusColor(review.creator.status)">
            {{ t(`manage.creators.statuses.${review.creator.status}`) }}
          </el-text>
        </el-flex>
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10">
          <el-text :size="9" color="normal45">{{ t("manage.creators.review.readiness") }}</el-text>
          <el-text :size="11" :weight="800" :color="review.readiness.ready ? 'green' : 'orange'">
            {{ review.readiness.ready ? t("manage.creators.review.ready") : t("manage.creators.review.notReady") }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-flex v-if="isSelf" rules="rsc" :gap="8" bg="orange10" :p="10" :radius="10" class="w100">
        <el-icon icon="warning" color="orange" :size="16" />
        <el-text color="orange" :size="10">{{ t("manage.creators.review.selfReviewBlocked") }}</el-text>
      </el-flex>

      <el-grid cols="minmax(0, 1fr) minmax(0, 1fr)" :gap="10" class="w100 admin-creator-review__localized">
        <el-flex rules="ccs" :gap="6" :p="10" :radius="10" :br="1" bc="normal10" dir="ltr">
          <el-text :size="10" :weight="800">EN · {{ t("manage.creators.review.screenName") }}</el-text>
          <el-text :size="12">{{ review.profile.screenName.en || t("manage.creators.review.noValue") }}</el-text>
          <el-text :size="10" :weight="800">EN · {{ t("manage.creators.review.bio") }}</el-text>
          <el-text :size="11" class="admin-creator-review__prewrap">{{ review.profile.bio.en || t("manage.creators.review.noValue") }}</el-text>
          <el-text :size="10" :weight="800">EN · {{ t("manage.creators.review.article") }}</el-text>
          <div class="admin-creator-review__article">{{ review.profile.article.en || t("manage.creators.review.noValue") }}</div>
        </el-flex>

        <el-flex rules="ccs" :gap="6" :p="10" :radius="10" :br="1" bc="normal10" dir="rtl">
          <el-text :size="10" :weight="800">FA · {{ t("manage.creators.review.screenName") }}</el-text>
          <el-text :size="12">{{ review.profile.screenName.fa || t("manage.creators.review.noValue") }}</el-text>
          <el-text :size="10" :weight="800">FA · {{ t("manage.creators.review.bio") }}</el-text>
          <el-text :size="11" class="admin-creator-review__prewrap">{{ review.profile.bio.fa || t("manage.creators.review.noValue") }}</el-text>
          <el-text :size="10" :weight="800">FA · {{ t("manage.creators.review.article") }}</el-text>
          <div class="admin-creator-review__article">{{ review.profile.article.fa || t("manage.creators.review.noValue") }}</div>
        </el-flex>
      </el-grid>

      <el-grid cols="minmax(0, 1fr) minmax(0, 1fr)" :gap="10" class="w100 admin-creator-review__details">
        <el-flex rules="ccs" :gap="6" :p="10" :radius="10" :br="1" bc="normal10">
          <el-text :size="10" :weight="800">{{ t("manage.creators.review.skills") }}</el-text>
          <el-flex v-if="activeSkills.length" rules="rsc" :gap="6" wrap>
            <el-text
              v-for="skill in activeSkills"
              :key="skill.slug"
              :size="9"
              :marker="'blue10'">
              {{ skill.title[locale === 'fa' ? 'fa' : 'en'] || skill.title.en }}
            </el-text>
          </el-flex>
          <el-text v-else :size="10" color="normal45">{{ t("manage.creators.review.noValue") }}</el-text>
        </el-flex>

        <el-flex rules="ccs" :gap="6" :p="10" :radius="10" :br="1" bc="normal10">
          <el-text :size="10" :weight="800">{{ t("manage.creators.review.location") }}</el-text>
          <el-text :size="10">{{ review.profile.location?.text || t("manage.creators.review.noValue") }}</el-text>
          <el-text :size="10" :weight="800">{{ t("manage.creators.review.links") }}</el-text>
          <el-flex v-if="review.profile.links.length" rules="ccs" :gap="3">
            <el-text v-for="link in review.profile.links" :key="`${link.type}-${link.url}`" :size="9">
              {{ link.label || link.type }} · {{ link.url }}
            </el-text>
          </el-flex>
          <el-text v-else :size="10" color="normal45">{{ t("manage.creators.review.noValue") }}</el-text>
        </el-flex>
      </el-grid>

      <el-flex rules="ccs" :gap="6" class="w100">
        <el-text :size="10" :weight="800">{{ t("manage.creators.review.reviewNote") }}</el-text>
        <el-text-field
          v-model="note"
          type="textarea"
          :rows="3"
          :actions="false"
          :disabled="acting || creatorStatus !== 'pending'"
          :placeholder="t('manage.creators.review.reviewNotePlaceholder')"
        />
        <el-text
          v-if="review.creator.reviewNote && creatorStatus !== 'pending'"
          :size="9"
          color="normal45">
          {{ t("manage.creators.review.currentReviewNote") }}: {{ review.creator.reviewNote }}
        </el-text>
      </el-flex>

      <el-flex rules="rsc" :gap="8" wrap class="w100">
        <el-button
          v-if="creatorStatus === 'pending'"
          color="green"
          icon="verified"
          :label="t('manage.creators.actions.approve')"
          :disable="acting || isSelf || !review.readiness.ready"
          @click="applyAction('approve')"
        />
        <el-button
          v-if="creatorStatus === 'pending'"
          color="red"
          mode="flat"
          icon="cancel"
          :label="t('manage.creators.actions.reject')"
          :disable="acting || isSelf"
          @click="applyAction('reject')"
        />
        <el-button
          v-if="creatorStatus === 'approved'"
          color="orange"
          mode="flat"
          icon="block"
          :label="t('manage.creators.actions.suspend')"
          :disable="acting || isSelf"
          @click="applyAction('suspend')"
        />
        <el-button
          v-if="creatorStatus === 'suspended'"
          color="green"
          mode="flat"
          icon="restore"
          :label="t('manage.creators.actions.unsuspend')"
          :disable="acting || isSelf"
          @click="applyAction('unsuspend')"
        />
      </el-flex>

      <el-divider />

      <el-flex rules="ccs" :gap="8" class="w100">
        <el-text :size="12" :weight="900">{{ t("manage.creators.review.history") }}</el-text>
        <el-text v-if="!events.length" :size="10" color="normal45">
          {{ t("manage.creators.review.noHistory") }}
        </el-text>
        <el-flex
          v-for="event in events"
          :key="event.id"
          rules="rbc"
          :gap="10"
          :p="8"
          :radius="9"
          bg="surface50"
          class="w100 fw">
          <el-flex rules="ccs" :gap="2">
            <el-text :size="10" :weight="800">
              {{ t(`manage.creators.review.eventTypes.${event.eventType}`) }}
            </el-text>
            <el-text :size="8" color="normal45">
              {{ event.actorUserId || t("manage.creators.review.systemActor") }}
            </el-text>
          </el-flex>
          <el-text :size="9" color="normal45">{{ formatDate(event.createdAt) }}</el-text>
        </el-flex>
      </el-flex>
    </template>
  </el-flex>
</template>

<style scoped>
.admin-creator-review__article,
.admin-creator-review__prewrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.admin-creator-review__article {
  width: 100%;
  max-height: 220px;
  overflow: auto;
  padding: 8px;
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  font-size: 10px;
  line-height: 1.65;
}

@media (max-width: 720px) {
  .admin-creator-review__summary,
  .admin-creator-review__localized,
  .admin-creator-review__details {
    grid-template-columns: 1fr !important;
  }
}
</style>
