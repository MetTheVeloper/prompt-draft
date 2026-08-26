<script setup lang="ts">
import { computed, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
import type {
  ModuleField,
  ModuleValues,
  PromptKeyModule,
} from "~/modules/types";
import type { SceneEntity } from "~/modules/scene.types";
import type { ModuleEntityPayload } from "~/modules/entityContracts";
import {
  createModuleEntityId,
  getModuleEntities,
  getModuleEntitySceneSelection,
  isSceneExposableModule,
  moduleEntityRefIdentity,
} from "~/modules/entityContracts";
import {
  createModuleEntityReferenceCatalogIndex,
  resolveModuleEntityReferenceCatalogItem,
} from "~/utils/moduleEntityReferenceCatalog";
import {
  getSceneVariableToken,
  normalizeSceneEntities,
} from "~/utils/scene";
import {
  compileSceneModule,
  type SceneCompileIssue,
} from "~/utils/compileScene";
import ReferenceRecoveryList from "../shared/ReferenceRecoveryList.vue";

type RecoveryItem = {
  identity: string;
  label: string;
  status: "missing" | "unavailable";
  description?: string;
};

const { t } = useI18n();
const { mobile } = useScreen();

const props = withDefaults(
  defineProps<{
    modelValue?: SceneEntity[];
    field?: ModuleField;
    modules?: PromptKeyModule[];
    moduleValues?: Record<string, ModuleValues>;
  }>(),
  {
    modelValue: () => [],
    modules: () => [],
    moduleValues: () => ({}),
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: SceneEntity[]): void;
}>();

const collapsedIds = ref<string[]>([]);
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

function sceneEditorId(scene: SceneEntity, fieldId: "description" | "extraDetails") {
  return `scene:${scene.id}:${fieldId}`;
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

const scenes = computed(() => normalizeSceneEntities(props.modelValue));
const layoutActive = computed(() => props.modules.some((module) => module.key === "layout"));

const componentGroups = computed(() => {
  return props.modules
    .filter(isSceneExposableModule)
    .map((module) => {
      const entities = getModuleEntities<ModuleEntityPayload>(
        props.moduleValues[module.key] || {},
      );

      return {
        module,
        selection: getModuleEntitySceneSelection(module),
        entities,
        catalogIndex: createModuleEntityReferenceCatalogIndex(
          module.key,
          entities,
        ),
      };
    });
});

const compileResult = computed(() => {
  return compileSceneModule(
    { scenes: scenes.value as unknown as Record<string, unknown>[] },
    {
      modules: props.modules,
      moduleValues: {
        ...props.moduleValues,
        scene: { scenes: scenes.value as unknown as Record<string, unknown>[] },
      },
      layoutActive: layoutActive.value,
    },
  );
});

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

function setScenes(nextScenes: SceneEntity[]) {
  emit("update:modelValue", cloneValue(nextScenes));
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

function refsForModule(scene: SceneEntity, moduleKey: string) {
  return scene.components.filter((ref) => ref.moduleKey === moduleKey);
}

function componentItems(scene: SceneEntity, moduleKey: string) {
  const group = componentGroups.value.find((item) => item.module.key === moduleKey);
  const items = Array.from(group?.catalogIndex.values() || []).map((item) => ({
    value: item.reference.entityId,
    label: item.presentation.label,
    description:
      item.state?.available === false
        ? "Disabled configuration"
        : item.metadata.key,
    disabled: item.state?.available === false,
  }));

  refsForModule(scene, moduleKey).forEach((ref) => {
    const resolution = group
      ? resolveModuleEntityReferenceCatalogItem(ref, group.catalogIndex)
      : undefined;

    if (resolution && resolution.status !== "missing") return;

    items.push({
      value: ref.entityId,
      label: ref.label || "Missing configuration",
      description: `${ref.entityId} · Missing`,
      disabled: true,
    });
  });

  return items;
}

function componentRecoveryItems(
  scene: SceneEntity,
  moduleKey: string,
): RecoveryItem[] {
  const group = componentGroups.value.find((item) => item.module.key === moduleKey);
  if (!group) return [];

  return refsForModule(scene, moduleKey).flatMap((ref) => {
    const resolution = resolveModuleEntityReferenceCatalogItem(
      ref,
      group.catalogIndex,
    );

    if (resolution.status === "resolved") return [];

    return [
      {
        identity: moduleEntityRefIdentity(ref),
        label:
          resolution.status === "unavailable"
            ? resolution.item.presentation.label
            : ref.label ||
              translate(
                "modules.scene.warnings.missingConfigurationLabel",
                "Missing configuration",
              ),
        status: resolution.status,
        description:
          resolution.status === "unavailable"
            ? translate(
                "modules.scene.warnings.disabledConfiguration",
                "This configuration is disabled.",
              )
            : `${ref.entityId} · ${translate("modules.scene.warnings.missing", "Missing")}`,
      },
    ];
  });
}

function orphanComponentRecoveryItems(scene: SceneEntity): RecoveryItem[] {
  const activeModuleKeys = new Set(
    componentGroups.value.map((group) => group.module.key),
  );

  return scene.components
    .filter((ref) => !activeModuleKeys.has(ref.moduleKey))
    .map((ref) => ({
      identity: moduleEntityRefIdentity(ref),
      label:
        ref.label ||
        translate(
          "modules.scene.warnings.missingConfigurationLabel",
          `${humanize(ref.moduleKey)} configuration`,
        ),
      status: "missing" as const,
      description: `${ref.moduleKey} · ${ref.entityId}`,
    }));
}

function removeComponentReference(index: number, item: RecoveryItem) {
  const scene = scenes.value[index];
  if (!scene) return;

  updateScene(index, {
    components: scene.components.filter(
      (ref) => moduleEntityRefIdentity(ref) !== item.identity,
    ),
  });
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
  const existing = refsForModule(scene, moduleKey).find((ref) => ref.entityId === entityId);
  const reference = existing || { moduleKey, entityId };
  const resolution = group
    ? resolveModuleEntityReferenceCatalogItem(reference, group.catalogIndex)
    : undefined;

  updateScene(index, {
    components: [
      ...otherRefs,
      resolution && resolution.status !== "missing"
        ? { ...resolution.item.reference }
        : reference,
    ],
  });
}

function selectMultipleComponents(
  index: number,
  moduleKey: string,
  selected: ElDropdownValue[],
) {
  const group = componentGroups.value.find((item) => item.module.key === moduleKey);

  if (group?.selection === "single") {
    selectSingleComponent(index, moduleKey, selected[0] ?? "");
    return;
  }

  const scene = scenes.value[index];
  if (!scene) return;

  const current = new Map(refsForModule(scene, moduleKey).map((ref) => [ref.entityId, ref]));
  const otherRefs = scene.components.filter((ref) => ref.moduleKey !== moduleKey);

  const nextRefs = selected.flatMap((value) => {
    const entityId = String(value ?? "");
    const existing = current.get(entityId);
    const reference = existing || { moduleKey, entityId };
    const resolution = group
      ? resolveModuleEntityReferenceCatalogItem(reference, group.catalogIndex)
      : undefined;

    if (resolution && resolution.status !== "missing") {
      return [{ ...resolution.item.reference }];
    }

    return existing ? [existing] : [];
  });

  updateScene(index, { components: [...otherRefs, ...nextRefs] });
}

function sceneIssues(scene: SceneEntity) {
  return compileResult.value.issues.filter((issue) => issue.sceneId === scene.id);
}

function issueText(issue: SceneCompileIssue) {
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
</script>

<template>
  <el-grid :gap="12" class="w100">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-text marker="blue10" color="blue" :size="10" :weight="600">
        {{ scenes.length }} {{ scenes.length === 1 ? 'Scene' : 'Scenes' }}
      </el-text>

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
        {{ translate("modules.scene.empty", "No Scenes yet. Add a Scene to compose nested descriptions with named module configurations.") }}
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
              {{ getSceneVariableToken(scene) }} · {{ scene.components.length }} components
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
              :rows="3"
              :placeholder="translate('modules.scene.editor.descriptionPlaceholder', 'Describe this Scene using nested variables, actions, expressions, and local context.')"
              :editor-id="sceneEditorId(scene, 'description')"
              support-variables
              @update:model-value="updateScene(sceneIndex, { description: String($event || '') })"
            />
          </el-flex>

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

                <ReferenceRecoveryList
                  :items="componentRecoveryItems(scene, group.module.key)"
                  :help="
                    translate(
                      'modules.scene.warnings.recoveryHelp',
                      'Saved component references that are missing or disabled stay explicit. Remove them or select replacements manually.',
                    )
                  "
                  :remove-label="translate('components.assignmentScope.remove', 'Remove')"
                  @remove="removeComponentReference(sceneIndex, $event)"
                />
              </el-grid>
            </el-grid>

            <el-text v-else :size="10" color="orange" icon="warning" icon-color="orange">
              Add at least one scene-exposable module with a named configuration, such as Form or Camera.
            </el-text>

            <ReferenceRecoveryList
              :items="orphanComponentRecoveryItems(scene)"
              :help="
                translate(
                  'modules.scene.warnings.orphanRecoveryHelp',
                  'Some saved component references point to modules that are no longer available. They are preserved until you remove them explicitly.',
                )
              "
              :remove-label="translate('components.assignmentScope.remove', 'Remove')"
              @remove="removeComponentReference(sceneIndex, $event)"
            />
          </el-grid>

          <el-flex rules="ccs" :gap="5" class="w100">
            <el-text :size="10" color="normal50">Extra Details</el-text>
            <el-text-field
              :model-value="scene.extraDetails || ''"
              type="textarea"
              :rows="3"
              :placeholder="translate('modules.scene.editor.extraDetailsPlaceholder', 'Add optional scene-specific instructions, constraints, or context.')"
              :editor-id="sceneEditorId(scene, 'extraDetails')"
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
  </el-grid>
</template>