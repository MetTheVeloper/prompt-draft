<script setup lang="ts">
import type { AuthUserRole } from "~/types/auth";

const props = defineProps<{
  currentRole: AuthUserRole;
  onSelect?: (role: AuthUserRole) => void;
}>();

const { t } = useI18n();
const selectedRole = ref<AuthUserRole>(props.currentRole);

const roleItems = computed(() => [
  { label: t("manage.common.roles.user"), value: "user", icon: "person" },
  { label: t("manage.common.roles.admin"), value: "admin", icon: "admin_panel_settings" },
  { label: t("manage.common.roles.superAdmin"), value: "super_admin", icon: "shield_person" },
]);

watch(selectedRole, (value) => {
  props.onSelect?.(value);
}, { immediate: true });
</script>

<template>
  <el-flex rules="ccs" :gap="12" class="w100">
    <el-text color="normal55" :size="13">
      {{ t("manage.users.roleChange.description") }}
    </el-text>

    <el-dropdown
      v-model="selectedRole"
      class="w100"
      :items="roleItems"
      :placeholder="t('manage.users.roleChange.placeholder')"
      icon="admin_panel_settings"
    />
  </el-flex>
</template>
