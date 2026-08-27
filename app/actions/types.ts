import type {
  PromptKeyModule,
  SemanticTargetCapability,
} from "../modules/types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type { SemanticReferenceCatalogSource } from "../utils/semanticReferenceCatalog";

export type ActionIssue = {
  code: string;
  message?: string;
  path?: string;
  details?: Record<string, unknown>;
};

export type ActionValueSchema =
  | {
      type: "string";
      enum?: readonly string[];
      minLength?: number;
    }
  | {
      type: "number";
      min?: number;
      max?: number;
    }
  | {
      type: "boolean";
    }
  | {
      type: "array";
      items: ActionValueSchema;
      minItems?: number;
      maxItems?: number;
    }
  | {
      type: "object";
      properties?: Record<string, ActionValueSchema>;
      required?: readonly string[];
      additionalProperties?: boolean;
    }
  | {
      type: "unknown";
    };

export type ActionInputSchema = Extract<ActionValueSchema, { type: "object" }>;

export type ActionIdFactory = {
  variable?: () => string;
  moduleEntity?: (moduleKey: string) => string;
  scene?: () => string;
  layoutRegion?: () => string;
  typographyGroup?: () => string;
  typographyText?: () => string;
  colorAssignment?: () => string;
  colorSwatch?: () => string;
  materialAssignment?: () => string;
  poseAssignment?: () => string;
  generic?: (prefix: string) => string;
};

/**
 * Explicit runtime facts that are not persisted inside PromptDraftState.
 * Consumers/adapters may provide these values, but domain services never read
 * Vue composables or component state directly.
 */
export type ActionEnvironment = {
  activeSystemVariableKeys?: readonly string[];

  /**
   * Headless semantic-reference sources grouped by capability. Specialized
   * assignment actions consume these exact refs instead of reading the Vue
   * `useSemanticTargetCatalog` adapter. Builtin slots remain domain-owned and
   * are merged with these dynamic sources by the assignment scope service.
   */
  semanticTargetSources?: Partial<
    Record<SemanticTargetCapability, readonly SemanticReferenceCatalogSource[]>
  >;

  /**
   * Exact subject-variable catalog used by Pose/Expression assignment actions.
   * Ordering is meaningful for create: the first available source mirrors the
   * Expert UI's current default-target behavior. Missing/unavailable persisted
   * refs are never reconstructed by token/name matching.
   */
  subjectAssignmentTargets?: readonly SemanticReferenceCatalogSource[];
};

export type ActionContext = {
  draft: PromptDraftState;
  modules: readonly PromptKeyModule[];
  environment?: ActionEnvironment;
  idFactory?: ActionIdFactory;
};

export type ActionAvailability =
  | { allowed: true }
  | { allowed: false; issues: ActionIssue[] };

export type ActionExecutionResult<TData = unknown> =
  | {
      ok: true;
      draft: PromptDraftState;
      data?: TData;
      warnings?: ActionIssue[];
    }
  | {
      ok: false;
      draft: PromptDraftState;
      issues: ActionIssue[];
    };

export type MaybePromise<T> = T | Promise<T>;

export type ActionDefinition<TInput = unknown, TData = unknown> = {
  id: string;
  description: string;
  inputSchema?: ActionInputSchema;
  canExecute?: (
    context: ActionContext,
    input: TInput,
  ) => MaybePromise<ActionAvailability>;
  execute: (
    context: ActionContext,
    input: TInput,
  ) => MaybePromise<ActionExecutionResult<TData>>;
};

export type ActionDescriptor = {
  id: string;
  description: string;
  inputSchema?: ActionInputSchema;
};
