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
  OutfitPropertyState,
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

function outfitItem(
  id: string | undefined,
  key = "shirt",
  overrides: Partial<OutfitItem> = {},
): OutfitItem {
  return {
    ...(id ? { id } : ({} as { id: string })),
    key,
    name: "Shirt",
    type: "shirt",
    source: { mode: "defined" },
    properties: {},
    additionalDetails: "",
    ...overrides,
  } as OutfitItem;
}

function relation(
  id: string | undefined,
  sourceItemId: string,
  targetItemId: string,
  overrides: Partial<OutfitItemRelation> = {},
): OutfitItemRelation {
  return {
    ...(id ? { id } : ({} as { id: string })),
    type: "over",
    sourceItemId,
    targetItemId,
    details: "",
    ...overrides,
  } as OutfitItemRelation;
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

test("outfit set create uses stable ID, unique key, first subject target, and preserves caller", () => {
  const original = createDraft({ outfitSets: [] });
  const result = createPromptOutfitSet(original, OutfitModule, {
    createSetId: () => "set-new",
    subjectSources: [subjectSource()],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.set?.id, "set-new");
  assert.equal(result.value.set?.key, "set1");
  assert.equal(result.value.set?.name, "Outfit Set 1");
  assert.deepEqual(result.value.set?.targets, [subjectTarget()]);
  assert.deepEqual(original.moduleValues.outfit?.outfitSets, []);
});

test("outfit set update preserves preset for metadata/targets but details detach it", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "mainSet", { presetId: "casual" }), outfitSet("set-b", "otherSet")],
  });
  const metadata = updatePromptOutfitSet(
    original,
    OutfitModule,
    "set-a",
    {
      name: "Editorial Set",
      key: "other set",
      targets: [subjectTarget("subject-live", "{liveSubject}")],
    },
    { subjectSources: [subjectSource("subject-live", "{liveSubject}")] },
  );
  assert.equal(metadata.ok, true);
  if (!metadata.ok) return;
  assert.equal(metadata.value.set?.id, "set-a");
  assert.equal(metadata.value.set?.key, "otherSet2");
  assert.equal(metadata.value.set?.presetId, "casual");

  const details = updatePromptOutfitSet(
    original,
    OutfitModule,
    "set-a",
    { additionalDetails: "cinched at the waist" },
  );
  assert.equal(details.ok, true);
  if (details.ok) assert.equal(details.value.set?.presetId, undefined);
});

