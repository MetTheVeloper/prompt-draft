import { getPromptModuleByKey } from "~/modules/registry";
import type { PromptVariable } from "~/modules/types";
import type { PromptDraftRecord } from "~/modules/promptDraft.types";
import type { SyncedPromptDraftRecord } from "~/types/draftSyncApi";
import { compileModule } from "~/utils/compileModules";
import type { ModuleOutputMap } from "~/utils/compilePromptCore";
import { compilePromptOutputPure } from "~/utils/compilePromptPure";

function readEnabledVariables(draft: SyncedPromptDraftRecord) {
  const value = draft.snapshot.moduleValues.variables?.variables;
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is PromptVariable => {
    return Boolean(item) && typeof item === "object" && item.enabled !== false;
  });
}

export function compileCloudDraftOutput(draft: SyncedPromptDraftRecord) {
  const modules = draft.snapshot.selectedModuleKeys
    .map((key) => getPromptModuleByKey(key))
    .filter((module): module is NonNullable<typeof module> => Boolean(module));

  const outputs = modules.reduce<ModuleOutputMap>((result, module) => {
    result[module.key] = compileModule(
      module,
      draft.snapshot.moduleValues[module.key] || {},
    );
    return result;
  }, {});

  const variables = readEnabledVariables(draft);
  const ownership = {
    hasSubject: variables.some((variable) => variable.type === "subject"),
    hasReference: variables.some((variable) => variable.type === "reference"),
  };

  return compilePromptOutputPure(
    modules,
    outputs,
    draft.snapshot.promptSettings,
    draft.snapshot.outputFormat,
    ownership,
    draft.snapshot.moduleValues,
  ).output;
}

export function toLocalPromptDraftRecord(
  draft: SyncedPromptDraftRecord,
): PromptDraftRecord {
  return {
    ...draft.snapshot,
    version: 1,
    id: draft.id,
    title: draft.title,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

function safeFilePart(value: string) {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 90);

  return normalized || "prompt-draft";
}

export function downloadCloudDraftJson(draft: SyncedPromptDraftRecord) {
  if (!import.meta.client) return;

  const localDraft = toLocalPromptDraftRecord(draft);
  const blob = new Blob([`${JSON.stringify(localDraft, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${safeFilePart(draft.title)}-draft.json`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function copyFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

export async function copyTextToClipboard(value: string) {
  if (!import.meta.client) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back to execCommand for non-secure/local browser contexts.
    }
  }

  return copyFallback(value);
}
