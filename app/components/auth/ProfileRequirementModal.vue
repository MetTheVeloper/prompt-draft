<script setup lang="ts">
import type {
  AuthProfileField,
  CompleteAuthProfileInput,
} from "~/types/auth";

const props = defineProps<{
  fields: AuthProfileField[];
  onCompleted?: () => void | Promise<void>;
}>();

const { t } = useI18n();
const auth = useAuth();
const modal = useModal();

const username = ref("");
const email = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const needsUsername = computed(() => props.fields.includes("username"));
const needsEmail = computed(() => props.fields.includes("email"));

function resetError() {
  errorMessage.value = "";
}

function validate() {
  if (needsUsername.value) {
    const value = username.value.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,64}$/.test(value)) {
      return t("auth.profileCompletion.invalidUsername");
    }
  }

  if (needsEmail.value) {
    const value = email.value.trim().toLowerCase();
    if (
      !value ||
      value.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return t("auth.profileCompletion.invalidEmail");
    }
  }

  return "";
}

function getApiErrorMessage(error: unknown) {
  const value = error as {
    data?: {
      code?: unknown;
      errors?: Array<{ field?: unknown }>;
    };
  };

  if (value?.data?.code === "PROFILE_FIELD_TAKEN") {
    return t("auth.profileCompletion.taken");
  }

  if (value?.data?.code === "PROFILE_FIELD_LOCKED") {
    return t("auth.profileCompletion.locked");
  }

  if (value?.data?.code === "PROFILE_VALIDATION") {
    const firstField = value.data.errors?.[0]?.field;
    if (firstField === "username") {
      return t("auth.profileCompletion.invalidUsername");
    }
    if (firstField === "email") {
      return t("auth.profileCompletion.invalidEmail");
    }
  }

  return t("auth.profileCompletion.genericError");
}

async function submit() {
  if (submitting.value) return;

  resetError();
  const validationError = validate();

  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  const input: CompleteAuthProfileInput = {};

  if (needsUsername.value) {
    input.username = username.value.trim();
  }

  if (needsEmail.value) {
    input.email = email.value.trim();
  }

  submitting.value = true;

  try {
    await auth.completeProfile(input);
    await props.onCompleted?.();
    modal.close();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-flex rules="csc" :gap="16" class="w100">
    <el-flex v-if="needsUsername" rules="csc" :gap="7" class="w100">
      <el-text :size="12" :weight="700">
        {{ t("auth.profile.username") }}
      </el-text>
      <el-text-field
        v-model="username"
        class="w100"
        type="text"
        :actions="[]"
        :placeholder="t('auth.profileCompletion.usernamePlaceholder')"
        :disabled="submitting"
        @update:model-value="resetError"
      />
      <el-text :size="10" color="normal45">
        {{ t("auth.profileCompletion.usernameHint") }}
      </el-text>
    </el-flex>

    <el-flex v-if="needsEmail" rules="csc" :gap="7" class="w100">
      <el-text :size="12" :weight="700">
        {{ t("auth.profile.email") }}
      </el-text>
      <el-text-field
        v-model="email"
        class="w100"
        type="text"
        :actions="[]"
        :placeholder="t('auth.profileCompletion.emailPlaceholder')"
        :disabled="submitting"
        @update:model-value="resetError"
      />
    </el-flex>

    <el-flex
      v-if="errorMessage"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="10">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text :size="12" color="red">{{ errorMessage }}</el-text>
    </el-flex>

    <el-flex rules="rbc" :gap="10" class="w100" wrap>
      <el-button
        mode="flat"
        color="normal"
        icon="close"
        :label="t('auth.profileCompletion.cancel')"
        :disable="submitting"
        @click="modal.close()"
      />

      <el-button
        color="prim"
        icon="check"
        :label="submitting ? t('auth.profileCompletion.saving') : t('auth.profileCompletion.save')"
        :disable="submitting"
        @click="submit"
      />
    </el-flex>
  </el-flex>
</template>
