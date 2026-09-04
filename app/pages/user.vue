<script setup lang="ts">
import type {
  PublicUserProfile,
  UserDraftVisibility,
  UserProfileDraftSummary,
} from "~/types/userProfileApi";

const route = useRoute();
const auth = useAuth();
const api = useUserProfileApi();
const { t, locale } = useI18n();
const { mobile, tablet, mini } = useScreen();

const profile = ref<PublicUserProfile | null>(null);
const drafts = ref<UserProfileDraftSummary[]>([]);
const isOwner = ref(false);
const loading = ref(true);
const draftsLoading = ref(false);
const loadingMore = ref(false);
const errorMessage = ref("");
const draftsError = ref("");
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const visibilityBusyIds = ref<string[]>([]);
let requestVersion = 0;

const userId = computed(() => {
  const value = typeof route.query.id === "string" ? route.query.id.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
});

const displayName = computed(() => {
  const username = profile.value?.username?.trim();
  if (!username) return t("userProfile.fallbackName");
  return `${username.charAt(0).toUpperCase()}${username.slice(1)}`;
});

const heroTitleSize = computed(() => {
  if (mobile.value) return 44;
  if (tablet.value || mini.value) return 62;
  return 88;
});

const contentPadding = computed(() => {
  if (mobile.value) return 16;
  if (tablet.value || mini.value) return 24;
  return 40;
});

const heroStyle = computed(() => ({
  minHeight: `calc(100vh - ${dimension().header.height}px)`,
}));

const draftColumns = computed(() => {
  if (mobile.value) return 1;
  if (tablet.value || mini.value) return 2;
  return 3;
});

const formattedXp = computed(() => {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(
    profile.value?.totalXp ?? 0,
  );
});

const visibleDraftCount = computed(() => {
  if (!profile.value) return 0;
  return isOwner.value
    ? profile.value.totalDraftCount ?? profile.value.publicDraftCount
    : profile.value.publicDraftCount;
});

const draftDescription = computed(() => {
  return isOwner.value
    ? t("userProfile.drafts.ownerDescription")
    : t("userProfile.drafts.publicDescription");
});

useHead(() => ({
  title: profile.value
    ? `${displayName.value} · Prompt Draft`
    : t("userProfile.fallbackName"),
}));

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatOutputFormat(value: UserProfileDraftSummary["outputFormat"]) {
  return value.toUpperCase();
}

