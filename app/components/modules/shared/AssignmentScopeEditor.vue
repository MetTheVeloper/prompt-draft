<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  SemanticTargetCapability,
  SemanticTargetRef,
} from "~/modules/types";
import type { SemanticBuiltinTargetDefinition } from "~/utils/semanticTargets";
import {
  sameSemanticTargetList,
  semanticTargetIdentity,
} from "~/utils/semanticTargets";
import { useSemanticTargetCatalog } from "~/composables/prompt/useSemanticTargetCatalog";

const props = withDefaults(
  defineProps<{
    modelValue?: SemanticTargetRef[];
    exceptions?: SemanticTargetRef[];
    capability: SemanticTargetCapability;
    builtins: SemanticBuiltinTargetDefinition[];
    exclusiveValue?: string;
    applyPlaceholder?: string;
  }>(),
  {
    modelValue: () => [],
    exceptions: () => [],
    exclusiveValue: "",
    applyPlaceholder: "",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: SemanticTargetRef[]): void;
  (event: "update:exceptions", value: SemanticTargetRef[]): void;
}>();

const { t } = useI18n();
const customTargetDraft = ref("");
const customExceptionDraft = ref("");

const catalog = useSemanticTargetCatalog(
  props.capability,
  () => props.builtins,
);

function cloneTargets(value: SemanticTargetRef[]) {
  return value.map((target) => ({ ...target }));
}

function identities(value: SemanticTargetRef[]) {
  return new Set(value.map(semanticTargetIdentity).filter(Boolean));
}

async function emitScopeChanges(
  nextTargets: SemanticTargetRef[],
  nextExceptions: SemanticTargetRef[],
  order: "targets-first" | "exceptions-first" = "targets-first",
) {
  const targets = cloneTargets(nextTargets);
  const exceptions = cloneTargets(nextExceptions);
  const targetsChanged = !sameSemanticTargetList(targets, props.modelValue);
  const exceptionsChanged = !sameSemanticTargetList(exceptions, props.exceptions);

  if (!targetsChanged && !exceptionsChanged) return;

  const emitTargets = () => emit("update:modelValue", targets);
  const emitExceptions = () => emit("update:exceptions", exceptions);

  if (targetsChanged && exceptionsChanged) {
    if (order === "targets-first") {
      emitTargets();
      await nextTick();
      emitExceptions();
    } else {
      emitExceptions();
      await nextTick();
      emitTargets();
    }
    return;
  }

  if (targetsChanged) emitTargets();
  if (exceptionsChanged) emitExceptions();
}

watch(
  [
    () => props.modelValue,
    () => props.exceptions,
    catalog.availableOptions,
  ],
  () => {
    const upgradedTargets = catalog.upgradeTargets(props.modelValue);
    const upgradedExceptions = catalog.upgradeTargets(props.exceptions);

    void emitScopeChanges(upgradedTargets, upgradedExceptions);
  },
  { immediate: true, deep: true },
);

const applyItems = computed(() => catalog.itemsFor(props.modelValue));
const exceptionItems = computed(() =>
  catalog.itemsFor(props.exceptions, {
    excludeValues: props.exclusiveValue ? [props.exclusiveValue] : [],
  }),
);

const applyValues = computed(() => catalog.valuesFor(props.modelValue));
const exceptionValues = computed(() => catalog.valuesFor(props.exceptions));

const customTargets = computed(() =>
  props.modelValue.filter((target) => target.kind === "custom"),
);
const customExceptions = computed(() =>
  props.exceptions.filter((target) => target.kind === "custom"),
);

function isMissingCatalogTarget(target: SemanticTargetRef) {
  return (
    target.kind !== "custom" &&
    catalog.resolveTarget(target).status === "missing"
  );
}

const missingTargets = computed(() =>
  props.modelValue.filter(isMissingCatalogTarget),
);

const missingExceptions = computed(() =>
  props.exceptions.filter(isMissingCatalogTarget),
);

function removeExactConflicts(
  source: SemanticTargetRef[],
  against: SemanticTargetRef[],
) {
  const blocked = identities(against);
  return source.filter((target) => !blocked.has(semanticTargetIdentity(target)));
}

