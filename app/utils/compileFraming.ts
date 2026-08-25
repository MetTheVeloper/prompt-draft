import type { ModuleValues, PromptKeyModule } from "../modules/types";
import { compileSceneResourceModule } from "./compileSceneResource";

export function compileFramingModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: {
    customMode?: boolean;
    referencedEntityIds?: string[];
  } = {},
) {
  return compileSceneResourceModule(module, values, options);
}
