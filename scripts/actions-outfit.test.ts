import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerOutfitActions } from "../app/actions/outfitSets.ts";
import {
  applyPromptOutfitSetPreset,
  createPromptOutfitItem,
  createPromptOutfitRelation,
  createPromptOutfitSet,
  deletePromptOutfitItem,
  deletePromptOutfitRelation,
  deletePromptOutfitSet,
  duplicatePromptOutfitItem,
  duplicatePromptOutfitSet,
  setPromptOutfitItemProperty,
  setPromptOutfitItemSource,
  updatePromptOutfitItem,
  updatePromptOutfitRelation,
  updatePromptOutfitSet,
} from "../app/domain/outfitSets.ts";
import { OutfitModule } from "../app/modules/outfit.semantic.ts";
import type {
  OutfitItem,
  OutfitItemRelation,
  OutfitSet,
  PromptReferenceRef,
} from "../app/modules/outfit.types.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { ModuleValues, SemanticTargetRef } from "../app/modules/types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDraft(values: ModuleValues): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["outfit"],
    moduleValues: { outfit: clone(values) },
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
  token = "{outfitRef}",
  source: "user" | "system" = "user",
): PromptReferenceRef {
  return { variableId: id, token, label: "Outfit Ref", source };
}

function item(
  id: string,
  key = "shirt",
  overrides: Partial<OutfitItem> = {},
): OutfitItem {
  return {
    id,
    key,
    name: "Shirt",
    type: "shirt",
    source: { mode: "defined" },
    properties: {},
    additionalDetails: "",
    ...overrides,
  };
}

function relation(
  id: string,
  sourceItemId: string,
  targetItemId: string,
  overrides: Partial<OutfitItemRelation> = {},
): OutfitItemRelation {
  return {
    id,
    type: "over",
    sourceItemId,
    targetItemId,
    details: "",
    ...overrides,
  };
}

function outfitSet(
  id: string | undefined,
  key = "set1",
  overrides: Partial<OutfitSet> = {},
): OutfitSet {
  return {
    ...(id ? { id } : ({} as { id: string })),
    key,
    name: "Outfit Set 1",
    targets: [subjectTarget()],
    items: [],
    relations: [],
    additionalDetails: "",
    ...overrides,
  } as OutfitSet;
}

function idSequence(...values: string[]) {
  let index = 0;
  return () => values[index++] || `generated-${index}`;
}

test("outfit set create uses stable ID, unique key, first subject target, and preserves caller", () => {
  const original = createDraft({ outfitSets: [] });
  const result = createPromptOutfitSet(original, OutfitModule, {
    createSetId: () => "outfit-set-new",
    subjectSources: [subjectSource()],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.set?.id, "outfit-set-new");
  assert.equal(result.value.set?.key, "set1");
  assert.equal(result.value.set?.name, "Outfit Set 1");
  assert.deepEqual(result.value.set?.targets, [subjectTarget()]);
  assert.deepEqual(original.moduleValues.outfit?.outfitSets, []);
});

test("outfit set update preserves preset for metadata/targets but details detach it", () => {
  const original = createDraft({
    outfitSets: [
      outfitSet("set-a", "mainSet", { presetId: "casual" }),
      outfitSet("set-b", "otherSet"),
    ],
  });
  const metadata = updatePromptOutfitSet(
    original,
    OutfitModule,
    "set-a",
    {
      name: "Editorial",
      key: "other set",
      targets: [subjectTarget("live", "{live}")],
    },
    { subjectSources: [subjectSource("live", "{live}")] },
  );
  assert.equal(metadata.ok, true);
  if (!metadata.ok) return;
  assert.equal(metadata.value.set?.id, "set-a");
  assert.equal(metadata.value.set?.key, "otherSet2");
  assert.equal(metadata.value.set?.presetId, "casual");
  assert.equal(metadata.value.set?.targets[0]?.variableId, "live");

  const details = updatePromptOutfitSet(
    metadata.value.draft,
    OutfitModule,
    "set-a",
    { additionalDetails: "keep the palette restrained" },
  );
  assert.equal(details.ok, true);
  if (!details.ok) return;
  assert.equal(details.value.set?.additionalDetails, "keep the palette restrained");
  assert.equal(details.value.set?.presetId, undefined);

  const missing = updatePromptOutfitSet(
    original,
    OutfitModule,
    "set-a",
    { targets: [subjectTarget("missing", "{missing}")] },
    { subjectSources: [] },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "subject_assignment_target_missing");
});

test("outfit set duplicate remaps nested IDs and known relation endpoints while preserving orphan endpoints", () => {
  const source = outfitSet("set-a", "layered", {
    presetId: "casual",
    items: [item("item-a", "shirt"), item("item-b", "coat", { type: "coat", name: "Coat" })],
    relations: [
      relation("rel-a", "item-b", "item-a"),
      relation("rel-orphan", "item-a", "missing-item"),
    ],
  });
  const original = createDraft({ outfitSets: [source] });
  const result = duplicatePromptOutfitSet(original, OutfitModule, "set-a", {
    createSetId: () => "set-copy",
    createItemId: idSequence("item-a-copy", "item-b-copy"),
    createRelationId: idSequence("rel-a-copy", "rel-orphan-copy"),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const copy = result.value.set;
  assert.equal(copy?.id, "set-copy");
  assert.equal(copy?.presetId, undefined);
  assert.deepEqual(copy?.items.map((candidate) => candidate.id), ["item-a-copy", "item-b-copy"]);
  assert.equal(copy?.relations?.[0]?.sourceItemId, "item-b-copy");
  assert.equal(copy?.relations?.[0]?.targetItemId, "item-a-copy");
  assert.equal(copy?.relations?.[1]?.sourceItemId, "item-a-copy");
  assert.equal(copy?.relations?.[1]?.targetItemId, "missing-item");
});

test("outfit preset rebuilds preset-owned items with fresh IDs while preserving targets/details and clear keeps payload", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", { additionalDetails: "silver accents" })],
  });
  const applied = applyPromptOutfitSetPreset(original, OutfitModule, "set-a", "casual", {
    createItemId: idSequence("preset-item-1", "preset-item-2", "preset-item-3"),
    createRelationId: () => "preset-relation",
  });
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  assert.equal(applied.value.set?.presetId, "casual");
  assert.equal(applied.value.set?.name, "Casual Set");
  assert.equal(applied.value.set?.key, "casualSet");
  assert.deepEqual(applied.value.set?.items.map((candidate) => candidate.id), [
    "preset-item-1",
    "preset-item-2",
    "preset-item-3",
  ]);
  assert.deepEqual(applied.value.set?.targets, [subjectTarget()]);
  assert.equal(applied.value.set?.additionalDetails, "silver accents");

  const cleared = applyPromptOutfitSetPreset(
    applied.value.draft,
    OutfitModule,
    "set-a",
    "",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.set?.presetId, undefined);
  assert.equal(cleared.value.set?.items.length, 3);

  const unknown = applyPromptOutfitSetPreset(original, OutfitModule, "set-a", "missing");
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.equal(unknown.issues[0]?.code, "outfit_preset_not_found");
});

