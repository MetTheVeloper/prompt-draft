<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

import { promptModules } from "../modules/registry";
import type { ModuleValues } from "../modules/types";
import type {
  ModuleOutputMap,
  PromptOutputFormat,
  PromptSettings,
} from "../utils/compilePrompt";
import { compilePromptOutput, createDefaultPromptSettings } from "../utils/compilePrompt";
import type { PromptValidationIssue } from "../utils/promptValidation";
import { validatePromptSettings } from "../utils/promptValidation";
import PromptEditor from "../components/prompt/editor.vue";
import PromptOutputPreview from "../components/prompt/output-preview.vue";
import PromptSetupPanel from "../components/prompt/setup-panel.vue";
import { useAppStore } from "~/store/app";
import type { GlobalMenuItem } from "~/composables/useMenu";

const { t, locale } = useI18n();
const app = useAppStore();
const { $menu, $modal } = useNuxtApp();
type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const LEGACY_DRAFT_STORAGE_KEY = "prompt-draft:create-editor:v1";
const DRAFT_JSON_MIME_TYPE = "application/json";
const DRAFT_FILE_EXTENSION = "json";

type PromptDraftSnapshot = {
  version: 1;
  selectedModuleKeys: string[];
  moduleValues: Record<string, ModuleValues>;
  modulePanelStates: Record<string, ModulePanelState>;
  promptSettings: PromptSettings;
  outputFormat: PromptOutputFormat;
  updatedAt: string;
};

type PromptDraftRecord = PromptDraftSnapshot & {
  id: string;
  title: string;
  createdAt: string;
};

type PromptDraftCollection = {
  version: 1;
  activeDraftId: string | null;
  drafts: PromptDraftRecord[];
};

// const selectedModuleKeys = ref<string[]>(promptModules.map((module) => module.key));
const selectedModuleKeys = ref<string[]>([]);
const moduleValues = ref<Record<string, ModuleValues>>({});
const modulePanelStates = ref<Record<string, ModulePanelState>>({});

const promptSettings = ref<PromptSettings>(createDefaultPromptSettings());

const activeDraftId = ref("");
const draftTitle = ref("");
const savedDrafts = ref<PromptDraftRecord[]>([]);
const draftJsonInputRef = ref<HTMLInputElement | null>(null);

const isDraftHydrated = ref(false);
const isApplyingDraftState = ref(false);

type DraftSaveStatus = "idle" | "saving" | "saved";

const draftSaveStatus = ref<DraftSaveStatus>("idle");
const lastSavedAt = ref<string | null>(null);

const draftTitlePlaceholder = computed(() => t("create.draft.titlePlaceholder"));

const canDeleteActiveDraft = computed(() => {
  return savedDrafts.value.some((draft) => draft.id === activeDraftId.value);
});

const canExportActiveDraft = computed(() => {
  return isDraftHydrated.value && Boolean(activeDraftId.value);
});

const canExportDraftCollection = computed(() => {
  return isDraftHydrated.value && savedDrafts.value.length > 0;
});

