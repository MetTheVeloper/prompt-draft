<script setup lang="ts">
import { AUTH_PERMISSIONS } from "~/config/authorization";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();

const checkingBackend = ref(true);
const backendAuthorized = ref(false);
const backendError = ref("");

const identityLabel = computed(() => {
  return auth.user.value?.username || auth.user.value?.email || "";
});

const roleLabel = computed(() => {
  return auth.role.value?.replaceAll("_", " ") || "";
});

onMounted(async () => {
  await auth.initialize();

  try {
    const response = await api.getAdminAccessCheck();
    backendAuthorized.value = response.ok;
  } catch (error) {
    console.error("[Prompt Draft] dashboard authorization check failed", error);
    backendError.value = "Backend authorization check failed.";
  } finally {
    checkingBackend.value = false;
  }
});
</script>

<template>
  <el-flex rules="csc" :gap="16" class="w100">
    <el-flex rules="csc" :gap="12" bg="surface" :p="20" :radius="16" class="w100 mxw720">
      <el-flex rules="rbc" class="w100" :gap="16">
        <el-text color="normal55" :size="12">Account</el-text>
        <el-text :size="13" :weight="700">{{ identityLabel }}</el-text>
      </el-flex>

      <el-flex rules="rbc" class="w100" :gap="16">
        <el-text color="normal55" :size="12">Role</el-text>
        <el-text :size="13" :weight="700">{{ roleLabel }}</el-text>
      </el-flex>

      <el-flex rules="rbc" class="w100" :gap="16">
        <el-text color="normal55" :size="12">Backend authorization</el-text>
        <el-text
          :size="13"
          :weight="700"
          :color="backendAuthorized ? 'green' : backendError ? 'red' : 'normal55'">
          {{ checkingBackend ? "Checking…" : backendAuthorized ? "Verified" : backendError || "Unavailable" }}
        </el-text>
      </el-flex>

      <el-divider />

      <el-flex rules="csc" :gap="8" class="w100">
        <el-text color="normal55" :size="12">Granted permissions</el-text>
        <el-flex rules="rsc" :gap="8" class="fw">
          <el-text
            v-for="permission in auth.permissions.value"
            :key="permission"
            type="span"
            bg="prim15"
            color="prim"
            :radius="8"
            :p="[6, 8]"
            :size="11"
            :weight="700">
            {{ permission }}
          </el-text>
        </el-flex>
      </el-flex>
    </el-flex>
  </el-flex>
</template>
