<script setup lang="ts">
type LoginStep = "identifier" | "login" | "register";

const { t } = useI18n();
const route = useRoute();
const auth = useAuth();
const analytics = useProductAnalytics();

const step = ref<LoginStep>("identifier");
const identifier = ref("");
const normalizedIdentifier = ref("");
const password = ref("");
const confirmPassword = ref("");
const referralUsername = ref("");
const referralFromLink = ref("");
const submitting = ref(false);
const errorMessage = ref("");
let trackedReferralUsername = "";

const passwordIsValid = computed(() => {
  return (
    password.value.length >= 8 &&
    /[A-Za-z]/.test(password.value) &&
    /\d/.test(password.value)
  );
});

const pageTitle = computed(() => {
  if (step.value === "login") return t("auth.login.existingTitle");
  if (step.value === "register") return t("auth.login.newTitle");
  return t("auth.login.title");
});

const pageSubtitle = computed(() => {
  if (step.value === "login") return t("auth.login.existingSubtitle");
  if (step.value === "register") return t("auth.login.newSubtitle");
  return t("auth.login.subtitle");
});

function safeNextPath() {
  const next = typeof route.query.next === "string" ? route.query.next.trim() : "";

  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login")) {
    return next;
  }

  return "/create";
}

function normalizeReferralQuery(value: unknown) {
  if (typeof value !== "string") return "";

  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9._-]{3,64}$/.test(normalized) ? normalized : "";
}

function applyReferralFromRoute() {
  const normalized = normalizeReferralQuery(route.query.ref);
  referralFromLink.value = normalized;

  if (!normalized) return;

  referralUsername.value = normalized;

  if (trackedReferralUsername === normalized) return;
  trackedReferralUsername = normalized;

  void analytics.track("referral_link_open", {
    resource: {
      type: "referral_username",
      id: normalized,
    },
  });
}

function getApiErrorMessage(error: unknown) {
  const value = error as {
    data?: {
      code?: unknown;
      message?: unknown;
      errors?: Array<{ message?: unknown }>;
    };
  };

  switch (value?.data?.code) {
    case "REFERRAL_USERNAME_INVALID":
      return t("auth.login.referralInvalid");
    case "REFERRAL_USERNAME_NOT_FOUND":
      return t("auth.login.referralNotFound");
    case "REFERRAL_SELF_REFERENCE":
      return t("auth.login.referralSelf");
  }

  const firstFieldMessage = value?.data?.errors?.find((item) => {
    return typeof item?.message === "string";
  })?.message;

  if (typeof firstFieldMessage === "string" && firstFieldMessage.trim()) {
    return firstFieldMessage;
  }

  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }

  return t("auth.login.genericError");
}

function resetError() {
  errorMessage.value = "";
}