test("outfit item create supports catalog type, starter, and custom choices with stable IDs", () => {
  const original = createDraft({ outfitSets: [outfitSet("set-a", "set1", { presetId: "casual" })] });
  const typed = createPromptOutfitItem(
    original,
    OutfitModule,
    "set-a",
    { kind: "type", type: "shirt" },
    { createItemId: () => "item-shirt" },
  );
  assert.equal(typed.ok, true);
  if (!typed.ok) return;
  assert.equal(typed.value.item?.type, "shirt");
  assert.equal(typed.value.set?.presetId, undefined);

  const starter = createPromptOutfitItem(
    typed.value.draft,
    OutfitModule,
    "set-a",
    { kind: "starter", starterId: "oversized_t_shirt" },
    { createItemId: () => "item-starter" },
  );
  assert.equal(starter.ok, true);
  if (!starter.ok) return;
  assert.deepEqual(starter.value.item?.properties.fit, { mode: "option", value: "oversized" });

  const custom = createPromptOutfitItem(
    starter.value.draft,
    OutfitModule,
    "set-a",
    { kind: "custom" },
    { createItemId: () => "item-custom" },
  );
  assert.equal(custom.ok, true);
  if (!custom.ok) return;
  assert.equal(custom.value.item?.type, "custom");
  assert.equal(custom.value.item?.customCategory, "custom");
});

test("outfit item update preserves stable ID, uniquifies key, and canonical type/category transitions reset properties", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      presetId: "casual",
      items: [
        item("item-a", "shirt", { properties: { fit: { mode: "option", value: "fitted" } } }),
        item("item-b", "coat", { type: "coat", name: "Coat" }),
      ],
    })],
  });
  const changed = updatePromptOutfitItem(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { key: "coat", type: "custom", customType: "tech robe", customCategory: "outerwear" },
  );
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.equal(changed.value.item?.id, "item-a");
  assert.equal(changed.value.item?.key, "coat2");
  assert.equal(changed.value.item?.type, "custom");
  assert.equal(changed.value.item?.customType, "tech robe");
  assert.equal(changed.value.item?.customCategory, "outerwear");
  assert.deepEqual(changed.value.item?.properties, {});
  assert.equal(changed.value.set?.presetId, undefined);

  const invalid = updatePromptOutfitItem(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { type: "not-a-type" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.issues[0]?.code, "outfit_item_type_not_found");
});

