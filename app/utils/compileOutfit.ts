import type { ModuleValues, PromptKeyModule } from "../modules/types";
import type {
  OutfitItem,
  OutfitItemRelation,
  OutfitPropertyState,
  OutfitSet,
  PromptReferenceRef,
} from "../modules/outfit.types";
import {
  getOutfitPropertyBindings,
  getOutfitPropertyOptions,
  outfitItemTypeMap,
  outfitPropertyDefinitions,
} from "../modules/outfit.catalog";
import {
  cleanSemanticText,
  formatSemanticScope,
  humanizeSemanticValue,
  normalizeSemanticTargets,
} from "./semanticTargets";
import {
  createUniqueOutfitEntityKey,
  getOutfitItemVariableToken,
  getOutfitSetVariableToken,
  humanizeOutfitEntityKey,
  normalizeOutfitEntityKey,
} from "./outfitVariables";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReference(value: unknown): PromptReferenceRef | undefined {
  if (!isRecord(value) || typeof value.token !== "string") return undefined;
  return {
    variableId: typeof value.variableId === "string" ? value.variableId : undefined,
    token: value.token,
    label: typeof value.label === "string" ? value.label : undefined,
    source:
      value.source === "user" || value.source === "system"
        ? value.source
        : undefined,
  };
}

function normalizePropertyState(value: unknown): OutfitPropertyState {
  if (!isRecord(value)) return { mode: "inherit" };

  if (value.mode === "option") {
    const optionValue = Array.isArray(value.value)
      ? value.value.filter((item): item is string => typeof item === "string")
      : typeof value.value === "string"
        ? value.value
        : "";
    return { mode: "option", value: optionValue };
  }

  if (value.mode === "custom") {
    return {
      mode: "custom",
      value: typeof value.value === "string" ? value.value : "",
    };
  }

  if (value.mode === "reference") {
    return { mode: "reference", reference: normalizeReference(value.reference) };
  }

  if (value.mode === "absent") return { mode: "absent" };
  return { mode: "inherit" };
}

function normalizeItem(
  value: unknown,
  index: number,
  usedKeys: Set<string>,
): OutfitItem | null {
  if (!isRecord(value)) return null;

  const type = typeof value.type === "string" && value.type.trim() ? value.type : "custom";
  const customType = typeof value.customType === "string" ? value.customType : undefined;
  const name = typeof value.name === "string" ? value.name : "";
  const rawKey = typeof value.key === "string" ? value.key : "";
  const keySource =
    rawKey ||
    (type === "custom" ? customType : "") ||
    (type !== "custom" ? type : "") ||
    name ||
    `item${index + 1}`;
  const key = createUniqueOutfitEntityKey(keySource, usedKeys, `item${index + 1}`);
  usedKeys.add(key);

  const properties = isRecord(value.properties)
    ? Object.fromEntries(
        Object.entries(value.properties).map(([propertyKey, state]) => [
          propertyKey,
          normalizePropertyState(state),
        ]),
      )
    : {};

  const sourceRecord = isRecord(value.source) ? value.source : {};
  const source =
    sourceRecord.mode === "reference"
      ? {
          mode: "reference" as const,
          reference:
            normalizeReference(sourceRecord.reference) || {
              token: "{reference}",
              source: "system" as const,
            },
          itemHint:
            typeof sourceRecord.itemHint === "string"
              ? sourceRecord.itemHint
              : undefined,
        }
      : { mode: "defined" as const };

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `outfit-item-${index + 1}`,
    key,
    name,
    type,
    customType,
    customCategory:
      typeof value.customCategory === "string"
        ? (value.customCategory as OutfitItem["customCategory"])
        : undefined,
    source,
    properties,
    additionalDetails:
      typeof value.additionalDetails === "string" ? value.additionalDetails : "",
  };
}

function normalizeRelation(value: unknown, index: number): OutfitItemRelation | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.sourceItemId !== "string" ||
    typeof value.targetItemId !== "string"
  ) {
    return null;
  }

  const type =
    value.type === "over" ||
    value.type === "under" ||
    value.type === "tucked_into" ||
    value.type === "layered_with"
      ? value.type
      : "layered_with";

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `outfit-relation-${index + 1}`,
    type,
    sourceItemId: value.sourceItemId,
    targetItemId: value.targetItemId,
    details: typeof value.details === "string" ? value.details : undefined,
  };
}

