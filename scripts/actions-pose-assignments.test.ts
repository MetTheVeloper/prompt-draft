import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerPoseAssignmentActions } from "../app/actions/poseAssignments.ts";
import {
  applyPromptPoseAssignmentPreset,
  createPromptPoseAssignment,
  deletePromptPoseAssignment,
  updatePromptPoseAssignment,
} from "../app/domain/poseAssignments.ts";
import { PoseModule } from "../app/modules/pose.freeform.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["pose"],
    moduleValues: {
      pose: {
        poseAssignments: [],
        customText: "",
      },
    },
    modulePanelStates: {
      pose: { isCustomMode: false, activePresetId: null },
    },
    promptSettings: {
      mode: "image_to_image",
      idea: "",
      subject: "",
      subjectType: "person",
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

function assignments(draft: PromptDraftState) {
  return draft.moduleValues.pose?.poseAssignments as any[];
}

function subjectSource(
  id = "subject-system",
  token = "{subject}",
  disabled = false,
): SemanticReferenceCatalogSource {
  return {
    label: "Main Subject",
    disabled,
    target: {
      kind: "system_variable",
      value: token,
      variableId: id,
      token,
      label: "Main Subject",
    },
  };
}

function createAssignmentFixture() {
  const created = createPromptPoseAssignment(createDraft(), PoseModule, {
    createAssignmentId: () => "pose-a",
    subjectSources: [subjectSource()],
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create pose fixture");
  return created.value.draft;
}

test("pose assignment create uses stable ID, first available exact subject target, and preserves caller", () => {
  const original = createDraft();
  const result = createPromptPoseAssignment(original, PoseModule, {
    createAssignmentId: () => "pose-a",
    subjectSources: [
      subjectSource("disabled", "{disabled}", true),
      subjectSource(),
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "pose-a");
  assert.equal(result.value.assignment?.targets[0]?.variableId, "subject-system");
  assert.deepEqual(result.value.assignment?.gestures, []);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(result.value.draft).length, 1);
});

test("pose payload update preserves authored freeform values and detaches active preset", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptPoseAssignmentPreset(
    draft,
    PoseModule,
    "pose-a",
    "neutral_standing",
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const result = updatePromptPoseAssignment(
    preset.value.draft,
    PoseModule,
    "pose-a",
    {
      torsoPosture: "spiral lean with asymmetric counterbalance",
      gestures: ["custom hand choreography"],
    },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, undefined);
  assert.equal(
    result.value.assignment?.torsoPosture,
    "spiral lean with asymmetric counterbalance",
  );
  assert.deepEqual(result.value.assignment?.gestures, [
    "custom hand choreography",
  ]);
});

test("pose target-only update keeps preset and resolves exact live target metadata", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptPoseAssignmentPreset(
    draft,
    PoseModule,
    "pose-a",
    "walking",
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const userSource: SemanticReferenceCatalogSource = {
    label: "Hero",
    target: {
      kind: "user_variable",
      value: "{hero}",
      variableId: "user-subject-1",
      token: "{hero}",
      label: "Hero Subject",
    },
  };
  const result = updatePromptPoseAssignment(
    preset.value.draft,
    PoseModule,
    "pose-a",
    {
      targets: [
        {
          kind: "user_variable",
          value: "old-token-is-not-identity",
          variableId: "user-subject-1",
        },
      ],
    },
    { subjectSources: [subjectSource(), userSource] },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "walking");
  assert.equal(result.value.assignment?.targets[0]?.value, "{hero}");
  assert.equal(result.value.assignment?.targets[0]?.label, "Hero Subject");
});

test("pose target mutation rejects new missing/unavailable refs but preserves exact persisted orphan", () => {
  const draft = createAssignmentFixture();
  const missing = updatePromptPoseAssignment(
    draft,
    PoseModule,
    "pose-a",
    {
      targets: [
        {
          kind: "user_variable",
          value: "{ghost}",
          variableId: "ghost-subject",
        },
      ],
    },
    { subjectSources: [subjectSource()] },
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "subject_assignment_target_missing");
  }

  const unavailable = updatePromptPoseAssignment(
    draft,
    PoseModule,
    "pose-a",
    {
      targets: [
        {
          kind: "system_variable",
          value: "{disabled}",
          variableId: "disabled-subject",
        },
      ],
    },
    { subjectSources: [subjectSource("disabled-subject", "{disabled}", true)] },
  );
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) {
    assert.equal(
      unavailable.issues[0]?.code,
      "subject_assignment_target_unavailable",
    );
  }

  const orphanDraft = createAssignmentFixture();
  (assignments(orphanDraft)[0] as any).targets = [
    {
      kind: "user_variable",
      value: "{deleted_subject}",
      variableId: "deleted-subject",
      label: "Deleted Subject",
    },
  ];
  const preserved = updatePromptPoseAssignment(
    orphanDraft,
    PoseModule,
    "pose-a",
    {
      targets: [
        {
          kind: "user_variable",
          value: "renamed-token-must-not-retarget",
          variableId: "deleted-subject",
        },
      ],
    },
    { subjectSources: [] },
  );
  assert.equal(preserved.ok, true);
  if (!preserved.ok) return;
  assert.equal(
    preserved.value.assignment?.targets[0]?.value,
    "{deleted_subject}",
  );
});

test("pose preset replaces preset-owned payload while preserving targets and additional details", () => {
  const draft = createAssignmentFixture();
  const authored = updatePromptPoseAssignment(
    draft,
    PoseModule,
    "pose-a",
    { additionalDetails: "Keep shoulders clearly visible" },
  );
  assert.equal(authored.ok, true);
  if (!authored.ok) return;

  const result = applyPromptPoseAssignmentPreset(
    authored.value.draft,
    PoseModule,
    "pose-a",
    "neutral_standing",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "neutral_standing");
  assert.equal(result.value.assignment?.basePosture, "standing");
  assert.equal(result.value.assignment?.torsoPosture, "upright");
  assert.deepEqual(result.value.assignment?.gestures, ["hands_at_sides"]);
  assert.equal(
    result.value.assignment?.additionalDetails,
    "Keep shoulders clearly visible",
  );
  assert.equal(result.value.assignment?.targets[0]?.variableId, "subject-system");

  const cleared = applyPromptPoseAssignmentPreset(
    result.value.draft,
    PoseModule,
    "pose-a",
    "",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.assignment?.presetId, undefined);
  assert.equal(cleared.value.assignment?.basePosture, "standing");
});

test("pose assignment mutations use exact stable IDs and reject identity conflicts", () => {
  const draft = createAssignmentFixture();
  const missing = deletePromptPoseAssignment(draft, PoseModule, "missing-pose");
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "pose_assignment_not_found");
  }

  const duplicate = createPromptPoseAssignment(draft, PoseModule, {
    createAssignmentId: () => "pose-a",
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(duplicate.issues[0]?.code, "pose_assignment_identity_conflict");
  }

  const unknownPreset = applyPromptPoseAssignmentPreset(
    draft,
    PoseModule,
    "pose-a",
    "does-not-exist",
  );
  assert.equal(unknownPreset.ok, false);
  if (!unknownPreset.ok) {
    assert.equal(unknownPreset.issues[0]?.code, "pose_preset_not_found");
  }
});

test("legacy pose assignment shape normalizes before exact stable-ID mutation", () => {
  const draft = createDraft();
  draft.moduleValues.pose = {
    poseAssignments: [
      {
        basePosture: "standing",
        gestures: ["arms_crossed"],
      },
    ] as any,
    customText: "",
  };

  const result = updatePromptPoseAssignment(
    draft,
    PoseModule,
    "pose-assignment-1",
    { bodyTension: "relaxed" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "pose-assignment-1");
  assert.equal(result.value.assignment?.bodyTension, "relaxed");
  assert.deepEqual(result.value.assignment?.targets, []);
});

test("registered Pose actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerPoseAssignmentActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "pose.assignment.create",
      "pose.assignment.update",
      "pose.assignment.delete",
      "pose.assignment.applyPreset",
    ],
  );

  const original = createDraft();
  const created = await registry.execute(
    "pose.assignment.create",
    {
      draft: original,
      modules: [PoseModule],
      environment: { subjectAssignmentTargets: [subjectSource()] },
      idFactory: { poseAssignment: () => "action-pose" },
    },
    {},
  );
  assert.equal(created.ok, true);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(created.draft).length, 1);

  const failed = await registry.execute(
    "pose.assignment.update",
    {
      draft: created.draft,
      modules: [PoseModule],
      environment: { subjectAssignmentTargets: [subjectSource()] },
    },
    {
      assignmentId: "missing-pose",
      basePosture: "standing",
    },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, created.draft);
});
