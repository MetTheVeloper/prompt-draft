import type { PromptKeyModule } from "../modules/types";
import { moduleSupportsEntities } from "../modules/entityContracts";
import { parseVariableDefinitions } from "./promptVariables";
import {
  createPromptIdentityRegistry,
  normalizePromptIdentityKey,
  rewritePromptTokens,
  type PromptIdentityRegistry,
  type PromptIdentityRegistryOptions,
} from "./promptIdentity";

const DEFINITION_TOKEN_PATTERN = /^\s*•\s*(\{([a-z][a-zA-Z0-9_]*)\})\s*=/gm;
const STRUCTURAL_TOKEN_PATTERN = /\{((?:hair|outfit)_[a-z][a-zA-Z0-9_]*?)\}/g;

const RESERVED_KEYS = [
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

type FallbackEntry = {
  sourceToken: string;
  preferredKey: string;
  qualifierKeys: string[];
};

function tokenKey(value: string) {
  return value.replace(/^\{|\}$/g, "");
}

function keyIdentity(value: string) {
  return value.toLowerCase();
}

function outputText(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function moduleByKey(modules: readonly PromptKeyModule[], key: string) {
  return modules.find((module) => module.key === key);
}

function addDefinitionEntries(
  entries: FallbackEntry[],
  seen: Set<string>,
  options: PromptIdentityRegistryOptions,
) {
  const modules = options.modules || [];
  const outputs = options.outputs || {};

  Object.entries(outputs).forEach(([moduleKey, value]) => {
    const module = moduleByKey(modules, moduleKey);
    const ownsNamedDefinitions =
      moduleKey === "scene" || Boolean(module && moduleSupportsEntities(module));
    if (!ownsNamedDefinitions || typeof value !== "string") return;

    for (const match of value.matchAll(DEFINITION_TOKEN_PATTERN)) {
      const sourceToken = match[1] || "";
      const sourceKey = match[2] || "";
      if (!sourceToken || seen.has(sourceToken)) continue;

      const expectedPrefix = `${moduleKey}_`;
      if (!sourceKey.startsWith(expectedPrefix)) continue;

      const semanticSuffix = sourceKey.slice(expectedPrefix.length);
      if (!semanticSuffix) continue;

      seen.add(sourceToken);
      entries.push({
        sourceToken,
        preferredKey: normalizePromptIdentityKey(semanticSuffix, moduleKey),
        qualifierKeys: [moduleKey],
      });
    }
  });
}

function addSpecializedStructuralEntries(
  entries: FallbackEntry[],
  seen: Set<string>,
  options: PromptIdentityRegistryOptions,
) {
  const searchable = Object.values(options.outputs || {})
    .map(outputText)
    .filter(Boolean)
    .join("\n");

  for (const match of searchable.matchAll(STRUCTURAL_TOKEN_PATTERN)) {
    const sourceKey = match[1] || "";
    const sourceToken = `{${sourceKey}}`;
    if (!sourceKey || seen.has(sourceToken)) continue;

    const [moduleKey, ...segments] = sourceKey.split("_");
    if ((moduleKey !== "hair" && moduleKey !== "outfit") || !segments.length) {
      continue;
    }

    const preferredSegment = segments[segments.length - 1] || "item";
    const parentSegments = segments.slice(0, -1);
    const parentKey = parentSegments.length
      ? normalizePromptIdentityKey(parentSegments.join(" "), moduleKey)
      : "";

    seen.add(sourceToken);
    entries.push({
      sourceToken,
      preferredKey: normalizePromptIdentityKey(preferredSegment, moduleKey),
      qualifierKeys: [parentKey, moduleKey].filter(Boolean),
    });
  }
}

function collectUsedKeys(
  base: PromptIdentityRegistry,
  options: PromptIdentityRegistryOptions,
) {
  const used = new Set<string>();
  const add = (key: string) => {
    const cleaned = key.trim();
    if (cleaned) used.add(keyIdentity(cleaned));
  };

  RESERVED_KEYS.forEach(add);
  options.modules?.forEach((module) => add(module.key));
  options.reservedKeys && Array.from(options.reservedKeys).forEach(add);
  base.aliases.forEach((alias) => add(tokenKey(alias)));

  const variables = options.outputs?.variables;
  if (typeof variables === "string") {
    parseVariableDefinitions(variables).forEach((variable) => add(variable.key));
  }

  return used;
}

function combine(prefixes: string[], preferred: string) {
  return normalizePromptIdentityKey(
    [...prefixes, preferred].filter(Boolean).join(" "),
    preferred,
  );
}

function allocateFallbackAliases(
  base: PromptIdentityRegistry,
  entries: FallbackEntry[],
  options: PromptIdentityRegistryOptions,
) {
  const aliases = new Map(base.aliases);
  const used = collectUsedKeys(base, options);
  const counts = new Map<string, number>();

  entries.forEach((entry) => {
    const id = keyIdentity(entry.preferredKey);
    counts.set(id, (counts.get(id) || 0) + 1);
  });

  entries.forEach((entry) => {
    if (aliases.has(entry.sourceToken)) return;

    const preferredId = keyIdentity(entry.preferredKey);
    const uniquePreferred = counts.get(preferredId) === 1;
    const candidates: string[] = [];

    if (uniquePreferred && !used.has(preferredId)) {
      candidates.push(entry.preferredKey);
    }

    for (let depth = 1; depth <= entry.qualifierKeys.length; depth += 1) {
      candidates.push(
        combine(
          entry.qualifierKeys.slice(0, depth).reverse(),
          entry.preferredKey,
        ),
      );
    }

    let candidate = candidates.find((key) => !used.has(keyIdentity(key)));
    if (!candidate) {
      const baseKey = candidates[candidates.length - 1] || entry.preferredKey;
      let suffix = 2;
      candidate = `${baseKey}${suffix}`;
      while (used.has(keyIdentity(candidate))) {
        suffix += 1;
        candidate = `${baseKey}${suffix}`;
      }
    }

    used.add(keyIdentity(candidate));
    aliases.set(entry.sourceToken, `{${candidate}}`);
  });

  return aliases;
}

/**
 * Build the prompt-facing identity registry from canonical state first, then
 * fill gaps from module-owned definition tokens. The fallback parser only
 * accepts definitions emitted by known entity-capable modules and exact
 * structural Hair/Outfit token shapes; it never strips arbitrary substrings.
 */
export function createPromptFacingIdentityRegistry(
  options: PromptIdentityRegistryOptions = {},
): PromptIdentityRegistry {
  const base = createPromptIdentityRegistry(options);
  const entries: FallbackEntry[] = [];
  const seen = new Set(base.aliases.keys());

  addDefinitionEntries(entries, seen, options);
  addSpecializedStructuralEntries(entries, seen, options);

  const aliases = allocateFallbackAliases(base, entries, options);

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
