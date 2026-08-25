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
  framing: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
  background: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
  lighting: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
  },
  style: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
    allowGlobalInheritanceToggle: true,
    preserveEntitiesInCustomMode: true,
  },
  effects: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
    allowGlobalInheritanceToggle: true,
    preserveEntitiesInCustomMode: true,
  },
  texture: {
    enabled: true,
    sceneExposable: true,
    sceneSelection: "single",
    targetPolicy: [],
    allowGlobalInheritanceToggle: true,
    preserveEntitiesInCustomMode: true,
  },
} satisfies Partial<Record<string, ModuleEntityConfig>>;

/**
 * Prompt-facing wording for applying a selected named configuration inside a
 * Scene. Keeping this separate from Scene compilation prevents module-key
 * conditionals from spreading as Phase 6 exposes more modules.
 *
 * `{tokens}` is replaced with one or more reusable entity tokens.
 */
const moduleEntitySceneInstructions: Partial<Record<string, string>> = {
  form: "Apply {tokens} to this scene.",
  camera: "Capture this scene with {tokens}.",
  framing: "Frame this scene with {tokens}.",
  background: "Use only {tokens} as this scene's background.",
  lighting: "Light this scene with {tokens}.",
  style: "Use {tokens} as this scene's visual style.",
  effects: "Apply {tokens} as this scene's effects.",
  texture: "Use {tokens} as this scene's material and surface treatment.",
};

export function withModuleEntityCapabilities(
  module: PromptKeyModule,
): EntityCapablePromptKeyModule {
  const config = moduleEntityCapabilities[module.key as keyof typeof moduleEntityCapabilities];
  if (!config) return module;

  return withModuleEntityConfig(module, config);
}

export function getModuleEntitySceneInstruction(module: PromptKeyModule) {
  return (
    moduleEntitySceneInstructions[module.key] ||
    "Apply {tokens} to this scene."
  );
}
