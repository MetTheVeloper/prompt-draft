import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerHairActions } from "../app/actions/hairStyles.ts";
import {
  applyPromptHairStylePreset,
  createPromptHairComponent,
  createPromptHairStyle,
  deletePromptHairComponent,
  deletePromptHairStyle,
  duplicatePromptHairComponent,
  duplicatePromptHairStyle,
  setPromptHairComponentProperty,
  setPromptHairStyleProperty,
  setPromptHairStyleSource,
  updatePromptHairComponent,
  updatePromptHairStyle,
} from "../app/domain/hairStyles.ts";
import { HairModule } from "../app/modules/hair.semantic.ts";
import type {
  HairComponent,
  HairReferenceRef,
  HairStyle,
} from "../app/modules/hair.types.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { ModuleValues, SemanticTargetRef } from "../app/modules/types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDraft(values: ModuleValues): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["hair"],
    moduleValues: { hair: clone(values) },
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
  };
}

function subjectTarget(
  id = "subject-1",
  token = "{subject}",
  kind: SemanticTargetRef["kind"] = "system_variable",
): SemanticTargetRef {
  return {
    kind,
    value: token,
    variableId: id,
    token,
    label: "Subject",
  };
}

function subjectSource(
  id = "subject-1",
  token = "{subject}",
  disabled = false,
): SemanticReferenceCatalogSource {
  return {
    label: "Subject",
    disabled,
    target: subjectTarget(id, token),
  };
}

function reference(
  id = "ref-1",
  token = "{hairRef}",
  source: "user" | "system" = "user",
): HairReferenceRef {
  return { variableId: id, token, label: "Hair Ref", source };
}

function component(
  id: string,
  key = "bangs",
  overrides: Partial<HairComponent> = {},
): HairComponent {
  return {
    id,
    key,
    name: "Bangs / Fringe",
    type: "bangs",
    properties: {},
    additionalDetails: "",
    ...overrides,
  };
}

function style(
  id: string | undefined,
  key = "style1",
  overrides: Partial<HairStyle> = {},
): HairStyle {
  return {
    ...(id ? { id } : ({} as { id: string })),
    key,
    name: "Hairstyle 1",
    targets: [subjectTarget()],
    source: { mode: "defined" },
    properties: {},
    components: [],
    additionalDetails: "",
    ...overrides,
  } as HairStyle;
}