function updateApply(values: ElDropdownValue[]) {
  const selected = catalog.resolveSelections(values, props.modelValue);
  const hasExclusive = Boolean(
    props.exclusiveValue &&
      selected.some((target) => target.value === props.exclusiveValue),
  );
  const custom = hasExclusive ? [] : customTargets.value;
  const nextTargets = [...selected, ...custom];
  const nextExceptions = removeExactConflicts(props.exceptions, nextTargets);

  void emitScopeChanges(nextTargets, nextExceptions, "targets-first");
}

function updateExceptions(values: ElDropdownValue[]) {
  const selected = catalog.resolveSelections(values, props.exceptions);
  const nextExceptions = [...selected, ...customExceptions.value];
  const nextTargets = removeExactConflicts(props.modelValue, nextExceptions);

  void emitScopeChanges(nextTargets, nextExceptions, "exceptions-first");
}

function addCustomTarget() {
  const value = customTargetDraft.value.trim();
  if (!value) return;

  const next: SemanticTargetRef = { kind: "custom", value };
  const identity = semanticTargetIdentity(next);
  if (identities(props.modelValue).has(identity)) {
    customTargetDraft.value = "";
    return;
  }

  const targets = props.modelValue.filter((target) => {
    return !(
      target.kind === "builtin" &&
      props.exclusiveValue &&
      target.value === props.exclusiveValue
    );
  });
  const nextTargets = [...targets, next];
  const nextExceptions = removeExactConflicts(props.exceptions, [next]);

  void emitScopeChanges(nextTargets, nextExceptions, "targets-first");
  customTargetDraft.value = "";
}

function addCustomException() {
  const value = customExceptionDraft.value.trim();
  if (!value) return;

  const next: SemanticTargetRef = { kind: "custom", value };
  const identity = semanticTargetIdentity(next);
  if (identities(props.exceptions).has(identity)) {
    customExceptionDraft.value = "";
    return;
  }

  const nextExceptions = [...props.exceptions, next];
  const nextTargets = removeExactConflicts(props.modelValue, [next]);

  void emitScopeChanges(nextTargets, nextExceptions, "exceptions-first");
  customExceptionDraft.value = "";
}

function removeTarget(targetToRemove: SemanticTargetRef) {
  const identity = semanticTargetIdentity(targetToRemove);
  emit(
    "update:modelValue",
    cloneTargets(
      props.modelValue.filter(
        (target) => semanticTargetIdentity(target) !== identity,
      ),
    ),
  );
}

function removeException(targetToRemove: SemanticTargetRef) {
  const identity = semanticTargetIdentity(targetToRemove);
  emit(
    "update:exceptions",
    cloneTargets(
      props.exceptions.filter(
        (target) => semanticTargetIdentity(target) !== identity,
      ),
    ),
  );
}

function targetChipLabel(target: SemanticTargetRef) {
  return target.token || target.label || target.value;
}
</script>

