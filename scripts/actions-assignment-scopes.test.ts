import assert from "node:assert/strict";
import test from "node:test";
import {
  setSemanticAssignmentScope,
  type SemanticAssignmentScopePolicy,
} from "../app/domain/assignmentScopes.ts";
import type { SemanticTargetRef } from "../app/modules/types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function colorPolicy(
  sources: readonly SemanticReferenceCatalogSource[] = [],
): SemanticAssignmentScopePolicy {
  return {
    capability: "color",
    builtinValues: ["overall", "background", "subject", "outfit", "hair", "typography", "accents"],
    exclusiveValue: "overall",
    sources,
  };
}

function materialPolicy(
  sources: readonly SemanticReferenceCatalogSource[] = [],
): SemanticAssignmentScopePolicy {
  return {
    capability: "material",
    builtinValues: ["all_surfaces", "background", "subject", "outfit", "hair", "typography", "accents"],
    exclusiveValue: "all_surfaces",
    sources,
  };
}

function dynamicSource(
  target: SemanticTargetRef,
  options: { disabled?: boolean; label?: string } = {},
): SemanticReferenceCatalogSource {
  return {
    label: options.label || target.label || target.token || target.value,
    disabled: options.disabled,
    target,
  };
}

test("exclusive builtin target collapses the authored target scope", () => {
  const result = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    {
      targets: [
        { kind: "builtin", value: "subject" },
        { kind: "custom", value: "shoe laces" },
        { kind: "builtin", value: "overall" },
      ],
    },
    colorPolicy(),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.targets, [
    { kind: "builtin", value: "overall", variableId: undefined, entityId: undefined, moduleKey: undefined, token: undefined, label: undefined, parentLabel: undefined },
  ]);
});

test("dynamic source upgrades one builtin slot to its canonical live reference", () => {
  const liveOutfit: SemanticTargetRef = {
    kind: "module_output",
    value: "outfit",
    moduleKey: "outfit",
    variableId: "module:outfit",
    token: "{outfit}",
    label: "Outfit",
  };

  const result = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    { targets: [{ kind: "builtin", value: "outfit" }] },
    colorPolicy([dynamicSource(liveOutfit)]),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.targets, [liveOutfit]);
});

test("new missing semantic refs are rejected instead of fuzzy-retargeted", () => {
  const missing: SemanticTargetRef = {
    kind: "user_variable",
    value: "{product}",
    variableId: "variable-missing",
    token: "{product}",
  };

  const result = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    { targets: [missing] },
    colorPolicy(),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "semantic_target_missing");
  }
});

test("persisted missing semantic refs survive unrelated scope changes", () => {
  const missing: SemanticTargetRef = {
    kind: "user_variable",
    value: "{product}",
    variableId: "variable-missing",
    token: "{product}",
    label: "Saved Product",
  };

  const result = setSemanticAssignmentScope(
    { targets: [missing], exceptions: [] },
    { exceptions: [{ kind: "custom", value: "logo" }] },
    colorPolicy(),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.targets, [missing]);
  assert.deepEqual(result.value.exceptions.map((target) => target.value), ["logo"]);
});

test("new unavailable refs reject while the exact persisted unavailable ref remains recoverable", () => {
  const unavailable: SemanticTargetRef = {
    kind: "module_output",
    value: "{hair_component_a}",
    moduleKey: "hair",
    entityId: "hair-component-a",
    token: "{hair_component_a}",
    label: "Hair Component A",
  };
  const policy = materialPolicy([
    dynamicSource(unavailable, { disabled: true }),
  ]);

  const authored = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    { targets: [unavailable] },
    policy,
  );
  assert.equal(authored.ok, false);
  if (!authored.ok) {
    assert.equal(authored.issues[0]?.code, "semantic_target_unavailable");
  }

  const persisted = setSemanticAssignmentScope(
    { targets: [unavailable], exceptions: [] },
    { exceptions: [{ kind: "custom", value: "eyes" }] },
    policy,
  );
  assert.equal(persisted.ok, true);
  if (!persisted.ok) return;
  assert.deepEqual(persisted.value.targets, [unavailable]);
});

test("target edits remove exact exception conflicts and exception edits remove exact target conflicts", () => {
  const subject: SemanticTargetRef = { kind: "builtin", value: "subject" };
  const background: SemanticTargetRef = { kind: "builtin", value: "background" };

  const targetsWin = setSemanticAssignmentScope(
    { targets: [background], exceptions: [subject] },
    { targets: [subject, background] },
    colorPolicy(),
  );
  assert.equal(targetsWin.ok, true);
  if (!targetsWin.ok) return;
  assert.deepEqual(targetsWin.value.exceptions, []);

  const exceptionsWin = setSemanticAssignmentScope(
    { targets: [subject, background], exceptions: [] },
    { exceptions: [subject] },
    colorPolicy(),
  );
  assert.equal(exceptionsWin.ok, true);
  if (!exceptionsWin.ok) return;
  assert.deepEqual(
    exceptionsWin.value.targets.map((target) => target.value),
    ["background"],
  );
});

test("exclusive builtin cannot be authored as an exception", () => {
  const result = setSemanticAssignmentScope(
    { targets: [{ kind: "builtin", value: "subject" }], exceptions: [] },
    { exceptions: [{ kind: "builtin", value: "overall" }] },
    colorPolicy(),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "semantic_scope_exclusive_exception");
  }
});

test("unsupported builtin and duplicate custom identities are handled canonically", () => {
  const unsupported = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    { targets: [{ kind: "builtin", value: "all_surfaces" }] },
    colorPolicy(),
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) {
    assert.equal(unsupported.issues[0]?.code, "semantic_target_builtin_unsupported");
  }

  const deduped = setSemanticAssignmentScope(
    { targets: [], exceptions: [] },
    {
      targets: [
        { kind: "custom", value: "Logo" },
        { kind: "custom", value: " logo " },
      ],
    },
    colorPolicy(),
  );
  assert.equal(deduped.ok, true);
  if (!deduped.ok) return;
  assert.equal(deduped.value.targets.length, 1);
});
