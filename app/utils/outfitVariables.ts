import type { OutfitItem, OutfitSet } from "../modules/outfit.types";

function normalizeEntityId(value: string) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "entity";
}

export function getOutfitSetVariableKey(setOrId: OutfitSet | string) {
  const id = typeof setOrId === "string" ? setOrId : setOrId.id;
  return `outfit_set_${normalizeEntityId(id)}`;
}

export function getOutfitSetVariableToken(setOrId: OutfitSet | string) {
  return `{${getOutfitSetVariableKey(setOrId)}}`;
}

export function getOutfitItemVariableKey(itemOrId: OutfitItem | string) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
  return `outfit_item_${normalizeEntityId(id)}`;
}

export function getOutfitItemVariableToken(itemOrId: OutfitItem | string) {
  return `{${getOutfitItemVariableKey(itemOrId)}}`;
}
