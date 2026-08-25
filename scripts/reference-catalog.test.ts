import assert from "node:assert/strict";
import test from "node:test";
import {
  createModuleEntityReferenceCatalogIndex,
  resolveModuleEntityReferenceCatalogItem,
} from "../app/utils/moduleEntityReferenceCatalog.ts";
import {
  createReferenceCatalogIndex,
  queryReferenceCatalog,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "../app/utils/referenceCatalog.ts";
import {
  createSceneReferenceCatalogIndex,
  createSceneReferenceCatalogItems,
  findLegacySceneReferenceByToken,
  resolveSceneReferenceCatalogItem,
} from "../app/utils/sceneReferenceCatalog.ts";
import {
  createSemanticReferenceCatalogIndex,
  resolveSemanticReferenceCatalogItem,
} from "../app/utils/semanticReferenceCatalog.ts";

type Ref = {
  id: string;
  token: string;
  name: string;
};

type Capability = "form-target" | "scene-target";

type Item = ReferenceCatalogItem<Ref, Capability>;

const identityFor = (reference: Ref) => `entity:${reference.id}`;

function item(
  id: string,
  token: string,
  name: string,
  overrides: Partial<Item> = {},
): Item {
  return {
    identity: `entity:${id}`,
    reference: { id, token, name },
    presentation: { label: name, token, name },
    capabilities: ["form-target", "scene-target"],
    ...overrides,
  };
}

test("resolves by canonical identity across rename/token changes", () => {
  const current = item("abc", "{form_new}", "New Name");
  const persisted: Ref = {
    id: "abc",
    token: "{form_old}",
    name: "Old Name",
  };

  const resolution = resolveReferenceCatalogItem(
    persisted,
    createReferenceCatalogIndex([current]),
    identityFor,
  );

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.identity, "entity:abc");
  if (resolution.status === "resolved") {
    assert.equal(resolution.item.reference.token, "{form_new}");
    assert.equal(resolution.item.reference.name, "New Name");
  }
});

test("never retargets by token or name representation", () => {
  const current = item("different-id", "{same_token}", "Same Name");
  const persisted: Ref = {
    id: "missing-id",
    token: "{same_token}",
    name: "Same Name",
  };

  const resolution = resolveReferenceCatalogItem(
    persisted,
    createReferenceCatalogIndex([current]),
    identityFor,
  );

  assert.equal(resolution.status, "missing");
  assert.equal(resolution.identity, "entity:missing-id");
  assert.equal(resolution.reference, persisted);
});

test("keeps missing references explicit", () => {
  const persisted: Ref = {
    id: "deleted",
    token: "{old_token}",
    name: "Deleted Entity",
  };

  const resolution = resolveReferenceCatalogItem(
    persisted,
    createReferenceCatalogIndex<Ref, Item>([]),
    identityFor,
  );

  assert.deepEqual(resolution, {
    status: "missing",
    identity: "entity:deleted",
    reference: persisted,
  });
});

test("distinguishes unavailable entries from missing entries", () => {
  const disabled = item("disabled", "{disabled}", "Disabled", {
    state: { enabled: false, disabledReason: "disabled by owner" },
  });
  const persisted = disabled.reference;

  const resolution = resolveReferenceCatalogItem(
    persisted,
    createReferenceCatalogIndex([disabled]),
    identityFor,
  );

  assert.equal(resolution.status, "unavailable");
  if (resolution.status === "unavailable") {
    assert.equal(resolution.item.state?.disabledReason, "disabled by owner");
  }
});

test("eligibility and capabilities filter presentation without changing identity", () => {
  const first = item("first", "{first}", "First");
  const second = item("second", "{second}", "Second", {
    capabilities: ["scene-target"],
  });
  const disabled = item("disabled", "{disabled}", "Disabled", {
    state: { available: false },
  });

  const result = queryReferenceCatalog([first, second, disabled], {
    capabilities: ["form-target"],
    eligible: (candidate) => candidate.identity !== "entity:blocked",
  });

  assert.deepEqual(
    result.map((candidate) => candidate.identity),
    ["entity:first"],
  );
});

test("duplicate canonical identities fail instead of silently choosing a target", () => {
  assert.throws(
    () =>
      createReferenceCatalogIndex([
        item("same", "{one}", "One"),
        item("same", "{two}", "Two"),
      ]),
    /Duplicate reference catalog identity: entity:same/,
  );
});

test("semantic adapter resolves module entities by stable entity id after rename", () => {
  const current = {
    value: "form:form-1",
    label: "{form_newName}",
    group: "module_entities",
    target: {
      kind: "module_output" as const,
      value: "{form_newName}",
      moduleKey: "form",
      entityId: "form-1",
      token: "{form_newName}",
      label: "New Name",
    },
  };

  const persisted = {
    kind: "module_output" as const,
    value: "{form_oldName}",
    moduleKey: "form",
    entityId: "form-1",
    token: "{form_oldName}",
    label: "Old Name",
  };

  const resolution = resolveSemanticReferenceCatalogItem(
    persisted,
    createSemanticReferenceCatalogIndex([current]),
  );

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.identity, "module_entity:form:form-1");
  if (resolution.status === "resolved") {
    assert.equal(resolution.item.reference.token, "{form_newName}");
    assert.equal(resolution.item.presentation.label, "{form_newName}");
  }
});

