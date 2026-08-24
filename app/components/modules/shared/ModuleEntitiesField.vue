<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleField,
  ModuleFieldOption,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "~/modules/types";
import type {
  ModuleEntity,
  ModuleEntityPayload,
  ModuleEntityTargetPolicy,
} from "~/modules/entityContracts";
import {
  createModuleEntityId,
  resolveModuleEntityValues,
} from "~/modules/entityContracts";
import {
  normalizeSemanticTargets,
  semanticScopeSummary,
} from "~/utils/semanticTargets";
import { useModuleEntityTargets } from "~/composables/prompt/useModuleEntityTargets";

const { t } = useI18n();
const { mobile } = useScreen();

type EditableModuleEntity = ModuleEntity<ModuleEntityPayload> & {
  targets?: SemanticTargetRef[];
};

type SelectOption = ModuleFieldOption & {
  category?: string;
  categoryLabel?: string;
  categoryLabelKey?: string;
};

const props = withDefaults(
  defineProps<{
    module: PromptKeyModule;
    globalValues: ModuleValues;
    modelValue?: ModuleEntity<ModuleEntityPayload>[];
    targetPolicy?: ModuleEntityTargetPolicy[];
  }>(),
  {
    modelValue: () => [],
    targetPolicy: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleEntity<ModuleEntityPayload>[]): void;
}>();