test("hair style create uses stable ID, unique key, first subject target, and preserves caller", () => {
  const original = createDraft({ hairStyles: [] });
  const result = createPromptHairStyle(original, HairModule, {
    createStyleId: () => "hair-style-new",
    subjectSources: [subjectSource()],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.style?.id, "hair-style-new");
  assert.equal(result.value.style?.key, "style1");
  assert.equal(result.value.style?.name, "Hairstyle 1");
  assert.deepEqual(result.value.style?.targets, [subjectTarget()]);
  assert.deepEqual(original.moduleValues.hair?.hairStyles, []);
});

test("hair style update keeps stable identity, canonicalizes key, and uses exact subject targets", () => {
  const original = createDraft({
    hairStyles: [style("hair-a", "mainStyle"), style("hair-b", "otherStyle")],
  });
  const result = updatePromptHairStyle(
    original,
    HairModule,
    "hair-a",
    {
      name: "Editorial Hair",
      key: "other style",
      targets: [subjectTarget("subject-live", "{liveSubject}")],
      additionalDetails: "controlled flyaways",
    },
    { subjectSources: [subjectSource("subject-live", "{liveSubject}")] },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.style?.id, "hair-a");
  assert.equal(result.value.style?.key, "otherStyle2");
  assert.equal(result.value.style?.additionalDetails, "controlled flyaways");
  assert.equal(result.value.style?.targets[0]?.variableId, "subject-live");

  const missing = updatePromptHairStyle(
    original,
    HairModule,
    "hair-a",
    { targets: [subjectTarget("missing", "{missing}")] },
    { subjectSources: [] },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "subject_assignment_target_missing");
});

test("hair style source resolves exact references, keeps builtin reference, and preserves exact orphan only", () => {
  const original = createDraft({ hairStyles: [style("hair-a")] });
  const liveReference = reference();
  const live = setPromptHairStyleSource(
    original,
    HairModule,
    "hair-a",
    { mode: "reference", reference: liveReference, hairHint: "copy the fringe" },
    { referenceSources: [{ reference: liveReference }] },
  );
  assert.equal(live.ok, true);
  if (!live.ok) return;
  assert.deepEqual(live.value.style?.source, {
    mode: "reference",
    reference: liveReference,
    hairHint: "copy the fringe",
  });

  const builtin = setPromptHairStyleSource(
    original,
    HairModule,
    "hair-a",
    { mode: "reference", reference: { token: "{reference}" } },
  );
  assert.equal(builtin.ok, true);
  if (builtin.ok && builtin.value.style?.source.mode === "reference") {
    assert.equal(builtin.value.style.source.reference.token, "{reference}");
    assert.equal(builtin.value.style.source.reference.source, "system");
  }

  const missing = setPromptHairStyleSource(
    original,
    HairModule,
    "hair-a",
    { mode: "reference", reference: reference("missing", "{missing}") },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "hair_reference_missing");

  const orphanDraft = createDraft({
    hairStyles: [style("hair-a", "style1", { source: { mode: "reference", reference: reference("orphan", "{orphan}") } })],
  });
  const orphan = setPromptHairStyleSource(
    orphanDraft,
    HairModule,
    "hair-a",
    { mode: "reference", reference: reference("orphan", "{orphan}") },
  );
  assert.equal(orphan.ok, true);
});

test("hair base property validates catalog state and detaches active style preset", () => {
  const original = createDraft({
    hairStyles: [style("hair-a", "style1", { presetId: "natural_waves" })],
  });
  const result = setPromptHairStyleProperty(
    original,
    HairModule,
    "hair-a",
    "length",
    { mode: "option", value: "shoulder_length" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.style?.properties.length?.mode, "option");
  assert.equal(result.value.style?.presetId, undefined);

  const invalid = setPromptHairStyleProperty(
    original,
    HairModule,
    "hair-a",
    "length",
    { mode: "option", value: "unknown_length" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.issues[0]?.code, "hair_property_invalid_option");

  const unsupported = setPromptHairStyleProperty(
    original,
    HairModule,
    "hair-a",
    "bangsStyle",
    { mode: "inherit" },
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.issues[0]?.code, "hair_style_property_unsupported");
});

test("hair preset replaces recipe payload with fresh component IDs while preserving targets and source", () => {
  const original = createDraft({
    hairStyles: [
      style("hair-a", "style1", {
        targets: [subjectTarget()],
        source: { mode: "reference", reference: { token: "{reference}", source: "system" } },
        additionalDetails: "keep this detail",
      }),
    ],
  });
  const ids = ["preset-component-1", "preset-component-2"];
  const result = applyPromptHairStylePreset(
    original,
    HairModule,
    "hair-a",
    "long_layers",
    { createComponentId: () => ids.shift() || "unexpected" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.style?.presetId, "long_layers");
  assert.equal(result.value.style?.name, "Long Layers");
  assert.equal(result.value.style?.key, "longLayers");
  assert.deepEqual(result.value.style?.targets, [subjectTarget()]);
  assert.equal(result.value.style?.source.mode, "reference");
  assert.equal(result.value.style?.components[0]?.id, "preset-component-1");
  assert.equal(result.value.style?.additionalDetails, "keep this detail");

  const cleared = applyPromptHairStylePreset(result.value.draft, HairModule, "hair-a", "");
  assert.equal(cleared.ok, true);
  if (cleared.ok) {
    assert.equal(cleared.value.style?.presetId, undefined);
    assert.equal(cleared.value.style?.components[0]?.id, "preset-component-1");
  }
});

test("hair style duplicate remaps nested IDs, clears preset, and delete targets exact stable ID", () => {
  const original = createDraft({
    hairStyles: [
      style("hair-a", "editorial", {
        name: "Editorial",
        presetId: "long_layers",
        components: [component("component-a")],
      }),
    ],
  });
  const duplicate = duplicatePromptHairStyle(original, HairModule, "hair-a", {
    createStyleId: () => "hair-b",
    createComponentId: () => "component-b",
  });
  assert.equal(duplicate.ok, true);
  if (!duplicate.ok) return;
  assert.equal(duplicate.value.style?.id, "hair-b");
  assert.equal(duplicate.value.style?.key, "editorialCopy");
  assert.equal(duplicate.value.style?.presetId, undefined);
  assert.equal(duplicate.value.style?.components[0]?.id, "component-b");

  const deleted = deletePromptHairStyle(duplicate.value.draft, HairModule, "hair-a");
  assert.equal(deleted.ok, true);
  if (deleted.ok) {
    assert.deepEqual(deleted.value.styles.map((item) => item.id), ["hair-b"]);
  }
});

test("hair component create supports catalog type, starter, and custom choices with stable IDs", () => {
  const original = createDraft({ hairStyles: [style("hair-a")] });
  const starter = createPromptHairComponent(
    original,
    HairModule,
    "hair-a",
    { kind: "starter", starterId: "curtain_bangs" },
    { createComponentId: () => "component-starter" },
  );
  assert.equal(starter.ok, true);
  if (!starter.ok) return;
  assert.equal(starter.value.component?.type, "bangs");
  assert.deepEqual(starter.value.component?.properties.bangsStyle, { mode: "option", value: "curtain" });

  const typed = createPromptHairComponent(
    starter.value.draft,
    HairModule,
    "hair-a",
    { kind: "type", type: "braid" },
    { createComponentId: () => "component-type" },
  );
  assert.equal(typed.ok, true);
  if (!typed.ok) return;
  assert.equal(typed.value.component?.type, "braid");

  const custom = createPromptHairComponent(
    typed.value.draft,
    HairModule,
    "hair-a",
    { kind: "custom" },
    { createComponentId: () => "component-custom" },
  );
  assert.equal(custom.ok, true);
  if (custom.ok) assert.equal(custom.value.component?.type, "custom");
});

test("hair component update preserves stable ID, uniquifies key, and type transition resets properties", () => {
  const original = createDraft({
    hairStyles: [style("hair-a", "style1", {
      presetId: "long_layers",
      components: [
        component("component-a", "bangs", { properties: { bangsStyle: { mode: "option", value: "curtain" } } }),
        component("component-b", "braid"),
      ],
    })],
  });
  const result = updatePromptHairComponent(
    original,
    HairModule,
    "hair-a",
    "component-a",
    { type: "braid", key: "braid", additionalDetails: "loose ends" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.component?.id, "component-a");
  assert.equal(result.value.component?.type, "braid");
  assert.equal(result.value.component?.name, "Braid");
  assert.equal(result.value.component?.key, "braid2");
  assert.deepEqual(result.value.component?.properties, {});
  assert.equal(result.value.style?.presetId, undefined);
});

test("hair component property enforces the owning type catalog and detaches preset", () => {
  const original = createDraft({
    hairStyles: [style("hair-a", "style1", {
      presetId: "long_layers",
      components: [component("component-a")],
    })],
  });
  const result = setPromptHairComponentProperty(
    original,
    HairModule,
    "hair-a",
    "component-a",
    "bangsStyle",
    { mode: "custom", value: "feathered micro fringe" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.component?.properties.bangsStyle, {
    mode: "custom",
    value: "feathered micro fringe",
  });
  assert.equal(result.value.style?.presetId, undefined);

  const wrongProperty = setPromptHairComponentProperty(
    original,
    HairModule,
    "hair-a",
    "component-a",
    "braidType",
    { mode: "inherit" },
  );
  assert.equal(wrongProperty.ok, false);
  if (!wrongProperty.ok) {
    assert.equal(wrongProperty.issues[0]?.code, "hair_component_property_unsupported");
  }
});

test("hair component duplicate/delete use exact nested identity and reject identity conflicts", () => {
  const original = createDraft({
    hairStyles: [style("hair-a", "style1", { components: [component("component-a")] })],
  });
  const duplicate = duplicatePromptHairComponent(
    original,
    HairModule,
    "hair-a",
    "component-a",
    { createComponentId: () => "component-b" },
  );
  assert.equal(duplicate.ok, true);
  if (!duplicate.ok) return;
  assert.equal(duplicate.value.component?.id, "component-b");
  assert.equal(duplicate.value.component?.key, "bangs2");

  const deleted = deletePromptHairComponent(
    duplicate.value.draft,
    HairModule,
    "hair-a",
    "component-a",
  );
  assert.equal(deleted.ok, true);
  if (deleted.ok) {
    assert.deepEqual(deleted.value.style?.components.map((item) => item.id), ["component-b"]);
  }

  const conflict = duplicatePromptHairComponent(
    original,
    HairModule,
    "hair-a",
    "component-a",
    { createComponentId: () => "component-a" },
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.issues[0]?.code, "hair_component_identity_conflict");
});

test("legacy Hair IDs normalize before exact style/component mutation", () => {
  const original = createDraft({
    hairStyles: [
      {
        key: "legacy",
        name: "Legacy",
        targets: [subjectTarget()],
        source: { mode: "defined" },
        properties: {},
        components: [
          {
            key: "bangs",
            name: "Bangs",
            type: "bangs",
            properties: {},
          },
        ],
      },
    ],
  });
  const styleUpdate = updatePromptHairStyle(
    original,
    HairModule,
    "hair-style-1",
    { name: "Legacy Updated" },
  );
  assert.equal(styleUpdate.ok, true);
  if (!styleUpdate.ok) return;
  assert.equal(styleUpdate.value.style?.id, "hair-style-1");

  const componentUpdate = updatePromptHairComponent(
    styleUpdate.value.draft,
    HairModule,
    "hair-style-1",
    "hair-component-1",
    { additionalDetails: "legacy detail" },
  );
  assert.equal(componentUpdate.ok, true);
  if (componentUpdate.ok) assert.equal(componentUpdate.value.component?.id, "hair-component-1");
});

test("registered Hair actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerHairActions(new ActionRegistry());
  const ids = registry.list().map((item) => item.id).sort();
  assert.deepEqual(ids, [
    "hair.component.create",
    "hair.component.delete",
    "hair.component.duplicate",
    "hair.component.setProperty",
    "hair.component.update",
    "hair.style.applyPreset",
    "hair.style.create",
    "hair.style.delete",
    "hair.style.duplicate",
    "hair.style.setProperty",
    "hair.style.setSource",
    "hair.style.update",
  ]);

  const original = createDraft({ hairStyles: [style("hair-a")] });
  const result = await registry.execute(
    "hair.style.update",
    {
      draft: original,
      modules: [HairModule],
      environment: { subjectAssignmentTargets: [] },
    },
    { styleId: "missing", name: "Nope" },
  );
  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  assert.deepEqual(original.moduleValues.hair?.hairStyles, [style("hair-a")]);
});
