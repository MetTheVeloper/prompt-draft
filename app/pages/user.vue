<script setup lang="ts">
import type {
  PublicUserProfile,
  UserDraftVisibility,
  UserProfileDraftSummary,
} from "~/types/userProfileApi";
import {
  DRAFT_PREVIEW_IMAGE_MAX_COUNT,
  prepareDraftPreviewImage,
} from "~/utils/draftPreviewImage";

const route = useRoute();
const auth = useAuth();
const avatarState = useUserAvatar();
const coverState = useUserCover();
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
const hoveredDraftId = ref<string | null>(null);
const draftMediaInput = ref<HTMLInputElement | null>(null);
const draftMediaTargetId = ref<string | null>(null);
const draftMediaBusyIds = ref<string[]>([]);
const draftMediaErrors = reactive<Record<string, string>>({});
let requestVersion = 0;

const routeUserId = computed(() => {
  const value = typeof route.query.id === "string" ? route.query.id.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
});

const routeUsername = computed(() => {
  const value = typeof route.query.un === "string"
    ? route.query.un.trim().toLowerCase()
    : "";

  return /^[a-z0-9._-]{3,64}$/.test(value) ? value : null;
});

const displayName = computed(() => {
  const username = profile.value?.username?.trim();
  if (!username) return t("userProfile.fallbackName");
  return `${username.charAt(0).toUpperCase()}${username.slice(1)}`;
});

const heroAvatarUrl = computed(() => {
  if (!profile.value) return null;

  if (
    isOwner.value &&
    avatarState.loadedUserId.value === profile.value.id
  ) {
    return avatarState.url.value;
  }

  return profile.value.avatarUrl;
});

const heroCoverUrl = computed(() => {
  if (!profile.value) return null;

  if (
    isOwner.value &&
    coverState.loadedUserId.value === profile.value.id
  ) {
    return coverState.fullUrl.value;
  }

  return profile.value.cover?.fullUrl || null;
});

const heroTitleSize = computed(() => {
  if (mobile.value) return 46;
  if (tablet.value || mini.value) return 64;
  return 86;
});

