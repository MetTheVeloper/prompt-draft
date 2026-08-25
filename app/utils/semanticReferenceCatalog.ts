import type { SemanticTargetRef } from "../modules/types";
import {
  createReferenceCatalogIndex,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "./referenceCatalog";
import { semanticTargetIdentity } from "./semanticTargets";

export type SemanticReferenceCatalogSource = {
  label: string;
  description?: string;
  group?: string;
  groupLabel?: string;
  disabled?: boolean;
  color?: string;
  target: SemanticTargetRef;
};

export type SemanticReferenceCatalogItem<
  TSource extends SemanticReferenceCatalogSource = SemanticReferenceCatalogSource,
> = ReferenceCatalogItem<SemanticTargetRef, string, TSource>;

export function createSemanticReferenceCatalogItem<
  TSource extends SemanticReferenceCatalogSource,
>(source: TSource): SemanticReferenceCatalogItem<TSource> {
  return {
    identity: semanticTargetIdentity(source.target),
    reference: source.target,
    presentation: {
      label: source.label,
      description: source.description,
      token: source.target.token,
      name: source.target.label,
      group: source.group,
      groupLabel: source.groupLabel,
      color: source.color,
    },
    kind: source.target.kind,
    state: {
      available: source.disabled !== true,
    },
    metadata: source,
  };
}

export function createSemanticReferenceCatalogIndex<
  TSource extends SemanticReferenceCatalogSource,
>(sources: readonly TSource[]) {
  return createReferenceCatalogIndex(
    sources.map((source) => createSemanticReferenceCatalogItem(source)),
  );
}

export function resolveSemanticReferenceCatalogItem<
  TSource extends SemanticReferenceCatalogSource,
>(
  reference: SemanticTargetRef,
  index: ReadonlyMap<string, SemanticReferenceCatalogItem<TSource>>,
) {
  return resolveReferenceCatalogItem(
    reference,
    index,
    semanticTargetIdentity,
  );
}
