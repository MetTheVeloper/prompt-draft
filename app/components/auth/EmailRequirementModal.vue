<script setup lang="ts">
const props = defineProps<{
  from: string;
  onCompleted?: () => void | Promise<void>;
}>();

const { t, te, locale } = useI18n();
const route = useRoute();
const auth = useAuth();
const modal = useModal();

const email = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const isLoggedIn = computed(() => auth.isLoggedIn.value);
const isPersian = computed(() => locale.value === "fa");
const heroLeadSize = computed(() => (isPersian.value ? 24 : 27));
const heroSourceSize = computed(() => (isPersian.value ? 18 : 21));

const sourceLabel = computed(() => {
  const key = `auth.emailRequirement.sources.${props.from}`;
  return te(key) ? t(key) : t("auth.emailRequirement.sources.generic");
});

function resetError() {
  errorMessage.value = "";
}

function isValidEmail(value: string) {
  const normalized = value.trim().toLowerCase();

  return Boolean(
    normalized &&
      normalized.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized),
  );
}

function getApiErrorMessage(error: unknown) {
  const value = error as {
    data?: {
      code?: unknown;
      errors?: Array<{ field?: unknown }>;
    };
  };

  if (value?.data?.code === "PROFILE_FIELD_TAKEN") {
    return t("auth.emailRequirement.taken");
  }

  if (value?.data?.code === "PROFILE_FIELD_LOCKED") {
    return t("auth.emailRequirement.locked");
  }

  if (value?.data?.code === "PROFILE_VALIDATION") {
    return t("auth.emailRequirement.invalidEmail");
  }

  return t("auth.emailRequirement.genericError");
}