function scrollToDrafts() {
  if (!import.meta.client) return;
  document.getElementById("user-profile-drafts")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function loadDrafts(
  targetUserId: string,
  options: { append?: boolean; version?: number } = {},
) {
  const append = Boolean(options.append);
  const version = options.version ?? requestVersion;

  if (append) {
    if (!hasMore.value || !nextCursor.value || loadingMore.value) return;
    loadingMore.value = true;
  } else {
    draftsLoading.value = true;
    draftsError.value = "";
  }

  try {
    const response = await api.listDrafts(targetUserId, {
      limit: 24,
      cursor: append ? nextCursor.value || undefined : undefined,
    });

    if (version !== requestVersion) return;

    drafts.value = append ? [...drafts.value, ...response.drafts] : response.drafts;
    isOwner.value = response.viewer.isOwner;
    nextCursor.value = response.pageInfo.nextCursor;
    hasMore.value = response.pageInfo.hasMore;
  } catch (error) {
    if (version !== requestVersion) return;
    draftsError.value = getApiErrorMessage(error, t("userProfile.drafts.errors.load"));

    if (!append) {
      drafts.value = [];
      nextCursor.value = null;
      hasMore.value = false;
    }
  } finally {
    if (version === requestVersion) {
      draftsLoading.value = false;
      loadingMore.value = false;
    }
  }
}

async function loadProfile() {
  const targetUserId = userId.value;
  const version = ++requestVersion;

  loading.value = true;
  errorMessage.value = "";
  draftsError.value = "";
  profile.value = null;
  drafts.value = [];
  nextCursor.value = null;
  hasMore.value = false;
  isOwner.value = false;

  if (!targetUserId) {
    errorMessage.value = t("userProfile.notFoundDescription");
    loading.value = false;
    return;
  }

  await auth.initialize();

  try {
    const response = await api.getProfile(targetUserId);
    if (version !== requestVersion) return;

    profile.value = response.profile;
    isOwner.value = response.viewer.isOwner;
    await loadDrafts(targetUserId, { version });
  } catch (error) {
    if (version !== requestVersion) return;
    errorMessage.value = getApiErrorMessage(error, t("userProfile.notFoundDescription"));
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

async function refreshProfileSummary() {
  const targetUserId = userId.value;
  if (!targetUserId) return;

  try {
    const response = await api.getProfile(targetUserId);
    profile.value = response.profile;
    isOwner.value = response.viewer.isOwner;
  } catch {
    // Draft visibility already succeeded; a summary refresh failure is non-blocking.
  }
}

async function setVisibility(
  draft: UserProfileDraftSummary,
  visibility: UserDraftVisibility,
) {
  if (!isOwner.value || visibilityBusyIds.value.includes(draft.id)) return;

  visibilityBusyIds.value = [...visibilityBusyIds.value, draft.id];
  draftsError.value = "";

  try {
    const response = await api.setDraftVisibility(draft.id, visibility);
    draft.visibility = response.draft.visibility;
    draft.publishedAt = response.draft.publishedAt;
    await refreshProfileSummary();
  } catch (error) {
    draftsError.value = getApiErrorMessage(
      error,
      t("userProfile.drafts.errors.visibility"),
    );
  } finally {
    visibilityBusyIds.value = visibilityBusyIds.value.filter(id => id !== draft.id);
  }
}

function loadMore() {
  if (!userId.value) return;
  return loadDrafts(userId.value, { append: true });
}

watch(
  () => route.query.id,
  () => {
    void loadProfile();
  },
);

onMounted(() => {
  void loadProfile();
});
</script>

<template>
  <el-flex
    v-if="loading"
    rules="ccc"
    class="w100 h100"
    :gap="10"
    :p="40">
    <el-icon icon="refresh" color="prim" :size="34" />
    <el-text :size="13" color="normal55">{{ t("userProfile.loading") }}</el-text>
  </el-flex>

  <el-flex
    v-else-if="errorMessage || !profile"
    rules="ccc"
    class="w100 h100"
    :gap="10"
    :p="32">
    <el-icon icon="person_off" color="normal35" :size="44" />
    <el-text type="h1" :size="mini ? 24 : 32" :weight="900">
      {{ t("userProfile.notFoundTitle") }}
    </el-text>
    <el-text type="p" :size="13" color="normal55" class="tc">
      {{ errorMessage || t("userProfile.notFoundDescription") }}
    </el-text>
    <el-button
      icon="refresh"
      mode="flat"
      color="prim"
      :label="t('userProfile.retry')"
      @click="loadProfile"
    />
  </el-flex>

  <div v-else class="user-profile w100 por">
    <visual-slider
      v-if="profile.cover?.fullUrl"
      :sources="[profile.cover.fullUrl]"
      :interval="9000"
      :transition-duration="2600"
      :edge-blur="320"
      :random="false"
      :z-index="0"
      :opacity="1"
      :start-index="0"
    />
    <div v-else class="user-profile__fallback-bg" />

    <div class="user-profile__cinema-overlay" />
    <div class="user-profile__grain" />

    <section class="user-profile__hero w100 por zi20" :style="heroStyle">
      <el-flex
        rules="cbs"
        class="user-profile__hero-content w100 h100"
        :gap="18"
        :p="contentPadding">
        <el-flex rules="rsc" :gap="14" wrap class="w100">
          <el-avatar
            :src="profile.avatarUrl"
            :name="displayName"
            :size="mobile ? 20 : 28"
            :br="3"
            bc="white"
          />

          <el-flex rules="ccs" :gap="6">
            <el-text
              :size="10"
              :weight="900"
              marker="white"
              color="black"
              :p="[3, 7]"
              :radius="100">
              {{ t("userProfile.eyebrow") }}
            </el-text>
            <el-text :size="mobile ? 11 : 13" color="white">
              {{ t("userProfile.memberSince", { date: formatDate(profile.createdAt) }) }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-text
          type="h1"
          :size="heroTitleSize"
          :weight="600"
          color="white"
          effect="glitch"
          class="user-profile__title">
          {{ displayName }}
        </el-text>

        <el-flex rules="rsc" :gap="mobile ? 8 : 14" wrap class="w100">
          <el-flex
            rules="ccs"
            :gap="2"
            class="user-profile__stat"
            :p="[10, 14]"
            :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">
              {{ formattedXp }}
            </el-text>
            <el-text :size="10" color="white">{{ t("userProfile.stats.xp") }}</el-text>
          </el-flex>

          <el-flex
            rules="ccs"
            :gap="2"
            class="user-profile__stat"
            :p="[10, 14]"
            :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">
              {{ profile.publicDraftCount }}
            </el-text>
            <el-text :size="10" color="white">
              {{ t("userProfile.stats.publicDrafts") }}
            </el-text>
          </el-flex>

          <el-flex
            v-if="isOwner"
            rules="ccs"
            :gap="2"
            class="user-profile__stat"
            :p="[10, 14]"
            :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">
              {{ profile.totalDraftCount ?? profile.publicDraftCount }}
            </el-text>
            <el-text :size="10" color="white">
              {{ t("userProfile.stats.totalDrafts") }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-button
          :label="t('userProfile.drafts.title')"
          icon="arrow_downward"
          mode="outline"
          color="white"
          text-color="white"
          icon-color="white"
          :size="13"
          :p="[9, 14]"
          @click="scrollToDrafts"
        />
      </el-flex>
    </section>

    <section id="user-profile-drafts" class="user-profile__drafts por zi20">
      <el-flex
        rules="csc"
        class="w100"
        :gap="24"
        :p="contentPadding">
        <el-grid :gap="8" class="w100">
          <el-text
            :size="10"
            :weight="900"
            marker="prim"
            color="white"
            class="wsnw">
            {{ t("userProfile.drafts.eyebrow") }}
          </el-text>
          <el-text
            type="h2"
            :size="mobile ? 34 : 54"
            :weight="600">
            {{ t("userProfile.drafts.title") }}
          </el-text>
          <el-text type="p" :size="mobile ? 12 : 14" color="normal55" style="max-width: 760px">
            {{ draftDescription }}
          </el-text>
          <el-text :size="11" color="normal45">
            {{ visibleDraftCount }}
          </el-text>
        </el-grid>

        <el-flex
          v-if="draftsError"
          rules="rsc"
          class="w100"
          :gap="8"
          :p="12"
          :radius="12"
          bg="red10">
          <el-icon icon="warning" color="red" :size="18" />
          <el-text color="red" :size="11">{{ draftsError }}</el-text>
        </el-flex>

        <el-flex
          v-if="draftsLoading"
          rules="ccc"
          class="w100"
          :gap="8"
          :p="32">
          <el-icon icon="refresh" color="prim" :size="26" />
        </el-flex>

        <el-flex
          v-else-if="!drafts.length"
          rules="ccc"
          class="w100"
          :gap="10"
          :p="48"
          :radius="20"
          bg="normal5">
          <el-icon icon="draft" color="normal35" :size="38" />
          <el-text :size="14" :weight="700" class="tc">
            {{ isOwner ? t("userProfile.drafts.emptyOwner") : t("userProfile.drafts.emptyPublic") }}
          </el-text>
        </el-flex>

        <el-grid v-else :cols="draftColumns" :gap="14" class="w100">
          <el-flex
            v-for="draft in drafts"
            :key="draft.id"
            rules="cbs"
            class="user-profile__draft-card w100"
            :gap="22"
            :p="18"
            :radius="18"
            :br="1"
            bc="normal12">
            <el-flex rules="rbc" :gap="8" class="w100">
              <el-text
                :size="10"
                :weight="800"
                marker="normal10"
                :p="[3, 6]"
                :radius="100">
                {{ formatOutputFormat(draft.outputFormat) }}
              </el-text>

              <el-text
                v-if="isOwner && draft.visibility"
                :size="10"
                :weight="800"
                :marker="draft.visibility === 'public' ? 'green15' : 'orange15'"
                :color="draft.visibility === 'public' ? 'green' : 'orange'"
                :p="[3, 6]"
                :radius="100">
                {{ t(`userProfile.drafts.visibility.${draft.visibility}`) }}
              </el-text>
            </el-flex>

            <el-flex rules="ccs" :gap="8" class="w100">
              <el-text type="h3" :size="mobile ? 20 : 24" :weight="650">
                {{ draft.title }}
              </el-text>
              <el-text :size="10" color="normal40">{{ draft.id }}</el-text>
            </el-flex>

            <el-flex rules="rsc" :gap="10" wrap class="w100">
              <el-text :size="10" color="normal55" icon="account_tree" icon-color="normal45">
                {{ t("userProfile.drafts.modules", { count: draft.moduleCount }) }}
              </el-text>
              <el-text :size="10" color="normal55" icon="history" icon-color="normal45">
                {{ t("userProfile.drafts.revision", { revision: draft.revision }) }}
              </el-text>
              <el-text :size="10" color="normal55" icon="schedule" icon-color="normal45">
                {{ t("userProfile.drafts.updated", { date: formatUpdatedDate(draft.updatedAt) }) }}
              </el-text>
            </el-flex>

            <el-button
              v-if="isOwner && draft.visibility"
              class="w100"
              :color="draft.visibility === 'public' ? 'orange' : 'green'"
              mode="flat"
              :icon="draft.visibility === 'public' ? 'visibility_off' : 'public'"
              :label="draft.visibility === 'public'
                ? t('userProfile.drafts.actions.unpublish')
                : t('userProfile.drafts.actions.publish')"
              :disable="visibilityBusyIds.includes(draft.id)"
              @click="setVisibility(draft, draft.visibility === 'public' ? 'private' : 'public')"
            />
          </el-flex>
        </el-grid>

        <el-button
          v-if="hasMore"
          icon="expand_more"
          mode="flat"
          color="normal"
          :label="t('userProfile.drafts.loadMore')"
          :disable="loadingMore"
          @click="loadMore"
        />
      </el-flex>
    </section>
  </div>
</template>

<style scoped>
.user-profile {
  min-height: 100%;
  background: var(--surface);
}

.user-profile__fallback-bg {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(100vh, 920px);
  background:
    radial-gradient(circle at 14% 22%, rgba(69, 98, 255, 0.34), transparent 40%),
    radial-gradient(circle at 84% 18%, rgba(133, 64, 255, 0.24), transparent 42%),
    radial-gradient(circle at 54% 88%, rgba(20, 180, 165, 0.14), transparent 45%),
    linear-gradient(135deg, #171921, #090a0f 78%);
}

.user-profile__cinema-overlay {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(100vh, 920px);
  z-index: 5;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(5, 6, 9, 0.16), rgba(5, 6, 9, 0.3) 48%, rgba(5, 6, 9, 0.88) 100%),
    linear-gradient(90deg, rgba(5, 6, 9, 0.48), transparent 62%);
}

.user-profile__grain {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(100vh, 920px);
  z-index: 6;
  pointer-events: none;
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.38'/%3E%3C/svg%3E");
}

.user-profile__hero {
  display: flex;
  align-items: stretch;
}

.user-profile__hero-content {
  justify-content: flex-end;
  padding-bottom: clamp(44px, 8vh, 92px) !important;
}

.user-profile__title {
  max-width: min(1200px, 94vw);
  line-height: 0.92 !important;
  text-wrap: balance;
}

.user-profile__stat {
  min-width: 116px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(10, 12, 18, 0.34);
  backdrop-filter: blur(14px);
}

.user-profile__drafts {
  background: linear-gradient(to bottom, rgba(11, 12, 16, 0.99), var(--surface) 260px);
}

.user-profile__draft-card {
  min-height: 270px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 55%),
    var(--surface);
  transition: transform 220ms ease, border-color 220ms ease;
}

.user-profile__draft-card:hover {
  transform: translateY(-3px);
  border-color: rgba(115, 124, 255, 0.32) !important;
}
</style>
