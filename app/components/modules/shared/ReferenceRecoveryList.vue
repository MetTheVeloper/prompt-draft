<script setup lang="ts">
export type ReferenceRecoveryStatus = "missing" | "unavailable";

export type ReferenceRecoveryItem = {
  identity: string;
  label: string;
  status: ReferenceRecoveryStatus;
  description?: string;
  removable?: boolean;
};

withDefaults(
  defineProps<{
    items?: ReferenceRecoveryItem[];
    help?: string;
    removeLabel?: string;
  }>(),
  {
    items: () => [],
    help: "",
    removeLabel: "Remove reference",
  },
);

const emit = defineEmits<{
  (event: "remove", item: ReferenceRecoveryItem): void;
}>();

function statusColor(status: ReferenceRecoveryStatus) {
  return status === "missing" ? "red" : "orange";
}

function statusBackground(status: ReferenceRecoveryStatus) {
  return status === "missing" ? "red5" : "orange5";
}
</script>

<template>
  <el-flex v-if="items.length" rules="ccs" :gap="5" class="w100">
    <el-text
      v-if="help"
      :size="10"
      color="orange"
      icon="warning"
      icon-color="orange"
    >
      {{ help }}
    </el-text>

    <el-flex rules="rsc" class="fw w100" :gap="4">
      <el-flex
        v-for="item in items"
        :key="item.identity"
        rules="rcc"
        :gap="6"
        :p="[5, 8]"
        :radius="10"
        :bg="statusBackground(item.status)"
        class="minw0"
      >
        <el-flex rules="ccs" :gap="1" class="minw0">
          <el-text
            :size="10"
            :weight="600"
            :color="statusColor(item.status)"
            class="minw0"
          >
            {{ item.label }}
          </el-text>
          <el-text
            v-if="item.description"
            :size="9"
            color="normal45"
            class="minw0"
          >
            {{ item.description }}
          </el-text>
        </el-flex>

        <el-button
          v-if="item.removable !== false"
          type="fab"
          mode="flat"
          color="red"
          icon="close"
          :size="10"
          :p="4"
          :label="removeLabel"
          @click="emit('remove', item)"
        />
      </el-flex>
    </el-flex>
  </el-flex>
</template>