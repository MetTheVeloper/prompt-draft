import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_ACTION_CONTRACT,
  createPublicActionRegistry,
} from "../app/actions/public.ts";

const EXPECTED_PUBLIC_ACTION_IDS_V1 = [
  "module.activate",
  "module.deactivate",
  "module.field.set",
  "module.preset.apply",
  "module.customMode.set",

  "variable.create",
  "variable.update",
  "variable.duplicate",
  "variable.delete",
  "variable.setEnabled",

  "moduleEntity.create",
  "moduleEntity.update",
  "moduleEntity.duplicate",
  "moduleEntity.delete",
  "moduleEntity.setEnabled",
  "moduleEntity.setInheritance",
  "moduleEntity.field.set",
  "moduleEntity.field.clear",
  "moduleEntity.preset.apply",

  "typography.group.create",
  "typography.group.update",
  "typography.group.delete",
  "typography.group.move",
  "typography.text.create",
  "typography.text.update",
  "typography.text.delete",
  "typography.text.move",

  "scene.create",
  "scene.update",
  "scene.duplicate",
  "scene.delete",
  "scene.setEnabled",
  "scene.component.attach",
  "scene.component.detach",
  "scene.component.replace",

  "layout.region.create",
  "layout.region.update",
  "layout.region.duplicate",
  "layout.region.delete",
  "layout.region.move",
  "layout.grid.update",
  "layout.region.assignScene",
  "layout.region.clearScene",

  "colorPalette.assignment.create",
  "colorPalette.assignment.delete",
  "colorPalette.assignment.scope.set",
  "colorPalette.assignment.applyPreset",
  "colorPalette.swatch.add",
  "colorPalette.swatch.setLiteral",
  "colorPalette.swatch.setVariable",
  "colorPalette.swatch.delete",

  "texture.assignment.create",
  "texture.assignment.delete",
  "texture.assignment.scope.set",
  "texture.assignment.applyPreset",
  "texture.assignment.property.set",
  "texture.assignment.conditions.set",

  "pose.assignment.create",
  "pose.assignment.update",
  "pose.assignment.delete",
  "pose.assignment.applyPreset",

  "expression.assignment.create",
  "expression.assignment.update",
  "expression.assignment.delete",
  "expression.assignment.applyPreset",

  "lighting.source.create",
  "lighting.source.update",
  "lighting.source.delete",

  "effects.layer.create",
  "effects.layer.update",
  "effects.layer.delete",

  "hair.style.create",
  "hair.style.update",
  "hair.style.duplicate",
  "hair.style.delete",
  "hair.style.setSource",
  "hair.style.setProperty",
  "hair.style.applyPreset",
  "hair.component.create",
  "hair.component.update",
  "hair.component.setProperty",
  "hair.component.duplicate",
  "hair.component.delete",

  "outfit.set.create",
  "outfit.set.update",
  "outfit.set.duplicate",
  "outfit.set.delete",
  "outfit.set.applyPreset",
  "outfit.item.create",
  "outfit.item.update",
  "outfit.item.setSource",
  "outfit.item.setProperty",
  "outfit.item.duplicate",
  "outfit.item.delete",
  "outfit.relation.create",
  "outfit.relation.update",
  "outfit.relation.delete",

  "prompt.validate",
  "prompt.compile",
] as const;

test("public v1 action IDs are frozen as an exact compatibility set", () => {
  assert.equal(PUBLIC_ACTION_CONTRACT, "prompt-draft.actions.v1");
  assert.equal(EXPECTED_PUBLIC_ACTION_IDS_V1.length, 99);

  const actual = createPublicActionRegistry()
    .list()
    .map((action) => action.id)
    .sort();
  const expected = [...EXPECTED_PUBLIC_ACTION_IDS_V1].sort();

  assert.deepEqual(actual, expected);
});