export function normalizeOutfitSets(value: unknown): OutfitSet[] {
  if (!Array.isArray(value)) return [];

  const usedSetKeys = new Set<string>();
  const sets: OutfitSet[] = [];

  value.filter(isRecord).forEach((set, setIndex) => {
    const name = typeof set.name === "string" ? set.name : "";
    const rawKey = typeof set.key === "string" ? set.key : "";
    const key = createUniqueOutfitEntityKey(
      rawKey || name || `set${setIndex + 1}`,
      usedSetKeys,
      `set${setIndex + 1}`,
    );
    usedSetKeys.add(key);

    const usedItemKeys = new Set<string>();
    const items = Array.isArray(set.items)
      ? set.items
          .map((item, itemIndex) => normalizeItem(item, itemIndex, usedItemKeys))
          .filter((item): item is OutfitItem => Boolean(item))
      : [];

    sets.push({
      id:
        typeof set.id === "string" && set.id.trim()
          ? set.id
          : `outfit-set-${setIndex + 1}`,
      key,
      name,
      presetId: typeof set.presetId === "string" ? set.presetId : undefined,
      targets: normalizeSemanticTargets(set.targets),
      items,
      relations: Array.isArray(set.relations)
        ? set.relations
            .map(normalizeRelation)
            .filter((relation): relation is OutfitItemRelation => Boolean(relation))
        : [],
      additionalDetails:
        typeof set.additionalDetails === "string" ? set.additionalDetails : "",
    });
  });

  return sets;
}

function itemTypeText(item: OutfitItem) {
  if (item.type === "custom") {
    return cleanSemanticText(item.customType) || "custom wearable item";
  }

  return (
    outfitItemTypeMap.get(item.type)?.promptText ||
    humanizeSemanticValue(item.type).toLowerCase()
  );
}

function referenceToken(reference?: PromptReferenceRef) {
  return cleanSemanticText(reference?.token || "{reference}");
}

function optionPromptTexts(
  propertyId: string,
  values: string[],
  optionSet?: string,
) {
  const options = getOutfitPropertyOptions(propertyId, optionSet);
  return values.map((value) => {
    const option = options.find((candidate) => candidate.value === value);
    return option?.promptText || humanizeSemanticValue(value).toLowerCase();
  });
}

function compileProperty(
  item: OutfitItem,
  propertyId: string,
  state: OutfitPropertyState,
  optionSet?: string,
) {
  const definition = outfitPropertyDefinitions[propertyId];
  if (!definition || state.mode === "inherit") return "";

  if (state.mode === "absent") {
    return definition.allowAbsent ? definition.absentPromptText || "" : "";
  }

  if (state.mode === "custom") {
    return cleanSemanticText(state.value);
  }

  if (state.mode === "reference") {
    const reference = state.reference ||
      (item.source.mode === "reference" ? item.source.reference : undefined);
    return `${definition.label.toLowerCase()} matching ${referenceToken(reference)}`;
  }

  const values = Array.isArray(state.value) ? state.value : [state.value];
  return optionPromptTexts(propertyId, values.filter(Boolean), optionSet).join(", ");
}

export function compileOutfitItem(item: OutfitItem) {
  const typeDefinition = outfitItemTypeMap.get(item.type);
  const bindings = typeDefinition ? getOutfitPropertyBindings(typeDefinition) : [];
  const bindingMap = new Map(bindings.map((binding) => [binding.propertyId, binding]));
  const propertyIds = [
    ...bindings.map((binding) => binding.propertyId),
    ...Object.keys(item.properties).filter((id) => !bindingMap.has(id)),
  ];

  const modifiers: string[] = [];
  const details: string[] = [];

  propertyIds.forEach((propertyId) => {
    const state = item.properties[propertyId] || { mode: "inherit" };
    const binding = bindingMap.get(propertyId);
    const text = compileProperty(item, propertyId, state, binding?.optionSet);
    if (!text) return;

    const placement = outfitPropertyDefinitions[propertyId]?.compilePlacement || "detail";
    (placement === "modifier" ? modifiers : details).push(text);
  });

  const baseline =
    item.source.mode === "reference"
      ? `${itemTypeText(item)} from ${referenceToken(item.source.reference)}${
          cleanSemanticText(item.source.itemHint)
            ? ` (${cleanSemanticText(item.source.itemHint)})`
            : ""
        }`
      : itemTypeText(item);

  return [
    [...new Set(modifiers), baseline].filter(Boolean).join(" "),
    ...new Set(details),
    cleanSemanticText(item.additionalDetails),
  ]
    .filter(Boolean)
    .join("; ");
}

function itemDisplay(item: OutfitItem) {
  return humanizeOutfitEntityKey(item.key).toLowerCase();
}

function setDisplay(set: OutfitSet) {
  return humanizeOutfitEntityKey(set.key);
}

function relationText(relation: OutfitItemRelation, items: OutfitItem[]) {
  const source = items.find((item) => item.id === relation.sourceItemId);
  const target = items.find((item) => item.id === relation.targetItemId);
  if (!source || !target) return "";

  const verb: Record<OutfitItemRelation["type"], string> = {
    over: "over",
    under: "under",
    tucked_into: "tucked into",
    layered_with: "layered with",
  };

  return `${itemDisplay(source)} ${verb[relation.type]} ${itemDisplay(target)}${
    cleanSemanticText(relation.details) ? `; ${cleanSemanticText(relation.details)}` : ""
  }`;
}

