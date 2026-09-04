<script setup lang="ts">
const props = defineProps<{
  from: string;
  onCompleted?: () => void | Promise<void>;
}>();

const { t, te } = useI18n();
const route = useRoute();
const auth = useAuth();
const modal = useModal();

const email = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const isLoggedIn = computed(() => auth.isLoggedIn.value);

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
    :gap="18"
    :data-requirement-from="from">
    <el-flex
      rules="ccc"
      class="w100"
      bg="normal"
      :radius="24"
      :p="28"
      :gap="16"
      style="aspect-ratio: 1 / 1; text-align: center">
      <el-flex rules="rcc" :gap="7" :p="[7, 10]">
        <el-icon icon="lock_open" color="invert" :size="15" />
        <el-text :size="10" :weight="800" color="invert">
          {{ t("auth.emailRequirement.heroEyebrow") }}
        </el-text>
      </el-flex>

      <el-text
        type="h2"
        :size="30"
        :weight="900"
        color="invert"
        style="max-width: 360px; line-height: 1.08; letter-spacing: -0.025em">
        {{ t("auth.emailRequirement.heroTitle", { source: sourceLabel }) }}
      </el-text>

      <el-text
        :size="12"
        :weight="400"
        color="invert"
        style="max-width: 330px; line-height: 1.55; opacity: 0.72">
        {{ t("auth.emailRequirement.heroDescription") }}
      </el-text>
    </el-flex>

    <template v-if="isLoggedIn">
      <el-flex rules="csc" class="w100" :gap="12">
        <el-flex rules="csc" :gap="7" class="w100">
          <el-text :size="11" :weight="800" color="normal60">
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
          <el-icon icon="verified_user" color="green" :size="15" />
          <el-text :size="10" color="normal50" style="line-height: 1.45">
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
      <el-flex rules="csc" class="w100" :gap="12">
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
