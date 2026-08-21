import type { HairComponent, HairStyle } from "../modules/hair.types";

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

export function normalizeHairEntityKey(value: string, fallback = "entity") {
  const sourceWords = splitWords(value);
  const fallbackWords = splitWords(fallback);
  const words = sourceWords.length
    ? sourceWords
    : fallbackWords.length
      ? fallbackWords
      : ["entity"];

  const [first, ...rest] = words;
  let key = `${first.toLowerCase()}${rest
    .map((word) => upperFirst(word.toLowerCase()))
    .join("")}`;

  if (!/^[a-z]/.test(key)) {
    const prefix = normalizeHairEntityKey(
      fallback === value ? "entity" : fallback,
      "entity",
    );
    key = `${prefix}${upperFirst(key)}`;
  }

  return key.replace(/[^a-zA-Z0-9]/g, "") || "entity";
}

export function isValidHairEntityKey(value: string) {
  return /^[a-z][a-zA-Z0-9]*$/.test(String(value || ""));
}

export function createUniqueHairEntityKey(
  value: string,
  existingKeys: Iterable<string>,
  fallback = "entity",
) {
  const base = normalizeHairEntityKey(value, fallback);
  const used = new Set(
    Array.from(existingKeys, (key) => normalizeHairEntityKey(key, fallback)),
  );

  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export function humanizeHairEntityKey(value: string) {
  const cleaned = normalizeHairEntityKey(value);
  return cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9]+)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function styleKey(styleOrKey: HairStyle | string) {
  return normalizeHairEntityKey(
    typeof styleOrKey === "string" ? styleOrKey : styleOrKey.key,
    "style",
  );
}

function componentKey(componentOrKey: HairComponent | string) {
  return normalizeHairEntityKey(
    typeof componentOrKey === "string" ? componentOrKey : componentOrKey.key,
    "component",
  );
}

/** Global hairstyle key: hair | hairstyleKey */
export function getHairStyleVariableKey(styleOrKey: HairStyle | string) {
  return `hair_${styleKey(styleOrKey)}`;
}

export function getHairStyleVariableToken(styleOrKey: HairStyle | string) {
  return `{${getHairStyleVariableKey(styleOrKey)}}`;
}

/** Global component key: hair | hairstyleKey | componentKey */
export function getHairComponentVariableKey(
  styleOrKey: HairStyle | string,
  componentOrKey: HairComponent | string,
) {
  return `hair_${styleKey(styleOrKey)}_${componentKey(componentOrKey)}`;
}

export function getHairComponentVariableToken(
  styleOrKey: HairStyle | string,
  componentOrKey: HairComponent | string,
) {
  return `{${getHairComponentVariableKey(styleOrKey, componentOrKey)}}`;
}

export function getHairStyleLocalAlias(styleOrKey: HairStyle | string) {
  return `{${styleKey(styleOrKey)}}`;
}

export function getHairComponentLocalAlias(
  componentOrKey: HairComponent | string,
) {
  return `{${componentKey(componentOrKey)}}`;
}
