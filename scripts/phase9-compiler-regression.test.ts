import assert from "node:assert/strict";
import test from "node:test";

import type { ModuleValues, PromptKeyModule } from "../app/modules/types";
import { compileCameraModule } from "../app/utils/compileCamera";
import { compileFormModule, compileFormScalar } from "../app/utils/compileForm";
import { compileModule } from "../app/utils/compileModules";
import { compileSceneResourceModule } from "../app/utils/compileSceneResource";

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
