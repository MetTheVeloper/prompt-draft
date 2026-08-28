import assert from "node:assert/strict";
import test from "node:test";

import { invokePublicAction } from "../app/actions/public.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import { createDefaultPromptSettings } from "../app/utils/compilePromptCore.ts";
import { createPromptDraftState } from "../app/utils/promptDraftState.ts";

function createDraft(): PromptDraftState {
  return createPromptDraftState(createDefaultPromptSettings());
}

function context(draft: PromptDraftState) {
  return {
    draft,
    modules: [],
  };
}

test("prompt.settings.update covers the canonical Setup aggregate atomically", async () => {
  const original = createDraft();
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: {
        mode: "text_to_image",
        idea: "Editorial portrait",
        subject: "a confident creative director",
        subjectType: "person",
        aspectRatio: "common_portrait_4_5",
        globalRules: "keep the face unobstructed",
        imageToImage: {
          referenceUsage: "strict",
          transformationStrength: "strong",
          preserveMainSubject: false,
          preserveIdentity: false,
          preservePose: true,
          preserveOutfit: true,
          preserveComposition: false,
          preserveColors: true,
          preserveMaterials: true,
          preserveLighting: true,
        },
      },
    },
    context(original),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(original, snapshot);
  assert.notEqual(result.draft, original);
  assert.deepEqual(result.draft.promptSettings, {
    mode: "text_to_image",
    idea: "Editorial portrait",
    subject: "a confident creative director",
    subjectType: "person",
    aspectRatio: "common_portrait_4_5",
    globalRules: "keep the face unobstructed",
    imageToImage: {
      referenceUsage: "strict",
      transformationStrength: "strong",
      preserveMainSubject: false,
      preserveIdentity: false,
      preservePose: true,
      preserveOutfit: true,
      preserveComposition: false,
      preserveColors: true,
      preserveMaterials: true,
      preserveLighting: true,
    },
  });
});

test("prompt.settings.update partially merges nested image-to-image settings", async () => {
  const original = createDraft();

  const result = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: {
        imageToImage: {
          preservePose: true,
          preserveColors: true,
        },
      },
    },
    context(original),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.draft.promptSettings.imageToImage.preservePose, true);
  assert.equal(result.draft.promptSettings.imageToImage.preserveColors, true);
  assert.equal(result.draft.promptSettings.imageToImage.preserveIdentity, true);
  assert.equal(result.draft.promptSettings.imageToImage.referenceUsage, "balanced");
  assert.equal(result.draft.promptSettings.mode, original.promptSettings.mode);
});

test("prompt.settings.update accepts intentional empty text values used by Setup reset semantics", async () => {
  const original = createDraft();
  original.promptSettings.idea = "before";
  original.promptSettings.subject = "before";
  original.promptSettings.globalRules = "before";

  const result = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: {
        idea: "",
        subject: "",
        globalRules: "",
      },
    },
    context(original),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.promptSettings.idea, "");
  assert.equal(result.draft.promptSettings.subject, "");
  assert.equal(result.draft.promptSettings.globalRules, "");
});

test("prompt.settings.update rejects an empty patch and preserves caller Draft", async () => {
  const original = createDraft();

  const result = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: {},
    },
    context(original),
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  if (result.ok) return;
  assert.equal(result.issues[0]?.code, "prompt_settings_update_empty");
});

test("prompt.settings.update schema rejects invalid enums and unknown properties atomically", async () => {
  const original = createDraft();

  const invalidMode = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: { mode: "video_to_video" },
    },
    context(original),
  );
  assert.equal(invalidMode.ok, false);
  assert.equal(invalidMode.draft, original);
  if (!invalidMode.ok) {
    assert.equal(invalidMode.issues[0]?.code, "action_input_invalid_enum");
  }

  const invalidAspectRatio = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: { aspectRatio: "unknown_ratio" },
    },
    context(original),
  );
  assert.equal(invalidAspectRatio.ok, false);
  assert.equal(invalidAspectRatio.draft, original);
  if (!invalidAspectRatio.ok) {
    assert.equal(invalidAspectRatio.issues[0]?.code, "action_input_invalid_enum");
  }

  const unknownNested = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: { imageToImage: { preserveEverything: true } },
    },
    context(original),
  );
  assert.equal(unknownNested.ok, false);
  assert.equal(unknownNested.draft, original);
  if (!unknownNested.ok) {
    assert.equal(unknownNested.issues[0]?.code, "action_input_unknown_property");
  }
});

test("prompt.outputFormat.set changes only the persisted Output selection", async () => {
  const original = createDraft();
  const settingsSnapshot = JSON.parse(JSON.stringify(original.promptSettings));

  const result = await invokePublicAction(
    {
      actionId: "prompt.outputFormat.set",
      input: { format: "natural" },
    },
    context(original),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.outputFormat, "natural");
  assert.deepEqual(result.draft.promptSettings, settingsSnapshot);
  assert.equal(original.outputFormat, "modular");
});

test("prompt.outputFormat.set rejects unsupported formats atomically", async () => {
  const original = createDraft();

  const result = await invokePublicAction(
    {
      actionId: "prompt.outputFormat.set",
      input: { format: "xml" },
    },
    context(original),
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  if (result.ok) return;
  assert.equal(result.issues[0]?.code, "action_input_invalid_enum");
});

test("prompt.validate and prompt.compile consume settings/output mutated through public Actions", async () => {
  const original = createDraft();

  const settingsResult = await invokePublicAction(
    {
      actionId: "prompt.settings.update",
      input: {
        mode: "text_to_image",
        idea: "",
        subject: "",
      },
    },
    context(original),
  );
  assert.equal(settingsResult.ok, true);
  if (!settingsResult.ok) return;

  const validationResult = await invokePublicAction(
    { actionId: "prompt.validate", input: {} },
    context(settingsResult.draft),
  );
  assert.equal(validationResult.ok, true);
  if (!validationResult.ok) return;
  const validationData = validationResult.data as {
    issues: Array<{ code: string }>;
  };
  assert.equal(
    validationData.issues.some(
      (issue) => issue.code === "text_to_image_missing_context",
    ),
    true,
  );

  const outputResult = await invokePublicAction(
    {
      actionId: "prompt.outputFormat.set",
      input: { format: "json" },
    },
    context(settingsResult.draft),
  );
  assert.equal(outputResult.ok, true);
  if (!outputResult.ok) return;

  const compileResult = await invokePublicAction(
    { actionId: "prompt.compile", input: {} },
    context(outputResult.draft),
  );
  assert.equal(compileResult.ok, true);
  if (!compileResult.ok) return;
  const compileData = compileResult.data as { format: string };
  assert.equal(compileData.format, "json");
});
