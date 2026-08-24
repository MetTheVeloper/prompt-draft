<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
} from "~/modules/types";
import type { SceneContentRef, SceneEntity } from "~/modules/scene.types";
import type { ModuleEntityPayload } from "~/modules/entityContracts";
import {
  createModuleEntityId,
  getModuleEntities,
  getModuleEntitySceneSelection,
  isSceneExposableModule,
} from "~/modules/entityContracts";
import {
  getSceneEntities,
  getSceneVariableToken,
  setSceneEntities,
} from "~/utils/scene";
import {
  compileSceneModule,
  type SceneCompileIssue,
} from "~/utils/compileScene";
import type { ModuleOutputValue } from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const { t } = useI18n();
const { mobile } = useScreen();
const { enabledVariablesWithSystem } = usePromptVariables();

const props = withDefaults(
  defineProps<{
    module: PromptKeyModule;
    modelValue?: ModuleValues;
    modules?: PromptKeyModule[];
    moduleValues?: Record<string, ModuleValues>;
    previewOutput?: string;
  }>(),
  {
    modelValue: () => ({}),
    modules: () => [],
    moduleValues: () => ({}),
    previewOutput: "",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

const collapsedIds = ref<string[]>([]);
const listExpanded = ref(true);
const copied = ref(false);

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

  if (!parts.length) return "scene";

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

const values = computed(() => props.modelValue || {});
const scenes = computed(() => getSceneEntities(values.value));
const layoutActive = computed(() => props.modules.some((module) => module.key === "layout"));

function uniqueSceneKey(base: string, ignoreIndex = -1) {
  const normalized = semanticKey(base);
  const used = new Set(
    scenes.value
      .filter((_, index) => index !== ignoreIndex)
      .map((scene) => scene.key.trim())
      .filter(Boolean),
  );

  if (!used.has(normalized)) return normalized;

  let suffix = 2;
  while (used.has(`${normalized}${suffix}`)) suffix += 1;
  return `${normalized}${suffix}`;
}

const contentVariables = computed(() => {
  return enabledVariablesWithSystem.value.filter((variable) => {
    if (variable.moduleKey === "scene" || variable.entityType === "scene") return false;
    if (variable.entityType === "region") return false;

    if (variable.source === "user") {
      return (
        variable.type === "subject" ||
        variable.type === "object" ||
        variable.type === "reference"
      );
    }

    return variable.source === "system" && variable.key === "subject";
  });
});

const componentGroups = computed(() => {
  return props.modules
    .filter(isSceneExposableModule)
    .map((module) => ({
      module,
      selection: getModuleEntitySceneSelection(module),
      entities: getModuleEntities<ModuleEntityPayload>(
        props.moduleValues[module.key] || {},
      ),
    }));
});

const compileResult = computed(() => {
  const sceneValues = {
    ...props.moduleValues,
    scene: values.value,
  };

  return compileSceneModule(values.value, {
    modules: props.modules,
    moduleValues: sceneValues,
    variables: enabledVariablesWithSystem.value,
    layoutActive: layoutActive.value,
  });
});

const output = computed(() => compileResult.value.output);
const displayOutput = computed(() => props.previewOutput || output.value);

function mapCompileIssue(issue: SceneCompileIssue): PromptValidationIssue {
  const code =
    issue.kind === "missing_content"
      ? "scene_missing_content_reference"
      : issue.kind === "component_cardinality"
        ? "scene_component_cardinality_conflict"
        : "scene_missing_component_reference";

  return {
    id: issue.id,
    code,
    level: "warning",
    moduleKey: "scene",
    moduleLabel: "Scene",
  };
}

const validationIssues = computed(() =>
  compileResult.value.issues.map(mapCompileIssue),
);

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

watch(
  validationIssues,
  (issues) => emit("update:issues", issues),
  { immediate: true, deep: true },
);

function setScenes(nextScenes: SceneEntity[]) {
  emit(
    "update:modelValue",
    setSceneEntities(values.value, cloneValue(nextScenes)),
  );
}

function updateScene(index: number, patch: Partial<SceneEntity>) {
  setScenes(
    scenes.value.map((scene, sceneIndex) =>
      sceneIndex === index ? { ...scene, ...patch } : scene,
    ),
  );
}

function createScene(): SceneEntity {
  const number = scenes.value.length + 1;
  return {
    id: createModuleEntityId("scene"),
    key: uniqueSceneKey(`scene${number}`),
    name: `Scene ${number}`,
    enabled: true,
    description: "",
    content: [],
    components: [],
    extraDetails: "",
  };
}

function addScene() {
  const scene = createScene();
  collapsedIds.value = collapsedIds.value.filter((id) => id !== scene.id);
  setScenes([...scenes.value, scene]);
  listExpanded.value = true;
}

function duplicateScene(index: number) {
  const source = scenes.value[index];
  if (!source) return;

  const copy: SceneEntity = {
    ...cloneValue(source),
    id: createModuleEntityId("scene"),
    key: uniqueSceneKey(`${source.key || "scene"}Copy`),
    name: `${source.name || "Scene"} Copy`,
  };

  setScenes([
    ...scenes.value.slice(0, index + 1),
    copy,
    ...scenes.value.slice(index + 1),
  ]);
}

function removeScene(index: number) {
  const source = scenes.value[index];
  if (source) {
    collapsedIds.value = collapsedIds.value.filter((id) => id !== source.id);
  }
  setScenes(scenes.value.filter((_, sceneIndex) => sceneIndex !== index));
}

function isExpanded(scene: SceneEntity) {
  return !collapsedIds.value.includes(scene.id);
}

function toggleExpanded(scene: SceneEntity) {
  collapsedIds.value = collapsedIds.value.includes(scene.id)
    ? collapsedIds.value.filter((id) => id !== scene.id)
    : [...collapsedIds.value, scene.id];
}

function updateName(index: number, value: unknown) {
  updateScene(index, { name: String(value ?? "") });
}

function updateKey(index: number, value: unknown) {
  updateScene(index, { key: uniqueSceneKey(String(value ?? ""), index) });
}

function contentRef(variable: PromptVariable): SceneContentRef {
  return {
    variableId: variable.id,
    token: `{${variable.key}}`,
    label: variable.label || variable.key,
    source: variable.source,
    type: variable.type,
  };
}

function contentItems(scene: SceneEntity) {
  const items = contentVariables.value.map((variable) => ({
    value: variable.id,
    label: variable.label || variable.key,
    description: `{${variable.key}}`,
    group: variable.source || "user",
    groupLabel: humanize(variable.source || "user"),
    disabled: false,
  }));
  const known = new Set(items.map((item) => item.value));

  scene.content.forEach((ref) => {
    if (known.has(ref.variableId)) return;
    items.push({
      value: ref.variableId,
      label: ref.label || "Missing content reference",
      description: `${ref.token || ref.variableId} · Missing`,
      group: "missing",
      groupLabel: "Missing",
      disabled: true,
    });
  });

  return items;
}

function updateContent(index: number, selected: ElDropdownValue[]) {
  const scene = scenes.value[index];
  if (!scene) return;

  const current = new Map(scene.content.map((ref) => [ref.variableId, ref]));
  const available = new Map(contentVariables.value.map((variable) => [variable.id, variable]));

  const next = selected.flatMap((value) => {
    const id = String(value ?? "");
    const variable = available.get(id);
    if (variable) return [contentRef(variable)];
    const existing = current.get(id);
    return existing ? [existing] : [];
  });

  updateScene(index, { content: next });
}

function refsForModule(scene: SceneEntity, moduleKey: string) {
  return scene.components.filter((ref) => ref.moduleKey === moduleKey);
}

function componentItems(scene: SceneEntity, moduleKey: string) {
  const group = componentGroups.value.find((item) => item.module.key === moduleKey);
  const items = (group?.entities || []).map((entity) => ({
    value: entity.id,
    label: entity.name || entity.key || entity.id,
    description: entity.enabled === false ? "Disabled configuration" : entity.key,
    disabled: entity.enabled === false,
  }));
  const known = new Set(items.map((item) => item.value));

  refsForModule(scene, moduleKey).forEach((ref) => {
    if (known.has(ref.entityId)) return;
    items.push({
      value: ref.entityId,
      label: ref.label || "Missing configuration",
      description: `${ref.entityId} · Missing`,
      disabled: true,
    });
  });

  return items;
}

function selectSingleComponent(
  index: number,
  moduleKey: string,
  value: ElDropdownValue,
) {
  const scene = scenes.value[index];
  if (!scene) return;

  const entityId = String(value ?? "");
  const otherRefs = scene.components.filter((ref) => ref.moduleKey !== moduleKey);
  if (!entityId) {
    updateScene(index, { components: otherRefs });
    return;
  }

  const group = componentGroups.value.find((item) => item.module.key === moduleKey);
  const entity = group?.entities.find((item) => item.id === entityId);
  const existing = refsForModule(scene, moduleKey).find((ref) => ref.entityId === entityId);

  updateScene(index, {
    components: [
      ...otherRefs,
      entity
        ? {
            moduleKey,
            entityId: entity.id,
            label: entity.name || entity.key || entity.id,
          }
        : existing || { moduleKey, entityId },
    ],
  });
}

function selectMultipleComponents(
  index: number,
  moduleKey: string,
  selected: ElDropdownValue[],
) {
  const scene = scenes.value[index];
  if (!scene) return;

  const group = componentGroups.value.find((item) => item.module.key === moduleKey);
  const entities = new Map((group?.entities || []).map((entity) => [entity.id, entity]));
  const current = new Map(refsForModule(scene, moduleKey).map((ref) => [ref.entityId, ref]));
  const otherRefs = scene.components.filter((ref) => ref.moduleKey !== moduleKey);

  const nextRefs = selected.flatMap((value) => {
    const entityId = String(value ?? "");
    const entity = entities.get(entityId);
    if (entity) {
      return [{
        moduleKey,
        entityId: entity.id,
        label: entity.name || entity.key || entity.id,
      }];
    }
    const existing = current.get(entityId);
    return existing ? [existing] : [];
  });

  updateScene(index, { components: [...otherRefs, ...nextRefs] });
}

function sceneIssues(scene: SceneEntity) {
  return compileResult.value.issues.filter((issue) => issue.sceneId === scene.id);
}

function issueText(issue: SceneCompileIssue) {
  if (issue.kind === "missing_content") {
    return translate(
      "modules.scene.warnings.missingContent",
      "A selected content reference is missing or disabled.",
    );
  }
  if (issue.kind === "component_cardinality") {
    return translate(
      "modules.scene.warnings.cardinality",
      "This module allows only one configuration per Scene.",
    );
  }
  return translate(
    "modules.scene.warnings.missingComponent",
    "A selected configuration is missing, disabled, or unavailable.",
  );
}

async function copyOutput() {
  if (!displayOutput.value) return;
  try {
    await navigator.clipboard.writeText(displayOutput.value);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Scene output copy failed:", error);
  }
}
</script>

<template>
  <el-grid type="section" :p="mobile ? 12 : 16" :br="1" bc="blue40" :radius="mobile ? 16 : 24" :gap="16" class="w100">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="3">
        <el-flex rules="rsc" :gap="8">
          <el-text :size="20" :weight="800" icon="layers">
            {{ translate("modules.scene.title", "SCENE") }}
          </el-text>
          <el-text marker="blue10" color="blue" :size="10" :weight="600">
            {{ scenes.length }}
          </el-text>
        </el-flex>
        <el-text :size="11" color="normal50">
          {{ translate("modules.scene.description", "Compose reusable scene content and stable references to named module configurations.") }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="6">
        <el-button
          type="fab"
          mode="flat"
          :icon="listExpanded ? 'expand_less' : 'expand_more'"
          :label="listExpanded ? 'Collapse scenes' : 'Expand scenes'"
          :size="12"
          :p="8"
          @click="listExpanded = !listExpanded"
        />
        <el-button
          color="blue"
          icon="add"
          :label="translate('modules.scene.actions.add', 'Add Scene')"
          :size="12"
          :p="[8, 12]"
          @click="addScene"
        />
      </el-flex>
    </el-flex>

    <el-grid
      v-if="!layoutActive"
      :p="12"
      :br="1"
      bc="orange25"
      :radius="12"
      :gap="4"
    >
      <el-text :size="12" :weight="600" color="orange" icon="warning" icon-color="orange">
        {{ translate("modules.scene.layoutRequired.title", "Layout is inactive") }}
      </el-text>
      <el-text :size="10" color="normal50">
        {{ translate("modules.scene.layoutRequired.description", "Scene state remains saved and editable, but Scene definitions and Scene reference variables compile only while Layout is active.") }}
      </el-text>
    </el-grid>

    <el-grid v-show="listExpanded" :gap="12" class="w100">
      <el-text v-if="!scenes.length" :size="11" color="normal50">
        {{ translate("modules.scene.empty", "No Scenes yet. Add a Scene to compose content with named Form/Camera configurations.") }}
      </el-text>

      <el-grid
        v-for="(scene, sceneIndex) in scenes"
        :key="scene.id"
        :p="12"
        :br="2"
        :bc="isExpanded(scene) ? 'blue40' : 'normal10'"
        :radius="16"
        :gap="12"
        class="w100"
      >
        <el-flex rules="rbc" class="w100 crp" :gap="8" @click="toggleExpanded(scene)">
          <el-flex rules="ccs" :gap="2" class="minw0">
            <el-text :size="14" :weight="700" icon="layers">
              {{ scene.name || scene.key || `Scene ${sceneIndex + 1}` }}
            </el-text>
            <el-text :size="9" color="normal45">
              {{ getSceneVariableToken(scene) }} · {{ scene.content.length }} content · {{ scene.components.length }} components
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="6">
            <el-switch
              :model-value="scene.enabled !== false"
              :size="12"
              label="Enabled"
              @click.stop
              @update:model-value="updateScene(sceneIndex, { enabled: $event })"
            />
            <el-button type="fab" mode="flat" icon="content_copy" label="Duplicate" :size="12" :p="8" @click.stop="duplicateScene(sceneIndex)" />
            <el-button type="fab" mode="flat" color="red" icon="delete" label="Remove" :size="12" :p="8" @click.stop="removeScene(sceneIndex)" />
            <el-icon :icon="isExpanded(scene) ? 'expand_less' : 'expand_more'" :size="14" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isExpanded(scene)" :gap="12" class="w100">
          <el-grid :cols="mobile ? 1 : 2" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">Name</el-text>
              <el-text-field :model-value="scene.name" type="text" @update:model-value="updateName(sceneIndex, $event)" />
            </el-flex>

            <el-flex rules="ccs" :gap="5">
              <el-text :size="10" color="normal50">Semantic Key</el-text>
              <el-text-field :model-value="scene.key" type="text" @update:model-value="updateKey(sceneIndex, $event)" />
              <el-text :size="9" color="normal40">Stable ID: {{ scene.id }}</el-text>
            </el-flex>
          </el-grid>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">Description</el-text>
            <el-text-field
              :model-value="scene.description || ''"
              type="textarea"
              :rows="2"
              support-variables
              @update:model-value="updateScene(sceneIndex, { description: String($event || '') })"
            />
          </el-flex>

          <el-grid :p="12" :br="1" bc="normal10" :radius="12" :gap="8" class="w100">
            <el-flex rules="ccs" :gap="2">
              <el-text :size="13" :weight="700" icon="person">Content / Actors</el-text>
              <el-text :size="9" color="normal45">Select stable subject/object/reference variables that belong to this Scene.</el-text>
            </el-flex>

            <el-multi-select
              :model-value="scene.content.map((ref) => ref.variableId)"
              :items="contentItems(scene)"
              item-label="label"
              item-value="value"
              item-description="description"
              item-group="group"
              item-group-label="groupLabel"
              item-disabled="disabled"
              placeholder="Select Scene content"
              @update:model-value="updateContent(sceneIndex, $event)"
            />
          </el-grid>

          <el-grid :p="12" :br="1" bc="normal10" :radius="12" :gap="10" class="w100">
            <el-flex rules="ccs" :gap="2">
              <el-text :size="13" :weight="700" icon="tune">Configuration Components</el-text>
              <el-text :size="9" color="normal45">Only named entities from modules marked scene-exposable are shown.</el-text>
            </el-flex>

            <el-grid v-if="componentGroups.length" :cols="mobile ? 1 : 2" :gap="10" class="w100">
              <el-grid
                v-for="group in componentGroups"
                :key="group.module.key"
                :p="10"
                :br="1"
                bc="normal10"
                :radius="10"
                :gap="6"
              >
                <el-flex rules="rbc" :gap="8">
                  <el-text :size="11" :weight="600" :icon="group.module.icon">
                    {{ translate(`modules.${group.module.key}.title`, humanize(group.module.key)) }}
                  </el-text>
                  <el-text :size="9" color="normal40">
                    {{ group.selection === 'single' ? 'Single' : 'Multiple' }}
                  </el-text>
                </el-flex>

                <el-text v-if="!group.entities.length && !refsForModule(scene, group.module.key).length" :size="9" color="normal45">
                  No named configurations available.
                </el-text>

                <el-dropdown
                  v-if="group.selection === 'single'"
                  :model-value="refsForModule(scene, group.module.key)[0]?.entityId || ''"
                  :items="[{ value: '', label: t('panel.none'), disabled: false }, ...componentItems(scene, group.module.key)]"
                  item-label="label"
                  item-value="value"
                  item-disabled="disabled"
                  :clearable="false"
                  @update:model-value="selectSingleComponent(sceneIndex, group.module.key, $event)"
                />

                <el-multi-select
                  v-else
                  :model-value="refsForModule(scene, group.module.key).map((ref) => ref.entityId)"
                  :items="componentItems(scene, group.module.key)"
                  item-label="label"
                  item-value="value"
                  item-description="description"
                  item-disabled="disabled"
                  placeholder="Select configurations"
                  @update:model-value="selectMultipleComponents(sceneIndex, group.module.key, $event)"
                />
              </el-grid>
            </el-grid>

            <el-text v-else :size="10" color="orange" icon="warning" icon-color="orange">
              Add at least one scene-exposable module with a named configuration, such as Form or Camera.
            </el-text>
          </el-grid>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">Extra Details</el-text>
            <el-text-field
              :model-value="scene.extraDetails || ''"
              type="textarea"
              :rows="3"
              support-variables
              @update:model-value="updateScene(sceneIndex, { extraDetails: String($event || '') })"
            />
          </el-flex>

          <el-grid v-if="sceneIssues(scene).length" :gap="4" :p="10" :br="1" bc="orange25" :radius="10">
            <el-text
              v-for="issue in sceneIssues(scene)"
              :key="issue.id"
              :size="10"
              color="orange"
              icon="warning"
              icon-color="orange"
            >
              {{ issueText(issue) }}
            </el-text>
          </el-grid>
        </el-grid>
      </el-grid>
    </el-grid>

    <el-grid :p="12" :br="1" bc="normal15" :radius="14" :gap="8" class="w100">
      <el-flex rules="rbc" :gap="8">
        <el-text :size="13" :weight="700" icon="code">Scene Output</el-text>
        <el-button
          type="fab"
          mode="flat"
          :icon="copied ? 'check' : 'content_copy'"
          :label="copied ? 'Copied' : 'Copy'"
          :disabled="!displayOutput"
          :size="12"
          :p="8"
          @click="copyOutput"
        />
      </el-flex>
      <el-text v-if="displayOutput" :size="11" class="scene-output">{{ displayOutput }}</el-text>
      <el-text v-else :size="10" color="normal45">
        {{ layoutActive ? 'Add an enabled Scene to generate Scene definitions.' : 'Enable Layout to compile Scene definitions.' }}
      </el-text>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.scene-output {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
