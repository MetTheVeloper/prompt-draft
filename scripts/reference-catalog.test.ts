import assert from "node:assert/strict";
import test from "node:test";
import {
  createReferenceCatalogIndex,
  queryReferenceCatalog,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "../app/utils/referenceCatalog.ts";

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