async function submit() {
  if (submitting.value || !isLoggedIn.value) return;

  resetError();

  if (!isValidEmail(email.value)) {
    errorMessage.value = t("auth.emailRequirement.invalidEmail");
    return;
  }

  submitting.value = true;

  try {
    await auth.completeProfile({
      email: email.value.trim(),
    });

    await props.onCompleted?.();
    modal.close();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function openLogin() {
  modal.close();

  await navigateTo({
    path: "/login",
    query: {
      next: route.fullPath || "/create",
    },
  });
}
</script>

<template>
  <el-flex
    rules="ccc"
    class="w100 emailRequirementModal"
    :class="{ isPersian }"
    :gap="15"
    :data-requirement-from="from">
    <el-flex
      rules="ccc"
      bg="normal"
      :radius="22"
      :p="23"
      :gap="12"
      class="emailRequirementHero"
      style="width: min(100%, 390px); aspect-ratio: 1 / 1; text-align: center">
      <el-flex rules="rcc" :gap="6" :p="[5, 8]" class="heroEyebrow">
        <el-icon icon="lock_open" color="invert" :size="13" />
        <el-text :size="9" :weight="800" color="invert">
          {{ t("auth.emailRequirement.heroEyebrow") }}
        </el-text>
      </el-flex>

      <el-flex rules="ccc" :gap="5" class="heroMessage">
        <el-text
          type="h2"
          :size="heroLeadSize"
          :weight="900"
          color="invert"
          class="heroLead">
          {{ t("auth.emailRequirement.heroLead") }}
        </el-text>

        <el-text
          :size="11"
          :weight="700"
          color="invert"
          class="heroAction">
          {{ t("auth.emailRequirement.heroAction") }}
        </el-text>

        <el-text
          :size="heroSourceSize"
          :weight="900"
          color="invert"
          class="heroSource">
          {{ sourceLabel }}
        </el-text>
      </el-flex>

      <el-text
        :size="11"
        :weight="400"
        color="invert"
        class="heroDescription">
        {{ t("auth.emailRequirement.heroDescription") }}
      </el-text>
    </el-flex>

    <template v-if="isLoggedIn">
      <el-flex rules="csc" class="w100 emailRequirementForm" :gap="10">
        <el-flex rules="csc" :gap="6" class="w100">
          <el-text :size="10" :weight="800" color="normal60" class="emailLabel">
            {{ t("auth.emailRequirement.emailLabel") }}
          </el-text>

          <el-text-field
            v-model="email"
            class="w100"
            type="text"
            :actions="[]"
            :placeholder="t('auth.emailRequirement.emailPlaceholder')"
            :disabled="submitting"
            @update:model-value="resetError"
          />
        </el-flex>

        <el-flex rules="rsc" class="w100" :gap="7">
          <el-icon icon="verified_user" color="green" :size="14" />
          <el-text :size="10" color="normal50" class="privacyCopy">
            {{ t("auth.emailRequirement.privacyNote") }}
          </el-text>
        </el-flex>

        <el-flex
          v-if="errorMessage"
          rules="rsc"
          class="w100"
          :gap="8"
          bg="red10"
          :radius="10"
          :p="12">
          <el-icon icon="warning" color="red" :size="18" />
          <el-text :size="12" color="red">
            {{ errorMessage }}
          </el-text>
        </el-flex>

        <el-button
          class="w100"
          color="prim"
          icon="arrow_forward"
          :label="submitting ? t('auth.emailRequirement.saving') : t('auth.emailRequirement.save')"
          :disable="submitting"
          @click="submit"
        />

        <el-button
          class="w100"
          mode="flat"
          color="normal"
          :size="12"
          :label="t('auth.emailRequirement.cancel')"
          :disable="submitting"
          @click="modal.close()"
        />
      </el-flex>
    </template>

    <template v-else>
      <el-flex rules="csc" class="w100 emailRequirementForm" :gap="10">
        <el-flex
          rules="csc"
          class="w100"
          :gap="6"
          bg="normal5"
          :radius="14"
          :p="14">
          <el-text :size="13" :weight="800">
            {{ t("auth.emailRequirement.anonymousTitle") }}
          </el-text>
          <el-text :size="11" color="normal55" class="anonymousCopy">
            {{ t("auth.emailRequirement.anonymousDescription") }}
          </el-text>
        </el-flex>

        <el-button
          class="w100"
          color="prim"
          icon="login"
          :label="t('auth.emailRequirement.signIn')"
          @click="openLogin"
        />

        <el-button
          class="w100"
          mode="flat"
          color="normal"
          :size="12"
          :label="t('auth.emailRequirement.cancel')"
          @click="modal.close()"
        />
      </el-flex>
    </template>
  </el-flex>
</template>

<style scoped>
.emailRequirementHero,
.emailRequirementForm,
.heroMessage,
.heroLead,
.heroAction,
.heroSource,
.heroDescription {
  min-width: 0;
}

.emailRequirementForm {
  max-width: 410px;
}

.heroMessage {
  width: 100%;
  max-width: 330px;
}

.heroLead,
.heroSource,
.heroDescription {
  width: 100%;
}

.heroLead :deep(h2) {
  width: 100%;
  margin: 0;
  line-height: 1.16;
  letter-spacing: -0.025em;
  text-align: center;
  overflow-wrap: anywhere;
}

.heroAction :deep(*) {
  width: 100%;
  line-height: 1.2;
  letter-spacing: 0.045em;
  text-align: center;
  opacity: 0.62;
}

.heroSource :deep(*) {
  width: 100%;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-align: center;
  overflow-wrap: anywhere;
}

.heroDescription {
  max-width: 292px;
  opacity: 0.65;
}

.heroDescription :deep(*) {
  width: 100%;
  line-height: 1.5;
  text-align: center;
}

.heroEyebrow :deep(*) {
  letter-spacing: 0.025em;
}

.emailLabel :deep(*) {
  letter-spacing: 0.02em;
}

.privacyCopy :deep(*),
.anonymousCopy :deep(*) {
  line-height: 1.45;
}

.isPersian .heroMessage {
  max-width: 345px;
}

.isPersian .heroLead :deep(h2) {
  line-height: 1.46;
  letter-spacing: 0;
}

.isPersian .heroAction :deep(*) {
  line-height: 1.55;
  letter-spacing: 0;
}

.isPersian .heroSource :deep(*) {
  line-height: 1.5;
  letter-spacing: 0;
}

.isPersian .heroDescription :deep(*) {
  line-height: 1.75;
}

.isPersian .heroEyebrow :deep(*),
.isPersian .emailLabel :deep(*) {
  letter-spacing: 0;
}
</style>
