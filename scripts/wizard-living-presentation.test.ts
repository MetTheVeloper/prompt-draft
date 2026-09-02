import assert from "node:assert/strict";
import test from "node:test";

import wizardEn from "../i18n/locales/wizard.en.ts";
import { portraitWizardV2Definition } from "../app/wizard/definition.ts";
import {
  buildPortraitLivingSentenceTokens,
  clearPortraitLivingPoseAnswers,
  createPortraitLivingSubjects,
  getPortraitLivingChapterProgress,
  getPortraitLivingCompositionPhase,
  getPortraitLivingLookState,
  getPortraitLivingPeopleState,
  setPortraitLivingCompositionPhase,
  setPortraitLivingLookState,
  setPortraitLivingPeopleState,
  type WizardLivingLocalizer,
} from "../app/wizard/portraitLivingPresentation.ts";
import {
  createFreshWizardSession,
  goToNextWizardStep,
  setWizardUserAnswer,
} from "../app/wizard/session.ts";

const messages = { wizard: wizardEn } as Record<string, unknown>;

function translate(
  key: string,
  params: Record<string, string | number> = {},
) {
  let current: unknown = messages;
  for (const part of key.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return key;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "string") return key;
  return current.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

const localizer: WizardLivingLocalizer = {
  t: translate,
  list: (items) => new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format([...items]),
};

function sentence(session: ReturnType<typeof createFreshWizardSession>) {
  return buildPortraitLivingSentenceTokens(session, localizer)
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

test("Living Sentence uses a user-selected Portrait direction instead of the canonical default", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = setWizardUserAnswer(session, "creationMode", "from_description");
  session = setWizardUserAnswer(
    session,
    "subjects",
    createPortraitLivingSubjects(1, "text_to_image"),
  );
  session = setWizardUserAnswer(session, "portraitIntent", "cinematic");

  assert.equal(
    sentence(session),
    "I want to create a cinematic portrait of one person",
  );
});

test("Living Sentence surfaces meaningful per-subject Look overrides without leaking subject ids", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const subjects = createPortraitLivingSubjects(2, "image_to_image");
  subjects[1] = { ...subjects[1]!, label: "Zahra" };

  session = setWizardUserAnswer(session, "creationMode", "from_image");
  session = setWizardUserAnswer(session, "subjects", subjects);
  session = setWizardUserAnswer(session, "portraitIntent", "fashion");
  session = setWizardUserAnswer(session, "expressionIntent", "natural");
  session = setWizardUserAnswer(session, "expressionSubjectOverrides", {
    [subjects[1]!.id]: { intent: "serious", options: {} },
  });

  assert.equal(
    sentence(session),
    "I want to transform my image into a fashion portrait featuring 2 people, with natural expressions; Zahra has a serious expression",
  );
  assert.equal(sentence(session).includes(subjects[1]!.id), false);
});

test("Living Sentence surfaces per-subject Pose overrides only when Pose is relevant", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  const subjects = createPortraitLivingSubjects(2, "image_to_image");
  subjects[1] = { ...subjects[1]!, label: "Zahra" };

  session = setWizardUserAnswer(session, "creationMode", "from_image");
  session = setWizardUserAnswer(session, "subjects", subjects);
  session = setWizardUserAnswer(session, "portraitIntent", "fashion");
  session = setWizardUserAnswer(session, "framingIntent", "half_body");
  session = setWizardUserAnswer(session, "poseIntent", "natural");
  session = setWizardUserAnswer(session, "poseSubjectOverrides", {
    [subjects[1]!.id]: { intent: "dynamic", options: {} },
  });

  assert.equal(
    sentence(session),
    "I want to transform my image into a fashion portrait featuring 2 people, at half body, in a natural pose; Zahra has a dynamic pose",
  );

  session = setWizardUserAnswer(session, "framingIntent", "headshot");
  assert.equal(sentence(session).includes("pose"), false);
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
  assert.equal(getPortraitLivingChapterProgress(session), 1);
});

test("Look presentation progress follows Expression Hair and Outfit micro-states", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "appearance",
  };

  assert.deepEqual(getPortraitLivingLookState(session), {
    domain: "expression",
    phase: "choice",
  });
  assert.equal(getPortraitLivingChapterProgress(session), 0);

  session = setPortraitLivingLookState(session, {
    domain: "expression",
    phase: "refine",
  });
  assert.equal(getPortraitLivingChapterProgress(session), 1 / 6);

  session = setPortraitLivingLookState(session, { domain: "hair", phase: "choice" });
  assert.equal(getPortraitLivingChapterProgress(session), 1 / 3);

  session = setPortraitLivingLookState(session, { domain: "hair", phase: "refine" });
  assert.equal(getPortraitLivingChapterProgress(session), 1 / 2);

  session = setPortraitLivingLookState(session, { domain: "outfit", phase: "choice" });
  assert.equal(getPortraitLivingChapterProgress(session), 2 / 3);

  session = setPortraitLivingLookState(session, { domain: "outfit", phase: "refine" });
  assert.equal(getPortraitLivingChapterProgress(session), 1);
});

test("Composition progress adapts to framing and Pose relevance", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "composition",
  };

  assert.equal(getPortraitLivingCompositionPhase(session), "framing");
  assert.equal(getPortraitLivingChapterProgress(session), 0);

  session = setWizardUserAnswer(session, "framingIntent", "half_body");
  assert.equal(getPortraitLivingCompositionPhase(session), "pose-choice");
  assert.equal(getPortraitLivingChapterProgress(session), 1 / 2);

  session = setPortraitLivingCompositionPhase(session, "pose-refine");
  session = setWizardUserAnswer(session, "poseIntent", "natural");
  assert.equal(getPortraitLivingChapterProgress(session), 1);

  session = setWizardUserAnswer(session, "framingIntent", "headshot");
  session = setPortraitLivingCompositionPhase(session, "framing");
  assert.equal(getPortraitLivingChapterProgress(session), 1);
});

test("Headshot branch cleanup removes stale Pose answers before Pose can become relevant again", () => {
  let session = createFreshWizardSession(portraitWizardV2Definition);
  session = setWizardUserAnswer(session, "poseIntent", "dynamic");
  session = setWizardUserAnswer(session, "poseOptions", { posture: "upright" });
  session = setWizardUserAnswer(session, "poseSubjectOverrides", {
    subject: { intent: "formal", options: {} },
  });

  session = clearPortraitLivingPoseAnswers(session);

  assert.equal(session.answers.poseIntent, undefined);
  assert.equal(session.answers.poseOptions, undefined);
  assert.equal(session.answers.poseSubjectOverrides, undefined);
});

test("Look state can recover from user-owned answers when older persisted sessions lack micro-state metadata", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "appearance",
  };
  session = setWizardUserAnswer(session, "expressionIntent", "warm");
  session = setWizardUserAnswer(session, "hairIntent", "editorial");

  assert.deepEqual(getPortraitLivingLookState(session), {
    domain: "hair",
    phase: "refine",
  });
});

test("Composition state can recover from user-owned answers when persisted sessions lack micro-state metadata", () => {
  let session = {
    ...createFreshWizardSession(portraitWizardV2Definition),
    currentStepId: "composition",
  };
  session = setWizardUserAnswer(session, "framingIntent", "full_body");
  assert.equal(getPortraitLivingCompositionPhase(session), "pose-choice");

  session = setWizardUserAnswer(session, "poseIntent", "formal");
  assert.equal(getPortraitLivingCompositionPhase(session), "pose-refine");
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
