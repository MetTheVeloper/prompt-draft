<script setup lang="ts">
import ProfileBirthdayField from "~/components/manage/ProfileBirthdayField.vue";
import type {
  CreatorAccountStatus,
  ProfileLinkType,
  ProfileManagementInput,
  ProfileManagementResponse,
} from "~/types/profileManagement";
import { prepareUserAvatarImage } from "~/utils/userAvatarImage";
import {
  prepareUserCoverImage,
  type PreparedUserCover,
} from "~/utils/userCoverImage";

definePageMeta({
  middleware: "authenticated",
});

const { locale, t } = useI18n();
const auth = useAuth();
const profileApi = useProfileManagement();
const avatar = useUserAvatar();
const cover = useUserCover();
const modal = useModal();

const response = ref<ProfileManagementResponse | null>(null);
const loading = ref(false);
const saving = ref(false);
const loadError = ref("");

const avatarInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);
const avatarPreviewUrl = ref("");
const coverPreviewUrl = ref("");
const preparedAvatar = ref<Blob | null>(null);
const preparedCover = ref<PreparedUserCover | null>(null);
const avatarPreparing = ref(false);
const coverPreparing = ref(false);
const mediaError = ref("");

const form = reactive({
  username: "",
  email: "",
  screenNameEn: "",
  screenNameFa: "",
  bioEn: "",
  bioFa: "",
  articleEn: "",
  articleFa: "",
  birthday: null as string | null,
  skills: [] as string[],
  links: [] as Array<{ type: ProfileLinkType; url: string; label: string }>,
  locationText: "",
});

const linkTypeItems = computed(() => [
  "website",
  "github",
  "linkedin",
  "instagram",
  "telegram",
  "x",
  "youtube",
  "other",
].map(type => ({
  value: type,
  label: t(`manage.profile.links.types.${type}`),
  icon: type === "website" ? "language" : "link",
})));

const categoryBySlug = computed(() => new Map(
  (response.value?.taxonomy.categories ?? []).map(category => [category.slug, category]),
));

const skillItems = computed(() => {
  const language = locale.value as "en" | "fa";
  const categories = categoryBySlug.value;

  return [...(response.value?.taxonomy.skills ?? [])]
    .sort((first, second) => {
      const firstCategoryOrder = categories.get(first.categorySlug)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const secondCategoryOrder = categories.get(second.categorySlug)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return firstCategoryOrder - secondCategoryOrder
        || first.sortOrder - second.sortOrder
        || first.slug.localeCompare(second.slug);
    })
    .map(skill => {
      const category = categories.get(skill.categorySlug);
      const skillLabel = skill.title[language] || skill.title.en;
      const categoryLabel = category?.title[language] || category?.title.en || skill.categorySlug;
      return {
        value: skill.slug,
        label: skillLabel,
        group: skill.categorySlug,
        groupLabel: categoryLabel,
        icon: "psychology",
      };
    });
});

const creatorStatus = computed<CreatorAccountStatus>(() => response.value?.creator.status ?? "none");
const creatorReady = computed(() => Boolean(response.value?.creator.readiness.ready));
const usernameLocked = computed(() => Boolean(response.value?.creator.usernameChangeRequiresAlias));
const canAddLink = computed(() => form.links.length < 5);

const displayedAvatarUrl = computed(() => avatarPreviewUrl.value || avatar.url.value || null);
const displayedCoverUrl = computed(() => coverPreviewUrl.value || cover.thumbnailUrl.value || null);
const identityName = computed(() => form.screenNameEn.trim() || form.username.trim() || form.email.trim());

