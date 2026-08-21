import {
  outfitItemStarters,
  outfitItemTypes,
  outfitPresetRecipes,
  outfitPropertyDefinitions,
  outfitPropertyProfiles,
} from "./outfit.catalog";
import type { OutfitPropertyBinding } from "./outfit.types";

export type OutfitCatalogIssue = {
  code:
    | "missing_profile"
    | "missing_property"
    | "missing_option_set"
    | "unknown_item_type"
    | "unknown_starter_property"
    | "unknown_preset_property";
  path: string;
  message: string;
};

function validateBinding(
  binding: OutfitPropertyBinding,
  path: string,
  issues: OutfitCatalogIssue[],
) {
  const definition = outfitPropertyDefinitions[binding.propertyId];

  if (!definition) {
    issues.push({
      code: "missing_property",
      path,
      message: `Unknown outfit property: ${binding.propertyId}`,
    });
    return;
  }

  if (binding.optionSet && !definition.optionSets?.[binding.optionSet]) {
    issues.push({
      code: "missing_option_set",
      path,
      message: `Unknown option set ${binding.optionSet} for ${binding.propertyId}`,
    });
  }
}

function validatePropertyStateKeys(
  properties: Record<string, unknown> | undefined,
  path: string,
  code: "unknown_starter_property" | "unknown_preset_property",
  issues: OutfitCatalogIssue[],
) {
  Object.keys(properties || {}).forEach((propertyId) => {
    if (outfitPropertyDefinitions[propertyId]) return;

    issues.push({
      code,
      path: `${path}.properties.${propertyId}`,
      message: `Unknown outfit property: ${propertyId}`,
    });
  });
}

export function validateOutfitCatalog(): OutfitCatalogIssue[] {
  const issues: OutfitCatalogIssue[] = [];
  const knownTypes = new Set(outfitItemTypes.map((item) => item.value));

  Object.values(outfitPropertyProfiles).forEach((profile) => {
    profile.properties.forEach((binding, index) => {
      validateBinding(binding, `profiles.${profile.id}.${index}`, issues);
    });
  });

  outfitItemTypes.forEach((item) => {
    if (item.profileId && !outfitPropertyProfiles[item.profileId]) {
      issues.push({
        code: "missing_profile",
        path: `itemTypes.${item.value}.profileId`,
        message: `Unknown outfit property profile: ${item.profileId}`,
      });
    }

    item.properties?.forEach((binding, index) => {
      validateBinding(binding, `itemTypes.${item.value}.properties.${index}`, issues);
    });
  });

  outfitItemStarters.forEach((starter) => {
    if (!knownTypes.has(starter.item.type) && starter.item.type !== "custom") {
      issues.push({
        code: "unknown_item_type",
        path: `starters.${starter.id}.item.type`,
        message: `Unknown outfit item type: ${starter.item.type}`,
      });
    }

    validatePropertyStateKeys(
      starter.item.properties,
      `starters.${starter.id}.item`,
      "unknown_starter_property",
      issues,
    );
  });

  outfitPresetRecipes.forEach((preset) => {
    preset.items.forEach((item) => {
      if (!knownTypes.has(item.type) && item.type !== "custom") {
        issues.push({
          code: "unknown_item_type",
          path: `presets.${preset.id}.items.${item.key}.type`,
          message: `Unknown outfit item type: ${item.type}`,
        });
      }

      validatePropertyStateKeys(
        item.properties,
        `presets.${preset.id}.items.${item.key}`,
        "unknown_preset_property",
        issues,
      );
    });
  });

  return issues;
}