test("outfit set duplicate remaps nested IDs and known relation endpoints while preserving orphan endpoints", () => {
  let itemId = 0;
  let relationId = 0;
  const original = createDraft({
    outfitSets: [
      outfitSet("set-a", "mainSet", {
        presetId: "casual",
        items: [outfitItem("item-a", "shirt"), outfitItem("item-b", "coat", { type: "coat", name: "Coat" })],
        relations: [
          relation("rel-a", "item-b", "item-a"),
          relation("rel-orphan", "missing-item", "item-a"),
        ],
      }),
    ],
  });
  const result = duplicatePromptOutfitSet(original, OutfitModule, "set-a", {
    createSetId: () => "set-copy",
    createItemId: () => `item-copy-${++itemId}`,
    createRelationId: () => `relation-copy-${++relationId}`,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.set?.id, "set-copy");
  assert.equal(result.value.set?.presetId, undefined);
  assert.deepEqual(result.value.set?.items.map((item) => item.id), ["item-copy-1", "item-copy-2"]);
  assert.deepEqual(result.value.set?.relations?.map((item) => item.id), ["relation-copy-1", "relation-copy-2"]);
  assert.equal(result.value.set?.relations?.[0]?.sourceItemId, "item-copy-2");
  assert.equal(result.value.set?.relations?.[0]?.targetItemId, "item-copy-1");
  assert.equal(result.value.set?.relations?.[1]?.sourceItemId, "missing-item");
  assert.equal(result.value.set?.relations?.[1]?.targetItemId, "item-copy-1");
});

test("outfit preset rebuilds preset-owned items with fresh IDs while preserving targets/details and clear keeps payload", () => {
  let itemId = 0;
  let relationId = 0;
  const original = createDraft({
    outfitSets: [
      outfitSet("set-a", "set1", {
        name: "Outfit Set 1",
        targets: [subjectTarget()],
        additionalDetails: "keep this authored note",
      }),
    ],
  });
  const result = applyPromptOutfitSetPreset(original, OutfitModule, "set-a", "casual", {
    createItemId: () => `preset-item-${++itemId}`,
    createRelationId: () => `preset-relation-${++relationId}`,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.set?.presetId, "casual");
  assert.deepEqual(result.value.set?.targets, [subjectTarget()]);
  assert.equal(result.value.set?.additionalDetails, "keep this authored note");
  assert.deepEqual(result.value.set?.items.map((item) => item.id), ["preset-item-1", "preset-item-2", "preset-item-3"]);

  const cleared = applyPromptOutfitSetPreset(result.value.draft, OutfitModule, "set-a", "");
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.set?.presetId, undefined);
  assert.deepEqual(cleared.value.set?.items, result.value.set?.items);
});

test("outfit item create supports catalog type, starter, and custom choices with stable IDs", () => {
  let itemId = 0;
  const original = createDraft({ outfitSets: [outfitSet("set-a")] });
  const options = { createItemId: () => `item-new-${++itemId}` };

  const typed = createPromptOutfitItem(original, OutfitModule, "set-a", { kind: "type", type: "shirt" }, options);
  assert.equal(typed.ok, true);
  if (!typed.ok) return;
  assert.equal(typed.value.item?.id, "item-new-1");
  assert.equal(typed.value.item?.type, "shirt");

  const starter = createPromptOutfitItem(typed.value.draft, OutfitModule, "set-a", { kind: "starter", starterId: "mini_skirt" }, options);
  assert.equal(starter.ok, true);
  if (!starter.ok) return;
  assert.equal(starter.value.item?.type, "skirt");
  assert.deepEqual(starter.value.item?.properties.length, { mode: "option", value: "mini" });

  const custom = createPromptOutfitItem(starter.value.draft, OutfitModule, "set-a", { kind: "custom" }, options);
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
        outfitItem("item-a", "shirt", { properties: { fit: { mode: "option", value: "fitted" } } }),
        outfitItem("item-b", "coat", { type: "coat" }),
      ],
    })],
  });

  const metadata = updatePromptOutfitItem(original, OutfitModule, "set-a", "item-a", {
    name: "Editorial Shirt",
    key: "coat",
  });
  assert.equal(metadata.ok, true);
  if (!metadata.ok) return;
  assert.equal(metadata.value.item?.id, "item-a");
  assert.equal(metadata.value.item?.key, "coat2");
  assert.equal(metadata.value.set?.presetId, undefined);

  const typeChange = updatePromptOutfitItem(original, OutfitModule, "set-a", "item-a", { type: "custom" });
  assert.equal(typeChange.ok, true);
  if (!typeChange.ok) return;
  assert.equal(typeChange.value.item?.type, "custom");
  assert.equal(typeChange.value.item?.customCategory, "custom");
  assert.deepEqual(typeChange.value.item?.properties, {});

  const categoryChange = updatePromptOutfitItem(typeChange.value.draft, OutfitModule, "set-a", "item-a", { customCategory: "footwear" });
  assert.equal(categoryChange.ok, true);
  if (categoryChange.ok) assert.deepEqual(categoryChange.value.item?.properties, {});
});

test("outfit item source resolves exact references, keeps builtin reference, and preserves exact persisted orphan", () => {
  const original = createDraft({ outfitSets: [outfitSet("set-a", "set1", { items: [outfitItem("item-a")] })] });
  const liveReference = reference();
  const live = setPromptOutfitItemSource(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: liveReference, itemHint: "copy the shirt" },
    { referenceSources: [{ reference: liveReference }] },
  );
  assert.equal(live.ok, true);
  if (!live.ok) return;
  assert.deepEqual(live.value.item?.source, {
    mode: "reference",
    reference: liveReference,
    itemHint: "copy the shirt",
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
    assert.equal(builtin.value.item.source.reference.token, "{reference}");
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

  const orphanDraft = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [outfitItem("item-a", "shirt", { source: { mode: "reference", reference: reference("orphan", "{orphan}") } })],
    })],
  });
  const retained = setPromptOutfitItemSource(
    orphanDraft,
    OutfitModule,
    "set-a",
    "item-a",
    { mode: "reference", reference: reference("orphan", "{orphan}") },
  );
  assert.equal(retained.ok, true);
});

test("outfit item property validates profile option sets and multi-select/custom/reference state", () => {
  const original = createDraft({ outfitSets: [outfitSet("set-a", "set1", { items: [outfitItem("item-a", "shirt")] })] });

  const validLength = setPromptOutfitItemProperty(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    "length",
    { mode: "option", value: "cropped" },
  );
  assert.equal(validLength.ok, true);

  const invalidLength = setPromptOutfitItemProperty(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    "length",
    { mode: "option", value: "mini" },
  );
  assert.equal(invalidLength.ok, false);
  if (!invalidLength.ok) assert.equal(invalidLength.issues[0]?.code, "outfit_property_invalid_option");

  const multi = setPromptOutfitItemProperty(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    "pockets",
    { mode: "option", value: ["side", "cargo"] },
  );
  assert.equal(multi.ok, true);

  const custom = setPromptOutfitItemProperty(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    "fit",
    { mode: "custom", value: "architectural fit" },
  );
  assert.equal(custom.ok, true);

  const refState: OutfitPropertyState = { mode: "reference", reference: reference() };
  const fromReference = setPromptOutfitItemProperty(
    original,
    OutfitModule,
    "set-a",
    "item-a",
    "fit",
    refState,
    { referenceSources: [{ reference: reference() }] },
  );
  assert.equal(fromReference.ok, true);
});

