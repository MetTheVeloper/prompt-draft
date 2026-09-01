import {
  getHairComponentVariableToken,
  getHairStyleVariableToken,
  normalizeHairEntityKey,
} from "./hairVariables";
import {
  getOutfitItemVariableToken,
  getOutfitSetVariableToken,
  normalizeOutfitEntityKey,
} from "./outfitVariables";

function aliasFor(
  aliases: ReadonlyMap<string, string> | undefined,
  sourceToken: string,
  fallback: string,
) {
  return aliases?.get(sourceToken) || fallback;
}

type ParsedChildLine = {
  lineIndex: number;
  key: string;
};

type ParsedBlock = {
  key: string;
  display: string;
  headerIndex: number;
  childLines: ParsedChildLine[];
};

export function formatHairOutputWithPromptAliases(
  output: string,
  externalReferenceText: string,
  aliases?: ReadonlyMap<string, string>,
) {
  const cleanedOutput = String(output || "").trim();
  if (!cleanedOutput) return "";

  const lines = cleanedOutput.split("\n");
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;

  lines.forEach((line, lineIndex) => {
    const header = line.match(/^•\s+([^:]+):\s*$/);
    if (header && !line.includes(": style hair as ")) {
      const display = header[1]?.trim() || "";
      const key = normalizeHairEntityKey(display, "style");
      current = { key, display, headerIndex: lineIndex, childLines: [] };
      blocks.push(current);
      return;
    }

    if (!current) return;
    const component = line.match(/^\s*◦\s+([^:]+):\s*/);
    if (!component) return;
    const rawKey = component[1]?.trim() || "";
    if (
      rawKey.toLowerCase() === "base" ||
      rawKey.toLowerCase() === "style details"
    ) {
      return;
    }

    current.childLines.push({
      lineIndex,
      key: normalizeHairEntityKey(rawKey, "component"),
    });
  });

  blocks.forEach((block) => {
    const styleSource = getHairStyleVariableToken(block.key);
    const styleAlias = aliasFor(aliases, styleSource, `{${block.key}}`);
    const referencedComponents = new Map<string, string>();

    block.childLines.forEach((component) => {
      const source = getHairComponentVariableToken(block.key, component.key);
      if (!externalReferenceText.includes(source)) return;
      referencedComponents.set(
        component.key,
        aliasFor(aliases, source, `{${component.key}}`),
      );
    });

    const styleReferenced =
      externalReferenceText.includes(styleSource) || referencedComponents.size > 0;

    if (styleReferenced) {
      lines[block.headerIndex] = `• ${styleAlias}:`;
    }

    block.childLines.forEach((component) => {
      const componentAlias = referencedComponents.get(component.key);
      if (!componentAlias) return;
      lines[component.lineIndex] = lines[component.lineIndex]?.replace(
        /^(\s*◦\s+)([^:]+)(:\s*)/,
        `$1${componentAlias}$3`,
      ) || "";
    });

    lines.forEach((line, lineIndex) => {
      const applicationPrefix = /^•\s+.+:\s+style hair as\s+/;
      if (!applicationPrefix.test(line)) return;
      const suffix = line.replace(applicationPrefix, "").trim();
      if (suffix !== block.display) return;
      lines[lineIndex] = line.replace(
        block.display,
        styleReferenced ? styleAlias : block.display,
      );
    });
  });

  return lines.join("\n");
}

export function formatOutfitOutputWithPromptAliases(
  output: string,
  externalReferenceText: string,
  aliases?: ReadonlyMap<string, string>,
) {
  const cleanedOutput = String(output || "").trim();
  if (!cleanedOutput) return "";

  const lines = cleanedOutput.split("\n");
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;

  lines.forEach((line, lineIndex) => {
    const header = line.match(/^•\s+([^:]+):\s*$/);
    if (header && !line.includes(": wear ")) {
      const display = header[1]?.trim() || "";
      const key = normalizeOutfitEntityKey(display, "set");
      current = { key, display, headerIndex: lineIndex, childLines: [] };
      blocks.push(current);
      return;
    }

    if (!current) return;
    const item = line.match(/^\s*◦\s+([^:]+):\s*/);
    if (!item) return;
    const rawKey = item[1]?.trim() || "";
    if (
      rawKey.toLowerCase() === "relation" ||
      rawKey.toLowerCase() === "set details"
    ) {
      return;
    }

    current.childLines.push({
      lineIndex,
      key: normalizeOutfitEntityKey(rawKey, "item"),
    });
  });

  blocks.forEach((block) => {
    const setSource = getOutfitSetVariableToken(block.key);
    const setAlias = aliasFor(aliases, setSource, `{${block.key}}`);
    const referencedItems = new Map<string, string>();

    block.childLines.forEach((item) => {
      const source = getOutfitItemVariableToken(block.key, item.key);
      if (!externalReferenceText.includes(source)) return;
      referencedItems.set(
        item.key,
        aliasFor(aliases, source, `{${item.key}}`),
      );
    });

    const setReferenced =
      externalReferenceText.includes(setSource) || referencedItems.size > 0;

    if (setReferenced) {
      lines[block.headerIndex] = `• ${setAlias}:`;
    }

    block.childLines.forEach((item) => {
      const itemAlias = referencedItems.get(item.key);
      if (!itemAlias) return;
      lines[item.lineIndex] = lines[item.lineIndex]?.replace(
        /^(\s*◦\s+)([^:]+)(:\s*)/,
        `$1${itemAlias}$3`,
      ) || "";
    });

    lines.forEach((line, lineIndex) => {
      const applicationPrefix = /^•\s+.+:\s+wear\s+/;
      if (!applicationPrefix.test(line)) return;
      const suffix = line.replace(applicationPrefix, "").trim();
      if (suffix !== block.display) return;
      lines[lineIndex] = line.replace(
        block.display,
        setReferenced ? setAlias : block.display,
      );
    });
  });

  return lines.join("\n");
}
