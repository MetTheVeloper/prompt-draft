import type {
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
} from "../modules/types";
import {
  getModuleEntities,
  moduleSupportsEntities,
} from "../modules/entityContracts";
import { normalizeLayoutRegionsState } from "./layoutRegions";
import { normalizeTypographyGroups } from "./typography";
import { normalizeHairStyles } from "./compileHair";
import { normalizeOutfitSets } from "./compileOutfit";
import {
  getLayoutRegionVariableToken,
  getTypographyGroupVariableToken,
  getTypographyTextVariableToken,
} from "./structuralVariables";
import {
  getHairComponentVariableToken,
  getHairStyleVariableToken,
} from "./hairVariables";
import {
  getOutfitItemVariableToken,
  getOutfitSetVariableToken,
} from "./outfitVariables";
import { getModuleEntityVariableToken } from "./moduleEntityVariables";
import { getSceneEntities, getSceneVariableToken } from "./scene";
import { parseVariableDefinitions } from "./promptVariables";

export type PromptIdentityEntryKind =
  | "layout_region"
  | "scene"
  | "module_entity"
  | "typography_group"
  | "typography_text"
  | "hair_style"
  | "hair_component"
  | "outfit_set"
  | "outfit_item";

type PromptIdentityEntry = {
  identity: string;
  sourceToken: string;
  preferredKey: string;
  qualifierKeys?: string[];
  kind: PromptIdentityEntryKind;
  fixed?: boolean;
};

export type PromptIdentityRegistry = {
  aliases: ReadonlyMap<string, string>;
  aliasForToken: (token: string) => string;
  rewrite: (text: string) => string;
};

export type PromptIdentityRegistryOptions = {
  modules?: readonly PromptKeyModule[];
  moduleValues?: Record<string, ModuleValues>;
  outputs?: Record<string, unknown>;
  reservedKeys?: Iterable<string>;
};

const BUILTIN_RESERVED_KEYS = [
  "mode",
  "reference",
  "idea",
  "subject",
  "reference_usage",
  "preserve",
  "transformation_strength",
  "aspect",
  "rules",
  "variables",
  "layout",
  "scene",
  "scenes",
  "typography",
];

