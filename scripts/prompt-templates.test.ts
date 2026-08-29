import assert from "node:assert/strict";
import test from "node:test";

import { compilePromptDraft } from "../app/domain/promptRead.ts";
import { promptModules } from "../app/modules/registry.ts";
import { instantiatePromptTemplate } from "../app/templates/instantiate.ts";
import {
  getBuiltInPromptTemplate,
  listAvailablePromptTemplates,
  listBuiltInPromptTemplates,
} from "../app/templates/registry.ts";
import {
  createUserPromptTemplateFromDraft,
  deleteUserPromptTemplate,
  loadUserPromptTemplates,
  PROMPT_TEMPLATE_STORAGE_KEY,
  saveUserPromptTemplate,
} from "../app/templates/storage.ts";
import type { PromptTemplateStorage } from "../app/templates/types.ts";
import { normalizePromptTemplate } from "../app/templates/validation.ts";

class MemoryStorage implements PromptTemplateStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("built-in template registry starts with the curated LinkedIn profile snapshot", () => {
  const templates = listBuiltInPromptTemplates();
  assert.equal(templates.length, 1);

  const template = getBuiltInPromptTemplate("linkedin-profile");
  assert.ok(template);
  assert.equal(template.origin, "builtin");
  assert.equal(template.source?.kind, "wizard");
  assert.equal(template.source?.wizardId, "portrait");
  assert.equal(template.source?.wizardVersion, 2);
  assert.equal(template.draft.promptSettings.mode, "image_to_image");
  assert.equal(template.draft.promptSettings.aspectRatio, "common_portrait_4_5");
  assert.equal(template.draft.promptSettings.imageToImage.referenceUsage, "strict");
  assert.equal(
    template.draft.promptSettings.imageToImage.transformationStrength,
    "subtle",
  );
  assert.equal(template.draft.promptSettings.imageToImage.preserveIdentity, false);
});

test("LinkedIn built-in compiles from canonical Draft state into the validated profile recipe", () => {
  const template = getBuiltInPromptTemplate("linkedin-profile");
  assert.ok(template);

  const result = compilePromptDraft(template.draft, promptModules);
  const output = result.output;

  assert.match(output, /^\{person\} = person in \{reference\}$/m);
  assert.match(
    output,
    /^\{idea\} = A professional portrait of \{person\} with the following settings$/m,
  );
  assert.match(
    output,
    /^\{reference_usage\} = strictly follow the attached reference image\(s\)$/m,
  );
  assert.match(output, /^\{transformation_strength\} = subtle transformation$/m);
  assert.match(output, /^\{aspect\} = 4:5$/m);
  assert.match(output, /^\{framing\} = head-and-shoulders framing$/m);
  assert.match(output, /\{person\}: replace the source\/reference facial expression/);
  assert.match(output, /subtle intensity; relaxed eyes; relaxed brows; slight smile; confident expression/);
  assert.match(output, /\{person\}: replace the source\/reference pose with standing; weight shifted to one side; relaxed body tension/);
  assert.match(output, /controlled styling/);
  assert.match(output, /professional attire/);
  assert.match(output, /plain light gray studio backdrop/);
  assert.match(output, /broad area-light source from the camera-front direction/);
});

test("template instantiation deep-clones the canonical Draft snapshot", () => {
  const template = getBuiltInPromptTemplate("linkedin-profile");
  assert.ok(template);

  const first = instantiatePromptTemplate(template);
  const second = instantiatePromptTemplate(template);

  first.draft.promptSettings.idea = "changed only in first instance";
  first.draft.selectedModuleKeys.pop();

  assert.equal(
    second.draft.promptSettings.idea,
    "A professional portrait of {person} with the following settings",
  );
  assert.notDeepEqual(first.draft, second.draft);
  assert.equal(
    template.draft.promptSettings.idea,
    "A professional portrait of {person} with the following settings",
  );
});

test("user templates use isolated storage and round-trip canonical Draft snapshots", () => {
  const storage = new MemoryStorage();
  const builtin = getBuiltInPromptTemplate("linkedin-profile");
  assert.ok(builtin);

  const userTemplate = createUserPromptTemplateFromDraft(builtin.draft, {
    id: "my-linkedin",
    title: "My LinkedIn",
    description: "Personal profile starter",
    source: { kind: "create" },
    now: "2026-08-29T00:00:00.000Z",
  });

  saveUserPromptTemplate(userTemplate, storage);
  assert.ok(storage.getItem(PROMPT_TEMPLATE_STORAGE_KEY));

  const loaded = loadUserPromptTemplates(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0]?.id, "my-linkedin");
  assert.equal(loaded[0]?.origin, "user");
  assert.deepEqual(loaded[0]?.draft, userTemplate.draft);

  const available = listAvailablePromptTemplates(storage);
  assert.deepEqual(
    available.map((template) => template.id),
    ["linkedin-profile", "my-linkedin"],
  );

  assert.equal(deleteUserPromptTemplate("my-linkedin", storage), true);
  assert.deepEqual(loadUserPromptTemplates(storage), []);
});

test("template validation rejects malformed or wrong-version snapshots", () => {
  assert.equal(normalizePromptTemplate(null), null);
  assert.equal(
    normalizePromptTemplate({
      schemaVersion: 99,
      id: "bad",
      title: "Bad",
      origin: "builtin",
      draft: {},
    }),
    null,
  );
});
