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
const heroLeadSize = computed(() => (isPersian.value ? 25 : 28));
const heroSourceSize = computed(() => (isPersian.value ? 20 : 22));

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
    class="w100"
    :gap="16"
    :data-requirement-from="from">
    <el-flex
      rules="ccc"
      bg="normal"
      :radius="24"
      :p="24"
      :gap="13"
      style="width: min(100%, 390px); aspect-ratio: 1 / 1; text-align: center">
      <el-flex rules="rcc" :gap="7" :p="[6, 9]">
        <el-icon icon="lock_open" color="invert" :size="14" />
        <el-text :size="9" :weight="800" color="invert" style="letter-spacing: 0.04em">
          {{ t("auth.emailRequirement.heroEyebrow") }}
        </el-text>
      </el-flex>

      <el-flex rules="ccc" :gap="6" style="max-width: 330px">
        <el-text
          type="h2"
          :size="heroLeadSize"
          :weight="900"
          color="invert"
          style="line-height: 1.08; letter-spacing: -0.025em">
          {{ t("auth.emailRequirement.heroLead") }}
        </el-text>

        <el-text
          :size="12"
          :weight="700"
          color="invert"
          style="line-height: 1.15; opacity: 0.68; letter-spacing: 0.03em">
          {{ t("auth.emailRequirement.heroAction") }}
        </el-text>

        <el-text
          :size="heroSourceSize"
          :weight="900"
          color="invert"
          style="line-height: 1.08; letter-spacing: -0.015em">
          {{ sourceLabel }}
        </el-text>
      </el-flex>

      <el-text
        :size="11"
        :weight="400"
        color="invert"
        style="max-width: 300px; line-height: 1.5; opacity: 0.66">
        {{ t("auth.emailRequirement.heroDescription") }}
      </el-text>
    </el-flex>

    <template v-if="isLoggedIn">
      <el-flex rules="csc" class="w100" :gap="10" style="max-width: 430px">
        <el-flex rules="csc" :gap="6" class="w100">
          <el-text :size="10" :weight="800" color="normal60" style="letter-spacing: 0.02em">
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
          <el-text :size="10" color="normal50" style="line-height: 1.4">
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
          :label="t('auth.emailRequirement.cancel')"
          :disable="submitting"
          @click="modal.close()"
        />
      </el-flex>
    </template>

    <template v-else>
      <el-flex rules="csc" class="w100" :gap="10" style="max-width: 430px">
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
          <el-text :size="11" color="normal55" style="line-height: 1.5">
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
          :label="t('auth.emailRequirement.cancel')"
          @click="modal.close()"
        />
      </el-flex>
    </template>
  </el-flex>
</template>
