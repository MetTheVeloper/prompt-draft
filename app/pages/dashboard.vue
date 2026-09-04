<script setup lang="ts">
import { AUTH_PERMISSIONS } from "~/config/authorization";

definePageMeta({
  middleware: ["authorization", "dashboard-legacy"],
  requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
});
</script>

<template>
  <div />
</template>
