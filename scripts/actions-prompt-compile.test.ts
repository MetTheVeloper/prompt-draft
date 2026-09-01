import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../app/actions/registry.ts";
import { registerPromptReadActions } from "../app/actions/promptRead.ts";
import { compilePromptDraft } from "../app/domain/promptRead.ts";
import type { PromptDraftState } from "../app/modules/promptDraft.types.ts";
import type {
  PromptKeyModule,
  PromptVariable,
  PromptVariableType,
} from "../app/modules/types.ts";
import {
  createDefaultPromptSettings,
  type ModuleOutputMap,
} from "../app/utils/compilePromptCore.ts";
import { compilePromptOutputPure } from "../app/utils/compilePromptPure.ts";

const styleModule: PromptKeyModule = {
  key: "style",
  fields: {
    finish: {
      id: "finish",
      type: "select",
      default: "",
      options: [
        { value: "soft", promptText: "soft focus" },
        { value: "sharp", promptText: "crisp detail" },
      ],
    },
    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      isOverride: true,
    },
  },
  compile: {
    overrideField: "customText",
  },
};

const variablesModule: PromptKeyModule = {
  key: "variables",
  fields: {
    variables: {
      id: "variables",
      type: "variables",
      default: [],
    },
  },
};

const sceneModule: PromptKeyModule = {
  key: "scene",
  fields: {},
};

const layoutModule: PromptKeyModule = {
  key: "layout",
  fields: {},
};

function createDraft(
  overrides: Partial<PromptDraftState> = {},
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: [],
    moduleValues: {},
    modulePanelStates: {},
    promptSettings: {
      ...createDefaultPromptSettings(),
      mode: "text_to_image",
      idea: "portrait",
      subject: "person",
    },
    outputFormat: "modular",
    ...overrides,
  };
}

function variable(
  id: string,
  key: string,
  value: string,
  type: PromptVariableType,
): PromptVariable {
  return {
    id,
    key,
    value,
    type,
    source: "user",
    enabled: true,
  };
}

test("prompt compile defaults to persisted format and canonical active module outputs", () => {
  const draft = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: { finish: "sharp" },
    },
  });

  const result = compilePromptDraft(draft, [styleModule]);

  assert.equal(result.format, "modular");
  assert.match(result.output, /^\{mode\} = text to image/m);
  assert.match(result.output, /^\{style\} = crisp detail$/m);
});

test("explicit prompt format override is read-only and JSON uses canonical compiled outputs", () => {
  const draft = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: { finish: "soft" },
    },
    outputFormat: "modular",
  });
  const snapshot = JSON.parse(JSON.stringify(draft));

  const result = compilePromptDraft(draft, [styleModule], "json");
  const parsed = JSON.parse(result.output) as {
    modules: Record<string, unknown>;
  };

  assert.equal(result.format, "json");
  assert.equal(parsed.modules.style, "soft focus");
  assert.deepEqual(draft, snapshot);
  assert.equal(draft.outputFormat, "modular");
});

test("typed user Subject ownership suppresses only the generated subject definition", () => {
  const draft = createDraft({
    selectedModuleKeys: ["variables"],
    moduleValues: {
      variables: {
        variables: [
          variable("subject-variable", "hero", "the authored hero", "subject"),
        ],
      },
    },
    promptSettings: {
      ...createDefaultPromptSettings(),
      mode: "image_to_image",
      idea: "portrait",
      subject: "person in a blue coat",
      subjectType: "person",
    },
  });

  const result = compilePromptDraft(draft, [variablesModule]);

  assert.match(result.output, /^\{hero\} = the authored hero$/m);
  assert.doesNotMatch(result.output, /^\{subject\} =/m);
  assert.match(result.output, /^\{reference\} = attached reference image\(s\)$/m);
});

test("typed user Reference ownership suppresses generated subject and reference definitions", () => {
  const draft = createDraft({
    selectedModuleKeys: ["variables"],
    moduleValues: {
      variables: {
        variables: [
          variable("reference-variable", "asset", "the authored reference", "reference"),
        ],
      },
    },
    promptSettings: {
      ...createDefaultPromptSettings(),
      mode: "image_to_image",
      idea: "portrait",
      subject: "person",
      subjectType: "person",
    },
  });

  const result = compilePromptDraft(draft, [variablesModule]);

  assert.match(result.output, /^\{asset\} = the authored reference$/m);
  assert.doesNotMatch(result.output, /^\{subject\} =/m);
  assert.doesNotMatch(result.output, /^\{reference\} =/m);
});

test("pure final compiler injects the Scene/Layout rule and modular Scene alias", () => {
  const outputs: ModuleOutputMap = {
    scene: "• {scene_one} = portrait scene",
    layout: { regions: [] },
  };
  const settings = {
    ...createDefaultPromptSettings(),
    mode: "text_to_image" as const,
    idea: "portrait",
    subject: "person",
    globalRules: "keep detail",
  };

  const result = compilePromptOutputPure(
    [sceneModule, layoutModule],
    outputs,
    settings,
    "modular",
  );

  assert.match(
    result.output,
    /^\{rules\} = keep detail Match each scene's dimensions exactly to its corresponding region in \{layout\}\.$/m,
  );
  assert.match(result.output, /^\{scenes\} =\n• \{one\} = portrait scene$/m);
});

test("pure final compiler applies the JSON scenes presentation alias", () => {
  const outputs: ModuleOutputMap = {
    scene: "• {scene_one} = portrait scene",
    layout: { regions: [] },
  };
  const result = compilePromptOutputPure(
    [sceneModule, layoutModule],
    outputs,
    createDraft().promptSettings,
    "json",
  );
  const parsed = JSON.parse(result.output) as {
    modules: Record<string, unknown>;
  };

  assert.equal(Object.prototype.hasOwnProperty.call(parsed.modules, "scene"), false);
  assert.equal(parsed.modules.scenes, "• {scene_one} = portrait scene");
});

test("prompt.compile returns read data without mutating the caller draft", async () => {
  const registry = registerPromptReadActions(new ActionRegistry());
  const original = createDraft({
    selectedModuleKeys: ["style"],
    moduleValues: {
      style: { finish: "sharp" },
    },
  });
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = await registry.execute(
    "prompt.compile",
    {
      draft: original,
      modules: [styleModule],
    },
    { format: "natural" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const data = result.data as ReturnType<typeof compilePromptDraft>;
  assert.equal(data.format, "natural");
  assert.match(data.output, /Create an image/);
  assert.deepEqual(original, snapshot);
  assert.notEqual(result.draft, original);
});

test("prompt read registry exposes stable IDs and invalid compile format is atomic", async () => {
  const registry = registerPromptReadActions(new ActionRegistry());
  assert.deepEqual(
    registry.list().map((action) => action.id).sort(),
    ["prompt.compile", "prompt.validate"],
  );

  const original = createDraft();
  const result = await registry.execute(
    "prompt.compile",
    {
      draft: original,
      modules: [styleModule],
    },
    { format: "xml" } as never,
  );

  assert.equal(result.ok, false);
  assert.equal(result.draft, original);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "action_input_invalid_enum");
  }
});
