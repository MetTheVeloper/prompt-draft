import {
  hairBasePropertyIds,
  hairComponentStarters,
  hairComponentTypes,
  hairPresetRecipes,
  hairPropertyDefinitions,
} from "./hair.catalog";
import type { HairPropertyState } from "./hair.types";

export type HairCatalogIssue = {
  code:
    | "missing_property"
    | "unknown_component_type"
    | "unsupported_component_property"
    | "unknown_property_option";
  path: string;
  message: string;
};

function validatePropertyState(
  propertyId: string,
  state: HairPropertyState,
  path: string,
  issues: HairCatalogIssue[],
) {
  const definition = hairPropertyDefinitions[propertyId];
  if (!definition) {
    issues.push({
      code: "missing_property",
      path,
      message: `Unknown hair property: ${propertyId}`,
    });
    return;
  }

  if (state.mode !== "option" || !state.value) return;
  if (definition.options.some((option) => option.value === state.value)) return;

  issues.push({
    code: "unknown_property_option",
    path,
    message: `Unknown option ${state.value} for hair property ${propertyId}`,
  });
}

function validateProperties(
  properties: Record<string, HairPropertyState> | undefined,
  path: string,
  issues: HairCatalogIssue[],
  allowedPropertyIds?: Set<string>,
) {
  Object.entries(properties || {}).forEach(([propertyId, state]) => {
    if (allowedPropertyIds && !allowedPropertyIds.has(propertyId)) {
      issues.push({
        code: "unsupported_component_property",
        path: `${path}.${propertyId}`,
        message: `Property ${propertyId} is not declared for this hair component type`,
      });
    }

    validatePropertyState(
      propertyId,
      state,
      `${path}.${propertyId}`,
      issues,
    );
  });
}

export function validateHairCatalog(): HairCatalogIssue[] {
  const issues: HairCatalogIssue[] = [];
  const componentTypeMap = new Map(
    hairComponentTypes.map((component) => [component.value, component]),
  );

  hairBasePropertyIds.forEach((propertyId) => {
    if (hairPropertyDefinitions[propertyId]) return;
    issues.push({
      code: "missing_property",
      path: `baseProperties.${propertyId}`,
      message: `Unknown base hair property: ${propertyId}`,
    });
  });

  hairComponentTypes.forEach((component) => {
    component.propertyIds.forEach((propertyId) => {
      if (hairPropertyDefinitions[propertyId]) return;
      issues.push({
        code: "missing_property",
        path: `componentTypes.${component.value}.${propertyId}`,
        message: `Unknown hair component property: ${propertyId}`,
      });
    });
  });

  hairComponentStarters.forEach((starter) => {
    const component = componentTypeMap.get(starter.type);
    if (!component) {
      issues.push({
        code: "unknown_component_type",
        path: `starters.${starter.id}.type`,
        message: `Unknown hair component type: ${starter.type}`,
      });
      return;
    }

    validateProperties(
      starter.properties,
      `starters.${starter.id}.properties`,
      issues,
      new Set(component.propertyIds),
    );
  });

  hairPresetRecipes.forEach((preset) => {
    validateProperties(
      preset.properties,
      `presets.${preset.id}.properties`,
      issues,
      new Set(hairBasePropertyIds),
    );

    ;(preset.components || []).forEach((componentRecipe) => {
      const component = componentTypeMap.get(componentRecipe.type);
      if (!component) {
        issues.push({
          code: "unknown_component_type",
          path: `presets.${preset.id}.components.${componentRecipe.key}.type`,
          message: `Unknown hair component type: ${componentRecipe.type}`,
        });
        return;
      }

      validateProperties(
        componentRecipe.properties,
        `presets.${preset.id}.components.${componentRecipe.key}.properties`,
        issues,
        new Set(component.propertyIds),
      );
    });
  });

  return issues;
}
