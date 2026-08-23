import type {
  ModuleFieldOption,
  ModuleOptionCompatibility,
} from "./types";

export type FreeformOptionConfig = {
  category?: string;
  categoryLabel?: string;
  tags?: string[];
  compatibility?: ModuleOptionCompatibility;
  placeholder?: string;
};

export function createFreeformOption(
  config: FreeformOptionConfig = {},
): ModuleFieldOption {
  return {
    value: "Custom",
    promptText: "",
    freeform: true,
    freeformPlaceholder: config.placeholder,
    category: config.category,
    categoryLabel: config.categoryLabel,
    tags: config.tags,
    compatibility: config.compatibility,
  };
}

export function readModuleFieldOptions(value: unknown): ModuleFieldOption[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ModuleFieldOption => {
    return Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as ModuleFieldOption).value === "string"
    );
  });
}

export function appendFreeformOption<T extends ModuleFieldOption>(
  options: T[] | undefined,
  config: FreeformOptionConfig = {},
): ModuleFieldOption[] {
  const catalogOptions = (options || []).filter((option) => !option.freeform);
  return [...catalogOptions, createFreeformOption(config)];
}

export function appendFreeformConfigOption(
  value: unknown,
  config: FreeformOptionConfig = {},
) {
  return appendFreeformOption(readModuleFieldOptions(value), config);
}

export function collectOptionTags(options: ModuleFieldOption[] | undefined) {
  return Array.from(
    new Set((options || []).flatMap((option) => option.tags || [])),
  );
}
