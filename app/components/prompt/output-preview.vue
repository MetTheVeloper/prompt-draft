<script setup lang="ts">
import { computed, ref } from "vue";
import type { PromptOutputFormat } from "../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../utils/promptValidation";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    output: string;
    format: PromptOutputFormat;
    issues?: PromptValidationIssue[];
  }>(),
  {
    issues: () => [],
  }
);

const emit = defineEmits<{
  (event: "update:format", value: PromptOutputFormat): void;
}>();

const isCopied = ref(false);

const formatOptions: PromptOutputFormat[] = ["modular", "natural", "json"];

const hasBlockingIssues = computed(() => {
  return props.issues.some((issue) => issue.level === "error");
});

const hasWarnings = computed(() => {
  return props.issues.some((issue) => issue.level === "warning");
});

const outputState = computed(() => {
  if (hasBlockingIssues.value) return "error";
  if (hasWarnings.value) return "warning";
  if (props.output) return "ready";

  return "empty";
});

const outputStateLabel = computed(() => {
  if (outputState.value === "error") return t("validation.level.error");
  if (outputState.value === "warning") return t("validation.level.warning");
  if (outputState.value === "ready") return "Ready";

  return "Empty";
});

const outputStateColor = computed(() => {
  if (outputState.value === "error") return "red";
  if (outputState.value === "warning") return "orange";
  if (outputState.value === "ready") return "green";

  return "normal";
});

const canCopy = computed(() => {
  return Boolean(props.output) && !hasBlockingIssues.value;
});

function setFormat(format: PromptOutputFormat) {
  emit("update:format", format);
}

function validationMessage(issue: PromptValidationIssue) {
  if (issue.code === "no_modules_selected") {
    return t("validation.noModulesSelected");
  }

  if (issue.code === "custom_override_empty") {
    return t("validation.customOverrideEmpty", {
      module: issue.moduleLabel || issue.moduleKey || "module",
    });
  }

  if (issue.code === "text_to_image_missing_context") {
    return t("validation.textToImageMissingContext");
  }

  if (issue.code === "custom_subject_empty") {
    return t("validation.customSubjectEmpty");
  }

  if (issue.code === "idea_empty") {
    return t("validation.ideaEmpty");
  }

  return t("validation.unknown");
}

function issueColor(issue: PromptValidationIssue) {
  return issue.level === "error" ? "red" : "orange";
}

function issueIcon(issue: PromptValidationIssue) {
  return issue.level === "error" ? "danger" : "warning-2";
}

async function copyOutput() {
  if (!canCopy.value) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.output);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = props.output;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (!success) {
        throw new Error("Fallback copy failed");
      }
    }

    isCopied.value = true;
    window.setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

</script>

<template>
  <el-grid
    type="section"
    :p="[0]"
    :br="2"
    :bc="!canCopy ? 'normal10' : 'blue50'"
    bg="surface"
    :radius="32"
    class="w100 oh">
    <!-- Header -->
    <el-grid :p="[20, 20, 16, 20]" class="w100">
      <el-flex rules="rbc" class="w100">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h2" :size="16" :weight="800" class="lh1">
            {{ t("create.outputTitle") }}
          </el-text>

          <el-text type="p" :size="12" :weight="300" color="normal60">
            {{ t("create.outputDescription") }}
          </el-text>
        </el-flex>

        <el-button :label="isCopied ? t('panel.copied') : t('panel.copy')" :icon="isCopied ? 'tick' : 'document-copy'"
          :disable="!canCopy" :mode="isCopied ? 'flat' : 'normal'" color="normal" :size="12" :gap="8" :p="[8, 12]"
          @click="copyOutput" />
      </el-flex>
    </el-grid>

    <el-divider />

    <!-- Format Switcher -->
    <el-grid :p="[16]" :gap="32">
      <el-flex rules="rbc" class="w100">
        <el-flex rules="rsc" class="fw" :gap="6">
          <el-button v-for="formatOption in formatOptions" :key="formatOption"
            :label="t(`create.outputFormats.${formatOption}`)" :mode="format === formatOption ? 'normal' : 'flat'"
            :color="format === formatOption ? 'normal' : 'normal'" :size="12" :p="[8, 14]"
            @click="setFormat(formatOption)" />
        </el-flex>
      </el-flex>

      <!-- Validation -->
      <el-grid v-if="issues.length" :gap="10" :radius="16">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h3" :size="14" :weight="800" class="lh1" :icon="hasBlockingIssues ? 'danger' : 'warning-2'"
            :color="hasBlockingIssues ? 'red' : 'orange'" :icon-color="hasBlockingIssues ? 'red' : 'orange'">
            {{ t("validation.title") }}
          </el-text>
        </el-flex>

        <el-grid :gap="8">
          <el-flex v-for="issue in issues" :key="issue.id" rules="ccs" :gap="8" :p="[10, 12]" :radius="12"
            :bg="`${issueColor(issue)}5`" :br="1" :bc="`${issueColor(issue)}20`">
            <el-text type="label" :size="10" :weight="900" :color="issueColor(issue)" :icon="issueIcon(issue)"
              :icon-color="issueColor(issue)">
              {{ t(`validation.level.${issue.level}`) }}
            </el-text>

            <el-text :size="12" :weight="400" :color="issueColor(issue)">
              {{ validationMessage(issue) }}
            </el-text>
          </el-flex>
        </el-grid>
      </el-grid>

      <!-- Output Box -->
      <el-grid :gap="12" :p="[16]" :radius="18" :br="1" :bc="output ? 'normal10' : 'normal5'"
        :bg="output ? 'normal3' : 'normal5'">
        <el-flex rules="rbc" class="w100">
          <el-flex rules="rsc" :gap="8">
            <el-text type="h3" :size="14" :weight="800" class="lh1" :icon="output ? 'archive-tick' : 'document-text'"
              :color="output ? 'normal' : 'normal45'" :icon-color="output ? 'blue' : 'normal45'">
              {{ t(`create.outputFormats.${format}`) }}
            </el-text>
          </el-flex>

          <el-button :label="isCopied ? t('panel.copied') : t('panel.copy')" :icon="isCopied ? 'tick' : 'document-copy'"
            :disable="!canCopy" :mode="isCopied ? 'flat' : 'normal'" color="prim" :size="12" :gap="8" :p="[8, 12]"
            @click="copyOutput" />
        </el-flex>

        <el-divider />

        <pre v-if="output" class="fs12 txt-normal"
          style="white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word">{{ output }}</pre>

        <el-flex v-else rules="ccs" :gap="4">
          <el-text :size="14" :weight="800" color="normal">
            {{ t("create.emptyOutput") }}
          </el-text>

          <el-text :size="12" :weight="300" color="normal55">
            Select modules and complete the required setup fields to generate output.
          </el-text>
        </el-flex>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
