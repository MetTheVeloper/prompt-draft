<script setup lang="ts">
import CreatorApplicationSection from "~/components/manage/CreatorApplicationSection.vue";
import {
  getPermittedManageSections,
  type ManageSection,
} from "~/config/manage";

definePageMeta({
  middleware: "manage-entry",
});

const route = useRoute();
const auth = useAuth();
const { t } = useI18n();
const localePath = useLocalePath();

type VisibleManageSection = ManageSection | {
  key: "profile";
  icon: string;
  route: string;
};

const profileSection: VisibleManageSection = {
  key: "profile",
  icon: "manage_accounts",
  route: "/manage/profile",
};

const permittedSections = computed<VisibleManageSection[]>(() => {
  return [profileSection, ...getPermittedManageSections(auth.can)];
});

const isActiveSection = (section: VisibleManageSection) => {
  const path = localePath(section.route);
  return route.path === path || route.path.startsWith(`${path}/`);
};

const activeSection = computed(() => {
  return permittedSections.value.find(isActiveSection) ?? null;
});

const isProfileSection = computed(() => activeSection.value?.key === "profile");

function sectionLabel(section: VisibleManageSection) {
  return t(`manage.sections.${section.key}.label`);
}

function sectionDescription(section: VisibleManageSection) {
  return t(`manage.sections.${section.key}.description`);
}

onMounted(() => {
  void auth.initialize();
});
</script>

<template>
  <el-flex rules="csc" :gap="20" class="w100">
    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text type="h1" :size="28" :weight="800">{{ t("manage.title") }}</el-text>
      <el-text color="normal55" :size="13">
        {{ t("manage.subtitle") }}
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
        :to="localePath(section.route)"
        :icon="section.icon"
        :label="sectionLabel(section)"
        :color="isActiveSection(section) ? 'prim' : 'normal'"
        :mode="isActiveSection(section) ? 'normal' : 'flat'"
        :size="12"
        :p="[8, 12]"
      />
    </el-flex>

    <el-flex v-if="activeSection" rules="ccs" :gap="6" class="w100">
      <el-text type="h2" :size="24" :weight="800">{{ sectionLabel(activeSection) }}</el-text>
      <el-text color="normal55" :size="13">{{ sectionDescription(activeSection) }}</el-text>
    </el-flex>

    <NuxtPage />
    <CreatorApplicationSection v-if="isProfileSection" />
  </el-flex>
</template>