test("outfit item duplicate does not duplicate relation edges and item delete removes connected relations only", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [outfitItem("item-a", "shirt"), outfitItem("item-b", "coat", { type: "coat" }), outfitItem("item-c", "shoes", { type: "sneakers" })],
      relations: [
        relation("rel-a", "item-b", "item-a"),
        relation("rel-b", "item-c", "item-b"),
      ],
    })],
  });
  const duplicated = duplicatePromptOutfitItem(original, OutfitModule, "set-a", "item-a", {
    createItemId: () => "item-copy",
  });
  assert.equal(duplicated.ok, true);
  if (!duplicated.ok) return;
  assert.equal(duplicated.value.set?.relations?.length, 2);

  const deleted = deletePromptOutfitItem(original, OutfitModule, "set-a", "item-b");
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.deepEqual(deleted.value.set?.relations, []);
});

test("outfit relation create requires exact current item endpoints", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", { items: [outfitItem("item-a"), outfitItem("item-b", "coat")] })],
  });
  const created = createPromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    { type: "over", sourceItemId: "item-b", targetItemId: "item-a", details: "coat over shirt" },
    { createRelationId: () => "rel-new" },
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.relation?.id, "rel-new");

  const missing = createPromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    { type: "over", sourceItemId: "missing", targetItemId: "item-a" },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "outfit_relation_endpoint_missing");
});

test("outfit relation update validates changed endpoints but allows an unchanged orphan endpoint to persist", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [outfitItem("item-a"), outfitItem("item-b", "coat")],
      relations: [relation("rel-orphan", "missing-item", "item-a")],
    })],
  });

  const unrelated = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-orphan",
    { details: "keep orphan endpoint snapshot" },
  );
  assert.equal(unrelated.ok, true);
  if (!unrelated.ok) return;
  assert.equal(unrelated.value.relation?.sourceItemId, "missing-item");

  const repair = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-orphan",
    { sourceItemId: "item-b" },
  );
  assert.equal(repair.ok, true);
  if (repair.ok) assert.equal(repair.value.relation?.sourceItemId, "item-b");

  const fuzzy = updatePromptOutfitRelation(
    original,
    OutfitModule,
    "set-a",
    "rel-orphan",
    { sourceItemId: "coat" },
  );
  assert.equal(fuzzy.ok, false);
  if (!fuzzy.ok) assert.equal(fuzzy.issues[0]?.code, "outfit_relation_endpoint_missing");
});

test("outfit relation delete targets exact stable relation ID including an orphan relation", () => {
  const original = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [outfitItem("item-a")],
      relations: [relation("rel-orphan", "missing-item", "item-a")],
    })],
  });
  const result = deletePromptOutfitRelation(original, OutfitModule, "set-a", "rel-orphan");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.set?.relations, []);
});

test("outfit exact stable identity conflicts reject before mutation", () => {
  const duplicateItems = createDraft({
    outfitSets: [outfitSet("set-a", "set1", { items: [outfitItem("same"), outfitItem("same", "coat")] })],
  });
  const itemResult = duplicatePromptOutfitItem(duplicateItems, OutfitModule, "set-a", "same", {
    createItemId: () => "copy",
  });
  assert.equal(itemResult.ok, false);
  if (!itemResult.ok) assert.equal(itemResult.issues[0]?.code, "outfit_item_identity_conflict");

  const duplicateRelations = createDraft({
    outfitSets: [outfitSet("set-a", "set1", {
      items: [outfitItem("item-a"), outfitItem("item-b", "coat")],
      relations: [relation("same-rel", "item-a", "item-b"), relation("same-rel", "item-b", "item-a")],
    })],
  });
  const relationResult = deletePromptOutfitRelation(duplicateRelations, OutfitModule, "set-a", "same-rel");
  assert.equal(relationResult.ok, false);
  if (!relationResult.ok) assert.equal(relationResult.issues[0]?.code, "outfit_relation_identity_conflict");
});

test("legacy Outfit IDs normalize before exact set/item/relation mutation", () => {
  const original = createDraft({
    outfitSets: [outfitSet(undefined, "legacySet", {
      items: [outfitItem(undefined, "shirt"), outfitItem("item-b", "coat")],
      relations: [relation(undefined, "outfit-item-1", "item-b")],
    })],
  });
  const itemResult = duplicatePromptOutfitItem(original, OutfitModule, "outfit-set-1", "outfit-item-1", {
    createItemId: () => "item-copy",
  });
  assert.equal(itemResult.ok, true);
  if (!itemResult.ok) return;
  assert.equal(itemResult.value.item?.id, "item-copy");

  const relationResult = deletePromptOutfitRelation(original, OutfitModule, "outfit-set-1", "outfit-relation-1");
  assert.equal(relationResult.ok, true);
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
  if (!result.ok) assert.equal(result.issues[0]?.code, "outfit_set_not_found");
});