async function submitIdentifier() {
  if (submitting.value) return;
  resetError();

  if (!identifier.value.trim()) {
    errorMessage.value = t("auth.login.identifierPlaceholder");
    return;
  }

  submitting.value = true;

  try {
    const response = await auth.identify(identifier.value);
    normalizedIdentifier.value = response.identifier;
    identifier.value = response.identifier;
    password.value = "";
    confirmPassword.value = "";
    referralUsername.value = referralFromLink.value;
    step.value = response.exists ? "login" : "register";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function submitPassword() {
  if (submitting.value) return;
  resetError();

  if (step.value === "register") {
    if (!passwordIsValid.value) {
      errorMessage.value = t("auth.login.invalidPassword");
      return;
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = t("auth.login.passwordMismatch");
      return;
    }
  }

  submitting.value = true;

  try {
    if (step.value === "register") {
      await auth.register(
        normalizedIdentifier.value || identifier.value,
        password.value,
        {
          referralUsername: referralUsername.value.trim() || undefined,
        },
      );
    } else {
      await auth.login(normalizedIdentifier.value || identifier.value, password.value);
    }

    await navigateTo(safeNextPath());
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

function changeIdentifier() {
  step.value = "identifier";
  normalizedIdentifier.value = "";
  password.value = "";
  confirmPassword.value = "";
  referralUsername.value = referralFromLink.value;
  resetError();
}

function handleEnter() {
  if (step.value === "identifier") {
    void submitIdentifier();
  } else {
    void submitPassword();
  }
}

watch(
  () => route.query.ref,
  () => {
    applyReferralFromRoute();
  },
);

onMounted(async () => {
  await auth.initialize();
  applyReferralFromRoute();

  if (auth.isLoggedIn.value) {
    await navigateTo(safeNextPath());
  }
});
</script>

<template>
  <el-flex rules="ccc" class="w100 h100" :p="24">
    <el-flex
      rules="csc"
      class="w100 auth-login__card"
      :gap="20"
      :p="24"
      :radius="20"
      bg="surface50"
      :br="1"
      bc="normal15">
      <el-flex rules="csc" :gap="8" class="w100">
        <el-flex rules="rcc" bg="blue15" :radius="100" :p="12">
          <el-icon icon="login" color="blue" :size="28" />
        </el-flex>
        <el-text type="h1" :size="26" :weight="800">{{ pageTitle }}</el-text>
        <el-text type="p" :size="13" color="normal55" style="max-width: 480px">
          {{ pageSubtitle }}
        </el-text>
      </el-flex>

      <el-flex rules="csc" :gap="8" class="w100">
        <el-text :size="12" :weight="700">{{ t("auth.login.identifierLabel") }}</el-text>
        <input
          v-model="identifier"
          class="auth-login__input"
          type="text"
          autocomplete="username"
          :placeholder="t('auth.login.identifierPlaceholder')"
          :disabled="step !== 'identifier' || submitting"
          @input="resetError"
          @keydown.enter.prevent="handleEnter"
        />
      </el-flex>

      <template v-if="step !== 'identifier'">
        <el-flex rules="csc" :gap="8" class="w100">
          <el-text :size="12" :weight="700">{{ t("auth.login.passwordLabel") }}</el-text>
          <input
            v-model="password"
            class="auth-login__input"
            type="password"
            :autocomplete="step === 'register' ? 'new-password' : 'current-password'"
            :disabled="submitting"
            @input="resetError"
            @keydown.enter.prevent="handleEnter"
          />
          <el-text v-if="step === 'register'" :size="11" color="normal50">
            {{ t("auth.login.passwordHint") }}
          </el-text>
        </el-flex>

        <el-flex v-if="step === 'register'" rules="csc" :gap="8" class="w100">
          <el-text :size="12" :weight="700">{{ t("auth.login.confirmPasswordLabel") }}</el-text>
          <input
            v-model="confirmPassword"
            class="auth-login__input"
            type="password"
            autocomplete="new-password"
            :disabled="submitting"
            @input="resetError"
            @keydown.enter.prevent="handleEnter"
          />
        </el-flex>

        <el-flex v-if="step === 'register'" rules="csc" :gap="8" class="w100">
          <el-text :size="12" :weight="700">{{ t("auth.login.referralLabel") }}</el-text>
          <input
            v-model="referralUsername"
            class="auth-login__input"
            type="text"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            :placeholder="t('auth.login.referralPlaceholder')"
            :disabled="submitting"
            @input="resetError"
            @keydown.enter.prevent="handleEnter"
          />
          <el-text :size="11" color="normal50">
            {{ t("auth.login.referralHint") }}
          </el-text>
        </el-flex>
      </template>

      <el-flex v-if="errorMessage" rules="rsc" :gap="8" class="w100 auth-login__error" :p="12" :radius="10">
        <el-icon icon="warning" color="red" :size="18" />
        <el-text :size="12" color="red">{{ errorMessage }}</el-text>
      </el-flex>

      <el-button
        v-if="step === 'identifier'"
        class="w100"
        color="blue"
        icon="arrow_forward"
        :label="t('auth.login.continue')"
        :disable="submitting"
        @click="submitIdentifier"
      />

      <el-button
        v-else
        class="w100"
        color="prim"
        :icon="step === 'register' ? 'person_add' : 'login'"
        :label="step === 'register' ? t('auth.login.registerAction') : t('auth.login.loginAction')"
        :disable="submitting"
        @click="submitPassword"
      />

      <el-button
        v-if="step !== 'identifier'"
        class="w100"
        mode="flat"
        color="normal"
        icon="arrow_back"
        :label="t('auth.login.changeIdentifier')"
        :disable="submitting"
        @click="changeIdentifier"
      />

      <el-divider />

      <el-flex rules="csc" :gap="8" class="w100">
        <el-text :size="11" color="normal50">{{ t("auth.login.optional") }}</el-text>
        <el-button
          to="/create"
          mode="flat"
          color="normal"
          icon="close"
          :label="t('auth.login.backToCreate')"
        />
      </el-flex>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.auth-login__card {
  max-width: 560px;
  margin: auto;
}

.auth-login__input {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: rgba(127, 127, 127, 0.07);
  color: inherit;
  font: inherit;
  outline: none;
  transition: border-color 160ms ease, background 160ms ease;
}

.auth-login__input:focus {
  border-color: currentColor;
  background: rgba(127, 127, 127, 0.11);
}

.auth-login__input:disabled {
  opacity: 0.55;
}

.auth-login__error {
  background: rgba(220, 60, 60, 0.08);
}
</style>
