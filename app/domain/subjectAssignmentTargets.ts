import type { SemanticTargetRef } from "../modules/types";
import {
  createSemanticReferenceCatalogIndex,
  resolveSemanticReferenceCatalogItem,
  type SemanticReferenceCatalogSource,
} from "../utils/semanticReferenceCatalog";
import {
  normalizeSemanticTargets,
  semanticTargetIdentity,
} from "../utils/semanticTargets";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type SubjectAssignmentTargetPolicy = {
  sources?: readonly SemanticReferenceCatalogSource[];
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function targetIssue(
  code: "subject_assignment_target_missing" | "subject_assignment_target_unavailable",
  target: SemanticTargetRef,
) {
  return domainFailure({
    code,
    path: "targets",
    details: {
      identity: semanticTargetIdentity(target),
      kind: target.kind,
      value: target.value,
    },
  });
}

/**
 * Canonical subject-assignment target mutation primitive shared by Pose and
 * Expression. New targets must resolve by exact stable identity against an
 * explicit headless catalog source. Persisted missing/unavailable references
 * may survive only when the caller keeps that exact identity.
 */
export function setSubjectAssignmentTargets(
  currentTargets: readonly SemanticTargetRef[],
  requestedTargets: readonly SemanticTargetRef[],
  policy: SubjectAssignmentTargetPolicy = {},
): DomainResult<SemanticTargetRef[]> {
  const current = normalizeSemanticTargets(currentTargets);
  const requested = normalizeSemanticTargets(requestedTargets);
  const sources = policy.sources || [];
  const index = createSemanticReferenceCatalogIndex(sources);
  const currentByIdentity = new Map(
    current.map((target) => [semanticTargetIdentity(target), target] as const),
  );
  const seen = new Set<string>();
  const next: SemanticTargetRef[] = [];

  for (const target of requested) {
    const identity = semanticTargetIdentity(target);
    if (!identity || seen.has(identity)) continue;

    const resolution = resolveSemanticReferenceCatalogItem(target, index);
    if (resolution.status === "resolved") {
      next.push(cloneValue(resolution.item.reference));
      seen.add(identity);
      continue;
    }

    const persisted = currentByIdentity.get(identity);
    if (persisted) {
      next.push(cloneValue(persisted));
      seen.add(identity);
      continue;
    }

    return resolution.status === "unavailable"
      ? targetIssue("subject_assignment_target_unavailable", target)
      : targetIssue("subject_assignment_target_missing", target);
  }

  return domainSuccess(next);
}

export function firstAvailableSubjectAssignmentTarget(
  policy: SubjectAssignmentTargetPolicy = {},
): SemanticTargetRef | undefined {
  const source = (policy.sources || []).find((item) => item.disabled !== true);
  return source ? cloneValue(source.target) : undefined;
}
