import type {
  SemanticTargetCapability,
  SemanticTargetRef,
} from "../modules/types";
import type { SemanticReferenceCatalogSource } from "../utils/semanticReferenceCatalog";
import {
  createSemanticReferenceCatalogIndex,
  resolveSemanticReferenceCatalogItem,
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

export type SemanticAssignmentScope = {
  targets: SemanticTargetRef[];
  exceptions: SemanticTargetRef[];
};

export type SemanticAssignmentScopePatch = {
  targets?: SemanticTargetRef[];
  exceptions?: SemanticTargetRef[];
};

export type SemanticAssignmentScopePolicy = {
  capability: SemanticTargetCapability;
  builtinValues: readonly string[];
  exclusiveValue?: string;
  sources?: readonly SemanticReferenceCatalogSource[];
};

type ScopeSide = "targets" | "exceptions";

function cloneTarget(target: SemanticTargetRef): SemanticTargetRef {
  return { ...target };
}

function cloneTargets(targets: readonly SemanticTargetRef[]) {
  return targets.map(cloneTarget);
}

function targetMap(targets: readonly SemanticTargetRef[]) {
  return new Map(
    targets
      .map((target) => [semanticTargetIdentity(target), target] as const)
      .filter(([identity]) => Boolean(identity)),
  );
}

function dedupeTargets(targets: readonly SemanticTargetRef[]) {
  const seen = new Set<string>();
  const result: SemanticTargetRef[] = [];

  targets.forEach((target) => {
    const identity = semanticTargetIdentity(target);
    if (!identity || seen.has(identity)) return;
    seen.add(identity);
    result.push(cloneTarget(target));
  });

  return result;
}

function buildCatalogSources(policy: SemanticAssignmentScopePolicy) {
  const sources = new Map<string, SemanticReferenceCatalogSource>();

  policy.builtinValues.forEach((value) => {
    const target: SemanticTargetRef = { kind: "builtin", value };
    sources.set(semanticTargetIdentity(target), {
      label: value,
      target,
    });
  });

  // Dynamic sources intentionally override a builtin with the same semantic
  // slot identity. This mirrors the current UI behavior where, for example,
  // the builtin Outfit slot upgrades to the live Outfit module-output ref.
  (policy.sources || []).forEach((source) => {
    const identity = semanticTargetIdentity(source.target);
    if (!identity) return;
    sources.set(identity, {
      ...source,
      target: cloneTarget(source.target),
    });
  });

  return [...sources.values()];
}

function invalidTarget(
  side: ScopeSide,
  target: SemanticTargetRef,
  code: string,
) {
  return domainFailure<SemanticTargetRef>({
    code,
    path: side,
    details: {
      kind: target.kind,
      value: target.value,
      identity: semanticTargetIdentity(target),
    },
  });
}

function canonicalizeTarget(
  target: SemanticTargetRef,
  side: ScopeSide,
  current: ReadonlyMap<string, SemanticTargetRef>,
  policy: SemanticAssignmentScopePolicy,
  catalogIndex: ReturnType<typeof createSemanticReferenceCatalogIndex>,
): DomainResult<SemanticTargetRef> {
  const identity = semanticTargetIdentity(target);
  if (!identity) {
    return invalidTarget(side, target, "semantic_target_invalid");
  }

  if (target.kind === "custom") {
    return domainSuccess(cloneTarget(target));
  }

  if (
    target.kind === "builtin" &&
    !policy.builtinValues.includes(target.value)
  ) {
    return invalidTarget(side, target, "semantic_target_builtin_unsupported");
  }

  const resolution = resolveSemanticReferenceCatalogItem(target, catalogIndex);

  if (resolution.status === "resolved") {
    return domainSuccess(cloneTarget(resolution.item.reference));
  }

  // Persisted exact refs that later become missing/unavailable stay explicit.
  // This is recovery behavior, not permission to author a new broken ref.
  const persisted = current.get(identity);
  if (persisted) {
    return domainSuccess(cloneTarget(persisted));
  }

  return invalidTarget(
    side,
    target,
    resolution.status === "unavailable"
      ? "semantic_target_unavailable"
      : "semantic_target_missing",
  );
}

function canonicalizeList(
  value: unknown,
  side: ScopeSide,
  current: readonly SemanticTargetRef[],
  policy: SemanticAssignmentScopePolicy,
  catalogIndex: ReturnType<typeof createSemanticReferenceCatalogIndex>,
): DomainResult<SemanticTargetRef[]> {
  const normalized = normalizeSemanticTargets(value);
  const currentByIdentity = targetMap(current);
  const result: SemanticTargetRef[] = [];

  for (const target of normalized) {
    const canonical = canonicalizeTarget(
      target,
      side,
      currentByIdentity,
      policy,
      catalogIndex,
    );
    if (!canonical.ok) return canonical;
    result.push(canonical.value);
  }

  return domainSuccess(dedupeTargets(result));
}

function removeExactConflicts(
  source: readonly SemanticTargetRef[],
  against: readonly SemanticTargetRef[],
) {
  const blocked = new Set(
    against.map(semanticTargetIdentity).filter(Boolean),
  );

  return source
    .filter((target) => !blocked.has(semanticTargetIdentity(target)))
    .map(cloneTarget);
}

function applyExclusiveTarget(
  targets: readonly SemanticTargetRef[],
  exclusiveValue = "",
) {
  if (!exclusiveValue) return cloneTargets(targets);

  const exclusiveIdentity = semanticTargetIdentity({
    kind: "builtin",
    value: exclusiveValue,
  });
  const exclusive = targets.find(
    (target) => semanticTargetIdentity(target) === exclusiveIdentity,
  );

  return exclusive ? [cloneTarget(exclusive)] : cloneTargets(targets);
}

function hasExclusiveException(
  exceptions: readonly SemanticTargetRef[],
  exclusiveValue = "",
) {
  if (!exclusiveValue) return false;

  const exclusiveIdentity = semanticTargetIdentity({
    kind: "builtin",
    value: exclusiveValue,
  });
  return exceptions.some(
    (target) => semanticTargetIdentity(target) === exclusiveIdentity,
  );
}

/**
 * Canonical relational scope mutation shared by Color, Material and future
 * assignment domains. It owns target identity/recovery/exclusivity only; it
 * deliberately knows nothing about palette, material, pose or expression
 * payloads and is not exposed as an arbitrary cross-domain public action.
 */
export function setSemanticAssignmentScope(
  current: SemanticAssignmentScope,
  patch: SemanticAssignmentScopePatch,
  policy: SemanticAssignmentScopePolicy,
): DomainResult<SemanticAssignmentScope> {
  const catalogIndex = createSemanticReferenceCatalogIndex(
    buildCatalogSources(policy),
  );

  const changesTargets = patch.targets !== undefined;
  const changesExceptions = patch.exceptions !== undefined;

  const nextTargetsResult = changesTargets
    ? canonicalizeList(
        patch.targets,
        "targets",
        current.targets,
        policy,
        catalogIndex,
      )
    : canonicalizeList(
        current.targets,
        "targets",
        current.targets,
        policy,
        catalogIndex,
      );
  if (!nextTargetsResult.ok) return nextTargetsResult;

  const nextExceptionsResult = changesExceptions
    ? canonicalizeList(
        patch.exceptions,
        "exceptions",
        current.exceptions,
        policy,
        catalogIndex,
      )
    : canonicalizeList(
        current.exceptions,
        "exceptions",
        current.exceptions,
        policy,
        catalogIndex,
      );
  if (!nextExceptionsResult.ok) return nextExceptionsResult;

  let targets = applyExclusiveTarget(
    nextTargetsResult.value,
    policy.exclusiveValue,
  );
  let exceptions = nextExceptionsResult.value;

  if (hasExclusiveException(exceptions, policy.exclusiveValue)) {
    return domainFailure({
      code: "semantic_scope_exclusive_exception",
      path: "exceptions",
      details: {
        capability: policy.capability,
        exclusiveValue: policy.exclusiveValue,
      },
    });
  }

  // Match the editor's directional conflict behavior. When only targets were
  // authored, targets win; when only exceptions were authored, exceptions win.
  // If a caller supplies both in one atomic patch, targets win deterministically.
  if (changesExceptions && !changesTargets) {
    targets = removeExactConflicts(targets, exceptions);
  } else {
    exceptions = removeExactConflicts(exceptions, targets);
  }

  return domainSuccess({
    targets: dedupeTargets(targets),
    exceptions: dedupeTargets(exceptions),
  });
}