/**
 * Compile a clean, human-first Outfit block. Global tokens are intentionally
 * not emitted here. Final prompt assembly selectively promotes referenced
 * sets/items to local `{setKey}` / `{itemKey}` aliases while their external
 * identities remain globally namespaced.
 */
export function compileOutfitSet(set: OutfitSet) {
  const scope = formatSemanticScope(set.targets, [], { format: "modular" });
  if (!scope || !set.items.length) return "";

  const display = setDisplay(set);
  const lines = [
    `• ${scope}: wear ${display}`,
    `• ${display}:`,
    ...set.items.map((item) => {
      const description = compileOutfitItem(item);
      return description ? `  ◦ ${itemDisplay(item)}: ${description}` : "";
    }),
    ...(set.relations || []).map((relation) => {
      const text = relationText(relation, set.items);
      return text ? `  ◦ relation: ${text}` : "";
    }),
  ].filter(Boolean);

  const details = cleanSemanticText(set.additionalDetails);
  if (details) lines.push(`  ◦ set details: ${details}`);

  return lines.join("\n");
}

export function compileOutfitModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideFieldId = module.compile?.overrideField || "customText";
  const override = values[overrideFieldId];
  if (typeof override === "string" && override.trim()) {
    return cleanSemanticText(override);
  }

  return normalizeOutfitSets(values.outfitSets)
    .map(compileOutfitSet)
    .filter(Boolean)
    .join("\n");
}

type ParsedOutfitItemLine = {
  lineIndex: number;
  key: string;
};

type ParsedOutfitSetBlock = {
  key: string;
  display: string;
  headerIndex: number;
  itemLines: ParsedOutfitItemLine[];
};

/**
 * Promote only externally referenced Outfit entities to local prompt aliases.
 *
 * Example without references:
 *   • Evening Set:
 *     ◦ dress: dress
 *
 * Example when the dress is targeted elsewhere:
 *   • {eveningSet}:
 *     ◦ {dress}: dress
 *
 * External modules still use globally unique paths such as
 * `{outfit_eveningSet}` and `{outfit_eveningSet_dress}`. The short aliases are
 * scoped by the owning `{outfit}` definition and are never registered as
 * global variables.
 */
export function formatOutfitOutputForReferences(
  output: string,
  externalReferenceText: string,
) {
  const cleanedOutput = String(output || "").trim();
  if (!cleanedOutput) return "";

  const lines = cleanedOutput.split("\n");
  const blocks: ParsedOutfitSetBlock[] = [];
  let current: ParsedOutfitSetBlock | null = null;

  lines.forEach((line, lineIndex) => {
    const header = line.match(/^•\s+([^:]+):\s*$/);
    if (header && !line.includes(": wear ")) {
      const display = header[1].trim();
      const key = normalizeOutfitEntityKey(display, "set");
      current = { key, display, headerIndex: lineIndex, itemLines: [] };
      blocks.push(current);
      return;
    }

    if (!current) return;
    const item = line.match(/^\s*◦\s+([^:]+):\s*/);
    if (
      !item ||
      item[1].trim().toLowerCase() === "relation" ||
      item[1].trim().toLowerCase() === "set details"
    ) {
      return;
    }

    current.itemLines.push({
      lineIndex,
      key: normalizeOutfitEntityKey(item[1].trim(), "item"),
    });
  });

  blocks.forEach((block) => {
    const setToken = getOutfitSetVariableToken(block.key);
    const setAlias = `{${block.key}}`;
    const referencedItems = new Set(
      block.itemLines
        .filter((item) =>
          externalReferenceText.includes(
            getOutfitItemVariableToken(block.key, item.key),
          ),
        )
        .map((item) => item.key),
    );
    const setReferenced =
      externalReferenceText.includes(setToken) || referencedItems.size > 0;

    if (setReferenced) {
      lines[block.headerIndex] = `• ${setAlias}:`;
    }

    block.itemLines.forEach((item) => {
      if (!referencedItems.has(item.key)) return;
      lines[item.lineIndex] = lines[item.lineIndex].replace(
        /^(\s*◦\s+)([^:]+)(:\s*)/,
        `$1{${item.key}}$3`,
      );
    });

    lines.forEach((line, lineIndex) => {
      const applicationPrefix = /^•\s+.+:\s+wear\s+/;
      if (!applicationPrefix.test(line)) return;
      const suffix = line.replace(applicationPrefix, "").trim();
      if (suffix !== block.display) return;
      lines[lineIndex] = line.replace(
        `${block.display}`,
        setReferenced ? setAlias : block.display,
      );
    });
  });

  return lines.join("\n");
}