<template>
  <el-grid :gap="10" class="w100">
    <el-flex rules="ccs" :gap="5" class="w100">
      <el-text :size="10" color="normal50">
        {{ t("components.assignmentScope.applyTo") }}
      </el-text>
      <el-multi-select
        :model-value="applyValues"
        :items="applyItems"
        item-label="label"
        item-value="value"
        item-description="description"
        item-group="group"
        item-group-label="groupLabel"
        item-color="color"
        item-disabled="disabled"
        :exclusive-values="exclusiveValue ? [`slot:${exclusiveValue}`] : []"
        :placeholder="applyPlaceholder || t('components.assignmentScope.applyPlaceholder')"
        @update:model-value="updateApply"
      />
    </el-flex>

    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="10" color="normal50">
        {{ t("components.assignmentScope.customTargets") }}
      </el-text>
      <el-flex rules="rsc" :gap="8" class="w100">
        <el-text-field
          v-model="customTargetDraft"
          type="text"
          support-variables
          :placeholder="t('components.assignmentScope.customTargetPlaceholder')"
          class="fg100"
          @keydown.enter.prevent="addCustomTarget"
        />
        <el-button
          :label="t('components.assignmentScope.addTarget')"
          icon="add"
          color="blue"
          :size="12"
          :p="[8, 12]"
          @click="addCustomTarget"
        />
      </el-flex>

      <el-flex v-if="customTargets.length" rules="rsc" class="fw w100" :gap="4">
        <el-flex
          v-for="target in customTargets"
          :key="semanticTargetIdentity(target)"
          rules="rcc"
          :gap="4"
          :p="[4, 8]"
          :radius="50"
          bg="normal5"
        >
          <el-text :size="10">{{ target.value }}</el-text>
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="close"
            :size="10"
            :p="4"
            :label="t('components.assignmentScope.remove')"
            @click="removeTarget(target)"
          />
        </el-flex>
      </el-flex>
    </el-flex>

    <el-flex v-if="missingTargets.length" rules="ccs" :gap="4" class="w100">
      <el-text :size="10" color="orange" icon="warning" icon-color="orange">
        {{ t("components.assignmentScope.missingHelp") }}
      </el-text>
      <el-flex rules="rsc" class="fw w100" :gap="4">
        <el-flex
          v-for="target in missingTargets"
          :key="semanticTargetIdentity(target)"
          rules="rcc"
          :gap="4"
          :p="[4, 8]"
          :radius="50"
          bg="orange5"
        >
          <el-text :size="10" color="orange">{{ targetChipLabel(target) }}</el-text>
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="close"
            :size="10"
            :p="4"
            :label="t('components.assignmentScope.remove')"
            @click="removeTarget(target)"
          />
        </el-flex>
      </el-flex>
    </el-flex>

    <el-divider mode="dashed" :dash="4" :gap="2" />

    <el-flex rules="ccs" :gap="5" class="w100">
      <el-text :size="10" color="normal50" icon="remove">
        {{ t("components.assignmentScope.except") }}
      </el-text>
      <el-multi-select
        :model-value="exceptionValues"
        :items="exceptionItems"
        item-label="label"
        item-value="value"
        item-description="description"
        item-group="group"
        item-group-label="groupLabel"
        item-color="color"
        item-disabled="disabled"
        :placeholder="t('components.assignmentScope.exceptionPlaceholder')"
        @update:model-value="updateExceptions"
      />
    </el-flex>

    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="10" color="normal50">
        {{ t("components.assignmentScope.customExceptions") }}
      </el-text>
      <el-flex rules="rsc" :gap="8" class="w100">
        <el-text-field
          v-model="customExceptionDraft"
          type="text"
          support-variables
          :placeholder="t('components.assignmentScope.customExceptionPlaceholder')"
          class="fg100"
          @keydown.enter.prevent="addCustomException"
        />
        <el-button
          :label="t('components.assignmentScope.addException')"
          icon="remove"
          color="blue"
          :size="12"
          :p="[8, 12]"
          @click="addCustomException"
        />
      </el-flex>

      <el-flex v-if="customExceptions.length" rules="rsc" class="fw w100" :gap="4">
        <el-flex
          v-for="target in customExceptions"
          :key="semanticTargetIdentity(target)"
          rules="rcc"
          :gap="4"
          :p="[4, 8]"
          :radius="50"
          bg="normal5"
        >
          <el-text :size="10">{{ target.value }}</el-text>
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="close"
            :size="10"
            :p="4"
            :label="t('components.assignmentScope.remove')"
            @click="removeException(target)"
          />
        </el-flex>
      </el-flex>
    </el-flex>

    <el-flex v-if="missingExceptions.length" rules="ccs" :gap="4" class="w100">
      <el-text :size="10" color="orange" icon="warning" icon-color="orange">
        {{ t("components.assignmentScope.missingExceptionHelp") }}
      </el-text>
      <el-flex rules="rsc" class="fw w100" :gap="4">
        <el-flex
          v-for="target in missingExceptions"
          :key="semanticTargetIdentity(target)"
          rules="rcc"
          :gap="4"
          :p="[4, 8]"
          :radius="50"
          bg="orange5"
        >
          <el-text :size="10" color="orange">{{ targetChipLabel(target) }}</el-text>
          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="close"
            :size="10"
            :p="4"
            :label="t('components.assignmentScope.remove')"
            @click="removeException(target)"
          />
        </el-flex>
      </el-flex>
    </el-flex>
  </el-grid>
</template>