const PROMPT_TOKEN_PATTERN = /\{([a-z][a-zA-Z0-9_]*)\}/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function splitWords(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/['"`]+/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function upperFirst(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : "";
}

/** Prompt-facing semantic names use compact lowerCamelCase. */
export function normalizePromptIdentityKey(
  value: unknown,
  fallback = "item",
) {
  const sourceWords = splitWords(value);
  const fallbackWords = splitWords(fallback);
  const words = sourceWords.length
    ? sourceWords
    : fallbackWords.length
      ? fallbackWords
      : ["item"];

  const [first = "item", ...rest] = words;
  let key = `${first.toLowerCase()}${rest
    .map((word) => upperFirst(word.toLowerCase()))
    .join("")}`;

  if (!/^[a-z]/.test(key)) {
    const safeFallback = normalizePromptIdentityKey(
      fallback === value ? "item" : fallback,
      "item",
    );
    key = `${safeFallback}${upperFirst(key)}`;
  }

  return key.replace(/[^a-zA-Z0-9]/g, "") || "item";
}

function tokenKey(token: unknown) {
  const match = String(token ?? "").trim().match(/^\{([a-z][a-zA-Z0-9_]*)\}$/);
  return match?.[1] || "";
}

function formatToken(key: string) {
  return `{${key}}`;
}

function keyIdentity(value: string) {
  return value.trim().toLowerCase();
}

function combineAliasKeys(prefixes: string[], preferred: string) {
  return normalizePromptIdentityKey(
    [...prefixes, preferred].filter(Boolean).join(" "),
    preferred || "item",
  );
}

function promptVariableList(value: unknown) {
  if (!Array.isArray(value)) return [] as PromptVariable[];

  return value.filter((item): item is PromptVariable => {
    if (!isRecord(item)) return false;
    return typeof item.key === "string";
  });
}

function addEntry(
  entries: PromptIdentityEntry[],
  seenSources: Set<string>,
  entry: PromptIdentityEntry,
) {
  const sourceKey = tokenKey(entry.sourceToken);
  if (!sourceKey || seenSources.has(entry.sourceToken)) return;

  seenSources.add(entry.sourceToken);
  entries.push(entry);
}

function addOutputStructuredEntries(
  entries: PromptIdentityEntry[],
  seenSources: Set<string>,
  outputs: Record<string, unknown>,
) {
  const layout = outputs.layout;
  if (isRecord(layout) && Array.isArray(layout.regions)) {
    layout.regions.forEach((region, index) => {
      if (!isRecord(region)) return;
      const sourceToken = typeof region.key === "string" ? region.key.trim() : "";
      const name = typeof region.name === "string" ? region.name : "";
      addEntry(entries, seenSources, {
        identity: `layout:output:${index}:${sourceToken}`,
        sourceToken,
        preferredKey: normalizePromptIdentityKey(name, `region${index + 1}`),
        qualifierKeys: ["layout"],
        kind: "layout_region",
      });
    });
  }

  const typography = outputs.typography;
  if (isRecord(typography) && Array.isArray(typography.groups)) {
    let textIndex = 0;
    typography.groups.forEach((group, groupIndex) => {
      if (!isRecord(group)) return;
      const sourceToken = typeof group.key === "string" ? group.key.trim() : "";
      addEntry(entries, seenSources, {
        identity: `typography:group:output:${groupIndex}:${sourceToken}`,
        sourceToken,
        preferredKey: `tg_${groupIndex + 1}`,
        kind: "typography_group",
        fixed: true,
      });

      const texts = Array.isArray(group.texts) ? group.texts : [];
      texts.forEach((text) => {
        textIndex += 1;
        if (!isRecord(text)) return;
        const textToken = typeof text.key === "string" ? text.key.trim() : "";
        addEntry(entries, seenSources, {
          identity: `typography:text:output:${textIndex}:${textToken}`,
          sourceToken: textToken,
          preferredKey: `tt_${textIndex}`,
          kind: "typography_text",
          fixed: true,
        });
      });
    });
  }
}

function addStateEntries(
  entries: PromptIdentityEntry[],
  seenSources: Set<string>,
  modules: readonly PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
) {
  const layoutValues = moduleValues.layout || {};
  normalizeLayoutRegionsState(layoutValues.regions).regions.forEach((region, index) => {
    addEntry(entries, seenSources, {
      identity: `layout:${region.id}`,
      sourceToken: getLayoutRegionVariableToken(region.id),
      preferredKey: normalizePromptIdentityKey(region.name, `region${index + 1}`),
      qualifierKeys: ["layout"],
      kind: "layout_region",
    });
  });

  getSceneEntities(moduleValues.scene || {}).forEach((scene, index) => {
    addEntry(entries, seenSources, {
      identity: `scene:${scene.id}`,
      sourceToken: getSceneVariableToken(scene),
      preferredKey: normalizePromptIdentityKey(
        scene.name || scene.key,
        `scene${index + 1}`,
      ),
      qualifierKeys: ["scene"],
      kind: "scene",
    });
  });

  modules
    .filter(moduleSupportsEntities)
    .forEach((module) => {
      getModuleEntities(moduleValues[module.key] || {}).forEach((entity, index) => {
        addEntry(entries, seenSources, {
          identity: `module_entity:${module.key}:${entity.id}`,
          sourceToken: getModuleEntityVariableToken(module.key, entity),
          preferredKey: normalizePromptIdentityKey(
            entity.name || entity.key,
            `${module.key}${index + 1}`,
          ),
          qualifierKeys: [module.key],
          kind: "module_entity",
        });
      });
    });

  let typographyTextIndex = 0;
  normalizeTypographyGroups(moduleValues.typography?.textGroups).forEach(
    (group, groupIndex) => {
      addEntry(entries, seenSources, {
        identity: `typography:group:${group.id || groupIndex}`,
        sourceToken: getTypographyGroupVariableToken(group),
        preferredKey: `tg_${groupIndex + 1}`,
        kind: "typography_group",
        fixed: true,
      });

      (group.texts || []).forEach((block, blockIndex) => {
        typographyTextIndex += 1;
        addEntry(entries, seenSources, {
          identity: `typography:text:${group.id || groupIndex}:${block.id || blockIndex}`,
          sourceToken: getTypographyTextVariableToken(block),
          preferredKey: `tt_${typographyTextIndex}`,
          kind: "typography_text",
          fixed: true,
        });
      });
    },
  );

  normalizeHairStyles(moduleValues.hair?.hairStyles).forEach((style, styleIndex) => {
    const stylePreferred = normalizePromptIdentityKey(
      style.name || style.key,
      `hairStyle${styleIndex + 1}`,
    );
    addEntry(entries, seenSources, {
      identity: `hair:${style.id}`,
      sourceToken: getHairStyleVariableToken(style),
      preferredKey: stylePreferred,
      qualifierKeys: ["hair"],
      kind: "hair_style",
    });

    style.components.forEach((component, componentIndex) => {
      addEntry(entries, seenSources, {
        identity: `hair:${style.id}:${component.id}`,
        sourceToken: getHairComponentVariableToken(style, component),
        preferredKey: normalizePromptIdentityKey(
          component.name || component.customType || component.key,
          `hairComponent${componentIndex + 1}`,
        ),
        qualifierKeys: [stylePreferred, "hair"],
        kind: "hair_component",
      });
    });
  });

  normalizeOutfitSets(moduleValues.outfit?.outfitSets).forEach((set, setIndex) => {
    const setPreferred = normalizePromptIdentityKey(
      set.name || set.key,
      `outfitSet${setIndex + 1}`,
    );
    addEntry(entries, seenSources, {
      identity: `outfit:${set.id}`,
      sourceToken: getOutfitSetVariableToken(set),
      preferredKey: setPreferred,
      qualifierKeys: ["outfit"],
      kind: "outfit_set",
    });

    set.items.forEach((item, itemIndex) => {
      addEntry(entries, seenSources, {
        identity: `outfit:${set.id}:${item.id}`,
        sourceToken: getOutfitItemVariableToken(set, item),
        preferredKey: normalizePromptIdentityKey(
          item.name || item.customType || item.key,
          `outfitItem${itemIndex + 1}`,
        ),
        qualifierKeys: [setPreferred, "outfit"],
        kind: "outfit_item",
      });
    });
  });
}

function collectReservedKeys(options: PromptIdentityRegistryOptions) {
  const reserved = new Set<string>();
  const add = (value: unknown) => {
    const key = String(value ?? "").trim();
    if (key) reserved.add(keyIdentity(key));
  };

  BUILTIN_RESERVED_KEYS.forEach(add);
  options.modules?.forEach((module) => add(module.key));
  options.reservedKeys && Array.from(options.reservedKeys).forEach(add);

  promptVariableList(options.moduleValues?.variables?.variables).forEach((variable) => {
    add(variable.key);
  });

  const variablesOutput = options.outputs?.variables;
  if (typeof variablesOutput === "string") {
    parseVariableDefinitions(variablesOutput).forEach((variable) => add(variable.key));
  }

  return reserved;
}

function qualifiedCandidates(entry: PromptIdentityEntry) {
  const preferred = entry.preferredKey;
  const qualifiers = (entry.qualifierKeys || [])
    .map((value) => normalizePromptIdentityKey(value, ""))
    .filter(Boolean);
  const candidates: string[] = [];

  for (let depth = 1; depth <= qualifiers.length; depth += 1) {
    const prefix = qualifiers.slice(0, depth).reverse();
    candidates.push(combineAliasKeys(prefix, preferred));
  }

  return candidates;
}

function allocateAliases(
  entries: PromptIdentityEntry[],
  reservedKeys: Set<string>,
) {
  const aliases = new Map<string, string>();
  const usedKeys = new Set(reservedKeys);
  const preferredCounts = new Map<string, number>();

  entries
    .filter((entry) => !entry.fixed)
    .forEach((entry) => {
      const identity = keyIdentity(entry.preferredKey);
      preferredCounts.set(identity, (preferredCounts.get(identity) || 0) + 1);
    });

  // Structural aliases are deliberate compiler-owned namespaces.
  entries.filter((entry) => entry.fixed).forEach((entry) => {
    let candidate = entry.preferredKey;
    let suffix = 2;
    while (usedKeys.has(keyIdentity(candidate))) {
      candidate = `${entry.preferredKey}_${suffix}`;
      suffix += 1;
    }
    usedKeys.add(keyIdentity(candidate));
    aliases.set(entry.sourceToken, formatToken(candidate));
  });

  entries.filter((entry) => !entry.fixed).forEach((entry) => {
    const preferred = entry.preferredKey;
    const preferredIdentity = keyIdentity(preferred);
    const preferredIsUnique = preferredCounts.get(preferredIdentity) === 1;
    const candidates = [
      ...(preferredIsUnique && !usedKeys.has(preferredIdentity) ? [preferred] : []),
      ...qualifiedCandidates(entry),
    ];

    let candidate = candidates.find((value) => {
      return value && !usedKeys.has(keyIdentity(value));
    });

    if (!candidate) {
      const base = candidates[candidates.length - 1] || preferred || "item";
      let suffix = 2;
      candidate = `${base}${suffix}`;
      while (usedKeys.has(keyIdentity(candidate))) {
        suffix += 1;
        candidate = `${base}${suffix}`;
      }
    }

    usedKeys.add(keyIdentity(candidate));
    aliases.set(entry.sourceToken, formatToken(candidate));
  });

  return aliases;
}

export function rewritePromptTokens(
  text: string,
  aliases: ReadonlyMap<string, string>,
) {
  if (!text || !aliases.size) return text;

  return text.replace(PROMPT_TOKEN_PATTERN, (token) => aliases.get(token) || token);
}

export function createPromptIdentityRegistry(
  options: PromptIdentityRegistryOptions = {},
): PromptIdentityRegistry {
  const entries: PromptIdentityEntry[] = [];
  const seenSources = new Set<string>();
  const outputs = options.outputs || {};
  const modules = options.modules || [];
  const moduleValues = options.moduleValues || {};

  addOutputStructuredEntries(entries, seenSources, outputs);
  addStateEntries(entries, seenSources, modules, moduleValues);

  const aliases = allocateAliases(entries, collectReservedKeys(options));

  return {
    aliases,
    aliasForToken(token: string) {
      return aliases.get(token) || token;
    },
    rewrite(text: string) {
      return rewritePromptTokens(text, aliases);
    },
  };
}
