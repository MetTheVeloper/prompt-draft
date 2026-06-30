<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    sourceText: string;
    options: string[];
    selected?: string;
  }>(),
  {
    selected: "",
  }
);

const emit = defineEmits<{
  (event: "select", value: string): void;
}>();

const currentValue = ref(props.selected || props.options[0] || "");

watch(
  () => props.selected,
  (value) => {
    if (value) {
      currentValue.value = value;
    }
  }
);

function selectOption(option: string) {
  currentValue.value = option;
  emit("select", option);
}
</script>

<template>
  <el-grid class="w100 translation-options-modal" :gap="16">
    <el-grid :gap="8" :p="12" :radius="12" :br="1" bc="normal15" bg="normal5">
      <el-text :size="12" :weight="600" icon="document-text">
        متن اصلی
      </el-text>

      <el-text class="translation-options-modal__text" :size="13" :weight="300" dir="auto">
        {{ sourceText }}
      </el-text>
    </el-grid>

    <el-grid :gap="8">
      <el-text :size="12" :weight="600" icon="translate">
        گزینه‌های ترجمه
      </el-text>

      <el-flex v-for="option in options" :key="option" rules="rsc" class="w100 translation-options-modal__option crp"
        :gap="10" :p="12" :radius="12" :br="1" :bc="currentValue === option ? 'blue50' : 'normal15'"
        :bg="currentValue === option ? 'blue5' : 'normal5'" @click="selectOption(option)">
        <input class="translation-options-modal__radio" type="radio" name="translation-option"
          :checked="currentValue === option" @click.stop="selectOption(option)" />

        <el-text class="translation-options-modal__text fg100" :size="13" :weight="300" dir="auto">
          {{ option }}
        </el-text>

        <el-icon v-if="currentValue === option" icon="tick-circle" color="blue" :size="18" />
      </el-flex>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.translation-options-modal__text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
}

.translation-options-modal__radio {
  margin-top: 4px;
}
</style>