import type { OutfitItem, OutfitSet } from "../modules/outfit.types";

function splitWords(value: string) {
  return String(value || "")
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
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "";
}

/**
 * Normalize a user-facing Outfit semantic key to lower camelCase.
 * Underscores are intentionally excluded because `_` is reserved as the
 * hierarchy boundary in generated prompt tokens.
 */
export function normalizeOutfitEntityKey(
  value: string,
  fallback = "entity",
) {
  const sourceWords = splitWords(value);
  const fallbackWords = splitWords(fallback);
  const words = sourceWords.length ? sourceWords : fallbackWords.length ? fallbackWords : ["entity"];

  const [first, ...rest] = words;
  let key = `${first.toLowerCase()}${rest
    .map((word) => upperFirst(word.toLowerCase()))
    .join("")}`;

  if (!/^[a-z]/.test(key)) {
    const prefix = normalizeOutfitEntityKey(fallback === value ? "entity" : fallback, "entity");
    key = `${prefix}${upperFirst(key)}`;
  }

  return key.replace(/[^a-zA-Z0-9]/g, "") || "entity";
}

export function isValidOutfitEntityKey(value: string) {
  return /^[a-z][a-zA-Z0-9]*$/.test(String(value || ""));
}

export function createUniqueOutfitEntityKey(
  value: string,
  existingKeys: Iterable<string>,
  fallback = "entity",
) {
  const base = normalizeOutfitEntityKey(value, fallback);
  const used = new Set(
    Array.from(existingKeys, (key) => normalizeOutfitEntityKey(key, fallback)),
  );

  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export function humanizeOutfitEntityKey(value: string) {
  const cleaned = normalizeOutfitEntityKey(value);
  return cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9]+)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function setKey(setOrKey: OutfitSet | string) {
  return normalizeOutfitEntityKey(
    typeof setOrKey === "string" ? setOrKey : setOrKey.key,
    "set",
  );
}

function itemKey(itemOrKey: OutfitItem | string) {
  return normalizeOutfitEntityKey(
    typeof itemOrKey === "string" ? itemOrKey : itemOrKey.key,
    "item",
  );
}

/** Global set key: outfit | setKey */
export function getOutfitSetVariableKey(setOrKey: OutfitSet | string) {
  return `outfit_${setKey(setOrKey)}`;
}

export function getOutfitSetVariableToken(setOrKey: OutfitSet | string) {
  return `{${getOutfitSetVariableKey(setOrKey)}}`;
}

/** Global item key: outfit | setKey | itemKey */
export function getOutfitItemVariableKey(
  setOrKey: OutfitSet | string,
  itemOrKey: OutfitItem | string,
) {
  return `outfit_${setKey(setOrKey)}_${itemKey(itemOrKey)}`;
}

export function getOutfitItemVariableToken(
  setOrKey: OutfitSet | string,
  itemOrKey: OutfitItem | string,
) {
  return `{${getOutfitItemVariableKey(setOrKey, itemOrKey)}}`;
}

/** Short alias used only inside its owning Outfit Set definition. */
export function getOutfitItemLocalAlias(itemOrKey: OutfitItem | string) {
  return `{${itemKey(itemOrKey)}}`;
}