test("outfit item source resolves exact references, keeps builtin reference, and preserves exact persisted orphan", () => {
  const original = createDraft({ outfitSets: [outfitSet("set-a", "set1", { items: [item("item-a")] })] });
  const liveReference = reference();
  const live = setPromptOutfitItemSource(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: liveReference, itemHint: "copy the collar" },
    { referenceSources: [{ reference: liveReference }] },
  );
  assert.equal(live.ok, true);
  if (!live.ok) return;
  assert.deepEqual(live.value.item?.source, {
    mode: "reference",
    reference: liveReference,
    itemHint: "copy the collar",
  });

  const builtin = setPromptOutfitItemSource(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: { token: "{reference}" } },
  );
  assert.equal(builtin.ok, true);
  if (builtin.ok && builtin.value.item?.source.mode === "reference") {
    assert.equal(builtin.value.item.source.reference.source, "system");
  }

  const missing = setPromptOutfitItemSource(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: reference("missing", "{missing}") },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_reference_missing");

  const orphanRef = reference("orphan", "{orphan}");
  const orphanDraft = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [item("item-a", "shirt", { source: { mode: "reference", reference: orphanRef } })],
    })],
  });
  const retained = setPromptOutfitItemSource(
    orphanDraft,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: orphanRef },
    { referenceSources: [] },
  );
  assert.equal(retained.ok, true);
});

test("outfit item property validates profile option sets and multi-select/custom/reference state", () => {
  const base = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      presetId: "casual",
      items: [item("item-a", "shirt", { type: "t_shirt", name: "T-Shirt" })],
    })],
  });
  const fit = setPromptOutfitItemProperty(
    base,
    OutfitModule,
    "set-a",
    "item-a",
    "fit",
    { mode: "option", value: "oversized" },
  );
  assert.equal(fit.ok, true);
  if (!fit.ok) return;
  assert.equal(fit.value.set?.presetId, undefined);

  const pockets = setPromptOutfitItemProperty(
    fit.value.draft,
    OutfitModule,
    "set-a",
    "item-a",
    "pockets",
    { mode: "option", value: ["cargo", "cargo"] },
  );
  assert.equal(pockets.ok, true);
  if (!pockets.ok) return;
  assert.deepEqual(pockets.value.item?.properties.pockets, { mode: "option", value: ["cargo"] });

  const custom = setPromptOutfitItemProperty(
    pockets.value.draft,
    OutfitModule,
    "set-a",
    "item-a",
    "neckline",
    { mode: "custom", value: "architectural folded neckline" },
  );
  assert.equal(custom.ok, true);

  const ref = reference();
  const referenced = setPromptOutfitItemProperty(
    pockets.value.draft,
    OutfitModule,
    "set-a",
    "item-a",
    "fit",
    { mode: "reference", reference: ref },
    { referenceSources: [{ reference: ref }] },
  );
  assert.equal(referenced.ok, true);

  const unsupported = setPromptOutfitItemProperty(
    base,
    OutfitModule,
    "set-a",
    "item-a",
    "heelHeight",
    { mode: "option", value: "high" },
  );
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.issues[0]?.code, "outfit_item_property_unsupported");
});

test("outfit item duplicate does not duplicate relation edges and item delete removes connected relations only", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      presetId: "casual",
      items: [item("item-a", "shirt"), item("item-b", "coat", { type: "coat", name: "Coat" })],
      relations: [
        relation("rel-a", "item-b", "item-a"),
        relation("rel-orphan", "missing", "item-b"),
      ],
    })],
  });
  const duplicated = duplicatePromptOutfitItem(original, OutfitModule, "set-a", "item-a", {
    createItemId: () => "item-a-copy",
  });
  assert.equal(duplicated.ok, true);
  if (!duplicated.ok) return;
  assert.equal(duplicated.value.set?.items.length, 3);
  assert.equal(duplicated.value.set?.relations?.length, 2);
  assert.equal(duplicated.value.set?.presetId, undefined);

  const deleted = deletePromptOutfitItem(
    duplicated.value.draft,
    OutfitModule,
    "set-a",
    "item-b",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.equal(deleted.value.set?.relations?.length, 0);
  assert.equal(deleted.value.set?.items.some((candidate) => candidate.id === "item-b"), false);
});

test("outfit relation create requires exact current item endpoints", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      presetId: "casual",
      items: [item("item-a"), item("item-b", "coat", { type: "coat" })],
    })],
  });
  const created = createPromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "over",
    "item-b",
    "item-a",
    "coat over shirt",
    { createRelationId: () => "rel-new" },
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.relation?.id, "rel-new");
  assert.equal(created.value.set?.presetId, undefined);

  const missing = createPromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "over",
    "missing",
    "item-a",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_relation_endpoint_not_found");
});