function getApiErrorMessage(error: unknown, fallback: string) {
  const payload = error as {
    data?: { message?: unknown; errors?: Array<{ message?: unknown }> };
  };
  const fieldMessage = payload?.data?.errors?.find(item => typeof item?.message === "string")?.message;
  if (typeof fieldMessage === "string" && fieldMessage.trim()) return fieldMessage;
  if (typeof payload?.data?.message === "string" && payload.data.message.trim()) {
    return payload.data.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function populate(value: ProfileManagementResponse) {
  response.value = value;
  form.username = value.account.username ?? "";
  form.email = value.account.email ?? "";
  form.screenNameEn = value.profile.screenName.en ?? "";
  form.screenNameFa = value.profile.screenName.fa ?? "";
  form.bioEn = value.profile.bio.en ?? "";
  form.bioFa = value.profile.bio.fa ?? "";
  form.articleEn = value.profile.article.en ?? "";
  form.articleFa = value.profile.article.fa ?? "";
  form.birthday = value.profile.birthday;
  form.skills = [...value.profile.skills];
  form.links = value.profile.links.map(link => ({
    type: link.type,
    url: link.url,
    label: link.label ?? "",
  }));
  form.locationText = value.profile.location?.text ?? "";
}

async function loadProfile() {
  loading.value = true;
  loadError.value = "";
  try {
    const [profile] = await Promise.all([
      profileApi.load(),
      avatar.refresh(true),
      cover.refresh(true),
    ]);
    populate(profile);
  } catch (error) {
    loadError.value = getApiErrorMessage(error, t("manage.profile.errors.load"));
  } finally {
    loading.value = false;
  }
}

function buildInput(): ProfileManagementInput {
  return {
    account: {
      username: form.username.trim() || null,
      email: form.email.trim() || null,
    },
    profile: {
      screenName: {
        en: form.screenNameEn.trim() || null,
        fa: form.screenNameFa.trim() || null,
      },
      bio: {
        en: form.bioEn.trim() || null,
        fa: form.bioFa.trim() || null,
      },
      article: {
        en: form.articleEn.trim() || null,
        fa: form.articleFa.trim() || null,
      },
      birthday: form.birthday,
      skills: [...form.skills],
      links: form.links.map(link => ({
        type: link.type,
        url: link.url.trim(),
        label: link.label.trim() || null,
      })),
      location: form.locationText.trim()
        ? {
            text: form.locationText.trim(),
            source: "custom",
            providerPlaceId: null,
            countryCode: null,
          }
        : null,
    },
  };
}

async function saveProfile() {
  if (saving.value) return;
  saving.value = true;

  try {
    const value = await profileApi.save(buildInput());
    populate(value);
    modal.message({
      type: "success",
      title: t("manage.profile.savedTitle"),
      message: t("manage.profile.savedMessage"),
      actionLabel: t("manage.common.actions.done"),
    });
  } catch (error) {
    modal.message({
      type: "error",
      title: t("manage.profile.errors.saveTitle"),
      message: getApiErrorMessage(error, t("manage.profile.errors.save")),
      actionLabel: t("manage.common.actions.close"),
    });
  } finally {
    saving.value = false;
  }
}

function addLink() {
  if (!canAddLink.value) return;
  form.links.push({ type: "website", url: "", label: "" });
}

function removeLink(index: number) {
  form.links.splice(index, 1);
}

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
  avatarPreviewUrl.value = "";
}

function revokeCoverPreview() {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
  coverPreviewUrl.value = "";
}

function clearPreparedAvatar() {
  revokeAvatarPreview();
  preparedAvatar.value = null;
  if (avatarInput.value) avatarInput.value.value = "";
}

function clearPreparedCover() {
  revokeCoverPreview();
  preparedCover.value = null;
  if (coverInput.value) coverInput.value.value = "";
}

async function handleAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  avatarPreparing.value = true;
  mediaError.value = "";
  try {
    const output = await prepareUserAvatarImage(file);
    revokeAvatarPreview();
    preparedAvatar.value = output.blob;
    avatarPreviewUrl.value = URL.createObjectURL(output.blob);
  } catch (error) {
    clearPreparedAvatar();
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  } finally {
    avatarPreparing.value = false;
    input.value = "";
  }
}

async function handleCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  coverPreparing.value = true;
  mediaError.value = "";
  try {
    const output = await prepareUserCoverImage(file);
    revokeCoverPreview();
    preparedCover.value = output;
    coverPreviewUrl.value = URL.createObjectURL(output.thumbnailBlob);
  } catch (error) {
    clearPreparedCover();
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  } finally {
    coverPreparing.value = false;
    input.value = "";
  }
}

async function saveAvatar() {
  if (!preparedAvatar.value) return;
  mediaError.value = "";
  try {
    await avatar.upload(preparedAvatar.value);
    clearPreparedAvatar();
  } catch (error) {
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  }
}

async function saveCover() {
  if (!preparedCover.value) return;
  mediaError.value = "";
  try {
    await cover.upload(preparedCover.value);
    clearPreparedCover();
  } catch (error) {
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  }
}

async function removeAvatar() {
  mediaError.value = "";
  try {
    await avatar.remove();
    clearPreparedAvatar();
  } catch (error) {
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  }
}

async function removeCover() {
  mediaError.value = "";
  try {
    await cover.remove();
    clearPreparedCover();
  } catch (error) {
    mediaError.value = error instanceof Error ? error.message : t("manage.profile.errors.media");
  }
}

