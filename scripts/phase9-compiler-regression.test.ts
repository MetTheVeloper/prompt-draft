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

function committedSource(ref: string, path: string) {
  return execFileSync("git", ["show", `${ref}:${path}`], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function assertCommitPathUnchanged(path: string) {
  execFileSync("git", ["diff", "--quiet", baseline, "HEAD", "--", path], {
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

test("draft persistence/import-export implementation is unchanged from the refactor baseline", () => {
  assertCommitPathUnchanged("app/pages/create.vue");
});

test("legacy Layout/Pose/Expression/Color/Texture compilers are unchanged from baseline", () => {
  [
    "app/utils/compileLayout.ts",
    "app/utils/compilePose.ts",
    "app/utils/compileExpression.ts",
    "app/utils/compileColorPalette.ts",
    "app/utils/compileTexture.ts",
  ].forEach(assertCommitPathUnchanged);
});

test("prompt output core remains byte-identical to the pre-refactor compiler", () => {
  assert.equal(
    committedSource("HEAD", "app/utils/compilePromptCore.ts"),
    committedSource(baseline, "app/utils/compilePrompt.ts"),
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

test("typed user reference ownership is reversible on the next compile", () => {
  const wrapper = committedSource("HEAD", "app/utils/compilePrompt.ts");
  const core = committedSource("HEAD", "app/utils/compilePromptCore.ts");

  assert.ok(wrapper.includes("const suppressSubject = ownership.hasSubject || ownership.hasReference;"));
  assert.ok(wrapper.includes('ownership.hasReference && variable.key === "reference"'));
  assert.ok(wrapper.includes("const compiled = compilePromptOutputCore("));
  assert.ok(wrapper.includes("filterOwnedSystemVariables(ownership);"));
  assert.ok(
    wrapper.indexOf("const compiled = compilePromptOutputCore(") <
      wrapper.indexOf("filterOwnedSystemVariables(ownership);"),
    "the core must regenerate system variables before ownership filtering",
  );
  assert.ok(core.includes("syncActiveSystemPromptVariables(settings)"));
});

test("Scene presentation aliases remain format-specific without changing the core", () => {
  const wrapper = committedSource("HEAD", "app/utils/compilePrompt.ts");

  assert.ok(wrapper.includes('if (format === "json")'));
  assert.ok(wrapper.includes("scenes: scene"));
  assert.ok(wrapper.includes('if (format === "natural")'));
  assert.ok(wrapper.includes('"$1Scenes:\\n"'));
  assert.ok(wrapper.includes('"$1{scenes} ="'));
});
