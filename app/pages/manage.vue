<script setup lang="ts">
import {
  getPermittedManageSections,
  type ManageSection,
} from "~/config/manage";

definePageMeta({
  middleware: "manage-entry",
});

const route = useRoute();
const auth = useAuth();

const permittedSections = computed<ManageSection[]>(() => {
  return getPermittedManageSections(auth.can);
});

const isActiveSection = (section: ManageSection) => {
  return (
    route.path === section.route ||
    route.path.startsWith(`${section.route}/`)
  );
};

const activeSection = computed(() => {
  return permittedSections.value.find(isActiveSection) ?? null;
});

onMounted(() => {
  void auth.initialize();
});
</script>

<template>
  <el-flex rules="csc" :gap="20" class="w100">
    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text type="h1" :size="28" :weight="800">Manage</el-text>
      <el-text color="normal55" :size="13">
        Administrative and system management workspace.
      </el-text>
    </el-flex>

    <el-flex
      v-if="permittedSections.length"
      rules="rsc"
      :gap="8"
      :p="8"
      bg="surface"
      :radius="14"
      class="w100 fw">
      <el-button
        v-for="section in permittedSections"
        :key="section.key"
        :to="section.route"
        :icon="section.icon"
        :label="section.label"
        :color="isActiveSection(section) ? 'prim' : 'normal'"
        :mode="isActiveSection(section) ? 'normal' : 'flat'"
        :size="12"
        :p="[8, 12]"
      />
    </el-flex>

    <el-flex v-if="activeSection" rules="ccs" :gap="6" class="w100">
      <el-text type="h2" :size="24" :weight="800">{{ activeSection.label }}</el-text>
      <el-text color="normal55" :size="13">{{ activeSection.description }}</el-text>
    </el-flex>

    <NuxtPage />
  </el-flex>
</template>
