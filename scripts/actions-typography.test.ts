import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerTypographyActions } from "../app/actions/typography.ts";
import {
  createTypographyGroup,
  createTypographyText,
  deleteTypographyGroup,
  deleteTypographyText,
  moveTypographyGroup,
  moveTypographyText,
  updateTypographyGroup,
  updateTypographyText,
} from "../app/domain/typography.ts";
import { TypographyModule } from "../app/modules/typography.module.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["typography"],
    moduleValues: {
      typography: {
        textGroups: [],
        textAccuracy: "",
        extraDetails: "",
        customText: "",
      },
    },
    modulePanelStates: {
      typography: {
        isCustomMode: false,
        activePresetId: null,
      },
    },
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

function createGroupDraft() {
  const created = createTypographyGroup(
    createDraft(),
    TypographyModule,
    { groupPurpose: "poster_header" },
    () => "text-group-abc",
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create fixture group");
  return created.value.draft;
}

test("typography group create derives structural token from deterministic stable ID", () => {
  const original = createDraft();
  const result = createTypographyGroup(
    original,
    TypographyModule,
    {
      groupPurpose: "poster_header",
      direction: "row",
      alignment: "start",
    },
    () => "text-group-abc",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.group?.id, "text-group-abc");
  assert.equal(result.value.group?.groupName, "{text_group_abc}");
  assert.equal(result.value.group?.groupPurpose, "poster_header");
  assert.equal(result.value.group?.direction, "row");
  assert.deepEqual(original.moduleValues.typography?.textGroups, []);
});

test("typography group update preserves identity/token and validates explicit positions", () => {
  const draft = createGroupDraft();
  const source = (draft.moduleValues.typography?.textGroups as any[])[0];

  const custom = updateTypographyGroup(
    draft,
    TypographyModule,
    "text-group-abc",
    {
      positionSource: "custom",
      customPositionDescription: "lower third",
      distribution: "spaced",
    },
  );
  assert.equal(custom.ok, true);
  if (!custom.ok) return;
  assert.equal(custom.value.group?.id, source.id);
  assert.equal(custom.value.group?.groupName, source.groupName);
  assert.equal(custom.value.group?.positionSource, "custom");
  assert.equal(custom.value.group?.positionPreset, "custom");
  assert.equal(custom.value.group?.layoutRegionId, "");

  const invalid = updateTypographyGroup(
    custom.value.draft,
    TypographyModule,
    "text-group-abc",
    { groupPurpose: "not-real" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.issues[0]?.code, "typography_invalid_option");
});

test("typography layout-region position accepts one exact active region and rejects missing replacement", () => {
  const draft = createGroupDraft();
  draft.selectedModuleKeys.push("layout");
  draft.moduleValues.layout = {
    regions: {
      mode: "descriptive",
      grid: { columns: 2, rows: 2 },
      regions: [
        {
          id: "region-hero",
          name: "Hero",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      ],
    } as any,
  };

  const exact = updateTypographyGroup(
    draft,
    TypographyModule,
    "text-group-abc",
    { positionSource: "layout_region", layoutRegionId: "region-hero" },
  );
  assert.equal(exact.ok, true);
  if (!exact.ok) return;
  assert.equal(exact.value.group?.layoutRegionId, "region-hero");
  assert.equal(exact.value.group?.positionPreset, "");

  const missing = updateTypographyGroup(
    draft,
    TypographyModule,
    "text-group-abc",
    { positionSource: "layout_region", layoutRegionId: "region-missing" },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "typography_layout_region_unavailable");
  }
});

test("typography group move and delete target one exact stable group", () => {
  const first = createTypographyGroup(
    createDraft(),
    TypographyModule,
    {},
    () => "text-group-a",
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = createTypographyGroup(
    first.value.draft,
    TypographyModule,
    {},
    () => "text-group-b",
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;

  const moved = moveTypographyGroup(
    second.value.draft,
    TypographyModule,
    "text-group-b",
    0,
  );
  assert.equal(moved.ok, true);
  if (!moved.ok) return;
  assert.deepEqual(moved.value.groups.map((group) => group.id), ["text-group-b", "text-group-a"]);

  const deleted = deleteTypographyGroup(
    moved.value.draft,
    TypographyModule,
    "text-group-b",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.deepEqual(deleted.value.groups.map((group) => group.id), ["text-group-a"]);
});

test("typography text create requires content and derives stable layer token", () => {
  const draft = createGroupDraft();
  const result = createTypographyText(
    draft,
    TypographyModule,
    "text-group-abc",
    {
      text: "Launch Day",
      purpose: "main_title",
      fontStyle: "bold_display",
    },
    () => "text-xyz",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.text?.id, "text-xyz");
  assert.equal(result.value.text?.layerName, "{text_xyz}");
  assert.equal(result.value.text?.text, "Launch Day");

  const empty = createTypographyText(
    draft,
    TypographyModule,
    "text-group-abc",
    { text: "   " },
    () => "text-empty",
  );
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.issues[0]?.code, "typography_text_required");
});

test("typography text update preserves identity/layer token and validates options", () => {
  const draft = createGroupDraft();
  const created = createTypographyText(
    draft,
    TypographyModule,
    "text-group-abc",
    { text: "Original" },
    () => "text-xyz",
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;

  const updated = updateTypographyText(
    created.value.draft,
    TypographyModule,
    "text-group-abc",
    "text-xyz",
    {
      text: "Updated",
      fontStyle: "{brand_font}",
      fontWeight: "bold",
    },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.text?.id, "text-xyz");
  assert.equal(updated.value.text?.layerName, "{text_xyz}");
  assert.equal(updated.value.text?.fontStyle, "{brand_font}");

  const invalid = updateTypographyText(
    updated.value.draft,
    TypographyModule,
    "text-group-abc",
    "text-xyz",
    { fontSize: "galactic" },
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.issues[0]?.code, "typography_invalid_option");
});

test("typography text move and delete stay within one exact group", () => {
  const draft = createGroupDraft();
  const first = createTypographyText(
    draft,
    TypographyModule,
    "text-group-abc",
    { text: "A" },
    () => "text-a",
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = createTypographyText(
    first.value.draft,
    TypographyModule,
    "text-group-abc",
    { text: "B" },
    () => "text-b",
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;

  const moved = moveTypographyText(
    second.value.draft,
    TypographyModule,
    "text-group-abc",
    "text-b",
    0,
  );
  assert.equal(moved.ok, true);
  if (!moved.ok) return;
  assert.deepEqual(moved.value.group?.texts.map((text) => text.id), ["text-b", "text-a"]);

  const deleted = deleteTypographyText(
    moved.value.draft,
    TypographyModule,
    "text-group-abc",
    "text-b",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.deepEqual(deleted.value.group?.texts.map((text) => text.id), ["text-a"]);
});

test("registered typography actions expose stable IDs and failures remain atomic", async () => {
  const registry = new ActionRegistry();
  registerTypographyActions(registry);
  assert.deepEqual(
    registry.list().map((item) => item.id).sort(),
    [
      "typography.group.create",
      "typography.group.delete",
      "typography.group.move",
      "typography.group.update",
      "typography.text.create",
      "typography.text.delete",
      "typography.text.move",
      "typography.text.update",
    ],
  );

  const draft = createDraft();
  const created = await registry.execute(
    "typography.group.create",
    {
      draft,
      modules: [TypographyModule],
      idFactory: { typographyGroup: () => "text-group-action" },
    },
    { groupPurpose: "poster_header" },
  );
  assert.equal(created.ok, true);
  assert.deepEqual(draft.moduleValues.typography?.textGroups, []);

  const failure = await registry.execute(
    "typography.text.create",
    {
      draft,
      modules: [TypographyModule],
      idFactory: { typographyText: () => "text-action" },
    },
    { groupId: "missing", text: "Hello" },
  );
  assert.equal(failure.ok, false);
  assert.deepEqual(failure.draft, draft);
});