test("outfit relation update validates changed endpoints but allows an unchanged orphan endpoint to persist", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [item("item-a"), item("item-b", "coat", { type: "coat" })],
      relations: [relation("rel-a", "missing-old", "item-a")],
    })],
  });
  const details = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-a",
    { type: "layered_with", details: "intentional orphan fixture" },
  );
  assert.equal(details.ok, true);
  if (!details.ok) return;
  assert.equal(details.value.relation?.sourceItemId, "missing-old");
  assert.equal(details.value.relation?.type, "layered_with");

  const repaired = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-a",
    { sourceItemId: "item-b" },
  );
  assert.equal(repaired.ok, true);
  if (repaired.ok) assert.equal(repaired.value.relation?.sourceItemId, "item-b");

  const missing = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-a",
    { sourceItemId: "new-missing" },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_relation_endpoint_not_found");
});

test("outfit relation delete targets exact stable relation ID including an orphan relation", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [item("item-a")],
      relations: [relation("rel-orphan", "missing", "item-a")],
    })],
  });
  const deleted = deletePromptOutfitRelation(original, OutfitModule, "set-a", "rel-orphan");
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.deepEqual(deleted.value.set?.relations, []);

  const missing = deletePromptOutfitRelation(original, OutfitModule, "set-a", "missing");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_relation_not_found");
});

test("outfit exact stable identity conflicts reject before mutation", () => {
  const duplicateItems = createDraft({
    outfitSets: [outfitSet("set-a", "set1", { items: [item("same"), item("same", "coat")] })],
  });
  const itemConflict = deletePromptOutfitSet(duplicateItems, OutfitModule, "set-a");
  assert.equal(itemConflict.ok, false);
  if (!itemConflict.ok) assert.equal(itemConflict.issues[0]?.code, "outfit_item_identity_conflict");

  const duplicateRelations = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [item("item-a"), item("item-b", "coat")],
      relations: [
        relation("same-rel", "item-a", "item-b"),
        relation("same-rel", "item-b", "item-a"),
      ],
    })],
  });
  const relationConflict = deletePromptOutfitSet(duplicateRelations, OutfitModule, "set-a");
  assert.equal(relationConflict.ok, false);
  if (!relationConflict.ok) assert.equal(relationConflict.issues[0]?.code, "outfit_relation_identity_conflict");
});

test("legacy Outfit IDs normalize before exact set/item/relation mutation", () => {
  const legacySet = {
    key: "legacy",
    name: "Legacy",
    targets: [subjectTarget()],
    items: [
      {
        key: "shirt",
        name: "Shirt",
        type: "shirt",
        source: { mode: "defined" },
        properties: {},
      },
    ],
    relations: [
      {
        type: "layered_with",
        sourceItemId: "outfit-item-1",
        targetItemId: "outfit-item-1",
      },
    ],
  } as unknown as OutfitSet;
  const original = createDraft({ outfitSets: [legacySet] });

  const itemUpdate = updatePromptOutfitItem(
    original,
    OutfitModule,
    "outfit-set-1",
    "outfit-item-1",
    { name: "Legacy Shirt" },
  );
  assert.equal(itemUpdate.ok, true);
  if (!itemUpdate.ok) return;
  assert.equal(itemUpdate.value.item?.id, "outfit-item-1");

  const relationUpdate = updatePromptOutfitRelation(
    itemUpdate.value.draft,
    OutfitModule,
    "outfit-set-1",
    "outfit-relation-1",
    { details: "legacy edge" },
  );
  assert.equal(relationUpdate.ok, true);
  if (relationUpdate.ok) assert.equal(relationUpdate.value.relation?.id, "outfit-relation-1");
});

test("outfit set delete targets one exact stable ID", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "first"), outfitSet("set-b", "second")],
  });
  const deleted = deletePromptOutfitSet(original, OutfitModule, "set-a");
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.deepEqual(deleted.value.sets.map((candidate) => candidate.id), ["set-b"]);

  const missing = deletePromptOutfitSet(original, OutfitModule, "missing");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_set_not_found");
});

test("registered Outfit actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerOutfitActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((action) => action.id).sort(),
    [
      "outfit.item.create",
      "outfit.item.delete",
      "outfit.item.duplicate",
      "outfit.item.setProperty",
      "outfit.item.setSource",
      "outfit.item.update",
      "outfit.relation.create",
      "outfit.relation.delete",
      "outfit.relation.update",
      "outfit.set.applyPreset",
      "outfit.set.create",
      "outfit.set.delete",
      "outfit.set.duplicate",
      "outfit.set.update",
    ],
  );

  const original = createDraft({ outfitSets: [] });
  const result = await registry.execute(
    "outfit.item.delete",
    {
      draft: original,
      modules: [OutfitModule],
    },
    { setId: "missing", itemId: "missing" },
  );
  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
});
