import assert from "node:assert/strict";
import test from "node:test";

import type {
  PromptDraftCollection,
  PromptDraftRecord,
} from "../app/modules/promptDraft.types.ts";
import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import { createWizardDraftHandoff } from "../app/wizard/hostDraft.ts";
import { createPortraitLivingSubjects } from "../app/wizard/portraitLivingPresentation.ts";
import { resolveWizardRuntime } from "../app/wizard/registry.ts";
import {
  createFreshWizardSession,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";
import { createDefaultPromptSettings } from "../app/utils/compilePromptCore.ts";
import {
  clonePromptDraftState,
  createPromptDraftState,
} from "../app/utils/promptDraftState.ts";

function answer(
  session: ReturnType<typeof createFreshWizardSession>,
  id: string,
  value: unknown,
) {
  return setWizardUserAnswer(session, id, value);
}

function completedPortraitSession() {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = answer(session, "creationMode", "from_description");
  session = answer(
    session,
    "subjects",
    createPortraitLivingSubjects(1, "text_to_image"),
  );
  session = answer(session, "portraitIntent", "professional");
  session = answer(session, "framingIntent", "headshot");
  session = answer(session, "environmentType", "studio");
  session = answer(session, "lightingIntent", "clean");
  session = answer(session, "aspectRatio", "4:5");
  return { ...session, currentStepId: "review" };
}

test("Portrait runtime completion exposes the canonical compiled prompt preview without mutating the Wizard source draft", async () => {
  const runtime = resolveWizardRuntime("portrait");
  assert.ok(runtime);
  if (!runtime) return;

  const session = completedPortraitSession();
  const before = JSON.parse(JSON.stringify(session.workingDraft));
  const result = await runtime.complete(session);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.ok(result.promptPreview.trim().length > 0);
  assert.deepEqual(session.workingDraft, before);
  assert.notEqual(result.finalDraft, session.workingDraft);
  assert.ok(result.finalDraft.selectedModuleKeys.includes("framing"));
  assert.ok(result.finalDraft.selectedModuleKeys.includes("background"));
  assert.ok(result.finalDraft.selectedModuleKeys.includes("lighting"));
});

test("Create handoff prepends and selects a new Draft without overwriting the existing Create collection or finalDraft input", () => {
  const existingDraft = createPromptDraftState(createDefaultPromptSettings());
  existingDraft.promptSettings.idea = "Existing Create draft";
  const existingRecord: PromptDraftRecord = {
    ...clonePromptDraftState(existingDraft),
    id: "draft-existing",
    title: "Existing",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
  const collection: PromptDraftCollection = {
    version: 1,
    activeDraftId: existingRecord.id,
    drafts: [existingRecord],
  };
  const collectionBefore = JSON.parse(JSON.stringify(collection));

  const finalDraft = createPromptDraftState(createDefaultPromptSettings());
  finalDraft.promptSettings.idea = "Wizard direction";
  const finalBefore = JSON.parse(JSON.stringify(finalDraft));

  const result = createWizardDraftHandoff(collection, finalDraft, {
    id: "draft-wizard",
    now: "2026-09-02T10:00:00.000Z",
    title: " Portrait of Met ",
  });

  assert.equal(result.id, "draft-wizard");
  assert.equal(result.collection.activeDraftId, "draft-wizard");
  assert.equal(result.collection.drafts.length, 2);
  assert.equal(result.collection.drafts[0]?.id, "draft-wizard");
  assert.equal(result.collection.drafts[0]?.title, "Portrait of Met");
  assert.equal(
    result.collection.drafts[0]?.promptSettings.idea,
    "Wizard direction",
  );
  assert.equal(result.collection.drafts[1]?.id, "draft-existing");
  assert.deepEqual(collection, collectionBefore);
  assert.deepEqual(finalDraft, finalBefore);

  result.collection.drafts[0]!.promptSettings.idea = "Changed after handoff";
  assert.equal(finalDraft.promptSettings.idea, "Wizard direction");
});
