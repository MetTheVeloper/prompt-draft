import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerLayoutActions } from "../app/actions/layouts.ts";
import {
  assignPromptLayoutRegionScene,
  clearPromptLayoutRegionScene,
  createPromptLayoutRegion,
  deletePromptLayoutRegion,
  duplicatePromptLayoutRegion,
  movePromptLayoutRegion,
  updatePromptLayoutGrid,
  updatePromptLayoutRegion,
} from "../app/domain/layouts.ts";
import { LayoutModule } from "../app/modules/layout.module.ts";
import { SceneModule } from "../app/modules/scene.module.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["layout"],
    moduleValues: {
      layout: {
        layoutType: "",
        density: "",
        regions: {
          grid: { columns: 12, rows: 12 },
          regions: [],
        },
        extraDetails: "",
        customText: "",
      },
    },
    modulePanelStates: {
      layout: { isCustomMode: false, activePresetId: null },
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

function layoutState(draft: PromptDraftState) {
  return draft.moduleValues.layout?.regions as any;
}

function createRegionDraft() {
  const created = createPromptLayoutRegion(
    createDraft(),
    LayoutModule,
    { name: "Hero", x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
    () => "region-a",
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create fixture region");
  return created.value.draft;
}

test("layout region create/update preserve stable identity and normalize geometry", () => {
  const original = createDraft();
  const created = createPromptLayoutRegion(
    original,
    LayoutModule,
    {
      name: "Hero",
      x: 0.9,
      y: -1,
      width: 0.5,
      height: 2,
      role: "hero_image",
    },
    () => "region-a",
  );

  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.region?.id, "region-a");
  assert.equal(created.value.region?.x, 0.9);
  assert.equal(created.value.region?.y, 0);
  assert.ok(Math.abs((created.value.region?.width || 0) - 0.1) < 1e-9);
  assert.equal(created.value.region?.height, 1);
  assert.equal(layoutState(original).regions.length, 0);

  const updated = updatePromptLayoutRegion(
    created.value.draft,
    LayoutModule,
    "region-a",
    { role: "custom", customRole: "Product spotlight", description: "Main product" },
  );
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.region?.id, "region-a");
  assert.equal(updated.value.region?.role, "custom");
  assert.equal(updated.value.region?.customRole, "Product spotlight");
});

test("layout region mutation rejects invalid custom role and zero geometry", () => {
  const draft = createRegionDraft();

  const customRole = updatePromptLayoutRegion(
    draft,
    LayoutModule,
    "region-a",
    { role: "custom", customRole: "" },
  );
  assert.equal(customRole.ok, false);
  if (!customRole.ok) {
    assert.equal(customRole.issues[0]?.code, "layout_region_custom_role_required");
  }

  const geometry = updatePromptLayoutRegion(
    draft,
    LayoutModule,
    "region-a",
    { width: 0 },
  );
  assert.equal(geometry.ok, false);
  if (!geometry.ok) {
    assert.equal(geometry.issues[0]?.code, "layout_region_invalid_geometry");
  }
});

test("layout duplicate preserves explicit binding and delete leaves external region refs untouched", () => {
  const draft = createRegionDraft();
  const region = layoutState(draft).regions[0];
  region.contentKey = "{scene_hero}";
  region.contentRef = {
    kind: "scene",
    entityId: "scene-a",
    token: "{scene_hero}",
    label: "Hero",
  };
  draft.moduleValues.typography = {
    textGroups: [
      {
        id: "text-group-a",
        groupName: "{text_group_a}",
        positionSource: "layout_region",
        layoutRegionId: "region-a",
        texts: [],
      },
    ] as any,
  };

  const duplicated = duplicatePromptLayoutRegion(
    draft,
    LayoutModule,
    "region-a",
    () => "region-b",
  );
  assert.equal(duplicated.ok, true);
  if (!duplicated.ok) return;
  assert.deepEqual(
    duplicated.value.state.regions.map((item) => item.id),
    ["region-a", "region-b"],
  );
  assert.equal(duplicated.value.region?.name, "");
  assert.equal(duplicated.value.region?.contentRef?.entityId, "scene-a");
  assert.notEqual(duplicated.value.region?.contentRef, region.contentRef);

  const deleted = deletePromptLayoutRegion(
    duplicated.value.draft,
    LayoutModule,
    "region-a",
  );
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  const typographyGroups = deleted.value.draft.moduleValues.typography?.textGroups as any[];
  assert.equal(typographyGroups[0]?.layoutRegionId, "region-a");
});

test("layout move preserves authored layers and grid update uses canonical clamp rules", () => {
  const first = createPromptLayoutRegion(
    createDraft(),
    LayoutModule,
    { layer: 7 },
    () => "region-a",
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = createPromptLayoutRegion(
    first.value.draft,
    LayoutModule,
    { layer: 9 },
    () => "region-b",
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;

  const moved = movePromptLayoutRegion(
    second.value.draft,
    LayoutModule,
    "region-b",
    0,
  );
  assert.equal(moved.ok, true);
  if (!moved.ok) return;
  assert.deepEqual(moved.value.state.regions.map((item) => item.id), ["region-b", "region-a"]);
  assert.deepEqual(moved.value.state.regions.map((item) => item.layer), [9, 7]);

  const grid = updatePromptLayoutGrid(
    moved.value.draft,
    LayoutModule,
    { columns: 99, rows: 1.2 },
  );
  assert.equal(grid.ok, true);
  if (!grid.ok) return;
  assert.deepEqual(grid.value.state.grid, { columns: 24, rows: 2 });
  assert.deepEqual(
    grid.value.state.regions.map((item) => [item.x, item.y, item.width, item.height]),
    moved.value.state.regions.map((item) => [item.x, item.y, item.width, item.height]),
  );
});

test("manual contentKey replacement explicitly detaches an existing Scene ref", () => {
  const draft = createRegionDraft();
  const region = layoutState(draft).regions[0];
  region.contentKey = "{scene_hero}";
  region.contentRef = {
    kind: "scene",
    entityId: "scene-a",
    token: "{scene_hero}",
    label: "Hero",
  };

  const same = updatePromptLayoutRegion(
    draft,
    LayoutModule,
    "region-a",
    { contentKey: "{scene_hero}" },
  );
  assert.equal(same.ok, true);
  if (!same.ok) return;
  assert.equal(same.value.region?.contentRef?.entityId, "scene-a");

  const manual = updatePromptLayoutRegion(
    same.value.draft,
    LayoutModule,
    "region-a",
    { contentKey: "{product}" },
  );
  assert.equal(manual.ok, true);
  if (!manual.ok) return;
  assert.equal(manual.value.region?.contentKey, "{product}");
  assert.equal(manual.value.region?.contentRef, undefined);
});

test("layout Scene binding uses exact active Scene identity and clear preserves unrelated manual content", () => {
  const draft = createRegionDraft();
  draft.selectedModuleKeys.push("scene");
  draft.moduleValues.scene = {
    scenes: [
      {
        id: "scene-a",
        key: "hero",
        name: "Hero Scene",
        enabled: true,
        description: "",
        content: [],
        components: [],
      },
    ] as any,
  };

  const assigned = assignPromptLayoutRegionScene(
    draft,
    LayoutModule,
    "region-a",
    "scene-a",
  );
  assert.equal(assigned.ok, true);
  if (!assigned.ok) return;
  assert.equal(assigned.value.region?.contentRef?.entityId, "scene-a");
  assert.equal(assigned.value.region?.contentRef?.label, "Hero Scene");
  assert.equal(assigned.value.region?.contentKey, "{scene_hero}");

  const cleared = clearPromptLayoutRegionScene(
    assigned.value.draft,
    LayoutModule,
    "region-a",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.region?.contentRef, undefined);
  assert.equal(cleared.value.region?.contentKey, "");

  const inconsistent = createRegionDraft();
  const inconsistentRegion = layoutState(inconsistent).regions[0];
  inconsistentRegion.contentKey = "{manual}";
  inconsistentRegion.contentRef = {
    kind: "scene",
    entityId: "scene-old",
    token: "{scene_old}",
    label: "Old",
  };
  const preserved = clearPromptLayoutRegionScene(
    inconsistent,
    LayoutModule,
    "region-a",
  );
  assert.equal(preserved.ok, true);
  if (!preserved.ok) return;
  assert.equal(preserved.value.region?.contentKey, "{manual}");
  assert.equal(preserved.value.region?.contentRef, undefined);
});

test("layout Scene assignment rejects inactive, missing, and disabled targets", () => {
  const inactive = assignPromptLayoutRegionScene(
    createRegionDraft(),
    LayoutModule,
    "region-a",
    "scene-a",
  );
  assert.equal(inactive.ok, false);
  if (!inactive.ok) assert.equal(inactive.issues[0]?.code, "scene_module_not_active");

  const draft = createRegionDraft();
  draft.selectedModuleKeys.push("scene");
  draft.moduleValues.scene = {
    scenes: [
      {
        id: "scene-disabled",
        key: "disabled",
        name: "Disabled",
        enabled: false,
        content: [],
        components: [],
      },
    ] as any,
  };

  const missing = assignPromptLayoutRegionScene(
    draft,
    LayoutModule,
    "region-a",
    "scene-missing",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "scene_not_found");

  const disabled = assignPromptLayoutRegionScene(
    draft,
    LayoutModule,
    "region-a",
    "scene-disabled",
  );
  assert.equal(disabled.ok, false);
  if (!disabled.ok) assert.equal(disabled.issues[0]?.code, "scene_unavailable");
});

test("registered Layout actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerLayoutActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "layout.region.create",
      "layout.region.update",
      "layout.region.duplicate",
      "layout.region.delete",
      "layout.region.move",
      "layout.grid.update",
      "layout.region.assignScene",
      "layout.region.clearScene",
    ],
  );

  const draft = createDraft();
  const before = JSON.stringify(draft);
  const failure = await registry.execute(
    "layout.region.delete",
    {
      draft,
      modules: [LayoutModule, SceneModule],
    },
    { regionId: "region-missing" },
  );
  assert.equal(failure.ok, false);
  assert.equal(JSON.stringify(draft), before);
  assert.deepEqual(failure.draft, draft);
});
