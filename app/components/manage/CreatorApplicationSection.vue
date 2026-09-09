<script setup lang="ts">
import CreatorApplicationCard from "~/components/manage/CreatorApplicationCard.vue";

const { t } = useI18n();
const profileApi = useProfileManagement();
const profile = profileApi.profile;

const loading = ref(!profile.value);
const errorMessage = ref("");

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }
  return t("manage.profile.errors.load");
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    await profileApi.load();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!profile.value) void load();
});
</script>

<template>
  <el-flex v-if="loading" rules="rsc" :gap="8" :p="12" class="w100">
    <el-text :size="10" color="normal45">{{ t("manage.profile.loading") }}</el-text>
  </el-flex>

  <el-flex
    v-else-if="errorMessage"
    rules="rbc"
    :gap="10"
    :p="12"
    bg="red10"
    :radius="12"
    class="w100 fw">
    <el-text :size="10" color="red">{{ errorMessage }}</el-text>
    <el-button
      mode="flat"
      icon="refresh"
      :label="t('manage.common.actions.refresh')"
      @click="load"
    />
  </el-flex>

  <CreatorApplicationCard
    v-else-if="profile"
    :creator="profile.creator"
    @updated="load"
  />
</template>
