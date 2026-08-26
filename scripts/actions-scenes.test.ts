import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerSceneActions } from "../app/actions/scenes.ts";
import {
  attachPromptSceneComponent,
  createPromptScene,
  deletePromptScene,
  detachPromptSceneComponent,
  duplicatePromptScene,
  replacePromptSceneComponent,
  setPromptSceneEnabled,
  updatePromptScene,
} from "../app/domain/scenes.ts";
import {
  withModuleEntityConfig,
  type ModuleEntity,
  type ModuleEntityPayload,
} from "../app/modules/entityContracts.ts";
import { SceneModule } from "../app/modules/scene.module.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";

const CameraModule = withModuleEntityConfig(
  { key: "camera", fields: {} },
  {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
);

const FormModule = withModuleEntityConfig(
  { key: "form", fields: {} },
  {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "multiple",
    targetPolicy: ["subject", "object"],
  },
);

const modules: PromptKeyModule[] = [SceneModule, CameraModule, FormModule];

function entity(
  id: string,
  key: string,
  name: string,
  enabled = true,
): ModuleEntity<ModuleEntityPayload> {
  return {
    id,
    key,
    name,
    enabled,
    inheritGlobal: true,
    payload: {},
  };
}

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["scene", "layout", "camera", "form"],
    moduleValues: {
      scene: { scenes: [] },
      camera: {
        entities: [
          entity("camera-a", "cameraA", "Camera A"),
          entity("camera-b", "cameraB", "Camera B"),
          entity("camera-disabled", "cameraDisabled", "Camera Disabled", false),
        ] as any,
      },
      form: {
        entities: [
          entity("form-a", "formA", "Form A"),
          entity("form-b", "formB", "Form B"),
        ] as any,
      },
      layout: {
        regions: {
          grid: { columns: 12, rows: 12 },
          regions: [],
        } as any,
      },
    },
    modulePanelStates: {},
    promptSettings: {
      mode: "image_to_image",
      idea: "",
      subject: "",
      subjectType: "unspecified",
      aspectRatio: "1:1",
      globalRules: "",
      imageToImage: {
        referenceUsage: "balanced",
        transformationStrength: "balanced",
        preserveMainSubject: true,
        preserveIdentity: true,
        preservePose: false,
        preserveOutfit: false,
        preserveComposition: true,
        preserveColors: false,
        preserveMaterials: false,
        preserveLighting: false,
      },
    },
    outputFormat: "modular",
    ...overrides,
  };
}

function createSceneDraft() {
  const created = createPromptScene(
    createDraft(),
    SceneModule,
    { name: "Hero Scene", key: "hero scene", description: "Primary scene" },
    () => "scene-a",
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create Scene fixture");
  return created.value.draft;
}

test("scene create and update preserve stable identity and canonical unique keys", () => {
  const original = createDraft();
  const first = createPromptScene(
    original,
    SceneModule,
    { name: "Hero", key: "hero scene" },
    () => "scene-a",
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.value.scene?.id, "scene-a");
  assert.equal(first.value.scene?.key, "heroScene");
  assert.deepEqual(original.moduleValues.scene?.scenes, []);

  const second = createPromptScene(
    first.value.draft,
    SceneModule,
    { name: "Hero 2", key: "hero scene" },
    () => "scene-b",
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.value.scene?.key, "heroScene2");

  const updated = updatePromptScene(
    second.value.draft,
    SceneModule,
    {
      sceneId: "scene-a",
      name: "Updated Hero",
      key: "hero scene",
      description: "Updated description",
    },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.scene?.id, "scene-a");
  assert.equal(updated.value.scene?.key, "heroScene");
  assert.equal(updated.value.scene?.description, "Updated description");
});

test("scene duplicate is adjacent with copied refs and delete leaves Layout stable refs untouched", () => {
  let draft = createSceneDraft();
  const attached = attachPromptSceneComponent(
    draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "camera", entityId: "camera-a" },
  );
  assert.equal(attached.ok, true);
  if (!attached.ok) return;
  draft = attached.value.draft;

  draft.moduleValues.layout = {
    regions: {
      grid: { columns: 12, rows: 12 },
      regions: [
        {
          id: "region-a",
          name: "Hero",
          role: "hero_image",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          contentKey: "{scene_hero_scene}",
          contentRef: { kind: "scene", entityId: "scene-a" },
        },
      ],
    } as any,
  };

  const duplicated = duplicatePromptScene(
    draft,
    SceneModule,
    "scene-a",
    () => "scene-b",
  );
  assert.equal(duplicated.ok, true);
  if (!duplicated.ok) return;
  assert.deepEqual(
    duplicated.value.scenes.map((scene) => scene.id),
    ["scene-a", "scene-b"],
  );
  assert.deepEqual(
    duplicated.value.scene?.components,
    attached.value.scene?.components,
  );

  const deleted = deletePromptScene(
    duplicated.value.draft,
    SceneModule,
    "scene-a",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  const layout = deleted.value.draft.moduleValues.layout?.regions as any;
  assert.equal(layout.regions[0].contentRef.entityId, "scene-a");
});

test("scene enabled mutation targets one exact stable Scene", () => {
  const draft = createSceneDraft();
  const result = setPromptSceneEnabled(draft, SceneModule, "scene-a", false);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.scene?.id, "scene-a");
  assert.equal(result.value.scene?.enabled, false);
});

