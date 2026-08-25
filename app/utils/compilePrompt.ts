import type { PromptKeyModule } from "../modules/types";
import type {
  ModuleOutputMap,
  PromptOutputFormat,
  PromptSettings,
} from "./compilePromptCore";
import { compilePromptOutput as compilePromptOutputCore } from "./compilePromptCore";

export * from "./compilePromptCore";

function aliasScenePresentation(output: string, format: PromptOutputFormat) {
  if (!output) return output;

  if (format === "json") {
    try {
      const parsed = JSON.parse(output) as Record<string, unknown>;
      const modules = parsed.modules;

      if (modules && typeof modules === "object" && !Array.isArray(modules)) {
        const moduleRecord = modules as Record<string, unknown>;

        if (Object.prototype.hasOwnProperty.call(moduleRecord, "scene")) {
          const { scene, ...rest } = moduleRecord;
          parsed.modules = {
            ...rest,
            scenes: scene,
          };
        }
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  }

  if (format === "natural") {
    return output.replace(
      /(^|\n\n)Scene:\n(?=• \{scene_)/g,
      "$1Scenes:\n",
    );
  }

  return output.replace(
    /(^|\n)\{scene\} =(?=\n• \{scene_)/g,
    "$1{scenes} =",
  );
}

export function compilePromptOutput(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap,
  settings: PromptSettings,
  format: PromptOutputFormat = "modular",
) {
  return aliasScenePresentation(
    compilePromptOutputCore(modules, outputs, settings, format),
    format,
  );
}
