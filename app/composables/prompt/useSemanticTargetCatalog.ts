import { computed } from "vue";
import type {
  PromptVariable,
  SemanticTargetCapability,
  SemanticTargetRef,
} from "~/modules/types";
import type { SemanticBuiltinTargetDefinition } from "~/utils/semanticTargets";
import {
  semanticScopeSummary,
  semanticTargetIdentity,
} from "~/utils/semanticTargets";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

export type SemanticTargetCatalogOption = {
  value: string;
  label: string;
  description?: string;
  group: string;
  groupLabel: string;
  color?: string;
  disabled?: boolean;
  target: SemanticTargetRef;
};

function variableToken(variable: PromptVariable) {
  return `{${variable.key}}`;
}

function parseSerializedObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function cleanLabel(value?: string) {
  const cleaned = String(value || "").trim();
  if (!cleaned || /^\{[^{}]+\}$/.test(cleaned)) return "";
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) return "";
  return cleaned;
}

function cleanDescription(value?: string) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned || cleaned.startsWith("{") && !/^\{[^{}]+\}$/.test(cleaned)) {
    return "";
  }
  return cleaned.length > 100 ? `${cleaned.slice(0, 97)}...` : cleaned;
}

export function useSemanticTargetCatalog(
  capability: SemanticTargetCapability,
  getBuiltins: () => SemanticBuiltinTargetDefinition[],
) {
  const { t } = useI18n();
  const {
    enabledPromptVariables,
    enabledModuleVariableGroups,
    enabledModulePromptVariables,
  } = usePromptVariables();

  function translate(path: string, fallback: string) {
    const translated = t(path);
    return translated === path ? fallback : translated;
  }

  const groupLabels = computed(() => ({
    general: translate("components.assignmentScope.groups.general", "General"),
    moduleOutputs: translate(
      "components.assignmentScope.groups.moduleOutputs",
      "Linked Module Outputs",
    ),
    moduleEntities: translate(
      "components.assignmentScope.groups.moduleEntities",
      "Linked Module Entities",
    ),
    typographyGroups: translate(
      "components.assignmentScope.groups.typographyGroups",
      "Typography Groups",
    ),
    typographyTexts: translate(
      "components.assignmentScope.groups.typographyTexts",
      "Typography Texts",
    ),
    userVariables: translate(
      "components.assignmentScope.groups.userVariables",
      "User Subject / Object Variables",
    ),
    missing: translate(
      "components.assignmentScope.groups.missing",
      "Missing References",
    ),
  }));

  const moduleTargetVariables = computed(() => {
    return enabledModulePromptVariables.value.filter((variable) => {
      return (
        variable.entityType === "module" &&
        variable.semanticCapabilities?.includes(capability)
      );
    });
  });

  const moduleEntityVariables = computed(() => {
    return enabledModulePromptVariables.value.filter((variable) => {
      return (
        variable.entityType !== "module" &&
        variable.entityType !== "text_group" &&
        variable.entityType !== "text" &&
        variable.semanticCapabilities?.includes(capability)
      );
    });
  });

  const builtinDefinitions = computed(() => getBuiltins());

  const builtinLabels = computed<Record<string, string>>(() => {
    return builtinDefinitions.value.reduce<Record<string, string>>(
      (result, target) => {
        result[target.value] = target.label;
        return result;
      },
      {},
    );
  });

  const builtinOptions = computed<SemanticTargetCatalogOption[]>(() => {
    return builtinDefinitions.value.map((definition) => {
      const linked = definition.moduleKey
        ? moduleTargetVariables.value.find(
            (variable) => variable.moduleKey === definition.moduleKey,
          )
        : undefined;

      if (linked) {
        const token = variableToken(linked);
        return {
          value: `slot:${definition.value}`,
          label: `${definition.label} · ${token}`,
          description: translate(
            "components.assignmentScope.linkedModuleDescription",
            "Linked module output",
          ),
          group: "general",
          groupLabel: groupLabels.value.general,
          target: {
            kind: "module_output",
            value: definition.value,
            moduleKey: linked.moduleKey || definition.moduleKey,
            variableId: linked.id,
            token,
            label: definition.label,
          },
        };
      }

      return {
        value: `slot:${definition.value}`,
        label: definition.label,
        group: "general",
        groupLabel: groupLabels.value.general,
        target: {
          kind: "builtin",
          value: definition.value,
          label: definition.label,
        },
      };
    });
  });

  const extraModuleOutputOptions = computed<SemanticTargetCatalogOption[]>(() => {
    const declaredModuleKeys = new Set(
      builtinDefinitions.value
        .map((definition) => definition.moduleKey)
        .filter((value): value is string => Boolean(value)),
    );

    return moduleTargetVariables.value
      .filter((variable) => {
        return !variable.moduleKey || !declaredModuleKeys.has(variable.moduleKey);
      })
      .map((variable) => {
        const token = variableToken(variable);
        const moduleKey = variable.moduleKey || variable.key;
        const label = cleanLabel(variable.label) || moduleKey;

        return {
          value: `slot:${moduleKey}`,
          label: `${label} · ${token}`,
          description: translate(
            "components.assignmentScope.linkedModuleDescription",
            "Linked module output",
          ),
          group: "module_outputs",
          groupLabel: groupLabels.value.moduleOutputs,
          target: {
            kind: "module_output" as const,
            value: moduleKey,
            moduleKey,
            variableId: variable.id,
            token,
            label,
          },
        };
      });
  });

  const moduleEntityOptions = computed<SemanticTargetCatalogOption[]>(() => {
    return moduleEntityVariables.value.map((variable, index) => {
      const token = variableToken(variable);
      const label = cleanLabel(variable.label) || `Module Entity ${index + 1}`;
      const group = enabledModuleVariableGroups.value.find((candidate) =>
        candidate.variables.some((item) => item.id === variable.id),
      );
      const parent = group?.variables.find(
        (candidate) => candidate.entityId === variable.parentId,
      );
      const parentLabel = cleanLabel(parent?.label);
      const description = cleanDescription(variable.description);
      const entityId = variable.entityId || variable.id;
      const moduleKey = variable.moduleKey || "module";

      return {
        value: `module_entity:${moduleKey}:${entityId}`,
        label: `${label} · ${token}`,
        description: [description, parentLabel].filter(Boolean).join(" · "),
        group: `module_entities:${moduleKey}`,
        groupLabel: group?.label
          ? `${groupLabels.value.moduleEntities} · ${group.label}`
          : groupLabels.value.moduleEntities,
        target: {
          kind: "module_output" as const,
          value: token,
          moduleKey: variable.moduleKey,
          variableId: variable.id,
          entityId,
          token,
          label,
          parentLabel,
        },
      };
    });
  });

  const typographyVariables = computed(() => {
    return (
      enabledModuleVariableGroups.value.find((group) => group.id === "typography")
        ?.variables || []
    );
  });

  const typographyGroupVariables = computed(() => {
    return typographyVariables.value.filter(
      (variable) => variable.entityType === "text_group",
    );
  });

  const typographyGroupOptions = computed<SemanticTargetCatalogOption[]>(() => {
    return typographyGroupVariables.value.map((variable, index) => {
      const token = variableToken(variable);
      const label = cleanLabel(variable.label) || `Text Group ${index + 1}`;
      const serialized = parseSerializedObject(variable.value);
      const purpose = cleanDescription(String(serialized?.purpose || ""));

      return {
        value: `typography_group:${variable.entityId || variable.id}`,
        label,
        description: [token, purpose].filter(Boolean).join(" · "),
        group: "typography_groups",
        groupLabel: groupLabels.value.typographyGroups,
        target: {
          kind: "typography_group",
          value: token,
          entityId: variable.entityId || variable.id,
          token,
          label,
        },
      };
    });
  });

  const typographyTextOptions = computed<SemanticTargetCatalogOption[]>(() => {
    return typographyVariables.value
      .filter((variable) => variable.entityType === "text")
      .map((variable, index) => {
        const token = variableToken(variable);
        const label = cleanLabel(variable.label) || `Text ${index + 1}`;
        const serialized = parseSerializedObject(variable.value);
        const content = cleanDescription(String(serialized?.content || ""));
        const parent = typographyGroupVariables.value.find(
          (candidate) => candidate.entityId === variable.parentId,
        );
        const parentLabel = cleanLabel(parent?.label);

        return {
          value: `typography_text:${variable.entityId || variable.id}`,
          label,
          description: [token, content, parentLabel].filter(Boolean).join(" · "),
          group: "typography_texts",
          groupLabel: groupLabels.value.typographyTexts,
          target: {
            kind: "typography_text" as const,
            value: token,
            entityId: variable.entityId || variable.id,
            token,
            label,
            parentLabel,
          },
        };
      });
  });

  const userOptions = computed<SemanticTargetCatalogOption[]>(() => {
    return enabledPromptVariables.value
      .filter((variable) => {
        return variable.type === "subject" || variable.type === "object";
      })
      .map((variable) => {
        const token = variableToken(variable);
        return {
          value: `user:${variable.id}`,
          label: token,
          description: variable.value,
          group: "user_variables",
          groupLabel: groupLabels.value.userVariables,
          target: {
            kind: "user_variable" as const,
            value: token,
            variableId: variable.id,
            token,
            label: cleanLabel(variable.label) || variable.key,
          },
        };
      });
  });

  const availableOptions = computed<SemanticTargetCatalogOption[]>(() => [
    ...builtinOptions.value,
    ...extraModuleOutputOptions.value,
    ...moduleEntityOptions.value,
    ...typographyGroupOptions.value,
    ...typographyTextOptions.value,
    ...userOptions.value,
  ]);

  function selectionValue(target: SemanticTargetRef) {
    const identity = semanticTargetIdentity(target);
    if (!identity) return "";

    if (identity.startsWith("slot:")) return identity;
    if (target.kind === "user_variable") {
      return `user:${target.variableId || target.value}`;
    }
    if (target.kind === "typography_group") {
      return `typography_group:${target.entityId || target.value}`;
    }
    if (target.kind === "typography_text") {
      return `typography_text:${target.entityId || target.value}`;
    }

    return identity;
  }

  function isAvailable(target: SemanticTargetRef) {
    const identity = semanticTargetIdentity(target);
    return availableOptions.value.some(
      (option) => semanticTargetIdentity(option.target) === identity,
    );
  }

  function missingOptions(
    currentTargets: SemanticTargetRef[],
  ): SemanticTargetCatalogOption[] {
    return currentTargets
      .filter((target) => target.kind !== "custom" && !isAvailable(target))
      .map((target) => ({
        value: selectionValue(target),
        label: `${translate("components.assignmentScope.missing", "Missing")} — ${target.label || target.token || target.value}`,
        description: target.token || target.value,
        group: "missing",
        groupLabel: groupLabels.value.missing,
        color: "orange",
        disabled: true,
        target,
      }));
  }

  function itemsFor(
    currentTargets: SemanticTargetRef[],
    options: { excludeValues?: string[] } = {},
  ) {
    const excluded = new Set(options.excludeValues || []);
    return [
      ...availableOptions.value.filter(
        (option) => !excluded.has(option.target.value),
      ),
      ...missingOptions(currentTargets).filter(
        (option) => !excluded.has(option.target.value),
      ),
    ];
  }

  function valuesFor(targets: SemanticTargetRef[]) {
    return targets
      .filter((target) => target.kind !== "custom")
      .map(selectionValue)
      .filter(Boolean);
  }

  function resolveSelections(
    values: Array<string | number | boolean | null>,
    currentTargets: SemanticTargetRef[],
  ) {
    return values
      .map((value) => String(value ?? ""))
      .map((selection) => {
        const option = availableOptions.value.find(
          (candidate) => candidate.value === selection,
        );
        if (option) return { ...option.target };

        return currentTargets.find(
          (target) => selectionValue(target) === selection,
        );
      })
      .filter((target): target is SemanticTargetRef => Boolean(target));
  }

  function upgradeTargets(targets: SemanticTargetRef[]) {
    return targets.map((target) => {
      if (target.kind === "custom") return target;
      const identity = semanticTargetIdentity(target);
      const option = availableOptions.value.find(
        (candidate) => semanticTargetIdentity(candidate.target) === identity,
      );
      return option ? { ...option.target } : target;
    });
  }

  function summarize(
    targets: SemanticTargetRef[],
    exceptions: SemanticTargetRef[] = [],
  ) {
    return semanticScopeSummary(
      upgradeTargets(targets),
      upgradeTargets(exceptions),
      builtinLabels.value,
    );
  }

  return {
    availableOptions,
    builtinLabels,
    itemsFor,
    valuesFor,
    resolveSelections,
    upgradeTargets,
    summarize,
  };
}
