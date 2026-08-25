import type {
  ModuleEntity,
  ModuleEntityPayload,
  ModuleEntityRef,
} from "../modules/entityContracts";
import {
  createModuleEntityRef,
  moduleEntityRefIdentity,
} from "../modules/entityContracts";
import {
  createReferenceCatalogIndex,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "./referenceCatalog";

export type ModuleEntityReferenceCatalogPresentation = {
  label?: string;
  description?: string;
  token?: string;
  group?: string;
  groupLabel?: string;
  color?: string;
};

export type ModuleEntityReferenceCatalogItem<
  TPayload extends object = ModuleEntityPayload,
> = ReferenceCatalogItem<ModuleEntityRef, string, ModuleEntity<TPayload>>;

export function createModuleEntityReferenceCatalogItem<
  TPayload extends object = ModuleEntityPayload,
>(
  moduleKey: string,
  entity: ModuleEntity<TPayload>,
  presentation: ModuleEntityReferenceCatalogPresentation = {},
): ModuleEntityReferenceCatalogItem<TPayload> {
  const label = presentation.label || entity.name || entity.key || entity.id;
  const reference = createModuleEntityRef(moduleKey, entity, {
    token: presentation.token,
    label,
  });

  return {
    identity: moduleEntityRefIdentity(reference),
    reference,
    presentation: {
      label,
      description: presentation.description ?? entity.key,
      token: presentation.token,
      name: entity.name,
      group: presentation.group,
      groupLabel: presentation.groupLabel,
      color: presentation.color,
    },
    kind: "module_entity",
    scope: moduleKey,
    state: {
      available: entity.enabled !== false,
      enabled: entity.enabled !== false,
    },
    metadata: entity,
  };
}

export function createModuleEntityReferenceCatalogIndex<
  TPayload extends object = ModuleEntityPayload,
>(
  moduleKey: string,
  entities: readonly ModuleEntity<TPayload>[],
  getPresentation?: (
    entity: ModuleEntity<TPayload>,
  ) => ModuleEntityReferenceCatalogPresentation,
) {
  return createReferenceCatalogIndex(
    entities.map((entity) =>
      createModuleEntityReferenceCatalogItem(
        moduleKey,
        entity,
        getPresentation?.(entity),
      ),
    ),
  );
}

export function resolveModuleEntityReferenceCatalogItem<
  TPayload extends object = ModuleEntityPayload,
>(
  reference: ModuleEntityRef,
  index: ReadonlyMap<string, ModuleEntityReferenceCatalogItem<TPayload>>,
) {
  return resolveReferenceCatalogItem(
    reference,
    index,
    moduleEntityRefIdentity,
  );
}
