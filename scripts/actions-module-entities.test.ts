import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerModuleEntityActions } from "../app/actions/moduleEntities.ts";
import {
  createPromptModuleEntity,
  deletePromptModuleEntity,
  duplicatePromptModuleEntity,
  setPromptModuleEntityEnabled,
  setPromptModuleEntityInheritance,
  updatePromptModuleEntity,
} from "../app/domain/moduleEntities.ts";
import {
  getModuleEntities,
  setModuleEntities,
  withModuleEntityConfig,
  type ModuleEntity,
  type ModuleEntityPayload,
} from "../app/modules/entityContracts.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { PromptKeyModule } from "../app/modules/types.ts";

const baseModule: PromptKeyModule = {
  key: "style",
  fields: {
    mood: { id: "mood", type: "select", default: "clean", options: [{ value: "clean" }, { value: "bold" }] },
  },
};

const module = withModuleEntityConfig(baseModule, {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
  allowGlobalInheritanceToggle: true,
});

const noInheritanceModule = withModuleEntityConfig(
  { ...baseModule, key: "camera" },
  {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
);

const unsupportedModule: PromptKeyModule = {
  key: "plain",
  fields: {},
};

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["style"],
    moduleValues: { style: { mood: "clean" } },
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

function withEntities(
  draft: PromptDraftState,
  entities: ModuleEntity<ModuleEntityPayload>[],
): PromptDraftState {
  return {
    ...draft,
    moduleValues: {
      ...draft.moduleValues,
      style: setModuleEntities(draft.moduleValues.style || {}, entities),
    },
  };
}

const sourceEntity: ModuleEntity<ModuleEntityPayload> = {
  id: "style-entity-1",
  key: "heroStyle",
  name: "Hero Style",
  enabled: true,
  inheritGlobal: true,
  payload: { mood: "bold" },
};

test("module entity create uses deterministic stable ID and unique semantic key", () => {
  const draft = withEntities(createDraft(), [sourceEntity]);
  const result = createPromptModuleEntity(
    draft,
    module,
    { name: "Second Style", key: "Hero Style" },
    () => "style-entity-2",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.entity?.id, "style-entity-2");
  assert.equal(result.value.entity?.key, "heroStyle2");
  assert.equal(result.value.entity?.name, "Second Style");
  assert.equal(result.value.entity?.enabled, true);
  assert.equal(result.value.entity?.inheritGlobal, true);
  assert.deepEqual(result.value.entity?.payload, {});
  assert.equal(getModuleEntities(draft.moduleValues.style).length, 1);
});

test("module entity metadata update preserves stable ID and normalizes key collisions", () => {
  const second = { ...sourceEntity, id: "style-entity-2", key: "otherStyle", name: "Other" };
  const draft = withEntities(createDraft(), [sourceEntity, second]);
  const result = updatePromptModuleEntity(draft, module, {
    entityId: "style-entity-2",
    name: "Renamed",
    key: "Hero Style",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.entity?.id, "style-entity-2");
  assert.equal(result.value.entity?.name, "Renamed");
  assert.equal(result.value.entity?.key, "heroStyle2");
});

test("module entity duplicate is adjacent, deep-cloned, and receives new identity", () => {
  const draft = withEntities(createDraft(), [sourceEntity]);
  const result = duplicatePromptModuleEntity(
    draft,
    module,
    sourceEntity.id,
    () => "style-entity-copy",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.entities.map((entity) => entity.id), [
    "style-entity-1",
    "style-entity-copy",
  ]);
  assert.equal(result.value.entity?.key, "heroStyleCopy");
  assert.equal(result.value.entity?.name, "Hero Style Copy");
  assert.deepEqual(result.value.entity?.payload, { mood: "bold" });
  assert.notEqual(result.value.entity?.payload, sourceEntity.payload);
});

test("module entity delete leaves external stable references untouched", () => {
  const draft = withEntities(createDraft({
    moduleValues: {
      style: { mood: "clean" },
      scene: {
        entities: [
          {
            id: "scene-1",
            key: "scene1",
            name: "Scene 1",
            enabled: true,
            components: [
              { moduleKey: "style", entityId: sourceEntity.id, token: "old-token" },
            ],
          },
        ] as any,
      },
    },
  }), [sourceEntity]);

  const sceneBefore = JSON.parse(JSON.stringify(draft.moduleValues.scene));
  const result = deletePromptModuleEntity(draft, module, sourceEntity.id);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.entities.length, 0);
  assert.deepEqual(result.value.draft.moduleValues.scene, sceneBefore);
});

test("enabled and inheritance mutations target one exact stable entity", () => {
  const second = { ...sourceEntity, id: "style-entity-2", key: "otherStyle" };
  const draft = withEntities(createDraft(), [sourceEntity, second]);

  const disabled = setPromptModuleEntityEnabled(draft, module, second.id, false);
  assert.equal(disabled.ok, true);
  if (!disabled.ok) return;
  assert.equal(disabled.value.entities[0].enabled, true);
  assert.equal(disabled.value.entities[1].enabled, false);

  const independent = setPromptModuleEntityInheritance(
    disabled.value.draft,
    module,
    second.id,
    false,
  );
  assert.equal(independent.ok, true);
  if (!independent.ok) return;
  assert.equal(independent.value.entities[1].inheritGlobal, false);
});

test("inheritance rejects modules without the capability", () => {
  const draft = createDraft({
    selectedModuleKeys: ["camera"],
    moduleValues: {
      camera: setModuleEntities({}, [{ ...sourceEntity, id: "camera-entity-1" }]),
    },
  });
  const result = setPromptModuleEntityInheritance(
    draft,
    noInheritanceModule,
    "camera-entity-1",
    false,
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.issues[0]?.code, "module_entity_inheritance_unsupported");
});

test("lifecycle rejects inactive, unsupported, missing, and conflicting identities", () => {
  const inactive = createPromptModuleEntity(
    createDraft({ selectedModuleKeys: [] }),
    module,
    {},
    () => "new-id",
  );
  assert.equal(inactive.ok, false);
  if (!inactive.ok) assert.equal(inactive.issues[0]?.code, "module_not_active");

  const unsupported = createPromptModuleEntity(
    createDraft({ selectedModuleKeys: ["plain"], moduleValues: { plain: {} } }),
    unsupportedModule,
    {},
    () => "new-id",
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.issues[0]?.code, "module_entities_unsupported");

  const draft = withEntities(createDraft(), [sourceEntity]);
  const missing = deletePromptModuleEntity(draft, module, "missing-id");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "module_entity_not_found");

  const conflict = createPromptModuleEntity(draft, module, {}, () => sourceEntity.id);
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.issues[0]?.code, "module_entity_id_conflict");
});

test("registered module entity actions expose stable IDs and preserve caller state on failure", async () => {
  const registry = registerModuleEntityActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "moduleEntity.create",
      "moduleEntity.update",
      "moduleEntity.duplicate",
      "moduleEntity.delete",
      "moduleEntity.setEnabled",
      "moduleEntity.setInheritance",
    ],
  );

  const draft = withEntities(createDraft(), [sourceEntity]);
  const original = JSON.parse(JSON.stringify(draft));
  const created = await registry.execute(
    "moduleEntity.create",
    {
      draft,
      modules: [module],
      idFactory: { moduleEntity: () => "style-entity-action" },
    },
    { moduleKey: "style", name: "Action Entity" },
  );
  assert.equal(created.ok, true);
  if (created.ok) assert.equal(created.data?.entity?.id, "style-entity-action");
  assert.deepEqual(draft, original);

  const failed = await registry.execute(
    "moduleEntity.delete",
    { draft, modules: [module] },
    { moduleKey: "style", entityId: "missing-id" },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, original);
  assert.deepEqual(draft, original);
});