const heroAvatarSize = computed(() => {
  if (mobile.value) return 30;
  if (tablet.value || mini.value) return 36;
  return 44;
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

function isDraftMediaBusy(draftId: string) {
  return draftMediaBusyIds.value.includes(draftId);
}

function setDraftMediaBusy(draftId: string, busy: boolean) {
  if (busy) {
    if (!draftMediaBusyIds.value.includes(draftId)) {
      draftMediaBusyIds.value = [...draftMediaBusyIds.value, draftId];
    }
    return;
  }

  draftMediaBusyIds.value = draftMediaBusyIds.value.filter(id => id !== draftId);
}

function setDraftMediaError(draftId: string, message = "") {
  if (message) {
    draftMediaErrors[draftId] = message;
  } else {
    delete draftMediaErrors[draftId];
  }
}

function openDraftMediaPicker(draft: UserProfileDraftSummary) {
  if (!isOwner.value || isDraftMediaBusy(draft.id)) return;

  if (draft.images.length >= DRAFT_PREVIEW_IMAGE_MAX_COUNT) {
    setDraftMediaError(
      draft.id,
      t("userProfile.drafts.media.errors.limit", {
        max: DRAFT_PREVIEW_IMAGE_MAX_COUNT,
      }),
    );
    return;
  }

  draftMediaTargetId.value = draft.id;
  setDraftMediaError(draft.id);
  if (draftMediaInput.value) draftMediaInput.value.value = "";
  draftMediaInput.value?.click();
}

async function handleDraftMediaSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const targetId = draftMediaTargetId.value;
  const files = Array.from(input.files || []);
  input.value = "";
  draftMediaTargetId.value = null;

  if (!targetId || !files.length) return;

  const draft = drafts.value.find(item => item.id === targetId);
  if (!draft || !isOwner.value || isDraftMediaBusy(draft.id)) return;

  const remaining = DRAFT_PREVIEW_IMAGE_MAX_COUNT - draft.images.length;
  if (files.length > remaining) {
    setDraftMediaError(
      draft.id,
      t("userProfile.drafts.media.errors.limit", {
        max: DRAFT_PREVIEW_IMAGE_MAX_COUNT,
      }),
    );
    return;
  }

  setDraftMediaBusy(draft.id, true);
  setDraftMediaError(draft.id);
  let fallback = t("userProfile.drafts.media.errors.prepare");

  try {
    for (const file of files) {
      fallback = t("userProfile.drafts.media.errors.prepare");
      const prepared = await prepareDraftPreviewImage(file);
      fallback = t("userProfile.drafts.media.errors.upload");
      const response = await api.addDraftImage(draft.id, prepared.blob);
      draft.images = response.images;
    }
  } catch (error) {
    setDraftMediaError(draft.id, getApiErrorMessage(error, fallback));
  } finally {
    setDraftMediaBusy(draft.id, false);
  }
}

async function removePrimaryDraftImage(draft: UserProfileDraftSummary) {
  if (!isOwner.value || isDraftMediaBusy(draft.id)) return;
  const primary = draft.images[0];
  if (!primary) return;

  setDraftMediaBusy(draft.id, true);
  setDraftMediaError(draft.id);

  try {
    const response = await api.removeDraftImage(draft.id, primary.id);
    draft.images = response.images;
  } catch (error) {
    setDraftMediaError(
      draft.id,
      getApiErrorMessage(error, t("userProfile.drafts.media.errors.remove")),
    );
  } finally {
    setDraftMediaBusy(draft.id, false);
  }
}

async function useNextDraftImageAsPrimary(draft: UserProfileDraftSummary) {
  if (!isOwner.value || isDraftMediaBusy(draft.id) || draft.images.length < 2) return;
  const next = draft.images[1];
  if (!next) return;

  setDraftMediaBusy(draft.id, true);
  setDraftMediaError(draft.id);

  try {
    const response = await api.makeDraftImagePrimary(draft.id, next.id);
    draft.images = response.images;
  } catch (error) {
    setDraftMediaError(
      draft.id,
      getApiErrorMessage(error, t("userProfile.drafts.media.errors.primary")),
    );
  } finally {
    setDraftMediaBusy(draft.id, false);
  }
}

async function resolveTargetUserId() {
  if (routeUserId.value) return routeUserId.value;
  if (!routeUsername.value) return null;

  const response = await api.resolveUsername(routeUsername.value);
  return response.user.id;
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
  const version = ++requestVersion;

  loading.value = true;
  errorMessage.value = "";
  draftsError.value = "";
  profile.value = null;
  drafts.value = [];
  nextCursor.value = null;
  hasMore.value = false;
  isOwner.value = false;
  hoveredDraftId.value = null;
  draftMediaTargetId.value = null;
  draftMediaBusyIds.value = [];
  Object.keys(draftMediaErrors).forEach(key => delete draftMediaErrors[key]);

  if (!routeUserId.value && !routeUsername.value) {
    errorMessage.value = t("userProfile.notFoundDescription");
    loading.value = false;
    return;
  }

  await auth.initialize();

  try {
    const targetUserId = await resolveTargetUserId();
    if (version !== requestVersion) return;

    if (!targetUserId) {
      errorMessage.value = t("userProfile.notFoundDescription");
      return;
    }

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
  const targetUserId = profile.value?.id;
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
  const targetUserId = profile.value?.id;
  if (!targetUserId) return;
  return loadDrafts(targetUserId, { append: true });
}

watch(
  () => [route.query.id, route.query.un],
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
    <input
      ref="draftMediaInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      multiple
      class="user-profile__media-input"
      @change="handleDraftMediaSelected"
    >

    <visual-slider
      v-if="heroCoverUrl"
      :sources="[heroCoverUrl]"
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
        rules="ccc"
        class="user-profile__hero-content w100 h100"
        :gap="18"
        :p="contentPadding">
        <el-avatar
          :src="heroAvatarUrl"
          :name="displayName"
          :size="heroAvatarSize"
          :br="4"
          bc="white"
          class="user-profile__hero-avatar"
        />

        <el-flex rules="ccc" :gap="6" class="user-profile__identity-meta">
          <el-text
            :size="10"
            :weight="900"
            marker="white"
            color="black"
            :p="[3, 8]"
            :radius="100">
            {{ t("userProfile.eyebrow") }}
          </el-text>
          <el-text :size="mobile ? 11 : 13" color="white">
            {{ t("userProfile.memberSince", { date: formatDate(profile.createdAt) }) }}
          </el-text>
        </el-flex>

        <el-text
          type="h1"
          :size="heroTitleSize"
          :weight="600"
          color="white"
          effect="glitch"
          class="user-profile__title tc">
          {{ displayName }}
        </el-text>

        <el-flex rules="rcc" :gap="mobile ? 8 : 12" wrap class="user-profile__stats-row w100">
          <el-flex
            rules="ccc"
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
            rules="ccc"
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
            rules="ccc"
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
            color="prim"
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
            :gap="18"
            :p="18"
            :radius="18"
            :br="1"
            :bc="hoveredDraftId === draft.id ? 'normal50' : 'normal15'"
            @mouseenter="hoveredDraftId = draft.id"
            @mouseleave="hoveredDraftId = hoveredDraftId === draft.id ? null : hoveredDraftId">
            <div
              v-if="draft.images.length"
              class="user-profile__draft-media w100">
              <img
                :src="draft.images[0].url"
                :alt="draft.title"
                class="user-profile__draft-media-image"
                loading="lazy"
                decoding="async"
                draggable="false"
              >
              <el-flex
                rules="rcc"
                class="user-profile__draft-media-count"
                :p="[4, 7]"
                :radius="100"
                bg="surface75"
                bd="b6">
                <el-text :size="9" :weight="800">
                  {{ t("userProfile.drafts.media.count", {
                    count: draft.images.length,
                    max: DRAFT_PREVIEW_IMAGE_MAX_COUNT,
                  }) }}
                </el-text>
              </el-flex>
            </div>

            <button
              v-else-if="isOwner"
              type="button"
              class="user-profile__draft-media-empty w100"
              :disabled="isDraftMediaBusy(draft.id)"
              @click="openDraftMediaPicker(draft)">
              <el-icon icon="wallpaper" color="normal45" :size="26" />
              <el-text :size="11" color="normal55">
                {{ t("userProfile.drafts.media.empty") }}
              </el-text>
            </button>

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

            <el-flex rules="ccs" :gap="10" class="w100">
              <el-text type="h3" :size="mobile ? 20 : 24" :weight="650">
                {{ draft.title }}
              </el-text>
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
            </el-flex>

            <el-text
              v-if="draftMediaErrors[draft.id]"
              :size="10"
              color="red"
              class="w100">
              {{ draftMediaErrors[draft.id] }}
            </el-text>

            <el-flex
              v-if="isOwner && draft.visibility"
              rules="rsc"
              :gap="8"
              class="w100">
              <el-button
                class="fg100"
                :color="draft.visibility === 'public' ? 'orange' : 'green'"
                mode="flat"
                :icon="draft.visibility === 'public' ? 'visibility_off' : 'public'"
                :label="draft.visibility === 'public'
                  ? t('userProfile.drafts.actions.unpublish')
                  : t('userProfile.drafts.actions.publish')"
                :disable="visibilityBusyIds.includes(draft.id) || isDraftMediaBusy(draft.id)"
                @click="setVisibility(draft, draft.visibility === 'public' ? 'private' : 'public')"
              />

              <el-button
                type="fab"
                color="blue"
                mode="flat"
                icon="wallpaper"
                :tooltip="t('userProfile.drafts.media.add')"
                :disable="isDraftMediaBusy(draft.id) || draft.images.length >= DRAFT_PREVIEW_IMAGE_MAX_COUNT"
                @click="openDraftMediaPicker(draft)"
              />

              <el-button
                v-if="draft.images.length > 1"
                type="fab"
                color="normal"
                mode="flat"
                icon="swap_horiz"
                :tooltip="t('userProfile.drafts.media.nextPrimary')"
                :disable="isDraftMediaBusy(draft.id)"
                @click="useNextDraftImageAsPrimary(draft)"
              />

              <el-button
                v-if="draft.images.length"
                type="fab"
                color="red"
                mode="flat"
                icon="delete"
                :tooltip="t('userProfile.drafts.media.removePrimary')"
                :disable="isDraftMediaBusy(draft.id)"
                @click="removePrimaryDraftImage(draft)"
              />
            </el-flex>
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
  isolation: isolate;
  background: #09090d;
}

.user-profile__media-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.user-profile__fallback-bg,
.user-profile__cinema-overlay,
.user-profile__grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.user-profile__fallback-bg {
  z-index: 0;
  background:
    radial-gradient(circle at 14% 22%, rgba(69, 98, 255, 0.34), transparent 40%),
    radial-gradient(circle at 84% 18%, rgba(133, 64, 255, 0.24), transparent 42%),
    radial-gradient(circle at 54% 88%, rgba(20, 180, 165, 0.14), transparent 45%),
    #09090d;
}

.user-profile__cinema-overlay {
  z-index: 4;
  background:
    radial-gradient(circle at 50% 34%, transparent 0%, var(--themeSurface15) 44%, var(--themeSurface75) 100%),
    linear-gradient(180deg, var(--themeSurface5) 0%, var(--themeSurface20) 42%, var(--themeSurface85) 100%);
}

.user-profile__grain {
  z-index: 5;
  opacity: 0.12;
  background-image:
    repeating-radial-gradient(circle at 0 0, var(--themeSurface15) 0, var(--themeSurface15) .6px, transparent .7px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.user-profile__hero {
  display: flex;
  align-items: stretch;
}

.user-profile__hero-content {
  justify-content: center;
  align-items: center;
  text-align: center;
  max-width: 1180px;
  margin-inline: auto;
  padding-top: clamp(72px, 10vh, 120px) !important;
  padding-bottom: clamp(52px, 9vh, 110px) !important;
}

.user-profile__hero-avatar {
  filter: drop-shadow(0 18px 44px rgba(0, 0, 0, 0.38));
}

.user-profile__identity-meta {
  width: 100%;
  align-items: center !important;
}

.user-profile__title {
  max-width: min(1000px, 94vw);
  line-height: 0.92 !important;
  letter-spacing: -0.045em;
  text-wrap: balance;
  text-shadow: 0 10px 50px rgba(0, 0, 0, 0.32);
}

.user-profile__stats-row {
  justify-content: center !important;
}

.user-profile__stat {
  min-width: 116px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(10, 12, 18, 0.34);
  backdrop-filter: blur(14px);
}

.user-profile__drafts {
  background:
    linear-gradient(180deg, var(--themeSurface75) 0%, var(--themeSurface90) 28%, var(--themeSurface95) 100%);
  backdrop-filter: blur(9px);
  border-top: 1px solid var(--themeSurface85);
}

.user-profile__drafts > .el-flex {
  max-width: 1440px;
  margin-inline: auto;
  padding-top: 72px !important;
  padding-bottom: 72px !important;
}

.user-profile__draft-card {
  min-height: 250px;
  background:
    linear-gradient(145deg, var(--normalText5), transparent 55%),
    var(--themeBackground);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.16);
  transition: transform 220ms ease, border-color 220ms ease;
}

.user-profile__draft-card:hover {
  transform: translateY(-3px);
}

.user-profile__draft-media,
.user-profile__draft-media-empty {
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  overflow: hidden;
}

.user-profile__draft-media {
  position: relative;
  background: var(--normalText5);
}

.user-profile__draft-media-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  user-select: none;
  pointer-events: none;
}

.user-profile__draft-media-count {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 2;
}

.user-profile__draft-media-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 12px;
  border: 1px dashed var(--normalText15);
  color: inherit;
  background: var(--normalText5);
  appearance: none;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease;
}

.user-profile__draft-media-empty:hover {
  border-color: var(--normalText50);
  background: var(--normalText10);
}

.user-profile__draft-media-empty:disabled {
  opacity: 0.55;
  cursor: wait;
}
</style>