const targetCatalog = useModuleEntityTargets(() => props.targetPolicy);
const collapsedEntityIds = ref<string[]>([]);
const selectedCategories = ref<Record<string, string>>({});
const listExpanded = ref(true);

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function semanticKey(value: string) {
  const parts = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "entity";

  return parts
    .map((part, index) => {
      const normalized = part.replace(/[^a-zA-Z0-9]/g, "");
      if (!normalized) return "";
      if (index === 0) {
        return normalized.charAt(0).toLowerCase() + normalized.slice(1);
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

function uniqueEntityKey(base: string, ignoreIndex = -1) {
  const normalizedBase = semanticKey(base);
  const used = new Set(
    entities.value
      .filter((_, index) => index !== ignoreIndex)
      .map((entity) => entity.key.trim())
      .filter(Boolean),
  );

  if (!used.has(normalizedBase)) return normalizedBase;

  let suffix = 2;
  while (used.has(`${normalizedBase}${suffix}`)) suffix += 1;
  return `${normalizedBase}${suffix}`;
}

const entities = computed<EditableModuleEntity[]>(() => {
  return props.modelValue.map((entity) => ({
    ...entity,
    payload: cloneValue(entity.payload || {}),
    targets: normalizeSemanticTargets((entity as EditableModuleEntity).targets),
  }));
});

const normalFields = computed(() => {
  return Object.values(props.module.fields)
    .filter((field) => !field.isOverride)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

const groups = computed(() => {
  const map = new Map<string, ModuleField[]>();
  normalFields.value.forEach((field) => {
    const groupId = field.group || "default";
    if (!map.has(groupId)) map.set(groupId, []);
    map.get(groupId)?.push(field);
  });

  return Array.from(map.entries())
    .map(([id, fields]) => ({
      id,
      fields,
      order: props.module.groups?.[id]?.order ?? 999,
    }))
    .sort((a, b) => a.order - b.order);
});

const hasTargets = computed(() => props.targetPolicy.length > 0);

watch(
  [() => props.modelValue, targetCatalog.availableOptions],
  () => {
    if (!hasTargets.value) return;

    const source = props.modelValue as EditableModuleEntity[];
    const upgraded = source.map((entity) => ({
      ...entity,
      targets: targetCatalog.upgradeTargets(
        normalizeSemanticTargets(entity.targets),
      ),
    }));

    if (JSON.stringify(source) !== JSON.stringify(upgraded)) {
      emit("update:modelValue", cloneValue(upgraded));
    }
  },
  { immediate: true, deep: true },
);

function setEntities(next: EditableModuleEntity[]) {
  emit("update:modelValue", cloneValue(next));
}

function updateEntity(index: number, patch: Partial<EditableModuleEntity>) {
  setEntities(
    entities.value.map((entity, entityIndex) =>
      entityIndex === index ? { ...entity, ...patch } : entity,
    ),
  );
}

function updatePayload(index: number, fieldId: string, value: unknown) {
  const entity = entities.value[index];
  if (!entity) return;

  updateEntity(index, {
    payload: {
      ...entity.payload,
      [fieldId]: value as ModuleValues[string],
    },
  });
}

function hasPayloadOverride(entity: EditableModuleEntity, fieldId: string) {
  return Object.prototype.hasOwnProperty.call(entity.payload, fieldId) &&
    entity.payload[fieldId] !== undefined;
}

function setPayloadOverride(
  index: number,
  field: ModuleField,
  enabled: boolean,
) {
  const entity = entities.value[index];
  if (!entity) return;

  const payload = { ...entity.payload };
  if (!enabled) {
    delete payload[field.id];
  } else if (!Object.prototype.hasOwnProperty.call(payload, field.id)) {
    payload[field.id] = cloneValue(
      props.globalValues[field.id] ?? field.default ?? "",
    );
  }

  updateEntity(index, { payload });
}

function resolvedValues(entity: EditableModuleEntity) {
  return resolveModuleEntityValues(props.globalValues, entity);
}

function resolvedFieldValue(entity: EditableModuleEntity, field: ModuleField) {
  return resolvedValues(entity)[field.id] ?? field.default ?? "";
}

function defaultTargets(): SemanticTargetRef[] {
  if (!hasTargets.value) return [];
  const first = targetCatalog.availableOptions.value[0]?.target;
  return first ? [{ ...first }] : [];
}

function createEntity(): EditableModuleEntity {
  const number = entities.value.length + 1;
  const name = `${humanize(props.module.key)} ${number}`;

  return {
    id: createModuleEntityId(props.module.key),
    key: uniqueEntityKey(`${props.module.key}${number}`),
    name,
    enabled: true,
    payload: {},
    ...(hasTargets.value ? { targets: defaultTargets() } : {}),
  };
}

function addEntity() {
  const entity = createEntity();
  collapsedEntityIds.value = collapsedEntityIds.value.filter(
    (id) => id !== entity.id,
  );
  setEntities([...entities.value, entity]);
  listExpanded.value = true;
}

function duplicateEntity(index: number) {
  const source = entities.value[index];
  if (!source) return;

  const copyName = `${source.name || humanize(props.module.key)} Copy`;
  const copy: EditableModuleEntity = {
    ...cloneValue(source),
    id: createModuleEntityId(props.module.key),
    key: uniqueEntityKey(`${source.key || props.module.key}Copy`),
    name: copyName,
  };

  setEntities([
    ...entities.value.slice(0, index + 1),
    copy,
    ...entities.value.slice(index + 1),
  ]);
}

function removeEntity(index: number) {
  const source = entities.value[index];
  if (source) {
    collapsedEntityIds.value = collapsedEntityIds.value.filter(
      (id) => id !== source.id,
    );
  }
  setEntities(entities.value.filter((_, entityIndex) => entityIndex !== index));
}

function isExpanded(entity: EditableModuleEntity) {
  return !collapsedEntityIds.value.includes(entity.id);
}

function toggleExpanded(entity: EditableModuleEntity) {
  collapsedEntityIds.value = collapsedEntityIds.value.includes(entity.id)
    ? collapsedEntityIds.value.filter((id) => id !== entity.id)
    : [...collapsedEntityIds.value, entity.id];
}

function updateName(index: number, value: unknown) {
  updateEntity(index, { name: String(value ?? "") });
}

function updateKey(index: number, value: unknown) {
  const next = String(value ?? "");
  updateEntity(index, { key: uniqueEntityKey(next, index) });
}

function entityTargets(entity: EditableModuleEntity) {
  return normalizeSemanticTargets(entity.targets);
}

function targetItems(entity: EditableModuleEntity) {
  return targetCatalog.itemsFor(entityTargets(entity));
}

function targetValues(entity: EditableModuleEntity) {
  return targetCatalog.valuesFor(entityTargets(entity));
}

function updateTargets(index: number, values: ElDropdownValue[]) {
  const current = entities.value[index];
  if (!current) return;

  updateEntity(index, {
    targets: targetCatalog.resolveSelections(values, entityTargets(current)),
  });
}

function targetSummary(entity: EditableModuleEntity) {
  if (!hasTargets.value) return translate("components.moduleEntities.sceneOnly", "Scene configuration");
  return semanticScopeSummary(entityTargets(entity));
}

function overrideCount(entity: EditableModuleEntity) {
  return normalFields.value.filter((field) => hasPayloadOverride(entity, field.id)).length;
}

function fieldLabel(field: ModuleField) {
  return translate(
    `modules.${props.module.key}.fields.${field.id}.label`,
    humanize(field.id),
  );
}

function fieldDescription(field: ModuleField) {
  return translate(`modules.${props.module.key}.fields.${field.id}.description`, "");
}

function fieldPlaceholder(field: ModuleField) {
  return translate(`modules.${props.module.key}.fields.${field.id}.placeholder`, "");
}

function groupTitle(groupId: string) {
  return translate(
    `modules.${props.module.key}.groups.${groupId}.title`,
    humanize(groupId),
  );
}

function optionLabel(field: ModuleField, option: ModuleFieldOption) {
  return translate(
    `modules.${props.module.key}.fields.${field.id}.options.${option.value}`,
    humanize(option.value),
  );
}

function fieldOptions(field: ModuleField) {
  return (field.options || []) as SelectOption[];
}

function dependencyTags(entity: EditableModuleEntity, field: ModuleField) {
  const dependsOn = field.ui?.compatibility?.dependsOn;
  if (!dependsOn) return [];

  const dependencyField = props.module.fields[dependsOn];
  if (!dependencyField) return [];

  const value = String(resolvedFieldValue(entity, dependencyField) ?? "");
  return dependencyField.options?.find((option) => option.value === value)?.tags || [];
}

function hasTagMatch(source: string[] = [], target: string[] = []) {
  return source.some((tag) => target.includes(tag));
}

function optionScore(
  entity: EditableModuleEntity,
  field: ModuleField,
  option: SelectOption,
) {
  if (field.ui?.compatibility?.mode !== "sort-and-hint") return 0;
  const tags = dependencyTags(entity, field);
  const compatibility = option.compatibility;
  if (!tags.length || !compatibility) return 0;

  let score = 0;
  if (hasTagMatch(tags, compatibility.preferredTags)) score += 30;
  if (hasTagMatch(tags, compatibility.supportedTags)) score += 10;
  if (hasTagMatch(tags, compatibility.discouragedTags)) score -= 50;
  return score;
}

function sortedOptions(entity: EditableModuleEntity, field: ModuleField) {
  return [...fieldOptions(field)]
    .map((option, index) => ({ option, index, score: optionScore(entity, field, option) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.option);
}

function categoryStateKey(entity: EditableModuleEntity, field: ModuleField) {
  return `${entity.id}:${field.id}`;
}

function selectedOption(entity: EditableModuleEntity, field: ModuleField) {
  const value = String(entity.payload[field.id] ?? "");
  return fieldOptions(field).find((option) => option.value === value);
}

function activeCategory(entity: EditableModuleEntity, field: ModuleField) {
  const selected = selectedOption(entity, field);
  if (selected?.category) return selected.category;

  return selectedCategories.value[categoryStateKey(entity, field)] || "";
}

function categoryItems(entity: EditableModuleEntity, field: ModuleField) {
  const categories = new Map<string, string>();
  sortedOptions(entity, field).forEach((option) => {
    if (!option.category) return;
    categories.set(
      option.category,
      option.categoryLabelKey || option.categoryLabel || option.category,
    );
  });

  return Array.from(categories.entries()).map(([value, label]) => ({
    value,
    label: label.startsWith("modules.")
      ? translate(label, humanize(value))
      : translate(
          `modules.${props.module.key}.fields.${field.id}.categories.${value}`,
          humanize(label),
        ),
  }));
}

function visibleCategorizedOptions(
  entity: EditableModuleEntity,
  field: ModuleField,
) {
  const category = activeCategory(entity, field);
  if (!category) return [];
  return sortedOptions(entity, field).filter((option) => option.category === category);
}

function updateCategory(
  entity: EditableModuleEntity,
  index: number,
  field: ModuleField,
  value: ElDropdownValue,
) {
  selectedCategories.value = {
    ...selectedCategories.value,
    [categoryStateKey(entity, field)]: String(value ?? ""),
  };
  updatePayload(index, field.id, "");
}

function isCategorizedSelect(field: ModuleField) {
  return field.type === "select" && field.ui?.optionLayout === "categorized";
}

function selectedCompatibilityWarning(
  entity: EditableModuleEntity,
  field: ModuleField,
) {
  if (field.ui?.compatibility?.mode !== "sort-and-hint") return "";

  const selected = selectedOption(entity, field);
  if (!selected?.compatibility?.warningKey) return "";

  const tags = dependencyTags(entity, field);
  if (!hasTagMatch(tags, selected.compatibility.discouragedTags)) return "";

  return translate(selected.compatibility.warningKey, "");
}

function inheritedLabel(entity: EditableModuleEntity, field: ModuleField) {
  const value = resolvedFieldValue(entity, field);
  if (Array.isArray(value)) return value.join(", ") || translate("panel.none", "None");
  if (typeof value === "boolean") return value ? "True" : "False";

  const stringValue = String(value ?? "");
  const option = field.options?.find((item) => item.value === stringValue);
  return option ? optionLabel(field, option) : stringValue || translate("panel.none", "None");
}
</script>

<template>
  <el-grid type="section" :p="mobile ? 12 : 16" :br="1" bc="blue25" :radius="mobile ? 16 : 24" class="w100">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="16" :weight="700" icon="layers">
          {{ translate("components.moduleEntities.title", "Named Configurations") }}
        </el-text>
        <el-text :size="10" color="normal50">
          {{ translate("components.moduleEntities.description", "Create reusable module configurations that inherit from the global/default values above.") }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="6">
        <el-text marker="blue5" color="blue" :size="10" :weight="600">
          {{ entities.length }}
        </el-text>
        <el-button
          type="fab"
          mode="flat"
          color="prim"
          :icon="listExpanded ? 'expand_less' : 'expand_more'"
          :label="listExpanded ? translate('components.moduleEntities.actions.collapse', 'Collapse') : translate('components.moduleEntities.actions.expand', 'Expand')"
          :size="12"
          :p="8"
          @click="listExpanded = !listExpanded"
        />
        <el-button
          color="blue"
          icon="add"
          :label="translate('components.moduleEntities.actions.add', `Add ${humanize(module.key)} Configuration`)"
          :size="12"
          :p="[8, 12]"
          @click="addEntity"
        />
      </el-flex>
    </el-flex>

    <el-grid v-show="listExpanded" :gap="12" class="w100">
      <el-text v-if="!entities.length" :size="11" color="normal50">
        {{ translate("components.moduleEntities.empty", "No named configurations yet. Global/default module behavior remains unchanged until one is added.") }}
      </el-text>

      <el-grid
        v-for="(entity, entityIndex) in entities"
        :key="entity.id"
        :p="12"
        :br="2"
        :bc="isExpanded(entity) ? 'blue40' : 'normal10'"
        :radius="16"
        :gap="12"
        class="w100"
      >
        <el-flex rules="rbc" class="w100 crp" :gap="8" @click="toggleExpanded(entity)">
          <el-flex rules="ccs" :gap="1" class="minw0">
            <el-text :size="14" :weight="600" icon="tune">
              {{ entity.name || entity.key || `${humanize(module.key)} ${entityIndex + 1}` }}
            </el-text>
            <el-text :size="9" color="normal45">
              {{ targetSummary(entity) }} · {{ overrideCount(entity) }} {{ translate("components.moduleEntities.overrides", "overrides") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="6">
            <el-switch
              :model-value="entity.enabled !== false"
              :size="12"
              :label="translate('components.moduleEntities.enabled', 'Enabled')"
              @click.stop
              @update:model-value="updateEntity(entityIndex, { enabled: $event })"
            />
            <el-button
              type="fab"
              mode="flat"
              icon="content_copy"
              :label="translate('components.moduleEntities.actions.duplicate', 'Duplicate')"
              :size="12"
              :p="8"
              @click.stop="duplicateEntity(entityIndex)"
            />
            <el-button
              type="fab"
              mode="flat"
              color="red"
              icon="delete"
              :label="translate('components.moduleEntities.actions.remove', 'Remove')"
              :size="12"
              :p="8"
              @click.stop="removeEntity(entityIndex)"
            />
            <el-icon :icon="isExpanded(entity) ? 'expand_less' : 'expand_more'" :size="14" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isExpanded(entity)" :gap="12" class="w100">
          <el-grid :cols="mobile ? 1 : 2" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">
                {{ translate("components.moduleEntities.fields.name", "Name") }}
              </el-text>
              <el-text-field
                :model-value="entity.name"
                type="text"
                :placeholder="translate('components.moduleEntities.fields.namePlaceholder', 'Configuration name')"
                @update:model-value="updateName(entityIndex, $event)"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">
                {{ translate("components.moduleEntities.fields.key", "Semantic Key") }}
              </el-text>
              <el-text-field
                :model-value="entity.key"
                type="text"
                :placeholder="translate('components.moduleEntities.fields.keyPlaceholder', 'stable semantic key')"
                @update:model-value="updateKey(entityIndex, $event)"
              />
              <el-text :size="9" color="normal40">
                {{ translate("components.moduleEntities.fields.idHint", `Stable ID: ${entity.id}`) }}
              </el-text>
            </el-flex>
          </el-grid>

          <el-flex v-if="hasTargets" rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">
              {{ translate("components.moduleEntities.fields.targets", "Apply To") }}
            </el-text>
            <el-multi-select
              :model-value="targetValues(entity)"
              :items="targetItems(entity)"
              item-label="label"
              item-value="value"
              item-description="description"
              item-group="group"
              item-group-label="groupLabel"
              item-color="color"
              item-disabled="disabled"
              :placeholder="translate('components.moduleEntities.fields.targetsPlaceholder', 'Select subject/object targets')"
              @update:model-value="updateTargets(entityIndex, $event)"
            />
            <el-text v-if="!entityTargets(entity).length" :size="10" color="orange" icon="warning" icon-color="orange">
              {{ translate("components.moduleEntities.warnings.noTarget", "This configuration is stored but will not compile until at least one valid target is selected.") }}
            </el-text>
          </el-flex>

          <el-divider mode="dashed" :dash="4" :gap="2" />

          <el-grid v-for="group in groups" :key="group.id" :gap="8" :p="10" :br="1" bc="normal10" :radius="12">
            <el-text :size="12" :weight="600">{{ groupTitle(group.id) }}</el-text>

            <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
              <el-grid
                v-for="field in group.fields"
                :key="field.id"
                :p="10"
                :br="1"
                :bc="hasPayloadOverride(entity, field.id) ? 'blue25' : 'normal10'"
                :radius="10"
                :gap="8"
              >
                <el-flex rules="rbc" :gap="8" class="w100">
                  <el-flex rules="rsc" :gap="6">
                    <el-text :size="11" :weight="500">{{ fieldLabel(field) }}</el-text>
                    <el-help v-if="fieldDescription(field)" :text="fieldDescription(field)" />
                  </el-flex>
                  <el-switch
                    :model-value="hasPayloadOverride(entity, field.id)"
                    :size="11"
                    :label="translate('components.moduleEntities.fields.override', 'Override')"
                    @update:model-value="setPayloadOverride(entityIndex, field, $event)"
                  />
                </el-flex>

                <el-text v-if="!hasPayloadOverride(entity, field.id)" :size="9" color="normal45">
                  {{ translate("components.moduleEntities.fields.inherits", "Inherits") }}: {{ inheritedLabel(entity, field) }}
                </el-text>

                <template v-else>
                  <el-flex v-if="isCategorizedSelect(field)" rules="ccs" :gap="6">
                    <el-dropdown
                      :model-value="activeCategory(entity, field)"
                      :items="categoryItems(entity, field)"
                      item-label="label"
                      item-value="value"
                      :placeholder="t('panel.none')"
                      clearable
                      @update:model-value="updateCategory(entity, entityIndex, field, $event)"
                    />
                    <el-dropdown
                      :model-value="entity.payload[field.id]"
                      :items="visibleCategorizedOptions(entity, field)"
                      :item-label="(option) => optionLabel(field, option)"
                      item-value="value"
                      item-disabled="disabled"
                      :placeholder="t('panel.none')"
                      :disabled="!activeCategory(entity, field)"
                      :clearable="field.ui?.clearable !== false"
                      @update:model-value="updatePayload(entityIndex, field.id, $event)"
                    />
                  </el-flex>

                  <el-dropdown
                    v-else-if="field.type === 'select'"
                    :model-value="entity.payload[field.id]"
                    :items="sortedOptions(entity, field)"
                    :item-label="(option) => optionLabel(field, option)"
                    item-value="value"
                    item-disabled="disabled"
                    :placeholder="t('panel.none')"
                    :clearable="field.ui?.clearable !== false"
                    @update:model-value="updatePayload(entityIndex, field.id, $event)"
                  />

                  <el-multi-select
                    v-else-if="field.type === 'multiSelect'"
                    :model-value="Array.isArray(entity.payload[field.id]) ? entity.payload[field.id] : []"
                    :items="sortedOptions(entity, field)"
                    :item-label="(option) => optionLabel(field, option)"
                    item-value="value"
                    :placeholder="t('panel.none')"
                    @update:model-value="updatePayload(entityIndex, field.id, $event)"
                  />

                  <el-text-field
                    v-else-if="field.type === 'textarea'"
                    :model-value="entity.payload[field.id]"
                    type="textarea"
                    :rows="field.ui?.rows || 3"
                    :placeholder="fieldPlaceholder(field)"
                    support-variables
                    @update:model-value="updatePayload(entityIndex, field.id, $event)"
                  />

                  <input
                    v-else-if="field.type === 'checkbox'"
                    :checked="Boolean(entity.payload[field.id])"
                    type="checkbox"
                    @change="updatePayload(entityIndex, field.id, ($event.target as HTMLInputElement).checked)"
                  />

                  <input
                    v-else-if="field.type === 'color'"
                    :value="String(entity.payload[field.id] || '')"
                    type="color"
                    @input="updatePayload(entityIndex, field.id, ($event.target as HTMLInputElement).value)"
                  />

                  <input
                    v-else-if="field.type === 'number' || field.type === 'range'"
                    :value="Number(entity.payload[field.id] || 0)"
                    :type="field.type"
                    :min="field.ui?.min"
                    :max="field.ui?.max"
                    :step="field.ui?.step"
                    @input="updatePayload(entityIndex, field.id, Number(($event.target as HTMLInputElement).value))"
                  />

                  <el-text-field
                    v-else
                    :model-value="entity.payload[field.id]"
                    type="text"
                    :placeholder="fieldPlaceholder(field)"
                    support-variables
                    @update:model-value="updatePayload(entityIndex, field.id, $event)"
                  />

                  <el-text
                    v-if="selectedCompatibilityWarning(entity, field)"
                    :size="9"
                    color="orange"
                    icon="warning"
                    icon-color="orange"
                  >
                    {{ selectedCompatibilityWarning(entity, field) }}
                  </el-text>
                </template>
              </el-grid>
            </el-grid>
          </el-grid>
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
