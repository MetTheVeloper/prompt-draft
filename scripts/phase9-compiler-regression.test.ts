import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ModuleValues, PromptKeyModule } from "../app/modules/types";
import { compileCameraModule } from "../app/utils/compileCamera";
import { compileFormModule, compileFormScalar } from "../app/utils/compileForm";
import { compileModule } from "../app/utils/compileModules";
import { compileSceneResourceModule } from "../app/utils/compileSceneResource";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = "83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c";
const promptCompileBaseline = "73f28f35e49d68d0ac285f4e05bbf4583a2a2931";

function committedSource(ref: string, path: string) {
  return execFileSync("git", ["show", `${ref}:${path}`], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function assertCommitPathUnchanged(path: string, ref = baseline) {
  execFileSync("git", ["diff", "--quiet", ref, "HEAD", "--", path], {
    cwd: repoRoot,
  });
}

function scalarModule(key: string): PromptKeyModule {
  return {
    key,
    fields: {
      tone: {
        id: "tone",
        type: "select",
        default: "neutral",
        options: [
          { value: "neutral", promptText: "neutral tone" },
          { value: "warm", promptText: "warm tone" },
        ],
      },
      detail: {
        id: "detail",
        type: "text",
        default: "",
      },
    },
    compile: {
      separator: ", ",
    },
  };
}

function withUnusedEntity(values: ModuleValues): ModuleValues {
  return {
    ...values,
    entities: [
      {
        id: "entity-unused",
        key: "unused",
        name: "Unused configuration",
        enabled: true,
        payload: {
          tone: "warm",
          detail: "entity-only detail",
        },
      },
    ],
  };
}

function expectedHeadlessPromptCore() {
  return committedSource(baseline, "app/utils/compilePrompt.ts")
    .replace("// app/utils/compilePrompt.ts", "// app/utils/compilePromptCore.ts")
    .replace(
      "import { usePromptVariables } from '~/composables/prompt/usePromptVariables'\n",
      "",
    )
    .replace(
      "import { usePromptSubjectContext } from '~/composables/prompt/usePromptSubjectContext'\n",
      "",
    )
    .replace(
      "function getSystemPromptVariables(\n",
      "export function getSystemPromptVariables(\n",
    )
    .replace(
      /\nfunction syncActiveSystemPromptVariables\([\s\S]*?\nfunction compileModularOutput\(/,
      "\nfunction compileModularOutput(",
    )
    .replace(
      "  syncActivePromptSubjectContext(settings)\n  syncActiveSystemPromptVariables(settings)\n\n",
      "",
    );
}

test("prompt compile extraction does not modify draft persistence/import-export", () => {
  assertCommitPathUnchanged("app/pages/create.vue", promptCompileBaseline);
});

test("legacy Layout/Pose/Expression/Color/Texture compilers are unchanged from baseline", () => {
  [
    "app/utils/compileLayout.ts",
    "app/utils/compilePose.ts",
    "app/utils/compileExpression.ts",
    "app/utils/compileColorPalette.ts",
    "app/utils/compileTexture.ts",
  ].forEach((path) => assertCommitPathUnchanged(path));
});

test("prompt output core differs from baseline only by the intentional headless extraction", () => {
  assert.equal(
    committedSource("HEAD", "app/utils/compilePromptCore.ts"),
    expectedHeadlessPromptCore(),
  );
});

test("legacy Form state without entities keeps scalar output byte-equivalent", () => {
  const module = scalarModule("form");
  const values: ModuleValues = {
    tone: "neutral",
    detail: "legacy detail",
  };

  assert.equal(
    compileFormModule(module, values),
    compileFormScalar(module, values, { allowOverride: false }),
  );
});

test("unused Camera entities do not change legacy/global output", () => {
  const module = scalarModule("camera");
  const values: ModuleValues = {
    tone: "neutral",
    detail: "legacy detail",
  };
  const expected = compileModule(module, values);

  assert.equal(compileCameraModule(module, values), expected);
  assert.equal(
    compileCameraModule(module, withUnusedEntity(values), {
      referencedEntityIds: [],
    }),
    expected,
  );
});

test("unused generic Scene-resource entities do not change legacy/global output", () => {
  const module = scalarModule("style");
  const values: ModuleValues = {
    tone: "neutral",
    detail: "legacy detail",
  };
  const expected = compileModule(module, values);

  assert.equal(compileSceneResourceModule(module, values), expected);
  assert.equal(
    compileSceneResourceModule(module, withUnusedEntity(values), {
      referencedEntityIds: [],
    }),
    expected,
  );
});

test("referenced Scene-resource entity is demand-driven and leaves stable global content intact", () => {
  const module = scalarModule("style");
  const values: ModuleValues = withUnusedEntity({
    tone: "neutral",
    detail: "legacy detail",
  });

  const output = compileSceneResourceModule(module, values, {
    referencedEntityIds: ["entity-unused"],
  });

  assert.match(output, /Global\/default style: neutral tone, legacy detail/);
  assert.match(output, /\{style_unused\} = warm tone, entity-only detail/);
});

test("typed user reference ownership stays pure while UI synchronization remains reversible", () => {
  const wrapper = committedSource("HEAD", "app/utils/compilePrompt.ts");
  const pure = committedSource("HEAD", "app/utils/compilePromptPure.ts");
  const core = committedSource("HEAD", "app/utils/compilePromptCore.ts");

  assert.ok(pure.includes("const suppressSubject = ownership.hasSubject || ownership.hasReference;"));
  assert.ok(pure.includes('ownership.hasReference && variable.key === "reference"'));
  assert.ok(pure.includes("const compiled = compilePromptOutputCore("));
  assert.ok(!pure.includes("usePromptVariables"));
  assert.ok(!pure.includes("usePromptSubjectContext"));

  assert.ok(wrapper.includes("const ownership = getUserVariableOwnership();"));
  assert.ok(wrapper.includes("setSubjectType(settings.subjectType || \"unspecified\")"));
  assert.ok(wrapper.includes("setSystemPromptVariables(systemVariables)"));
  assert.ok(wrapper.includes("const compiled = compilePromptOutputPure("));

  assert.ok(!core.includes("usePromptVariables"));
  assert.ok(!core.includes("usePromptSubjectContext"));
  assert.ok(!core.includes("syncActiveSystemPromptVariables(settings)"));
  assert.ok(core.includes("export function getSystemPromptVariables("));
});

test("Scene presentation aliases remain format-specific in the pure final adapter", () => {
  const pure = committedSource("HEAD", "app/utils/compilePromptPure.ts");

  assert.ok(pure.includes('if (format === "json")'));
  assert.ok(pure.includes("scenes: scene"));
  assert.ok(pure.includes('if (format === "natural")'));
  assert.ok(pure.includes('"$1Scenes:\\n"'));
  assert.ok(pure.includes('"$1{scenes} ="'));
});
