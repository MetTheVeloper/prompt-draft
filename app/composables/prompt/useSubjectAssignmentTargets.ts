import { computed } from "vue";
import type { SemanticTargetRef } from "~/modules/types";
import {
  sameSemanticTargetList,
  semanticTargetIdentity,
  semanticTargetUiLabel,
} from "~/utils/semanticTargets";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { usePromptSubjectContext } from "~/composables/prompt/usePromptSubjectContext";

export type SubjectAssignmentTargetOption = {
  value: string;
  label: string;
  description?: string;
  group: string;
  groupLabel: string;
  disabled?: boolean;
  color?: string;
  target: SemanticTargetRef;
};

function variableToken(key: string) {
  return `{${key}}`;
}

export function useSubjectAssignmentTargets() {
  const { t } = useI18n();
  const {
    enabledPromptVariables,
    enabledSystemPromptVariables,
  } = usePromptVariables();
  const { subjectType } = usePromptSubjectContext();

  function translate(path: string, fallback: string) {
    const translated = t(path);
    return translated === path ? fallback : translated;
  }

  const systemSubjectEligible = computed(() => {
    return ["unspecified", "person", "animal", "custom"].includes(subjectType.value);
  });

  const availableOptions = computed<SubjectAssignmentTargetOption[]>(() => {
    const options: SubjectAssignmentTargetOption[] = [];

    const systemSubject = enabledSystemPromptVariables.value.find(
      (variable) => variable.key === "subject",
    );

    if (systemSubject && systemSubjectEligible.value) {
      const token = variableToken(systemSubject.key);
      options.push({
        value: `system:${systemSubject.id}`,
        label: token,
        description: systemSubject.value,
        group: "system_subject",
        groupLabel: translate(
          "components.subjectAssignmentTargets.groups.systemSubject",
          "Main Subject",
        ),
        target: {
          kind: "system_variable",
          value: token,
          variableId: systemSubject.id,
          token,
          label: translate(
            "components.subjectAssignmentTargets.mainSubject",
            "Main Subject",
          ),
        },
      });
    }

    enabledPromptVariables.value
      .filter((variable) => variable.type === "subject")
      .forEach((variable) => {
        const token = variableToken(variable.key);
        options.push({
          value: `user:${variable.id}`,
          label: token,
          description: variable.value,
          group: "user_subjects",
          groupLabel: translate(
            "components.subjectAssignmentTargets.groups.userSubjects",
            "User Subject Variables",
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

  function selectionValue(target: SemanticTargetRef) {
    if (target.kind === "system_variable") {
      return `system:${target.variableId || target.value}`;
    }
    if (target.kind === "user_variable") {
      return `user:${target.variableId || target.value}`;
    }
    return semanticTargetIdentity(target);
  }

  function isAvailable(target: SemanticTargetRef) {
    const identity = semanticTargetIdentity(target);
    return availableOptions.value.some(
      (option) => semanticTargetIdentity(option.target) === identity,
    );
  }

  function missingOptions(currentTargets: SemanticTargetRef[]) {
    return currentTargets
      .filter((target) => !isAvailable(target))
      .map<SubjectAssignmentTargetOption>((target) => ({
        value: selectionValue(target),
        label: `${translate("components.subjectAssignmentTargets.missing", "Missing")} — ${semanticTargetUiLabel(target)}`,
        description: target.token || target.value,
        group: "missing",
        groupLabel: translate(
          "components.subjectAssignmentTargets.groups.missing",
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
      const identity = semanticTargetIdentity(target);
      const option = availableOptions.value.find(
        (candidate) => semanticTargetIdentity(candidate.target) === identity,
      );
      return option ? { ...option.target } : target;
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