test("semantic adapter keeps disabled targets unavailable without retargeting", () => {
  const current = {
    value: "user:user-1",
    label: "{subject1}",
    disabled: true,
    target: {
      kind: "user_variable" as const,
      value: "{subject1}",
      variableId: "user-1",
      token: "{subject1}",
      label: "Subject 1",
    },
  };

  const persisted = {
    ...current.target,
    token: "{oldSubject1}",
    value: "{oldSubject1}",
  };

  const resolution = resolveSemanticReferenceCatalogItem(
    persisted,
    createSemanticReferenceCatalogIndex([current]),
  );

  assert.equal(resolution.status, "unavailable");
  assert.equal(resolution.identity, "user:user-1");
  assert.equal(resolution.reference, persisted);
});

test("module entity adapter resolves stable refs after entity rename", () => {
  const current = {
    id: "camera-1",
    key: "newTelephoto",
    name: "New Telephoto",
    enabled: true,
    payload: {},
  };
  const persisted = {
    moduleKey: "camera",
    entityId: "camera-1",
    token: "{camera_oldTelephoto}",
    label: "Old Telephoto",
  };

  const resolution = resolveModuleEntityReferenceCatalogItem(
    persisted,
    createModuleEntityReferenceCatalogIndex("camera", [current], (entity) => ({
      token: `{camera_${entity.key}}`,
    })),
  );

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.identity, "module_entity:camera:camera-1");
  if (resolution.status === "resolved") {
    assert.equal(resolution.item.reference.label, "New Telephoto");
    assert.equal(resolution.item.reference.token, "{camera_newTelephoto}");
  }
});

test("module entity adapter reports disabled refs as unavailable", () => {
  const current = {
    id: "style-1",
    key: "poster",
    name: "Poster",
    enabled: false,
    payload: {},
  };
  const persisted = {
    moduleKey: "style",
    entityId: "style-1",
    label: "Old Poster",
  };

  const resolution = resolveModuleEntityReferenceCatalogItem(
    persisted,
    createModuleEntityReferenceCatalogIndex("style", [current]),
  );

  assert.equal(resolution.status, "unavailable");
  assert.equal(resolution.identity, "module_entity:style:style-1");
});

test("module entity adapter never crosses module scopes for the same entity id", () => {
  const current = {
    id: "shared-id",
    key: "same",
    name: "Same",
    enabled: true,
    payload: {},
  };
  const persisted = {
    moduleKey: "form",
    entityId: "shared-id",
    label: "Form Same",
  };

  const resolution = resolveModuleEntityReferenceCatalogItem(
    persisted,
    createModuleEntityReferenceCatalogIndex("camera", [current]),
  );

  assert.equal(resolution.status, "missing");
  assert.equal(resolution.identity, "module_entity:form:shared-id");
});

test("scene adapter resolves stable Layout refs after Scene rename", () => {
  const current = {
    id: "scene-variable-1",
    key: "scene_newKey",
    value: "New scene body",
    label: "New Scene",
    enabled: true,
    source: "module" as const,
    moduleKey: "scene",
    entityType: "scene" as const,
    entityId: "scene-1",
  };
  const persisted = {
    kind: "scene" as const,
    entityId: "scene-1",
    token: "{scene_oldKey}",
    label: "Old Scene",
  };

  const resolution = resolveSceneReferenceCatalogItem(
    persisted,
    createSceneReferenceCatalogIndex([current]),
  );

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.identity, "scene:scene-1");
  if (resolution.status === "resolved") {
    assert.equal(resolution.item.reference.token, "{scene_newKey}");
    assert.equal(resolution.item.reference.label, "New Scene");
  }
});

test("scene adapter reports disabled Scene refs as unavailable", () => {
  const current = {
    id: "scene-variable-disabled",
    key: "scene_disabled",
    value: "Disabled scene body",
    label: "Disabled Scene",
    enabled: false,
    source: "module" as const,
    moduleKey: "scene",
    entityType: "scene" as const,
    entityId: "scene-disabled",
  };
  const persisted = {
    kind: "scene" as const,
    entityId: "scene-disabled",
    token: "{scene_oldDisabled}",
    label: "Old Disabled Scene",
  };

  const resolution = resolveSceneReferenceCatalogItem(
    persisted,
    createSceneReferenceCatalogIndex([current]),
  );

  assert.equal(resolution.status, "unavailable");
  if (resolution.status === "unavailable") {
    assert.equal(resolution.item.reference.token, "{scene_disabled}");
  }
});

test("scene stable refs never retarget by matching legacy token", () => {
  const current = {
    id: "scene-variable-other",
    key: "scene_sharedToken",
    value: "Other scene body",
    label: "Other Scene",
    enabled: true,
    source: "module" as const,
    moduleKey: "scene",
    entityType: "scene" as const,
    entityId: "scene-other",
  };
  const persisted = {
    kind: "scene" as const,
    entityId: "scene-missing",
    token: "{scene_sharedToken}",
    label: "Missing Scene",
  };

  const resolution = resolveSceneReferenceCatalogItem(
    persisted,
    createSceneReferenceCatalogIndex([current]),
  );

  assert.equal(resolution.status, "missing");
  assert.equal(resolution.identity, "scene:scene-missing");
});

test("legacy Scene token lookup is explicit and only upgrades refs that do not exist yet", () => {
  const current = {
    id: "scene-variable-legacy",
    key: "scene_legacy",
    value: "Legacy scene body",
    label: "Legacy Scene",
    enabled: true,
    source: "module" as const,
    moduleKey: "scene",
    entityType: "scene" as const,
    entityId: "scene-legacy",
  };

  const item = findLegacySceneReferenceByToken(
    "{scene_legacy}",
    createSceneReferenceCatalogItems([current]),
  );

  assert.ok(item);
  assert.equal(item.reference.entityId, "scene-legacy");
  assert.equal(item.reference.token, "{scene_legacy}");
});
