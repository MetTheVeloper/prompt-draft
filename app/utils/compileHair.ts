import type { ModuleValues, PromptKeyModule } from "../modules/types";
import type {
  HairComponent,
  HairComponentType,
  HairPropertyState,
  HairReferenceRef,
  HairStyle,
} from "../modules/hair.types";
import {
  hairBasePropertyIds,
  hairComponentTypeMap,
  hairPropertyDefinitions,
} from "../modules/hair.catalog";
import {
  cleanSemanticText,
  formatSemanticScope,
  humanizeSemanticValue,
  normalizeSemanticTargets,
} from "./semanticTargets";
import {
  createUniqueHairEntityKey,
  getHairComponentVariableToken,
  getHairStyleVariableToken,
  humanizeHairEntityKey,
  normalizeHairEntityKey,
} from "./hairVariables";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReference(value: unknown): HairReferenceRef | undefined {
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

function normalizePropertyState(value: unknown): HairPropertyState {
  if (!isRecord(value)) return { mode: "inherit" };

  if (value.mode === "option") {
    return {
      mode: "option",
      value: typeof value.value === "string" ? value.value : "",
    };
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

function normalizeComponent(
  value: unknown,
  index: number,
  usedKeys: Set<string>,
): HairComponent | null {
  if (!isRecord(value)) return null;

  const rawType = typeof value.type === "string" ? value.type : "custom";
  const type: HairComponentType = hairComponentTypeMap.has(rawType as HairComponentType)
    ? (rawType as HairComponentType)
    : "custom";
  const customType = typeof value.customType === "string" ? value.customType : undefined;
  const name = typeof value.name === "string" ? value.name : "";
  const rawKey = typeof value.key === "string" ? value.key : "";
  const key = createUniqueHairEntityKey(
    rawKey || customType || (type !== "custom" ? type : "") || name || `component${index + 1}`,
    usedKeys,
    `component${index + 1}`,
  );
  usedKeys.add(key);

  const properties = isRecord(value.properties)
    ? Object.fromEntries(
        Object.entries(value.properties).map(([propertyKey, state]) => [
          propertyKey,
          normalizePropertyState(state),
        ]),
      )
    : {};

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `hair-component-${index + 1}`,
    key,
    name,
    type,
    customType,
    properties,
    additionalDetails:
      typeof value.additionalDetails === "string" ? value.additionalDetails : "",
  };
}

export function normalizeHairStyles(value: unknown): HairStyle[] {
  if (!Array.isArray(value)) return [];

  const usedStyleKeys = new Set<string>();
  const styles: HairStyle[] = [];

  value.filter(isRecord).forEach((style, styleIndex) => {
    const name = typeof style.name === "string" ? style.name : "";
    const rawKey = typeof style.key === "string" ? style.key : "";
    const key = createUniqueHairEntityKey(
      rawKey || name || `style${styleIndex + 1}`,
      usedStyleKeys,
      `style${styleIndex + 1}`,
    );
    usedStyleKeys.add(key);

    const sourceRecord = isRecord(style.source) ? style.source : {};
    const source =
      sourceRecord.mode === "reference"
        ? {
            mode: "reference" as const,
            reference:
              normalizeReference(sourceRecord.reference) || {
                token: "{reference}",
                source: "system" as const,
              },
            hairHint:
              typeof sourceRecord.hairHint === "string"
                ? sourceRecord.hairHint
                : undefined,
          }
        : { mode: "defined" as const };

    const properties = isRecord(style.properties)
      ? Object.fromEntries(
          Object.entries(style.properties).map(([propertyKey, state]) => [
            propertyKey,
            normalizePropertyState(state),
          ]),
        )
      : {};

    const usedComponentKeys = new Set<string>();
    const components = Array.isArray(style.components)
      ? style.components
          .map((component, componentIndex) =>
            normalizeComponent(component, componentIndex, usedComponentKeys),
          )
          .filter((component): component is HairComponent => Boolean(component))
      : [];

    styles.push({
      id:
        typeof style.id === "string" && style.id.trim()
          ? style.id
          : `hair-style-${styleIndex + 1}`,
      key,
      name,
      presetId: typeof style.presetId === "string" ? style.presetId : undefined,
      targets: normalizeSemanticTargets(style.targets),
      source,
      properties,
      components,
      additionalDetails:
        typeof style.additionalDetails === "string" ? style.additionalDetails : "",
    });
  });

  return styles;
}

function referenceToken(reference?: HairReferenceRef) {
  return cleanSemanticText(reference?.token || "{reference}");
}

function optionPromptText(propertyId: string, value: string) {
  const definition = hairPropertyDefinitions[propertyId];
  const option = definition?.options.find((candidate) => candidate.value === value);
  return option?.promptText || humanizeSemanticValue(value).toLowerCase();
}

function compileProperty(
  propertyId: string,
  propertyState: HairPropertyState,
  style: HairStyle,
) {
  const definition = hairPropertyDefinitions[propertyId];
  if (!definition || propertyState.mode === "inherit") return "";

  if (propertyState.mode === "absent") {
    return definition.allowAbsent ? definition.absentPromptText || "" : "";
  }

  if (propertyState.mode === "custom") {
    return cleanSemanticText(propertyState.value);
  }

  if (propertyState.mode === "reference") {
    const reference =
      propertyState.reference ||
      (style.source.mode === "reference" ? style.source.reference : undefined);
    return `${definition.label.toLowerCase()} matching ${referenceToken(reference)}`;
  }

  return propertyState.value
    ? optionPromptText(propertyId, propertyState.value)
    : "";
}

export function compileHairBase(style: HairStyle) {
  const modifiers: string[] = [];
  const details: string[] = [];

  hairBasePropertyIds.forEach((propertyId) => {
    const propertyState = style.properties[propertyId] || { mode: "inherit" };
    const text = compileProperty(propertyId, propertyState, style);
    if (!text) return;

    const placement = hairPropertyDefinitions[propertyId]?.compilePlacement || "detail";
    (placement === "modifier" ? modifiers : details).push(text);
  });

  const baseline =
    style.source.mode === "reference"
      ? `hairstyle from ${referenceToken(style.source.reference)}${
          cleanSemanticText(style.source.hairHint)
            ? ` (${cleanSemanticText(style.source.hairHint)})`
            : ""
        }`
      : "hair";

  return [
    [...new Set(modifiers), baseline].filter(Boolean).join(" "),
    ...new Set(details),
  ]
    .filter(Boolean)
    .join("; ");
}

export function compileHairComponent(component: HairComponent, style: HairStyle) {
  const definition = hairComponentTypeMap.get(component.type);
  const propertyIds = [
    ...(definition?.propertyIds || []),
    ...Object.keys(component.properties).filter(
      (propertyId) => !definition?.propertyIds.includes(propertyId),
    ),
  ];
  const modifiers: string[] = [];
  const details: string[] = [];

  propertyIds.forEach((propertyId) => {
    const propertyState = component.properties[propertyId] || { mode: "inherit" };
    const text = compileProperty(propertyId, propertyState, style);
    if (!text) return;
    const placement = hairPropertyDefinitions[propertyId]?.compilePlacement || "detail";
    (placement === "modifier" ? modifiers : details).push(text);
  });

  const baseline =
    component.type === "custom"
      ? cleanSemanticText(component.customType) || "custom hair component"
      : definition?.promptText || humanizeSemanticValue(component.type).toLowerCase();

  return [
    [...new Set(modifiers), baseline].filter(Boolean).join(" "),
    ...new Set(details),
    cleanSemanticText(component.additionalDetails),
  ]
    .filter(Boolean)
    .join("; ");
}

function componentDisplay(component: HairComponent) {
  return humanizeHairEntityKey(component.key).toLowerCase();
}

function styleDisplay(style: HairStyle) {
  return humanizeHairEntityKey(style.key);
}

export function compileHairStyle(style: HairStyle) {
  const scope = formatSemanticScope(style.targets, [], { format: "modular" });
  if (!scope) return "";

  const display = styleDisplay(style);
  const base = compileHairBase(style);
  const lines = [
    `• ${scope}: style hair as ${display}`,
    `• ${display}:`,
    base ? `  ◦ base: ${base}` : "",
    ...style.components.map((component) => {
      const description = compileHairComponent(component, style);
      return description
        ? `  ◦ ${componentDisplay(component)}: ${description}`
        : "";
    }),
  ].filter(Boolean);

  const details = cleanSemanticText(style.additionalDetails);
  if (details) lines.push(`  ◦ style details: ${details}`);

  return lines.join("\n");
}

export function compileHairModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideFieldId = module.compile?.overrideField || "customText";
  const override = values[overrideFieldId];
  if (typeof override === "string" && override.trim()) {
    return cleanSemanticText(override);
  }

  return normalizeHairStyles(values.hairStyles)
    .map(compileHairStyle)
    .filter(Boolean)
    .join("\n");
}

type ParsedHairComponentLine = {
  lineIndex: number;
  key: string;
};

type ParsedHairStyleBlock = {
  key: string;
  display: string;
  headerIndex: number;
  componentLines: ParsedHairComponentLine[];
};

/**
 * Promote only externally referenced Hair entities to short aliases inside the
 * owning `{hair}` definition. External modules keep globally unique paths such
 * as `{hair_curlyUpdo}` and `{hair_curlyUpdo_bangs}`.
 */
export function formatHairOutputForReferences(
  output: string,
  externalReferenceText: string,
) {
  const cleanedOutput = String(output || "").trim();
  if (!cleanedOutput) return "";

  const lines = cleanedOutput.split("\n");
  const blocks: ParsedHairStyleBlock[] = [];
  let current: ParsedHairStyleBlock | null = null;

  lines.forEach((line, lineIndex) => {
    const header = line.match(/^•\s+([^:]+):\s*$/);
    if (header && !line.includes(": style hair as ")) {
      const display = header[1].trim();
      const key = normalizeHairEntityKey(display, "style");
      current = { key, display, headerIndex: lineIndex, componentLines: [] };
      blocks.push(current);
      return;
    }

    if (!current) return;
    const component = line.match(/^\s*◦\s+([^:]+):\s*/);
    if (!component) return;
    const rawKey = component[1].trim();
    if (rawKey.toLowerCase() === "base" || rawKey.toLowerCase() === "style details") {
      return;
    }

    current.componentLines.push({
      lineIndex,
      key: normalizeHairEntityKey(rawKey, "component"),
    });
  });

  blocks.forEach((block) => {
    const globalStyleToken = getHairStyleVariableToken(block.key);
    const localStyleAlias = `{${block.key}}`;
    const referencedComponents = new Set(
      block.componentLines
        .filter((component) =>
          externalReferenceText.includes(
            getHairComponentVariableToken(block.key, component.key),
          ),
        )
        .map((component) => component.key),
    );
    const styleReferenced =
      externalReferenceText.includes(globalStyleToken) ||
      referencedComponents.size > 0;

    if (styleReferenced) {
      lines[block.headerIndex] = `• ${localStyleAlias}:`;
    }

    block.componentLines.forEach((component) => {
      if (!referencedComponents.has(component.key)) return;
      lines[component.lineIndex] = lines[component.lineIndex].replace(
        /^(\s*◦\s+)([^:]+)(:\s*)/,
        `$1{${component.key}}$3`,
      );
    });

    lines.forEach((line, lineIndex) => {
      const applicationPrefix = /^•\s+.+:\s+style hair as\s+/;
      if (!applicationPrefix.test(line)) return;
      const suffix = line.replace(applicationPrefix, "").trim();
      if (suffix !== block.display) return;
      lines[lineIndex] = line.replace(
        block.display,
        styleReferenced ? localStyleAlias : block.display,
      );
    });
  });

  return lines.join("\n");
}
