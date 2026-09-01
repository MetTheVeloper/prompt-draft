import assert from "node:assert/strict";
import test from "node:test";

import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  buildPortraitLivingSentenceTokens,
  createPortraitLivingSubjects,
  getPortraitLivingChapterProgress,
  getPortraitLivingPeopleState,
  setPortraitLivingPeopleState,
} from "../app/wizard/portraitLivingPresentation.ts";
import {
  createFreshWizardSession,
  goToNextWizardStep,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

function sentence(session: ReturnType<typeof createFreshWizardSession>) {
  return buildPortraitLivingSentenceTokens(session)
    .map((token) => token.text)
    .join("");
}

test("Living Sentence ignores canonical defaults until the user has expressed that intent", () => {
  const session = createFreshWizardSession(portraitWizardV2Definition);

  assert.equal(session.answers.portraitIntent?.source, "default");
  assert.equal(session.answers.subjects?.source, "default");
  assert.equal(sentence(session), "I want to...");
});

test("Living Sentence recomposes from user-owned creation mode and people answers", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = setWizardUserAnswer(session, "creationMode", "from_image");
  session = setWizardUserAnswer(
    session,
    "subjects",
    createPortraitLivingSubjects(3, "image_to_image"),
  );

  assert.equal(
    sentence(session),
    "I want to transform my image into a portrait featuring 3 people",
  );
});

test("People presentation progress follows the relevant micro-states instead of a global percentage", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = goToNextWizardStep(session, portraitWizardV2Definition);

  assert.equal(session.currentStepId, "subjects");
  assert.equal(getPortraitLivingPeopleState(session), "choice");
  assert.equal(getPortraitLivingChapterProgress(session), 0);

  session = setPortraitLivingPeopleState(session, "count");
  assert.equal(getPortraitLivingChapterProgress(session), 1 / 3);

  session = setPortraitLivingPeopleState(session, "configure");
  assert.equal(getPortraitLivingChapterProgress(session), 2 / 3);
});

test("People helpers create canonical subjects with mode-appropriate definitions", () => {
  const imageSubjects = createPortraitLivingSubjects(2, "image_to_image");
  const textSubjects = createPortraitLivingSubjects(2, "text_to_image");

  assert.equal(imageSubjects.length, 2);
  assert.deepEqual(imageSubjects.map((subject) => subject.definition), [
    { strategy: "sequence" },
    { strategy: "sequence" },
  ]);
  assert.deepEqual(textSubjects.map((subject) => subject.definition), [
    { strategy: "semantic", descriptor: "person" },
    { strategy: "semantic", descriptor: "person" },
  ]);
  assert.notEqual(imageSubjects[0]?.id, imageSubjects[1]?.id);
  assert.notEqual(textSubjects[0]?.key, textSubjects[1]?.key);
});