const draftSaveLabel = computed(() => {
  if (!isDraftHydrated.value) {
    return t("create.draft.restoring");
  }

  if (draftSaveStatus.value === "saving") {
    return t("create.draft.saving");
  }

  if (lastSavedAt.value) {
    const time = new Date(lastSavedAt.value).toLocaleTimeString(
      locale.value === "fa" ? "fa-IR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return t("create.draft.savedAt", { time });
  }

  return t("create.draft.newDraft");
});

const moduleOutputs = ref<ModuleOutputMap>({});
const outputFormat = ref<PromptOutputFormat>("modular");
const moduleValidationIssues = ref<PromptValidationIssue[]>([]);

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isValidOutputFormat(value: unknown): value is PromptOutputFormat {
  return value === "modular" || value === "natural" || value === "json";
}

function createDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUniqueDraftId(preferredId = "", usedIds = new Set(savedDrafts.value.map((draft) => draft.id))) {
  let draftId = preferredId;

  while (!draftId || usedIds.has(draftId)) {
    draftId = createDraftId();
  }

  usedIds.add(draftId);

  return draftId;
}

function getDefaultDraftTitle(index: number) {
  return t("create.draft.defaultTitle", { index: index + 1 });
}

function getNextDraftTitle() {
  return getDefaultDraftTitle(savedDrafts.value.length);
}

function getDraftTitleFallback(existingIndex = -1) {
  const fallbackIndex = existingIndex >= 0 ? existingIndex : savedDrafts.value.length;

  return getDefaultDraftTitle(fallbackIndex);
}

function getNormalizedDraftTitle(existingIndex = -1) {
  return draftTitle.value.trim() || getDraftTitleFallback(existingIndex);
}

function formatDraftDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(locale.value === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getJsonString(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function getSafeFileNamePart(value: string) {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "draft";
}

function getDraftFileName(title: string, suffix: string) {
  return `${getSafeFileNamePart(title)}-${suffix}.${DRAFT_FILE_EXTENSION}`;
}

function downloadJsonFile(value: unknown, fileName: string) {
  if (!import.meta.client) return;

  const blob = new Blob([getJsonString(value)], {
    type: DRAFT_JSON_MIME_TYPE,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

async function shareJsonFile(value: unknown, fileName: string) {
  if (!import.meta.client) return;

  const file = new File([getJsonString(value)], fileName, {
    type: DRAFT_JSON_MIME_TYPE,
  });

  const shareData: ShareData = {
    files: [file],
    title: fileName,
    text: t("create.draft.shareText"),
  };

  let canShareJsonFile = Boolean(navigator.share);

  if (canShareJsonFile && navigator.canShare) {
    try {
      canShareJsonFile = navigator.canShare({
        files: [file],
      });
    } catch {
      canShareJsonFile = false;
    }
  }

  if (canShareJsonFile) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (isAbortError(error)) return;

      console.error("Draft share failed:", error);
    }
  }

  downloadJsonFile(value, fileName);
}

function muteAutoSaveUntilNextTick() {
  isApplyingDraftState.value = true;

  nextTick(() => {
    isApplyingDraftState.value = false;
  });
}

function resetDraftState() {
  selectedModuleKeys.value = [];
  moduleValues.value = {};
  modulePanelStates.value = {};
  promptSettings.value = createDefaultPromptSettings();
  outputFormat.value = "modular";
  moduleOutputs.value = {};
  moduleValidationIssues.value = [];
}

function applyDraftSnapshot(snapshot: Partial<PromptDraftSnapshot>) {
  const validModuleKeys = new Set(promptModules.map((module) => module.key));

  selectedModuleKeys.value = Array.isArray(snapshot.selectedModuleKeys)
    ? snapshot.selectedModuleKeys.filter((key) => validModuleKeys.has(key))
    : [];

  moduleValues.value = snapshot.moduleValues || {};
  modulePanelStates.value = snapshot.modulePanelStates || {};

  promptSettings.value = {
    ...createDefaultPromptSettings(),
    ...(snapshot.promptSettings || {}),
  };

  outputFormat.value = isValidOutputFormat(snapshot.outputFormat)
    ? snapshot.outputFormat
    : "modular";

  moduleOutputs.value = {};
  moduleValidationIssues.value = [];
}

function applyDraftRecord(draft: PromptDraftRecord) {
  muteAutoSaveUntilNextTick();

  activeDraftId.value = draft.id;
  draftTitle.value = draft.title;
  applyDraftSnapshot(draft);

  lastSavedAt.value = draft.updatedAt || null;
  draftSaveStatus.value = draft.updatedAt ? "saved" : "idle";
}

function createDraftSnapshot(): PromptDraftSnapshot {
  return {
    version: 1,
    selectedModuleKeys: cloneJson(selectedModuleKeys.value),
    moduleValues: cloneJson(moduleValues.value),
    modulePanelStates: cloneJson(modulePanelStates.value),
    promptSettings: cloneJson(promptSettings.value),
    outputFormat: outputFormat.value,
    updatedAt: new Date().toISOString(),
  };
}

function persistDraftCollection() {
  if (!import.meta.client) return;

  const collection: PromptDraftCollection = {
    version: 1,
    activeDraftId: activeDraftId.value || null,
    drafts: cloneJson(savedDrafts.value),
  };

  localStorage.setItem(
    DRAFT_COLLECTION_STORAGE_KEY,
    JSON.stringify(collection)
  );
  localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
}

function saveDraft() {
  if (!import.meta.client) return;
  if (!isDraftHydrated.value) return;

  draftSaveStatus.value = "saving";

  if (!activeDraftId.value) {
    activeDraftId.value = createDraftId();
  }

  const existingIndex = savedDrafts.value.findIndex((draft) => {
    return draft.id === activeDraftId.value;
  });

  const snapshot = createDraftSnapshot();
  const title = getNormalizedDraftTitle(existingIndex);

  if (draftTitle.value !== title) {
    draftTitle.value = title;
  }

  const draftRecord: PromptDraftRecord = {
    ...snapshot,
    id: activeDraftId.value,
    title,
    createdAt: savedDrafts.value[existingIndex]?.createdAt || snapshot.updatedAt,
  };

  if (existingIndex >= 0) {
    savedDrafts.value.splice(existingIndex, 1, draftRecord);
  } else {
    savedDrafts.value.unshift(draftRecord);
  }

  persistDraftCollection();

  lastSavedAt.value = snapshot.updatedAt;
  draftSaveStatus.value = "saved";
}

const saveDraftDebounced = useDebounceFn(() => {
  saveDraft();
}, 350);

function getSafeDraftRecord(
  value: Partial<PromptDraftRecord>,
  index: number
): PromptDraftRecord | null {
  if (value.version !== 1) return null;

  const updatedAt =
    typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString();

  return {
    version: 1,
    id: typeof value.id === "string" && value.id ? value.id : createDraftId(),
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim()
        : getDefaultDraftTitle(index),
    selectedModuleKeys: Array.isArray(value.selectedModuleKeys)
      ? value.selectedModuleKeys
      : [],
    moduleValues: value.moduleValues || {},
    modulePanelStates: value.modulePanelStates || {},
    promptSettings: {
      ...createDefaultPromptSettings(),
      ...(value.promptSettings || {}),
    },
    outputFormat: isValidOutputFormat(value.outputFormat)
      ? value.outputFormat
      : "modular",
    updatedAt,
    createdAt:
      typeof value.createdAt === "string" && value.createdAt
        ? value.createdAt
        : updatedAt,
  };
}

function restoreDraftCollection() {
  if (!import.meta.client) return false;

  const rawCollection = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);

  if (!rawCollection) return false;

  try {
    const parsed = JSON.parse(rawCollection) as Partial<PromptDraftCollection>;

    if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) {
      localStorage.removeItem(DRAFT_COLLECTION_STORAGE_KEY);
      return false;
    }

    savedDrafts.value = parsed.drafts
      .map((draft, index) => getSafeDraftRecord(draft, index))
      .filter((draft): draft is PromptDraftRecord => Boolean(draft));

    const activeDraft =
      savedDrafts.value.find((draft) => draft.id === parsed.activeDraftId) ||
      savedDrafts.value[0];

    if (activeDraft) {
      applyDraftRecord(activeDraft);
    } else {
      activeDraftId.value = createDraftId();
      draftTitle.value = getNextDraftTitle();
    }

    return true;
  } catch {
    localStorage.removeItem(DRAFT_COLLECTION_STORAGE_KEY);
    return false;
  }
}

function restoreLegacyDraft() {
  if (!import.meta.client) return false;

  const rawDraft = localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);

  if (!rawDraft) return false;

  try {
    const parsed = JSON.parse(rawDraft) as Partial<PromptDraftSnapshot>;

    if (parsed.version !== 1) {
      localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
      return false;
    }

    const updatedAt =
      typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString();

    const legacyRecord = getSafeDraftRecord(
      {
        ...parsed,
        id: createDraftId(),
        title: getDefaultDraftTitle(0),
        createdAt: updatedAt,
        updatedAt,
      },
      0
    );

    if (!legacyRecord) return false;

    savedDrafts.value = [legacyRecord];
    applyDraftRecord(legacyRecord);
    persistDraftCollection();

    return true;
  } catch {
    localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
    return false;
  }
}

function restoreDraft() {
  if (!import.meta.client) return;

  const restored = restoreDraftCollection() || restoreLegacyDraft();

  if (!restored) {
    activeDraftId.value = createDraftId();
    draftTitle.value = getNextDraftTitle();
  }

  isDraftHydrated.value = true;
}

function createNewDraft() {
  if (isDraftHydrated.value) {
    saveDraft();
  }

  muteAutoSaveUntilNextTick();

  activeDraftId.value = createDraftId();
  draftTitle.value = getNextDraftTitle();
  resetDraftState();
  lastSavedAt.value = null;
  draftSaveStatus.value = "idle";

  saveDraft();
}

function selectDraft(draftId: string) {
  if (draftId === activeDraftId.value) return;

  saveDraft();

  const draft = savedDrafts.value.find((item) => item.id === draftId);

  if (!draft) return;

  applyDraftRecord(draft);
  persistDraftCollection();
}

function deleteDraftById(draftId: string) {
  const activeIndex = savedDrafts.value.findIndex((draft) => {
    return draft.id === draftId;
  });

  if (activeIndex < 0) return;

  savedDrafts.value.splice(activeIndex, 1);

  const nextDraft =
    savedDrafts.value[activeIndex] || savedDrafts.value[activeIndex - 1] || null;

  if (nextDraft) {
    applyDraftRecord(nextDraft);
    persistDraftCollection();
    return;
  }

  muteAutoSaveUntilNextTick();

  activeDraftId.value = createDraftId();
  draftTitle.value = getNextDraftTitle();
  resetDraftState();
  lastSavedAt.value = null;
  draftSaveStatus.value = "idle";

  persistDraftCollection();
}

function openDeleteDraftModal() {
  if (!canDeleteActiveDraft.value) return;

  saveDraft();

  const activeIndex = savedDrafts.value.findIndex((draft) => {
    return draft.id === activeDraftId.value;
  });

  if (activeIndex < 0) return;

  const activeDraft = savedDrafts.value[activeIndex];
  const title = activeDraft.title || getDraftTitleFallback(activeIndex);
  const isLastDraft = savedDrafts.value.length <= 1;

  $modal.open({
    header: {
      icon: "trash",
      title: t("create.draft.deleteModal.title"),
      subtitle: title,
      color: "red",
    },
    descriptions: isLastDraft
      ? t("create.draft.deleteModal.lastDraftDescription", { title })
      : t("create.draft.deleteModal.description", { title }),
    actions: [
      {
        label: t("create.draft.deleteModal.confirm"),
        icon: "trash",
        color: "red",
        close: true,
        handler: () => {
          deleteDraftById(activeDraft.id);
        },
      },
      {
        label: t("components.modal.actions.cancel"),
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
    ],
    options: {
      width: 480,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function getActiveDraftRecord() {
  if (!isDraftHydrated.value) return null;

  saveDraft();

  return (
    savedDrafts.value.find((draft) => {
      return draft.id === activeDraftId.value;
    }) || null
  );
}

function getDraftCollectionForExport(): PromptDraftCollection {
  saveDraft();

  return {
    version: 1,
    activeDraftId: activeDraftId.value || null,
    drafts: cloneJson(savedDrafts.value),
  };
}

function downloadActiveDraftJson() {
  const draft = getActiveDraftRecord();

  if (!draft) return;

  downloadJsonFile(
    cloneJson(draft),
    getDraftFileName(draft.title || getDraftTitleFallback(), "draft")
  );
}

async function shareActiveDraftJson() {
  const draft = getActiveDraftRecord();

  if (!draft) return;

  await shareJsonFile(
    cloneJson(draft),
    getDraftFileName(draft.title || getDraftTitleFallback(), "draft")
  );
}

function exportDraftCollectionJson() {
  if (!canExportDraftCollection.value) return;

  downloadJsonFile(
    getDraftCollectionForExport(),
    getDraftFileName("prompt-drafts", "collection")
  );
}

function openDraftImportPicker() {
  if (!import.meta.client) return;

  draftJsonInputRef.value?.click();
}

function getRawImportedCollection(value: unknown): Partial<PromptDraftCollection> | null {
  if (!isPlainRecord(value)) return null;

  if (value.kind === "prompt-draft-collection" && isPlainRecord(value.collection)) {
    return value.collection as Partial<PromptDraftCollection>;
  }

  return value as Partial<PromptDraftCollection>;
}

function getRawImportedDraft(value: unknown): Partial<PromptDraftRecord> | null {
  if (!isPlainRecord(value)) return null;

  if (value.kind === "prompt-draft-collection") return null;

  if (value.kind === "prompt-draft" && isPlainRecord(value.draft)) {
    return value.draft as Partial<PromptDraftRecord>;
  }

  if (Array.isArray(value.drafts)) return null;

  return value as Partial<PromptDraftRecord>;
}

function getSafeImportedDraftRecord(value: unknown, index: number) {
  const rawDraft = getRawImportedDraft(value);

  if (!rawDraft) return null;

  return getSafeDraftRecord(rawDraft, index);
}

function getSafeImportedCollection(value: unknown): PromptDraftCollection | null {
  const rawCollection = getRawImportedCollection(value);

  if (rawCollection?.version !== 1 || !Array.isArray(rawCollection.drafts)) {
    return null;
  }

  const usedIds = new Set<string>();
  const drafts = rawCollection.drafts
    .map((draft, index) => getSafeDraftRecord(draft, index))
    .filter((draft): draft is PromptDraftRecord => Boolean(draft))
    .map((draft) => {
      return {
        ...draft,
        id: getUniqueDraftId(draft.id, usedIds),
      };
    });

  if (!drafts.length) return null;

  const activeDraft =
    drafts.find((draft) => draft.id === rawCollection.activeDraftId) || drafts[0];

  return {
    version: 1,
    activeDraftId: activeDraft.id,
    drafts,
  };
}

function openDraftImportErrorModal() {
  $modal.open({
    header: {
      icon: "danger",
      title: t("create.draft.importModal.errorTitle"),
      color: "red",
    },
    descriptions: t("create.draft.importModal.errorDescription"),
    actions: [
      {
        label: t("components.modal.actions.close"),
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
    ],
    options: {
      width: 480,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function applyImportedCollection(collection: PromptDraftCollection) {
  muteAutoSaveUntilNextTick();

  savedDrafts.value = collection.drafts;

  const activeDraft =
    savedDrafts.value.find((draft) => draft.id === collection.activeDraftId) ||
    savedDrafts.value[0];

  if (activeDraft) {
    applyDraftRecord(activeDraft);
  }

  persistDraftCollection();
}

function addImportedDraft(draft: PromptDraftRecord) {
  saveDraft();

  const usedIds = new Set(savedDrafts.value.map((item) => item.id));
  const now = new Date().toISOString();
  const importedDraft: PromptDraftRecord = {
    ...draft,
    id: getUniqueDraftId(draft.id, usedIds),
    title: draft.title || getDefaultDraftTitle(savedDrafts.value.length),
    createdAt: draft.createdAt || now,
    updatedAt: draft.updatedAt || now,
  };

  savedDrafts.value.unshift(importedDraft);
  applyDraftRecord(importedDraft);
  persistDraftCollection();
}

async function importDraftJsonFile(file: File) {
  try {
    const parsed = JSON.parse(await file.text()) as unknown;
    const importedCollection = getSafeImportedCollection(parsed);

    if (importedCollection) {
      applyImportedCollection(importedCollection);
      return;
    }

    const importedDraft = getSafeImportedDraftRecord(
      parsed,
      savedDrafts.value.length
    );

    if (importedDraft) {
      addImportedDraft(importedDraft);
      return;
    }

    openDraftImportErrorModal();
  } catch (error) {
    console.error("Draft JSON import failed:", error);
    openDraftImportErrorModal();
  }
}

function handleDraftJsonImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = "";

  if (!file) return;

  importDraftJsonFile(file);
}

function getDraftMenuItems(): GlobalMenuItem[] {
  const items: GlobalMenuItem[] = [
    {
      label: t("create.draft.createNew"),
      icon: "edit",
      color: "blue",
      handler: createNewDraft,
    },
    {
      label: t("create.draft.importJson"),
      icon: "import-2",
      color: "blue",
      handler: openDraftImportPicker,
    },
    {
      label: t("create.draft.exportJson"),
      icon: "export-3",
      color: "orange",
      disabled: () => !canExportDraftCollection.value,
      handler: exportDraftCollectionJson,
    },
  ];

  if (savedDrafts.value.length) {
    items.push({
      divider: true,
    });
  }

  savedDrafts.value.forEach((draft, index) => {
    const isActive = draft.id === activeDraftId.value;

    items.push({
      label: draft.title || getDefaultDraftTitle(index),
      description: formatDraftDate(draft.updatedAt),
      icon: "note-text",
      active: isActive,
      handler: () => selectDraft(draft.id),
    });
  });

  return items;
}

function openDraftMenu(event: MouseEvent) {
  if (!isDraftHydrated.value) return;

  event.preventDefault();
  event.stopPropagation();

  saveDraft();

  const anchor = event.currentTarget as HTMLElement;

  const items = getDraftMenuItems();

  $menu.open({
    mode: "dropdown",
    anchor,
    placement: "bottom-end",
    options: {
      closeOnScroll: false,
      zIndex: 2200,
      minWidth: 220,
    },
    items,
  });
}

const selectedModules = computed(() => {
  return promptModules.filter((module) => {
    return selectedModuleKeys.value.includes(module.key);
  });
});

const globalValidationIssues = computed<PromptValidationIssue[]>(() => {
  const issues: PromptValidationIssue[] = [
    ...validatePromptSettings(promptSettings.value),
    ...moduleValidationIssues.value,
  ];

  if (!selectedModules.value.length) {
    issues.unshift({
      id: "global:no_modules_selected",
      code: "no_modules_selected",
      level: "error",
    });
  }

  return issues;
});

const globalOutput = computed(() => {
  return compilePromptOutput(
    selectedModules.value,
    moduleOutputs.value,
    promptSettings.value,
    outputFormat.value
  );
});

function updateModuleOutputs(outputs: ModuleOutputMap) {
  moduleOutputs.value = outputs;
}

function updateModuleIssues(issues: PromptValidationIssue[]) {
  moduleValidationIssues.value = issues;
}
const { mini, mobile } = useScreen();
const tabs = ref([
  {label: 'setup', icon: 'setting-2'},
  {label: 'editor', icon: 'edit'},
  {label: 'output', icon: 'note-text'},
]);
const tab = ref({label: 'setup', icon: 'settings'});

watch(
  [
    selectedModuleKeys,
    moduleValues,
    modulePanelStates,
    promptSettings,
    outputFormat,
  ],
  () => {
    if (!isDraftHydrated.value) return;
    if (isApplyingDraftState.value) return;

    draftSaveStatus.value = "saving";
    saveDraftDebounced();
  },
  {
    deep: true,
  }
);

function saveDraftTitleOnBlur() {
  if (!isDraftHydrated.value) return;
  if (isApplyingDraftState.value) return;

  const existingIndex = savedDrafts.value.findIndex((draft) => {
    return draft.id === activeDraftId.value;
  });

  const title = getNormalizedDraftTitle(existingIndex);
  const currentDraft = savedDrafts.value[existingIndex];

  if (draftTitle.value !== title) {
    draftTitle.value = title;
  }

  if (currentDraft?.title === title) return;

  draftSaveStatus.value = "saving";
  saveDraft();
}

function clearDraft() {
  const confirmed = window.confirm(t("create.draft.clearConfirm"));

  if (!confirmed) return;

  muteAutoSaveUntilNextTick();
  resetDraftState();

  lastSavedAt.value = null;
  draftSaveStatus.value = "idle";

  saveDraft();
}

onMounted(() => {
  restoreDraft();

  window.addEventListener("beforeunload", saveDraft);
});

onBeforeUnmount(() => {
  saveDraft();

  window.removeEventListener("beforeunload", saveDraft);
});

</script>

<template>
  <el-grid rules="csc" class="w100 por" :gap="24" style="max-width: 1400px" v-if="app.ready">
    <input
      ref="draftJsonInputRef"
      type="file"
      accept="application/json,.json"
      style="display: none"
      @change="handleDraftJsonImport" />
    <el-flex :rules="mini ? 'ccs' : 'rbc'" :gap="16" class="w100">
      <el-flex rules="ccs" :gap="16" class="w100">
        <el-grid :cols="mini ? 1 : ['1fr', 'auto']" class="w100" :gap="mini ? 8 : 16">
          <el-flex rules="rsc" :gap="8" :class="['fg100', { w100: mini }]">
            <el-text-field
              v-model="draftTitle"
              class="create-page__draft-title w100"
              :placeholder="draftTitlePlaceholder"
              :actions="false"
              :size="28"
              @blur="saveDraftTitleOnBlur" />
            <el-button
              @click="openDraftMenu"
              :size="14"
              :p="mini ? 8 : [8, 12]"
              :type="mini ? 'fab' : 'normal'"
              color="orange"
              :label="mini ? '' : t('create.draft.menu')"
              icon="note-text" />
          </el-flex>
          <!-- actions -->
          <el-flex rules="rbc" :class="['w100 tne100', draftSaveStatus === 'saving' ? 'pen flg100' : '']">
            <el-flex rules="rsc" :gap="12">
              <el-text type="span" :size="12" color="normal50" class="wsnw" v-if="false" >
                {{ draftSaveLabel }}
              </el-text>
  
              <el-flex rules="rcc" :gap="8">
                <el-button
                  @click="clearDraft"
                  :size="12"
                  :p="mini ? 8 : [8]"
                  type="fab"
                  mode="flat"
                  color="orange"
                  :label="t('create.draft.clear')"
                  icon="refresh-2" />
                <el-button
                  @click="openDeleteDraftModal"
                  :size="12"
                  :p="mini ? 8 : [8]"
                  type="fab"
                  mode="flat"
                  color="red"
                  :label="t('create.draft.delete')"
                  icon="trash"
                  :disable="!canDeleteActiveDraft" />
              </el-flex>
            </el-flex>
            <el-divider direction="vertical" :height="24" v-if="!mini" />
            <el-flex rules="rsc" :gap="12">
              <el-flex rules="rcc" :gap="8">
                <el-button
                  @click="downloadActiveDraftJson"
                  :size="12"
                  :p="mini ? 8 : [8]"
                  type="fab"
                  mode="flat"
                  color="normal"
                  :label="t('create.draft.download')"
                  icon="import-2"
                  :disable="!canExportActiveDraft" />
                <el-button
                  @click="shareActiveDraftJson"
                  :size="12"
                  :p="mini ? 8 : [8]"
                  mode="flat"
                  color="blue"
                  :label="t('create.draft.share')"
                  icon="share-1"
                  :disable="!canExportActiveDraft" />
              </el-flex>
            </el-flex>
          </el-flex>
        </el-grid>
        <el-divider mode="dashed" />
        <el-text type="p" :size="mini ? 12 : 16" :weight="400" color="normal45">
          {{ t("create.description") }}
        </el-text>
      </el-flex>
    </el-flex>
    <el-grid :cols="3" v-if="mini" class="post t0 l0 r0 zi200" bg="surface50" :br="1"
      :bc="['normal5', 'normal15', 'normal15', 'normal5']" bd="b4" :radius="24" :p="8">
      <el-button v-for="tb in tabs"
        :key="tb.label"
        @click="tab = tb"
        :label="$t(`create.tabs.${tb.label}`)"
        :size="12"
        :br="1"
        bc="normal25"
        :gap="4"
        :icon="tb.icon"
        :mode="tb.label === tab.label ? 'normal' : 'outline'"
        :color="tb.label === tab.label ? 'prim' : 'normal'" />
    </el-grid>
    <el-grid :cols="!mini ? ['300px', 'minmax(0, 1fr)', '340px'] : 1" class="create-page__layout" :gap="16">
      <el-flex type="aside" rules="csc" class="create-page__sidebar" v-show="!mini || mini && tab.label === 'setup'">
        <PromptSetupPanel v-model:settings="promptSettings" v-model:selected-module-keys="selectedModuleKeys"
          :modules="promptModules" />
      </el-flex>

      <el-flex type="section" class="w100" v-show="!mini || mini && tab.label === 'editor'">
        <PromptEditor :modules="selectedModules" v-model:module-values="moduleValues"
          v-model:module-panel-states="modulePanelStates" @update:outputs="updateModuleOutputs"
          @update:issues="updateModuleIssues" />
      </el-flex>

      <el-flex type="aside" class="create-page__output" v-show="!mini || mini && tab.label === 'output'">
        <PromptOutputPreview v-model:format="outputFormat" :output="globalOutput" :issues="globalValidationIssues" />
      </el-flex>
    </el-grid>
  </el-grid>
</template>

<style scoped>

.create-page__draft-title {
  min-width: 220px;
}

@media (max-width: 1180px) {
  .create-page__layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .create-page__output {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .create-page__header {
    flex-direction: column;
  }

  .create-page__draft-manager,
  .create-page__draft-title {
    min-width: 0;
    max-width: none;
  }

  .create-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
