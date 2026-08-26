import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function source(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function assertContains(path, needles) {
  const value = source(path);
  for (const needle of needles) {
    assert.ok(
      value.includes(needle),
      `${path} must contain ${JSON.stringify(needle)}`,
    );
  }
}

test("Named Configuration editors keep the shared collection/card shell boundary", () => {
  const editors = [
    "app/components/modules/shared/ModuleEntitiesField.vue",
    "app/components/modules/lighting/LightingEntitiesField.vue",
    "app/components/modules/effects/EffectsEntitiesField.vue",
    "app/components/modules/texture/TextureEntitiesField.vue",
  ];

  for (const path of editors) {
    assertContains(path, [
      "ModuleEntitiesCollectionShell",
      "ModuleEntityCardShell",
    ]);
  }
});

test("specialized structured Named Configuration editors remain canonical", () => {
  assertContains("app/components/modules/lighting/LightingEntitiesField.vue", [
    "LightSourcesField",
    "<LightSourcesField",
  ]);
  assertContains("app/components/modules/effects/EffectsEntitiesField.vue", [
    "EffectLayersField",
    "<EffectLayersField",
  ]);
  assertContains("app/components/modules/texture/TextureEntitiesField.vue", [
    "MaterialAssignmentsField",
    "<MaterialAssignmentsField",
  ]);
});

test("missing and unavailable references keep explicit resolver-backed recovery UX", () => {
  assertContains("app/components/modules/shared/AssignmentScopeEditor.vue", [
    "ReferenceRecoveryList",
    "catalog.resolveTarget",
    "semanticTargetIdentity",
  ]);

  assertContains("app/components/modules/scene/SceneEntitiesField.vue", [
    "ReferenceRecoveryList",
    "resolveModuleEntityReferenceCatalogItem",
    "moduleEntityRefIdentity",
  ]);
});

test("empty Custom Override locks collapse across generic and specialized module panels", () => {
  const panels = [
    "app/components/modules/panel/base.vue",
    "app/components/modules/panel/background.vue",
    "app/components/modules/panel/lighting.vue",
    "app/components/modules/panel/effects.vue",
    "app/components/modules/panel/texture.vue",
    "app/components/modules/panel/hair.vue",
    "app/components/modules/panel/outfit.vue",
    "app/components/modules/panel/subject-assignments.vue",
  ];

  for (const path of panels) {
    assertContains(path, [
      "useModulePanelCollapseGuard({",
      "isCollapseLocked",
      "togglePanel",
    ]);
  }

  assertContains("app/composables/useModulePanelCollapseGuard.ts", [
    "if (locked) options.expanded.value = true",
    "if (options.expanded.value && isCollapseLocked.value) return",
  ]);

  assertContains("app/composables/useModulePanelContextMenu.ts", [
    "canToggleExpand?: () => boolean",
    "disabled: !canToggleExpand",
  ]);
});

test("shared Named Configuration shells retain narrow-mobile stacking and wrapping", () => {
  const shells = [
    "app/components/modules/shared/ModuleEntitiesCollectionShell.vue",
    "app/components/modules/shared/ModuleEntityCardShell.vue",
  ];

  for (const path of shells) {
    assertContains(path, [
      ":rules=\"mobile ? 'ccs' : 'rbc'\"",
      ":class=\"mobile ? 'w100 fw' : ''\"",
    ]);
  }
});
