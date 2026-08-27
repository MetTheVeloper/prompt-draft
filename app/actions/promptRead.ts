import { validatePromptDraft } from "../domain/promptRead";
import { ActionRegistry } from "./registry";
import type { ActionDefinition } from "./types";

export const promptValidateAction: ActionDefinition<Record<string, never>> = {
  id: "prompt.validate",
  description:
    "Validate the canonical draft through the same module-output and prompt-validation semantics used by the current editor, without mutating draft state.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => ({
    ok: true,
    draft: context.draft,
    data: validatePromptDraft(context.draft, context.modules),
  }),
};

export const promptReadActions = [promptValidateAction] as const;

export function registerPromptReadActions(registry: ActionRegistry) {
  promptReadActions.forEach((action) => registry.register(action));
  return registry;
}
