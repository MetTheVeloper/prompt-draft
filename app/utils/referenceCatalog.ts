export type ReferenceCatalogPresentation = {
  label: string;
  description?: string;
  token?: string;
  name?: string;
  group?: string;
  groupLabel?: string;
  color?: string;
};

export type ReferenceCatalogState = {
  enabled?: boolean;
  available?: boolean;
  disabledReason?: string;
};

export type ReferenceCatalogItem<
  TReference,
  TCapability extends string = string,
  TMetadata = unknown,
> = {
  /** Canonical persistence identity. Tokens, labels, and names never belong here. */
  identity: string;
  reference: TReference;
  presentation: ReferenceCatalogPresentation;
  kind?: string;
  scope?: string;
  capabilities?: readonly TCapability[];
  state?: ReferenceCatalogState;
  metadata?: TMetadata;
};

export type ReferenceCatalogResolution<
  TReference,
  TItem extends ReferenceCatalogItem<TReference>,
> =
  | {
      status: "resolved";
      identity: string;
      reference: TReference;
      item: TItem;
    }
  | {
      status: "unavailable";
      identity: string;
      reference: TReference;
      item: TItem;
    }
  | {
      status: "missing";
      identity: string;
      reference: TReference;
    };

export type ReferenceCatalogQuery<TItem, TCapability extends string = string> = {
  capabilities?: readonly TCapability[];
  includeUnavailable?: boolean;
  eligible?: (item: TItem) => boolean;
};

function normalizeIdentity(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isReferenceCatalogItemAvailable(
  item: Pick<ReferenceCatalogItem<unknown>, "state">,
) {
  if (item.state?.available === false) return false;
  if (item.state?.enabled === false) return false;
  return true;
}

export function createReferenceCatalogIndex<
  TReference,
  TItem extends ReferenceCatalogItem<TReference>,
>(items: readonly TItem[]) {
  const index = new Map<string, TItem>();

  for (const item of items) {
    const identity = normalizeIdentity(item.identity);
    if (!identity) {
      throw new Error("Reference catalog items must have a non-empty identity.");
    }
    if (index.has(identity)) {
      throw new Error(`Duplicate reference catalog identity: ${identity}`);
    }
    index.set(identity, item);
  }

  return index;
}

export function resolveReferenceCatalogItem<
  TReference,
  TItem extends ReferenceCatalogItem<TReference>,
>(
  reference: TReference,
  index: ReadonlyMap<string, TItem>,
  getIdentity: (reference: TReference) => string,
): ReferenceCatalogResolution<TReference, TItem> {
  const identity = normalizeIdentity(getIdentity(reference));
  const item = identity ? index.get(identity) : undefined;

  if (!item) {
    return {
      status: "missing",
      identity,
      reference,
    };
  }

  return {
    status: isReferenceCatalogItemAvailable(item) ? "resolved" : "unavailable",
    identity,
    reference,
    item,
  };
}

export function queryReferenceCatalog<
  TReference,
  TCapability extends string,
  TItem extends ReferenceCatalogItem<TReference, TCapability>,
>(
  items: readonly TItem[],
  query: ReferenceCatalogQuery<TItem, TCapability> = {},
) {
  const requiredCapabilities = new Set(query.capabilities || []);

  return items.filter((item) => {
    if (!query.includeUnavailable && !isReferenceCatalogItemAvailable(item)) {
      return false;
    }

    if (
      requiredCapabilities.size > 0 &&
      ![...requiredCapabilities].every((capability) =>
        item.capabilities?.includes(capability),
      )
    ) {
      return false;
    }

    return query.eligible ? query.eligible(item) : true;
  });
}
