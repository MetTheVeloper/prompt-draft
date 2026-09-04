<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const auth = useAuth();
const { requireEmail } = useEmailRequirement();

const ready = ref(false);
const openingRequirement = ref(false);

const hasAccess = computed(() => {
  return auth.isLoggedIn.value && auth.hasProfileField("email");
});

const loginTarget = computed(() => {
  const next = encodeURIComponent(route.fullPath || "/prompts");
  return `/login?next=${next}`;
});

async function openRequirement() {
  if (openingRequirement.value || hasAccess.value) return;

  openingRequirement.value = true;

  try {
    await requireEmail({
      from: "promptArchive",
    });
  } finally {
    openingRequirement.value = false;
  }
}

onMounted(async () => {
  try {
    await auth.initialize();
  } finally {
    ready.value = true;
  }

  if (!hasAccess.value) {
    await nextTick();
    void openRequirement();
  }
});
</script>

<template>
  <el-flex
    v-if="!ready"
    rules="ccc"
    class="w100 h100"
    :gap="10"
    :p="32">
    <el-icon icon="refresh" :size="28" color="prim" />
    <el-text :size="12" color="normal55">
      {{ t("auth.promptArchiveAccess.checking") }}
    </el-text>
  </el-flex>

  <el-flex
    v-else
    rules="ccc"
    class="w100 h100"
    :gap="18"
    :p="24">
    <el-flex
      rules="ccc"
      class="w100"
      :gap="14"
      :p="32"
      :radius="24"
      :br="1"
      bc="normal15"
      bg="surface50"
      style="max-width: 620px; text-align: center">
      <el-flex rules="rcc" :p="14" :radius="100" bg="prim15">
        <el-icon icon="lock" color="prim" :size="28" />
      </el-flex>

      <el-text type="h1" :size="26" :weight="900">
        {{ t("auth.promptArchiveAccess.title") }}
      </el-text>

      <el-text
        type="p"
        :size="13"
        color="normal55"
        style="max-width: 500px; line-height: 1.65">
        {{ t("auth.promptArchiveAccess.description") }}
      </el-text>

      <el-button
        v-if="!auth.isLoggedIn.value"
        :to="loginTarget"
        color="prim"
        icon="login"
        :label="t('auth.promptArchiveAccess.signIn')"
        :p="[10, 16]"
      />

      <el-button
        v-else
        color="prim"
        icon="mail"
        :label="t('auth.promptArchiveAccess.addEmail')"
        :disable="openingRequirement"
        :p="[10, 16]"
        @click="openRequirement"
      />

      <el-button
        to="https://t.me/prompt-draft"
        mode="flat"
        color="blue"
        icon="send"
        label="Prompt Draft on Telegram"
        :p="[9, 14]"
      />
    </el-flex>
  </el-flex>
</template>
