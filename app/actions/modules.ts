import type {
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type { ModulePanelState } from "../modules/promptDraft.types";
import {
  activatePromptModule,
  applyPromptModulePreset,
  deactivatePromptModule,
  setPromptModuleCustomMode,
  setPromptModuleField,
} from "../domain/modules";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type {
  ActionContext,
  ActionDefinition,
  ActionIssue,
} from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(
  context: ActionContext,
  moduleKey: string,
): PromptKeyModule | null {
  return context.modules.find((module) => module.key === moduleKey) || null;
}

function moduleNotFound(moduleKey: string) {
  return {
    ok: false as const,
    issues: [
      {
        code: "module_not_found",
        path: "moduleKey",
        details: { moduleKey },
      },
    ],
  };
}

function moduleResult<T extends { draft: ActionContext["draft"] }>(
  context: ActionContext,
  result:
    | { ok: true; value: T; warnings?: DomainIssue[] }
    | { ok: false; issues: DomainIssue[] },
) {
  if (!result.ok) {
    return {
      ok: false as const,
      draft: context.draft,
      issues: actionIssues(result.issues),
    };
  }

  return {
    ok: true as const,
    draft: result.value.draft,
    warnings: result.warnings?.length
      ? actionIssues(result.warnings)
      : undefined,
  };
}

type ModuleKeyInput = {
  moduleKey: string;
};

type ModuleFieldSetInput = ModuleKeyInput & {
  fieldId: string;
  value: ModuleFieldValue;
  customText?: string;
};

type ModulePresetApplyInput = ModuleKeyInput & {
  presetId: string;
};

type ModuleCustomModeInput = ModuleKeyInput & {
  enabled: boolean;
};

type ModuleStateData = {
  moduleKey: string;
  moduleValues: ModuleValues;
  panelState: ModulePanelState;
};

const moduleKeyProperty = {
  moduleKey: { type: "string" as const, minLength: 1 },
};

export const moduleActivateAction: ActionDefinition<
  ModuleKeyInput,
  ModuleStateData
> = {
  id: "module.activate",
  description:
    "Activate a registered prompt module, preserving existing module state or initializing canonical defaults when missing.",
  inputSchema: {
    type: "object",
    required: ["moduleKey"],
    additionalProperties: false,
    properties: moduleKeyProperty,
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) {
      return {
        ...moduleNotFound(input.moduleKey),
        draft: context.draft,
      };
    }

    const result = activatePromptModule(context.draft, module);
    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        moduleKey: module.key,
        moduleValues: result.value.moduleValues,
        panelState: result.value.panelState,
      },
    };
  },
};

export const moduleDeactivateAction: ActionDefinition<
  ModuleKeyInput,
  { moduleKey: string }
> = {
  id: "module.deactivate",
  description:
    "Deactivate a registered prompt module without deleting its persisted values or panel state.",
  inputSchema: {
    type: "object",
    required: ["moduleKey"],
    additionalProperties: false,
    properties: moduleKeyProperty,
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) {
      return {
        ...moduleNotFound(input.moduleKey),
        draft: context.draft,
      };
    }

    const result = deactivatePromptModule(context.draft, module);
    const normalized = moduleResult(context, result);
    if (!normalized.ok) return normalized;

    return {
      ...normalized,
      data: { moduleKey: module.key },
    };
  },
};

export const moduleFieldSetAction: ActionDefinition<
  ModuleFieldSetInput,
  ModuleStateData
> = {
  id: "module.field.set",
  description:
    "Set one simple schema-backed module field. Structured fields require specialized domain actions.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "fieldId", "value"],
    additionalProperties: false,
    properties: {
      ...moduleKeyProperty,
      fieldId: { type: "string", minLength: 1 },
      value: { type: "unknown" },
      customText: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) {
      return {
        ...moduleNotFound(input.moduleKey),
        draft: context.draft,
      };
    }

    const result = setPromptModuleField(context.draft, module, {
      fieldId: input.fieldId,
      value: input.value,
      customText: input.customText,
    });

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        moduleKey: module.key,
        moduleValues: result.value.moduleValues,
        panelState: result.value.panelState,
      },
    };
  },
};

export const modulePresetApplyAction: ActionDefinition<
  ModulePresetApplyInput,
  ModuleStateData
> = {
  id: "module.preset.apply",
  description:
    "Apply one registered module preset as an overlay, leave unrelated state intact, and exit custom mode.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "presetId"],
    additionalProperties: false,
    properties: {
      ...moduleKeyProperty,
      presetId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) {
      return {
        ...moduleNotFound(input.moduleKey),
        draft: context.draft,
      };
    }

    const result = applyPromptModulePreset(
      context.draft,
      module,
      input.presetId,
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        moduleKey: module.key,
        moduleValues: result.value.moduleValues,
        panelState: result.value.panelState,
      },
    };
  },
};

export const moduleCustomModeSetAction: ActionDefinition<
  ModuleCustomModeInput,
  ModuleStateData
> = {
  id: "module.customMode.set",
  description:
    "Enable or disable module-level Custom Override mode for a module that exposes an override field.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "enabled"],
    additionalProperties: false,
    properties: {
      ...moduleKeyProperty,
      enabled: { type: "boolean" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) {
      return {
        ...moduleNotFound(input.moduleKey),
        draft: context.draft,
      };
    }

    const result = setPromptModuleCustomMode(
      context.draft,
      module,
      input.enabled,
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        moduleKey: module.key,
        moduleValues: result.value.moduleValues,
        panelState: result.value.panelState,
      },
    };
  },
};

export const moduleActions = [
  moduleActivateAction,
  moduleDeactivateAction,
  moduleFieldSetAction,
  modulePresetApplyAction,
  moduleCustomModeSetAction,
] as const;

export function registerModuleActions(registry: ActionRegistry) {
  moduleActions.forEach((action) => registry.register(action as any));
  return registry;
}
