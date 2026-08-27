import {
  compilePromptDraft,
  validatePromptDraft,
} from "../domain/promptRead";
import type { PromptOutputFormat } from "../utils/compilePromptCore";
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

export const promptCompileAction: ActionDefinition<{
  format?: PromptOutputFormat;
}> = {
  id: "prompt.compile",
  description:
    "Compile the canonical draft headlessly through the same final prompt semantics used by the current editor. An explicit format overrides the draft's persisted output format for this read only.",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["modular", "natural", "json"],
      },
    },
    additionalProperties: false,
  },
  execute: (context, input) => ({
    ok: true,
    draft: context.draft,
    data: compilePromptDraft(
      context.draft,
      context.modules,
      input.format ?? context.draft.outputFormat,
    ),
  }),
};

export const promptReadActions = [
  promptValidateAction,
  promptCompileAction,
] as const;

export function registerPromptReadActions(registry: ActionRegistry) {
  promptReadActions.forEach((action) => registry.register(action));
  return registry;
}