test("multiple-selection modules attach exact available entities without retargeting", () => {
  const draft = createSceneDraft();
  const first = attachPromptSceneComponent(
    draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "form", entityId: "form-a" },
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = attachPromptSceneComponent(
    first.value.draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "form", entityId: "form-b" },
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.deepEqual(
    second.value.scene?.components.map((ref) => `${ref.moduleKey}:${ref.entityId}`),
    ["form:form-a", "form:form-b"],
  );

  const missing = attachPromptSceneComponent(
    second.value.draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "form", entityId: "form-missing" },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "scene_component_entity_not_found");
  }
});

test("single-selection modules require explicit replace and reject unavailable entities", () => {
  const draft = createSceneDraft();
  const first = attachPromptSceneComponent(
    draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "camera", entityId: "camera-a" },
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const implicitReplace = attachPromptSceneComponent(
    first.value.draft,
    SceneModule,
    modules,
    { sceneId: "scene-a", moduleKey: "camera", entityId: "camera-b" },
  );
  assert.equal(implicitReplace.ok, false);
  if (!implicitReplace.ok) {
    assert.equal(implicitReplace.issues[0]?.code, "scene_component_cardinality");
  }

  const unavailable = replacePromptSceneComponent(
    first.value.draft,
    SceneModule,
    modules,
    {
      sceneId: "scene-a",
      moduleKey: "camera",
      entityId: "camera-a",
      replacementEntityId: "camera-disabled",
    },
  );
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) {
    assert.equal(unavailable.issues[0]?.code, "scene_component_unavailable");
  }

  const replaced = replacePromptSceneComponent(
    first.value.draft,
    SceneModule,
    modules,
    {
      sceneId: "scene-a",
      moduleKey: "camera",
      entityId: "camera-a",
      replacementEntityId: "camera-b",
    },
  );
  assert.equal(replaced.ok, true);
  if (!replaced.ok) return;
  assert.equal(replaced.value.scene?.components[0]?.entityId, "camera-b");
});

test("explicit replacement can repair a missing entity ref without fuzzy lookup", () => {
  const draft = createSceneDraft();
  (draft.moduleValues.scene?.scenes as any[])[0].components = [
    { moduleKey: "camera", entityId: "camera-missing", label: "Old Camera" },
  ];

  const repaired = replacePromptSceneComponent(
    draft,
    SceneModule,
    modules,
    {
      sceneId: "scene-a",
      moduleKey: "camera",
      entityId: "camera-missing",
      replacementEntityId: "camera-a",
    },
  );
  assert.equal(repaired.ok, true);
  if (!repaired.ok) return;
  assert.equal(repaired.value.scene?.components.length, 1);
  assert.equal(repaired.value.scene?.components[0]?.entityId, "camera-a");
});

test("detach removes an exact orphan or missing ref without requiring target availability", () => {
  const draft = createSceneDraft();
  (draft.moduleValues.scene?.scenes as any[])[0].components = [
    { moduleKey: "legacyModule", entityId: "legacy-entity" },
    { moduleKey: "camera", entityId: "camera-missing" },
  ];

  const orphan = detachPromptSceneComponent(
    draft,
    SceneModule,
    {
      sceneId: "scene-a",
      moduleKey: "legacyModule",
      entityId: "legacy-entity",
    },
  );
  assert.equal(orphan.ok, true);
  if (!orphan.ok) return;
  assert.deepEqual(
    orphan.value.scene?.components.map((ref) => `${ref.moduleKey}:${ref.entityId}`),
    ["camera:camera-missing"],
  );

  const missing = detachPromptSceneComponent(
    orphan.value.draft,
    SceneModule,
    {
      sceneId: "scene-a",
      moduleKey: "camera",
      entityId: "camera-missing",
    },
  );
  assert.equal(missing.ok, true);
  if (!missing.ok) return;
  assert.equal(missing.value.scene?.components.length, 0);
});

test("registered Scene actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerSceneActions(new ActionRegistry());
  const ids = registry.list().map((action) => action.id);
  assert.deepEqual(ids, [
    "scene.create",
    "scene.update",
    "scene.duplicate",
    "scene.delete",
    "scene.setEnabled",
    "scene.component.attach",
    "scene.component.detach",
    "scene.component.replace",
  ]);

  const original = createDraft();
  const created = await registry.execute(
    "scene.create",
    {
      draft: original,
      modules,
      idFactory: { scene: () => "scene-action" },
    },
    { name: "Action Scene", key: "action scene" },
  );
  assert.equal(created.ok, true);
  assert.deepEqual(original.moduleValues.scene?.scenes, []);
  if (!created.ok) return;
  assert.equal((created.data as any)?.scene?.id, "scene-action");

  const failed = await registry.execute(
    "scene.component.attach",
    {
      draft: created.draft,
      modules,
    },
    {
      sceneId: "scene-action",
      moduleKey: "camera",
      entityId: "camera-missing",
    },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, created.draft);
});
