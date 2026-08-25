<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  MaterialAssignment,
  ModuleField,
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
} from "~/modules/types";
import type {
  ModuleEntity,
  ModuleEntityPayload,
} from "~/modules/entityContracts";
import {
  createModuleEntityId,
  resolveModuleEntityValues,
} from "~/modules/entityContracts";
import MaterialAssignmentsField from "./MaterialAssignmentsField.vue";

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    module: PromptKeyModule;
    globalValues: ModuleValues;
    modelValue?: ModuleEntity<ModuleEntityPayload>[];
    allowGlobalInheritanceToggle?: boolean;
  }>(),
  {
    modelValue: () => [],
    allowGlobalInheritanceToggle: false,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleEntity<ModuleEntityPayload>[]): void;
}>();

const collapsedEntityIds = ref<string[]>(props.modelValue.map((entity) => entity.id));
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

  if (!parts.length) return "texture";

  return parts
    .map((part, index) => {
      const normalized = part.replace(/[^a-zA-Z0-9]/g, "");
      if (!normalized) return "";
      return index === 0
        ? normalized.charAt(0).toLowerCase() + normalized.slice(1)
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

const entities = computed(() =>
  props.modelValue.map((entity) => ({
    ...entity,
    payload: cloneValue(entity.payload || {}),
  })),
);

const normalFields = computed(() =>
  Object.values(props.module.fields)
    .filter((field) => !field.isOverride)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

function setEntities(next: ModuleEntity<ModuleEntityPayload>[]) {
  emit("update:modelValue", cloneValue(next));
}

function updateEntity(
  index: number,
  patch: Partial<ModuleEntity<ModuleEntityPayload>>,
) {
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
      [fieldId]: cloneValue(value as ModuleFieldValue),
    },
  });
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

function createEntity(): ModuleEntity<ModuleEntityPayload> {
  const number = entities.value.length + 1;

  return {
    id: createModuleEntityId(props.module.key),
    key: uniqueEntityKey(`texture${number}`),
    name: `Texture ${number}`,
    enabled: true,
    inheritGlobal: true,
    payload: {},
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

  const copy: ModuleEntity<ModuleEntityPayload> = {
    ...cloneValue(source),
    id: createModuleEntityId(props.module.key),
    key: uniqueEntityKey(`${source.key || "texture"}Copy`),
    name: `${source.name || "Texture"} Copy`,
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

function isExpanded(entity: ModuleEntity<ModuleEntityPayload>) {
  return !collapsedEntityIds.value.includes(entity.id);
}

function toggleExpanded(entity: ModuleEntity<ModuleEntityPayload>) {
  collapsedEntityIds.value = collapsedEntityIds.value.includes(entity.id)
    ? collapsedEntityIds.value.filter((id) => id !== entity.id)
    : [...collapsedEntityIds.value, entity.id];
}

function hasPayloadOverride(
  entity: ModuleEntity<ModuleEntityPayload>,
  fieldId: string,
) {
  return Object.prototype.hasOwnProperty.call(entity.payload, fieldId) &&
    entity.payload[fieldId] !== undefined;
}

function isIndependent(entity: ModuleEntity<ModuleEntityPayload>) {
  return entity.inheritGlobal === false;
}

function setIndependent(index: number, independent: boolean) {
  updateEntity(index, { inheritGlobal: !independent });
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
      isIndependent(entity)
        ? field.default ?? ""
        : props.globalValues[field.id] ?? field.default ?? "",
    );
  }

  updateEntity(index, { payload });
}

function resolvedValues(entity: ModuleEntity<ModuleEntityPayload>) {
  return resolveModuleEntityValues(props.globalValues, entity);
}

function resolvedFieldValue(
  entity: ModuleEntity<ModuleEntityPayload>,
  field: ModuleField,
) {
  return resolvedValues(entity)[field.id] ?? field.default ?? "";
}

function materialAssignmentsValue(
  entity: ModuleEntity<ModuleEntityPayload>,
) {
  const value = entity.payload.materialAssignments;
  return Array.isArray(value) ? (value as MaterialAssignment[]) : [];
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

function inheritedLabel(
  entity: ModuleEntity<ModuleEntityPayload>,
  field: ModuleField,
) {
  if (isIndependent(entity)) {
    return translate(
      "components.moduleEntities.fields.notSet",
      "Not set — independent configuration",
    );
  }

  const value = resolvedFieldValue(entity, field);

  if (field.type === "materialAssignments") {
    const count = Array.isArray(value) ? value.length : 0;
    return count
      ? `${count} material assignment${count === 1 ? "" : "s"}`
      : t("panel.none");
  }

  const stringValue = String(value ?? "").trim();
  return stringValue || t("panel.none");
}

function overrideCount(entity: ModuleEntity<ModuleEntityPayload>) {
  return normalFields.value.filter((field) => hasPayloadOverride(entity, field.id)).length;
}
</script>

<template>
  <el-grid
    type="section"
    :p="mobile ? 12 : 16"
    :br="1"
    bc="blue25"
    :radius="mobile ? 16 : 24"
    class="w100"
  >
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
          :label="translate('components.moduleEntities.actions.add', 'Add Texture Configuration')"
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
            <el-text :size="14" :weight="600" icon="texture">
              {{ entity.name || entity.key || `Texture ${entityIndex + 1}` }}
            </el-text>
            <el-text :size="9" color="normal45">
              {{ translate("components.moduleEntities.sceneOnly", "Scene configuration") }} ·
              {{ overrideCount(entity) }}
              {{ translate("components.moduleEntities.overrides", "overrides") }}
              <template v-if="isIndependent(entity)"> · {{ translate("components.moduleEntities.independentBadge", "Independent") }}</template>
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
                @update:model-value="updateEntity(entityIndex, { name: String($event ?? '') })"
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
                @update:model-value="updateEntity(entityIndex, { key: uniqueEntityKey(String($event ?? ''), entityIndex) })"
              />
              <el-text :size="9" color="normal40">
                {{ translate("components.moduleEntities.fields.idHint", "Stable ID") }}: {{ entity.id }}
              </el-text>
            </el-flex>
          </el-grid>

          <el-flex
            v-if="allowGlobalInheritanceToggle"
            rules="rbc"
            :gap="12"
            :p="10"
            :br="1"
            :bc="isIndependent(entity) ? 'blue25' : 'normal10'"
            :radius="12"
            class="w100"
          >
            <el-flex rules="ccs" :gap="2" class="minw0">
              <el-text :size="11" :weight="600">
                {{ translate("components.moduleEntities.fields.independent", "Independent Texture") }}
              </el-text>
              <el-text :size="9" color="normal45">
                {{ translate("components.moduleEntities.fields.independentDescription", "Do not inherit the Global/default Texture configuration. Only local material assignments and details are used.") }}
              </el-text>
            </el-flex>
            <el-switch
              :model-value="isIndependent(entity)"
              :size="12"
              :label="translate('components.moduleEntities.fields.independent', 'Independent Texture')"
              @update:model-value="setIndependent(entityIndex, $event)"
            />
          </el-flex>

          <el-divider mode="dashed" :dash="4" :gap="2" />

          <el-grid
            v-for="field in normalFields"
            :key="field.id"
            :p="10"
            :br="1"
            :bc="hasPayloadOverride(entity, field.id) ? 'blue25' : 'normal10'"
            :radius="12"
            :gap="8"
            class="w100"
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
              <template v-if="isIndependent(entity)">
                {{ inheritedLabel(entity, field) }}
              </template>
              <template v-else>
                {{ translate("components.moduleEntities.fields.inherits", "Inherits") }}: {{ inheritedLabel(entity, field) }}
              </template>
            </el-text>

            <template v-else>
              <MaterialAssignmentsField
                v-if="field.type === 'materialAssignments'"
                :field="field"
                :model-value="materialAssignmentsValue(entity)"
                @update:model-value="updatePayload(entityIndex, field.id, $event)"
              />

              <el-text-field
                v-else
                :model-value="entity.payload[field.id]"
                :type="field.type === 'textarea' ? 'textarea' : 'text'"
                :rows="field.ui?.rows || 3"
                :placeholder="fieldPlaceholder(field)"
                support-variables
                :editor-id="`texture:entity:${entity.id}:${field.id}`"
                @update:model-value="updatePayload(entityIndex, field.id, $event)"
              />
            </template>
          </el-grid>
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
