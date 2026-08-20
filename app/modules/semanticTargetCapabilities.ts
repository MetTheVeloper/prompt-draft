import type {
  ModuleSemanticTargetConfig,
  PromptKeyModule,
} from "./types";

/**
 * Cross-module capability registry for module outputs that can act as semantic
 * assignment targets. Consumers ask for a capability (for example `color` or
 * `material`) and never hard-code concrete module keys.
 *
 * This registry intentionally lives outside Color/Texture. When Hair and
 * Outfit receive their own semantic refactors, these declarations can move
 * directly onto those modules without changing assignment consumers.
 */
const semanticTargetCapabilities: Partial<
  Record<string, ModuleSemanticTargetConfig>
> = {
  hair: {
    exposeOutput: true,
    capabilities: ["color", "material"],
  },
  outfit: {
    exposeOutput: true,
    capabilities: ["color", "material"],
  },
};

export function withSemanticTargetCapabilities(
  module: PromptKeyModule,
): PromptKeyModule {
  const semanticTargets = semanticTargetCapabilities[module.key];
  if (!semanticTargets) return module;

  return {
    ...module,
    semanticTargets: {
      ...semanticTargets,
      capabilities: [...semanticTargets.capabilities],
    },
  };
}
