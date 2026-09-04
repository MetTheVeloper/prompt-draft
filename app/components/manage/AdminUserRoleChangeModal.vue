<script setup lang="ts">
import type { AuthUserRole } from "~/types/auth";

const props = defineProps<{
  currentRole: AuthUserRole;
  onSelect?: (role: AuthUserRole) => void;
}>();

const selectedRole = ref<AuthUserRole>(props.currentRole);

const roleItems = [
  { label: "User", value: "user", icon: "person" },
  { label: "Admin", value: "admin", icon: "admin_panel_settings" },
  { label: "Super admin", value: "super_admin", icon: "shield_person" },
];

watch(selectedRole, (value) => {
  props.onSelect?.(value);
}, { immediate: true });
</script>

<template>
  <el-flex rules="ccs" :gap="12" class="w100">
    <el-text color="normal55" :size="13">
      Select the new authorization role for this account. This changes the permissions resolved for future requests.
    </el-text>

    <el-dropdown
      v-model="selectedRole"
      class="w100"
      :items="roleItems"
      placeholder="Select role"
      icon="admin_panel_settings"
    />
  </el-flex>
</template>
