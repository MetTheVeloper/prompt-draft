import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerExpressionAssignmentActions } from "../app/actions/expressionAssignments.ts";
import {
  applyPromptExpressionAssignmentPreset,
  createPromptExpressionAssignment,
  deletePromptExpressionAssignment,
  updatePromptExpressionAssignment,
} from "../app/domain/expressionAssignments.ts";
import { ExpressionModule } from "../app/modules/expression.freeform.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type { SemanticReferenceCatalogSource } from "../app/utils/semanticReferenceCatalog.ts";

function createDraft(overrides: Partial<PromptDraftState> = {}): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: ["expression"],
    moduleValues: {
      expression: {
        expressionAssignments: [],
        customText: "",
      },
    },
    modulePanelStates: {
      expression: { isCustomMode: false, activePresetId: null },
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
  return draft.moduleValues.expression?.expressionAssignments as any[];
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
  const created = createPromptExpressionAssignment(
    createDraft(),
    ExpressionModule,
    {
      createAssignmentId: () => "expression-a",
      subjectSources: [subjectSource()],
    },
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("failed to create expression fixture");
  return created.value.draft;
}

test("expression assignment create uses stable ID, first available exact subject target, and preserves caller", () => {
  const original = createDraft();
  const result = createPromptExpressionAssignment(original, ExpressionModule, {
    createAssignmentId: () => "expression-a",
    subjectSources: [
      subjectSource("disabled", "{disabled}", true),
      subjectSource(),
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "expression-a");
  assert.equal(result.value.assignment?.targets[0]?.variableId, "subject-system");
  assert.equal(result.value.assignment?.coreExpression, "");
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(result.value.draft).length, 1);
});

test("expression payload update preserves authored strings and detaches active preset", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptExpressionAssignmentPreset(
    draft,
    ExpressionModule,
    "expression-a",
    "gentle_smile",
  );
  assert.equal(preset.ok, true);
  if (!preset.ok) return;

  const result = updatePromptExpressionAssignment(
    preset.value.draft,
    ExpressionModule,
    "expression-a",
    {
      coreExpression: "quietly triumphant but guarded",
      intensity: "barely perceptible",
      eyeState: "one eye softly narrowed",
    },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, undefined);
  assert.equal(
    result.value.assignment?.coreExpression,
    "quietly triumphant but guarded",
  );
  assert.equal(result.value.assignment?.intensity, "barely perceptible");
  assert.equal(result.value.assignment?.eyeState, "one eye softly narrowed");
});

test("expression target-only update keeps preset and resolves exact live target metadata", () => {
  const draft = createAssignmentFixture();
  const preset = applyPromptExpressionAssignmentPreset(
    draft,
    ExpressionModule,
    "expression-a",
    "warm_smile",
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
  const result = updatePromptExpressionAssignment(
    preset.value.draft,
    ExpressionModule,
    "expression-a",
    {
      targets: [
        {
          kind: "user_variable",
          value: "stale-token-is-not-identity",
          variableId: "user-subject-1",
        },
      ],
    },
    { subjectSources: [subjectSource(), userSource] },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "warm_smile");
  assert.equal(result.value.assignment?.targets[0]?.value, "{hero}");
  assert.equal(result.value.assignment?.targets[0]?.label, "Hero Subject");
});

test("expression target mutation rejects new missing/unavailable refs but preserves exact persisted orphan", () => {
  const draft = createAssignmentFixture();
  const missing = updatePromptExpressionAssignment(
    draft,
    ExpressionModule,
    "expression-a",
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

  const unavailable = updatePromptExpressionAssignment(
    draft,
    ExpressionModule,
    "expression-a",
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
  const preserved = updatePromptExpressionAssignment(
    orphanDraft,
    ExpressionModule,
    "expression-a",
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

test("expression preset replaces preset-owned payload while preserving targets and additional details", () => {
  const draft = createAssignmentFixture();
  const authored = updatePromptExpressionAssignment(
    draft,
    ExpressionModule,
    "expression-a",
    { additionalDetails: "Keep the smile asymmetric" },
  );
  assert.equal(authored.ok, true);
  if (!authored.ok) return;

  const result = applyPromptExpressionAssignmentPreset(
    authored.value.draft,
    ExpressionModule,
    "expression-a",
    "shocked",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.presetId, "shocked");
  assert.equal(result.value.assignment?.coreExpression, "surprised");
  assert.equal(result.value.assignment?.intensity, "pronounced");
  assert.equal(result.value.assignment?.eyeState, "wide");
  assert.equal(result.value.assignment?.browState, "raised");
  assert.equal(result.value.assignment?.mouthState, "open");
  assert.equal(
    result.value.assignment?.additionalDetails,
    "Keep the smile asymmetric",
  );
  assert.equal(result.value.assignment?.targets[0]?.variableId, "subject-system");

  const cleared = applyPromptExpressionAssignmentPreset(
    result.value.draft,
    ExpressionModule,
    "expression-a",
    "",
  );
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.value.assignment?.presetId, undefined);
  assert.equal(cleared.value.assignment?.coreExpression, "surprised");
});

test("expression assignment mutations use exact stable IDs and reject identity conflicts", () => {
  const draft = createAssignmentFixture();
  const missing = deletePromptExpressionAssignment(
    draft,
    ExpressionModule,
    "missing-expression",
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.issues[0]?.code, "expression_assignment_not_found");
  }

  const duplicate = createPromptExpressionAssignment(draft, ExpressionModule, {
    createAssignmentId: () => "expression-a",
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(
      duplicate.issues[0]?.code,
      "expression_assignment_identity_conflict",
    );
  }

  const unknownPreset = applyPromptExpressionAssignmentPreset(
    draft,
    ExpressionModule,
    "expression-a",
    "does-not-exist",
  );
  assert.equal(unknownPreset.ok, false);
  if (!unknownPreset.ok) {
    assert.equal(unknownPreset.issues[0]?.code, "expression_preset_not_found");
  }
});

test("legacy expression assignment shape normalizes before exact stable-ID mutation", () => {
  const draft = createDraft();
  draft.moduleValues.expression = {
    expressionAssignments: [
      {
        coreExpression: "serious",
        mouthState: "neutral",
      },
    ] as any,
    customText: "",
  };

  const result = updatePromptExpressionAssignment(
    draft,
    ExpressionModule,
    "expression-assignment-1",
    { browState: "furrowed" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.assignment?.id, "expression-assignment-1");
  assert.equal(result.value.assignment?.browState, "furrowed");
  assert.deepEqual(result.value.assignment?.targets, []);
});

test("registered Expression actions expose stable IDs and failures remain atomic", async () => {
  const registry = registerExpressionAssignmentActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((item) => item.id),
    [
      "expression.assignment.create",
      "expression.assignment.update",
      "expression.assignment.delete",
      "expression.assignment.applyPreset",
    ],
  );

  const original = createDraft();
  const created = await registry.execute(
    "expression.assignment.create",
    {
      draft: original,
      modules: [ExpressionModule],
      environment: { subjectAssignmentTargets: [subjectSource()] },
      idFactory: { expressionAssignment: () => "action-expression" },
    },
    {},
  );
  assert.equal(created.ok, true);
  assert.equal(assignments(original).length, 0);
  assert.equal(assignments(created.draft).length, 1);

  const failed = await registry.execute(
    "expression.assignment.update",
    {
      draft: created.draft,
      modules: [ExpressionModule],
      environment: { subjectAssignmentTargets: [subjectSource()] },
    },
    {
      assignmentId: "missing-expression",
      coreExpression: "happy",
    },
  );
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.draft, created.draft);
});
