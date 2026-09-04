<script setup lang="ts">
const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t, locale } = useI18n();
const auth = useAuth();

const user = computed(() => auth.user.value);

const identityLabel = computed(() => {
  return user.value?.username || user.value?.email || "";
});

const memberSince = computed(() => {
  if (!user.value?.createdAt) return "";

  const date = new Date(user.value.createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

async function handleLogout() {
  await auth.logout();
  emit("close");
}
</script>

<template>
  <el-flex rules="csc" :gap="12" :p="16" class="w100" style="min-width: 280px">
    <el-flex rules="rsc" :gap="10" class="w100">
      <el-flex rules="rcc" bg="prim15" :radius="100" :p="10">
        <el-icon icon="account_circle" color="prim" :size="24" />
      </el-flex>
      <el-flex rules="csc" :gap="4" class="fg100">
        <el-text :size="14" :weight="700">{{ t("auth.profile.title") }}</el-text>
        <el-text :size="12" color="normal55">{{ identityLabel }}</el-text>
      </el-flex>
    </el-flex>

    <el-divider />

    <el-flex v-if="user?.username" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.username") }}</el-text>
      <el-text :size="12">{{ user.username }}</el-text>
    </el-flex>

    <el-flex v-if="user?.email" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.email") }}</el-text>
      <el-text :size="12">{{ user.email }}</el-text>
    </el-flex>

    <el-flex v-if="memberSince" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.memberSince") }}</el-text>
      <el-text :size="12">{{ memberSince }}</el-text>
    </el-flex>

    <el-divider />

    <el-button
      class="w100"
      color="red"
      mode="flat"
      icon="logout"
      :label="t('auth.profile.logout')"
      :disable="auth.loading.value"
      @click="handleLogout"
    />
  </el-flex>
</template>
