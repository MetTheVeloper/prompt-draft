import type { PromptKeyModule } from "./types";
import {
  withModuleEntityConfig,
  type EntityCapablePromptKeyModule,
  type ModuleEntityConfig,
} from "./entityContracts";

/**
 * Capability registry for the generic repeatable-entity architecture.
 *
 * Specialized entity-owning modules (Hair, Outfit, Typography, etc.) keep
 * their current state models and can expose compatible refs through adapters
 * later without being forced into generic scalar entity storage.
 */
const moduleEntityCapabilities = {
  form: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "multiple",
    targetPolicy: ["subject", "object"],
  },
  camera: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
} satisfies Partial<Record<string, ModuleEntityConfig>>;

export function withModuleEntityCapabilities(
  module: PromptKeyModule,
): EntityCapablePromptKeyModule {
  const config = moduleEntityCapabilities[module.key as keyof typeof moduleEntityCapabilities];
  if (!config) return module;

  return withModuleEntityConfig(module, config);
}
