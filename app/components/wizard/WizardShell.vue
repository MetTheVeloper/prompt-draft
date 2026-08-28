<script setup lang="ts">
const props = defineProps<{
  title: string;
  stepTitle: string;
  stepDescription?: string;
  progress: number;
  canGoBack: boolean;
  isReview?: boolean;
  isBusy?: boolean;
}>();

const emit = defineEmits<{
  (event: "back"): void;
  (event: "next"): void;
  (event: "finish"): void;
  (event: "cancel"): void;
}>();
</script>

<template>
  <el-grid class="w100" rules="csc" :gap="20" style="max-width: 820px; margin: 0 auto; padding: 24px 16px 40px">
    <el-grid :gap="8">
      <el-flex rules="rsc" :gap="10">
        <el-text :size="12" color="normal55">{{ props.title }}</el-text>
        <el-text :size="12" color="normal55">{{ Math.round(props.progress * 100) }}%</el-text>
      </el-flex>
      <el-grid :gap="4">
        <el-text :size="24" :weight="800">{{ props.stepTitle }}</el-text>
        <el-text v-if="props.stepDescription" :size="13" color="normal55">{{ props.stepDescription }}</el-text>
      </el-grid>
    </el-grid>

    <slot />

    <el-flex rules="rsc" :gap="8">
      <el-button
        label="Cancel"
        mode="flat"
        color="normal"
        :disable="props.isBusy"
        @click="emit('cancel')"
      />
      <el-flex :gap="8">
        <el-button
          v-if="props.canGoBack"
          label="Back"
          mode="outline"
          color="blue"
          :disable="props.isBusy"
          @click="emit('back')"
        />
        <el-button
          :label="props.isReview ? 'Finish' : 'Continue'"
          color="blue"
          :loading="props.isBusy"
          @click="props.isReview ? emit('finish') : emit('next')"
        />
      </el-flex>
    </el-flex>
  </el-grid>
</template>
