import { clonePromptDraftState } from "../utils/promptDraftState";
import { validateActionInput } from "./inputSchema";
import type {
  ActionContext,
  ActionDefinition,
  ActionDescriptor,
  ActionExecutionResult,
  ActionIssue,
} from "./types";

type StoredActionDefinition = ActionDefinition<any, any>;

function cloneSchema<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function failure(
  context: ActionContext,
  issues: ActionIssue[],
): ActionExecutionResult<never> {
  return {
    ok: false,
    draft: context.draft,
    issues,
  };
}

function executionContext(context: ActionContext): ActionContext {
  return {
    ...context,
    draft: clonePromptDraftState(context.draft),
    modules: [...context.modules],
  };
}

export class ActionRegistry {
  private readonly actions = new Map<string, StoredActionDefinition>();

  register<TInput, TData>(definition: ActionDefinition<TInput, TData>) {
    const id = definition.id.trim();

    if (!id) {
      throw new Error("Action definitions must have a non-empty id.");
    }

    if (this.actions.has(id)) {
      throw new Error(`Duplicate action id: ${id}`);
    }

    this.actions.set(id, {
      ...definition,
      id,
    } as StoredActionDefinition);

    return this;
  }

  has(id: string) {
    return this.actions.has(id.trim());
  }

  get(id: string): StoredActionDefinition | undefined {
    return this.actions.get(id.trim());
  }

  list(): ActionDescriptor[] {
    return [...this.actions.values()].map((definition) => ({
      id: definition.id,
      description: definition.description,
      inputSchema: cloneSchema(definition.inputSchema),
    }));
  }

  async execute<TData = unknown>(
    id: string,
    context: ActionContext,
    input: unknown,
  ): Promise<ActionExecutionResult<TData>> {
    const normalizedId = id.trim();
    const definition = this.actions.get(normalizedId);

    if (!definition) {
      return failure(context, [
        {
          code: "action_not_found",
          details: { actionId: normalizedId },
        },
      ]) as ActionExecutionResult<TData>;
    }

    const inputIssues = validateActionInput(input, definition.inputSchema);

    if (inputIssues.length) {
      return failure(context, inputIssues) as ActionExecutionResult<TData>;
    }

    try {
      if (definition.canExecute) {
        const availability = await definition.canExecute(
          executionContext(context),
          input,
        );

        if (!availability.allowed) {
          return failure(context, availability.issues) as ActionExecutionResult<TData>;
        }
      }

      const result = await definition.execute(executionContext(context), input);

      if (!result.ok) {
        return {
          ...result,
          draft: context.draft,
        } as ActionExecutionResult<TData>;
      }

      return result as ActionExecutionResult<TData>;
    } catch (error) {
      return failure(context, [
        {
          code: "action_execution_error",
          details: {
            actionId: normalizedId,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      ]) as ActionExecutionResult<TData>;
    }
  }
}

export function createActionRegistry(
  definitions: StoredActionDefinition[] = [],
) {
  const registry = new ActionRegistry();
  definitions.forEach((definition) => registry.register(definition));
  return registry;
}