onMounted(async () => {
  await auth.initialize();
  await loadProfile();
});

onBeforeUnmount(() => {
  revokeAvatarPreview();
  revokeCoverPreview();
});
</script>

<template>
  <el-flex rules="csc" :gap="16" class="w100 profile-editor">
    <el-flex v-if="loading" rules="ccc" class="w100" :p="32">
      <el-text color="normal55">{{ t("manage.profile.loading") }}</el-text>
    </el-flex>

    <el-flex v-else-if="loadError" rules="csc" :gap="10" class="w100" :p="20">
      <el-text color="red" :weight="700">{{ loadError }}</el-text>
      <el-button icon="refresh" :label="t('manage.common.actions.refresh')" @click="loadProfile" />
    </el-flex>

    <template v-else-if="response">
      <input
        ref="avatarInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        class="profile-hidden-input"
        @change="handleAvatarSelected"
      >
      <input
        ref="coverInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        class="profile-hidden-input"
        @change="handleCoverSelected"
      >

      <el-flex rules="csc" :gap="0" bg="surface" :radius="18" :br="1" bc="normal15" class="w100 profile-media-card">
        <div class="profile-media-card__cover por w100">
          <img v-if="displayedCoverUrl" :src="displayedCoverUrl" alt="" class="profile-media-card__cover-image">
          <div v-else class="profile-media-card__cover-fallback" />
          <div class="profile-media-card__cover-overlay" />
          <el-flex class="profile-media-card__cover-actions" rules="rcc" :gap="6">
            <el-button
              icon="wallpaper"
              color="white"
              text-color="white"
              mode="flat"
              :label="t('manage.profile.media.changeCover')"
              :disable="coverPreparing || cover.saving.value"
              @click="coverInput?.click()"
            />
            <el-button
              v-if="cover.cover.value && !preparedCover"
              type="fab"
              icon="delete"
              color="red"
              :tooltip="t('manage.profile.media.removeCover')"
              :disable="cover.saving.value"
              @click="removeCover"
            />
          </el-flex>
          <div class="profile-media-card__avatar">
            <el-avatar
              :src="displayedAvatarUrl"
              :name="identityName"
              :size="22"
              :size-offset="18"
              :br="4"
              bc="surface"
            />
          </div>
        </div>

        <el-flex rules="rbc" :gap="12" :p="[52, 18, 18, 18]" class="w100 fw">
          <el-flex rules="rsc" :gap="8" wrap>
            <el-button
              icon="photo_camera"
              mode="flat"
              :label="t('manage.profile.media.changeAvatar')"
              :disable="avatarPreparing || avatar.saving.value"
              @click="avatarInput?.click()"
            />
            <el-button
              v-if="avatar.url.value && !preparedAvatar"
              icon="delete"
              color="red"
              mode="flat"
              :label="t('manage.profile.media.removeAvatar')"
              :disable="avatar.saving.value"
              @click="removeAvatar"
            />
          </el-flex>

          <el-flex rules="rsc" :gap="8" wrap>
            <el-button
              v-if="preparedAvatar"
              icon="save"
              color="prim"
              :label="t('manage.profile.media.saveAvatar')"
              :disable="avatar.saving.value"
              @click="saveAvatar"
            />
            <el-button
              v-if="preparedAvatar"
              icon="close"
              mode="flat"
              :label="t('manage.common.actions.cancel')"
              :disable="avatar.saving.value"
              @click="clearPreparedAvatar"
            />
            <el-button
              v-if="preparedCover"
              icon="save"
              color="blue"
              :label="t('manage.profile.media.saveCover')"
              :disable="cover.saving.value"
              @click="saveCover"
            />
            <el-button
              v-if="preparedCover"
              icon="close"
              mode="flat"
              :label="t('manage.common.actions.cancel')"
              :disable="cover.saving.value"
              @click="clearPreparedCover"
            />
          </el-flex>
        </el-flex>
        <el-text v-if="mediaError" color="red" :size="11" :p="[0, 18, 16, 18]">{{ mediaError }}</el-text>
      </el-flex>

      <el-flex rules="csc" :gap="14" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
        <el-flex rules="rbc" :gap="12" class="w100 fw">
          <el-flex rules="ccs" :gap="4">
            <el-text :size="16" :weight="800">{{ t("manage.profile.account.title") }}</el-text>
            <el-text :size="11" color="normal55">{{ t("manage.profile.account.description") }}</el-text>
          </el-flex>
          <el-text :marker="creatorReady ? 'green15' : 'normal15'" :size="11" :weight="700">
            {{ t(`manage.profile.creator.statuses.${creatorStatus}`) }}
          </el-text>
        </el-flex>

        <el-grid cols="minmax(240px, 1fr) minmax(240px, 1fr)" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6" dir="ltr">
            <el-text :size="11" :weight="700">{{ t("manage.profile.account.username") }}</el-text>
            <el-text-field
              v-model="form.username"
              type="text"
              :actions="false"
              :disabled="saving || usernameLocked"
              :placeholder="t('manage.profile.account.usernamePlaceholder')"
            />
            <el-text v-if="usernameLocked" :size="10" color="orange">
              {{ t("manage.profile.account.usernameLocked") }}
            </el-text>
          </el-flex>
          <el-flex rules="ccs" :gap="6" dir="ltr">
            <el-text :size="11" :weight="700">{{ t("manage.profile.account.email") }}</el-text>
            <el-text-field
              v-model="form.email"
              type="text"
              inputmode="email"
              autocomplete="email"
              :actions="false"
              :disabled="saving"
              :placeholder="t('manage.profile.account.emailPlaceholder')"
            />
            <el-text :size="10" color="normal55">{{ t("manage.profile.account.emailPrivate") }}</el-text>
          </el-flex>
        </el-grid>
      </el-flex>

      <el-flex rules="csc" :gap="14" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
        <el-flex rules="ccs" :gap="4" class="w100">
          <el-text :size="16" :weight="800">{{ t("manage.profile.identity.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.profile.identity.description") }}</el-text>
        </el-flex>

        <el-grid cols="minmax(240px, 1fr) minmax(240px, 1fr)" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6" dir="ltr">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.screenNameEn") }}</el-text>
            <el-text-field v-model="form.screenNameEn" :actions="false" :disabled="saving" />
          </el-flex>
          <el-flex rules="ccs" :gap="6" dir="rtl">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.screenNameFa") }}</el-text>
            <el-text-field v-model="form.screenNameFa" :actions="false" :disabled="saving" />
          </el-flex>
          <el-flex rules="ccs" :gap="6" dir="ltr">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.bioEn") }}</el-text>
            <el-text-field v-model="form.bioEn" type="textarea" :rows="5" :actions="false" :disabled="saving" />
          </el-flex>
          <el-flex rules="ccs" :gap="6" dir="rtl">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.bioFa") }}</el-text>
            <el-text-field v-model="form.bioFa" type="textarea" :rows="5" :actions="false" :disabled="saving" />
          </el-flex>
        </el-grid>
      </el-flex>

      <el-flex rules="csc" :gap="14" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
        <el-flex rules="ccs" :gap="4" class="w100">
          <el-text :size="16" :weight="800">{{ t("manage.profile.article.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.profile.article.description") }}</el-text>
        </el-flex>
        <el-grid cols="minmax(280px, 1fr) minmax(280px, 1fr)" :gap="12" class="w100">
          <el-flex rules="ccs" :gap="6" dir="ltr">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.articleEn") }}</el-text>
            <el-text-field v-model="form.articleEn" type="textarea" :rows="14" :actions="false" :disabled="saving" />
          </el-flex>
          <el-flex rules="ccs" :gap="6" dir="rtl">
            <el-text :size="11" :weight="700">{{ t("manage.profile.fields.articleFa") }}</el-text>
            <el-text-field v-model="form.articleFa" type="textarea" :rows="14" :actions="false" :disabled="saving" />
          </el-flex>
        </el-grid>
      </el-flex>

      <el-grid cols="minmax(280px, 1fr) minmax(280px, 1fr)" :gap="16" class="w100">
        <el-flex rules="csc" :gap="12" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
          <el-flex rules="ccs" :gap="4" class="w100">
            <el-text :size="16" :weight="800">{{ t("manage.profile.birthday.title") }}</el-text>
            <el-text :size="11" color="normal55">{{ t("manage.profile.birthday.description") }}</el-text>
          </el-flex>
          <ProfileBirthdayField v-model="form.birthday" :disabled="saving" />
        </el-flex>

        <el-flex rules="csc" :gap="12" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
          <el-flex rules="ccs" :gap="4" class="w100">
            <el-text :size="16" :weight="800">{{ t("manage.profile.location.title") }}</el-text>
            <el-text :size="10" color="normal55">{{ t("manage.profile.location.providerPending") }}</el-text>
          </el-flex>
          <el-text-field
            v-model="form.locationText"
            icon="location_on"
            :actions="false"
            :disabled="saving"
            :placeholder="t('manage.profile.location.placeholder')"
          />
        </el-flex>
      </el-grid>

      <el-flex rules="csc" :gap="12" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
        <el-flex rules="ccs" :gap="4" class="w100">
          <el-text :size="16" :weight="800">{{ t("manage.profile.skills.title") }}</el-text>
          <el-text :size="11" color="normal55">{{ t("manage.profile.skills.description") }}</el-text>
        </el-flex>
        <el-multi-select
          v-model="form.skills"
          :items="skillItems"
          item-label="label"
          item-value="value"
          item-group="group"
          item-group-label="groupLabel"
          icon="psychology"
          :disabled="saving || !skillItems.length"
          :placeholder="t('manage.profile.skills.placeholder')"
        />
        <el-text v-if="!skillItems.length" :size="10" color="orange">
          {{ t("manage.profile.skills.taxonomyPending") }}
        </el-text>
      </el-flex>

      <el-flex rules="csc" :gap="12" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100">
        <el-flex rules="rbc" :gap="12" class="w100 fw">
          <el-flex rules="ccs" :gap="4">
            <el-text :size="16" :weight="800">{{ t("manage.profile.links.title") }}</el-text>
            <el-text :size="11" color="normal55">{{ t("manage.profile.links.description") }}</el-text>
          </el-flex>
          <el-button
            icon="add_link"
            mode="flat"
            :label="t('manage.profile.links.add')"
            :disable="saving || !canAddLink"
            @click="addLink"
          />
        </el-flex>

        <el-flex v-if="!form.links.length" rules="ccc" :p="12" class="w100">
          <el-text :size="11" color="normal55">{{ t("manage.profile.links.empty") }}</el-text>
        </el-flex>

        <el-grid
          v-for="(link, index) in form.links"
          :key="index"
          cols="minmax(150px, .55fr) minmax(250px, 1.3fr) minmax(180px, .8fr) auto"
          :gap="8"
          class="w100">
          <el-dropdown v-model="link.type" :items="linkTypeItems" :disabled="saving" />
          <el-text-field v-model="link.url" :actions="false" :disabled="saving" :placeholder="t('manage.profile.links.url')" />
          <el-text-field v-model="link.label" :actions="false" :disabled="saving" :placeholder="t('manage.profile.links.label')" />
          <el-button type="fab" icon="delete" color="red" mode="flat" :disable="saving" @click="removeLink(index)" />
        </el-grid>
      </el-flex>

      <el-flex rules="rbc" :gap="12" :p="18" bg="surface" :radius="16" :br="1" bc="normal15" class="w100 fw">
        <el-flex rules="ccs" :gap="4" style="flex: 1 1 320px;">
          <el-text :size="14" :weight="800">
            {{ creatorReady ? t("manage.profile.creator.ready") : t("manage.profile.creator.notReady") }}
          </el-text>
          <el-text :size="10" color="normal55">
            {{ t("manage.profile.creator.requestNextSlice") }}
          </el-text>
          <el-text
            v-if="!creatorReady && response.creator.readiness.missingFields.length"
            :size="10"
            color="orange">
            {{ response.creator.readiness.missingFields.join(" · ") }}
          </el-text>
        </el-flex>
        <el-button
          color="prim"
          icon="save"
          :label="t('manage.profile.actions.save')"
          :disable="saving"
          @click="saveProfile"
        />
      </el-flex>
    </template>
  </el-flex>
</template>

<style scoped>
.profile-editor {
  max-width: 1120px;
}

.profile-hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.profile-media-card {
  overflow: hidden;
}

.profile-media-card__cover {
  height: 220px;
}

.profile-media-card__cover-image,
.profile-media-card__cover-fallback,
.profile-media-card__cover-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.profile-media-card__cover-image {
  object-fit: cover;
}

.profile-media-card__cover-fallback {
  background:
    radial-gradient(circle at 18% 10%, rgba(70, 110, 255, 0.48), transparent 42%),
    radial-gradient(circle at 88% 80%, rgba(122, 55, 255, 0.36), transparent 45%),
    linear-gradient(135deg, rgba(28, 31, 42, 0.96), rgba(13, 15, 21, 0.99));
}

.profile-media-card__cover-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.45));
}

.profile-media-card__cover-actions {
  position: absolute;
  inset-block-start: 14px;
  inset-inline-end: 14px;
  z-index: 3;
}

.profile-media-card__avatar {
  position: absolute;
  inset-inline-start: 22px;
  inset-block-end: 0;
  z-index: 4;
  transform: translateY(50%);
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.3));
}
</style>
