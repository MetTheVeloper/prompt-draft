import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { ModuleEntityTargetPolicy } from "~/modules/entityContracts";
import type { SemanticTargetRef } from "~/modules/types";
import {
  createReferenceCatalogIndex,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "~/utils/referenceCatalog";
import {
  sameSemanticTargetList,
  semanticTargetIdentity,
  semanticTargetUiLabel,
} from "~/utils/semanticTargets";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { usePromptSubjectContext } from "~/composables/prompt/usePromptSubjectContext";

export type ModuleEntityTargetOption = {
  value: string;
  label: string;
  description?: string;
  group: string;
  groupLabel: string;
  disabled?: boolean;
  color?: string;
  target: SemanticTargetRef;
};

type ModuleEntityTargetCatalogItem = ReferenceCatalogItem<
  SemanticTargetRef,
  string,
  ModuleEntityTargetOption
>;

function variableToken(key: string) {
  return `{${key}}`;
}

function mainSubjectPolicy(subjectType: string): ModuleEntityTargetPolicy {
  if (["person", "animal", "unspecified", "custom"].includes(subjectType)) {
    return "subject";
  }

  return "object";
}

/**
 * Policy-driven target catalog for generic repeatable module entities.
 * Subject/object eligibility remains module-specific; canonical reference
 * resolution is delegated to the shared Phase 7 catalog foundation.
 */
export function useModuleEntityTargets(
  policy: MaybeRefOrGetter<ModuleEntityTargetPolicy[]>,
) {
  const { t } = useI18n();
  const { enabledPromptVariables, enabledSystemPromptVariables } =
    usePromptVariables();
  const { subjectType } = usePromptSubjectContext();

  function translate(path: string, fallback: string) {
    const translated = t(path);
    return translated === path ? fallback : translated;
  }

  const enabledPolicy = computed(() => new Set(toValue(policy)));

  const availableOptions = computed<ModuleEntityTargetOption[]>(() => {
    const options: ModuleEntityTargetOption[] = [];

    const systemSubject = enabledSystemPromptVariables.value.find(
      (variable) => variable.key === "subject",
    );

    const mainPolicy = mainSubjectPolicy(subjectType.value);
    if (systemSubject && enabledPolicy.value.has(mainPolicy)) {
      const token = variableToken(systemSubject.key);
      options.push({
        value: `system:${systemSubject.id}`,
        label: token,
        description: systemSubject.value,
        group: "system_subject",
        groupLabel: translate(
          "components.moduleEntityTargets.groups.systemSubject",
          "Main Subject",
        ),
        target: {
          kind: "system_variable",
          value: token,
          variableId: systemSubject.id,
          token,
          label: translate(
            "components.moduleEntityTargets.mainSubject",
            "Main Subject",
          ),
        },
      });
    }

    enabledPromptVariables.value
      .filter((variable) => {
        return (
          (variable.type === "subject" && enabledPolicy.value.has("subject")) ||
          (variable.type === "object" && enabledPolicy.value.has("object"))
        );
      })
      .forEach((variable) => {
        const token = variableToken(variable.key);
        const kind = variable.type === "object" ? "object" : "subject";

        options.push({
          value: `user:${variable.id}`,
          label: token,
          description: variable.value,
          group: `user_${kind}s`,
          groupLabel: translate(
            `components.moduleEntityTargets.groups.user${kind === "object" ? "Objects" : "Subjects"}`,
            kind === "object" ? "User Object Variables" : "User Subject Variables",
          ),
          target: {
            kind: "user_variable",
            value: token,
            variableId: variable.id,
            token,
            label: variable.label || variable.key,
          },
        });
      });

    return options;
  });

  const catalogItems = computed<ModuleEntityTargetCatalogItem[]>(() => {
    return availableOptions.value.map((option) => ({
      identity: semanticTargetIdentity(option.target),
      reference: option.target,
      presentation: {
        label: option.label,
        description: option.description,
        token: option.target.token,
        name: option.target.label,
        group: option.group,
        groupLabel: option.groupLabel,
        color: option.color,
      },
      kind: option.target.kind,
      state: {
        available: option.disabled !== true,
      },
      metadata: option,
    }));
  });

  const catalogIndex = computed(() =>
    createReferenceCatalogIndex(catalogItems.value),
  );

  function selectionValue(target: SemanticTargetRef) {
    if (target.kind === "system_variable") {
      return `system:${target.variableId || target.value}`;
    }
    if (target.kind === "user_variable") {
      return `user:${target.variableId || target.value}`;
    }
    return semanticTargetIdentity(target);
  }

  function resolveTarget(target: SemanticTargetRef) {
    return resolveReferenceCatalogItem(
      target,
      catalogIndex.value,
      semanticTargetIdentity,
    );
  }

  function isAvailable(target: SemanticTargetRef) {
    return resolveTarget(target).status === "resolved";
  }

  function missingOptions(currentTargets: SemanticTargetRef[]) {
    return currentTargets
      .filter((target) => !isAvailable(target))
      .map<ModuleEntityTargetOption>((target) => ({
        value: selectionValue(target),
        label: `${translate("components.moduleEntityTargets.missing", "Missing")} — ${semanticTargetUiLabel(target)}`,
        description: target.token || target.value,
        group: "missing",
        groupLabel: translate(
          "components.moduleEntityTargets.groups.missing",
          "Missing References",
        ),
        color: "orange",
        target,
      }));
  }

  function itemsFor(currentTargets: SemanticTargetRef[]) {
    return [...availableOptions.value, ...missingOptions(currentTargets)];
  }

  function valuesFor(targets: SemanticTargetRef[]) {
    return targets.map(selectionValue).filter(Boolean);
  }

  function resolveSelections(
    values: Array<string | number | boolean | null>,
    currentTargets: SemanticTargetRef[],
  ) {
    return values
      .map((value) => String(value ?? ""))
      .map((selection) => {
        const available = availableOptions.value.find(
          (option) => option.value === selection,
        );
        if (available) return { ...available.target };

        return currentTargets.find(
          (target) => selectionValue(target) === selection,
        );
      })
      .filter((target): target is SemanticTargetRef => Boolean(target));
  }

  function upgradeTargets(targets: SemanticTargetRef[]) {
    return targets.map((target) => {
      const resolution = resolveTarget(target);
      return resolution.status === "resolved"
        ? { ...resolution.item.reference }
        : target;
    });
  }

  function sameTargets(first: SemanticTargetRef[], second: SemanticTargetRef[]) {
    return sameSemanticTargetList(first, second);
  }

  return {
    availableOptions,
    itemsFor,
    valuesFor,
    resolveSelections,
    upgradeTargets,
    sameTargets,
  };
}
