<script setup lang="ts">
import ManageArchiveTelegramAdapter from "~/components/manage/ArchiveTelegramAdapter.vue";
import type { AdminArchiveItem } from "~/types/adminArchiveApi";

const props = defineProps<{
  item: AdminArchiveItem;
  disable?: boolean;
}>();
</script>

<template>
  <ManageArchiveTelegramAdapter :item="props.item" />
</template>
