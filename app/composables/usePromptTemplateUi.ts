import { reactive } from "vue";
import PromptTemplatePickerModal from "~/components/templates/PromptTemplatePickerModal.vue";
import SavePromptTemplateModal from "~/components/templates/SavePromptTemplateModal.vue";
import type {
  PromptDraftRecord,
  PromptDraftState,
} from "~/modules/promptDraft.types";
import {
  addPromptTemplateToCreate,
  readActiveCreateDraftForTemplate,
} from "~/templates/createHost";
import { listAvailablePromptTemplates } from "~/templates/registry";
import {
  createUserPromptTemplateFromDraft,
  saveUserPromptTemplate,
} from "~/templates/storage";
import type {
  PromptTemplate,
  PromptTemplateSource,
} from "~/templates/types";
import { useModal } from "~/composables/useModal";

export type StartFromTemplateOptions = {
  onCreated?: (record: PromptDraftRecord, template: PromptTemplate) => void | Promise<void>;
};

export type SaveDraftAsTemplateOptions = {
  defaultTitle?: string;
  description?: string;
  source?: PromptTemplateSource;
  onSaved?: (template: PromptTemplate) => void | Promise<void>;
};

export function usePromptTemplateUi() {
  const modal = useModal();

  function openStartFromTemplate(options: StartFromTemplateOptions = {}) {
    const templates = listAvailablePromptTemplates();
    const state = reactive({
      selectedId: templates[0]?.id || "",
    });

    modal.open({
      header: {
        icon: "dashboard_customize",
        title: "Start from a template",
        subtitle:
          "Choose a tested starting point. A new Draft will be created and your current Draft will stay untouched.",
        color: "blue",
        closeButton: true,
      },
      component: PromptTemplatePickerModal,
      props: {
        templates,
        state,
      },
      actions: [
        {
          label: "Cancel",
          mode: "flat",
          color: "normal",
          close: true,
        },
        {
          label: "Use template",
          icon: "arrow_forward",
          color: "blue",
          close: true,
          disable: () => !state.selectedId,
          handler: async () => {
            const template = templates.find((item) => item.id === state.selectedId);
            if (!template) return false;

            const record = addPromptTemplateToCreate(template);
            if (!record) {
              modal.message({
                type: "error",
                title: "Template could not be used",
                message: "The new Draft could not be added to Create.",
              });
              return false;
            }

            await options.onCreated?.(record, template);
          },
        },
      ],
      options: {
        width: 680,
        maxHeight: "84vh",
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    });
  }

  function openSaveDraftAsTemplate(
    draft: PromptDraftState,
    options: SaveDraftAsTemplateOptions = {},
  ) {
    const state = reactive({
      title: options.defaultTitle?.trim() || "",
      description: options.description?.trim() || "",
    });

    modal.open({
      header: {
        icon: "bookmark_add",
        title: "Save as template",
        subtitle:
          "Save this structured Draft as a reusable starting point on this device.",
        color: "blue",
        closeButton: true,
      },
      component: SavePromptTemplateModal,
      props: { state },
      actions: [
        {
          label: "Cancel",
          mode: "flat",
          color: "normal",
          close: true,
        },
        {
          label: "Save template",
          icon: "bookmark_add",
          color: "blue",
          close: true,
          disable: () => !state.title.trim(),
          handler: async () => {
            if (!state.title.trim()) return false;

            const template = createUserPromptTemplateFromDraft(draft, {
              title: state.title,
              description: state.description,
              source: options.source,
            });
            const saved = saveUserPromptTemplate(template);
            await options.onSaved?.(saved);
          },
        },
      ],
      options: {
        width: 560,
        maxHeight: "80vh",
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    });
  }

  function openSaveActiveCreateDraftAsTemplate(
    options: Omit<SaveDraftAsTemplateOptions, "defaultTitle" | "source"> = {},
  ) {
    if (typeof window !== "undefined") {
      // Create already persists synchronously on beforeunload. Dispatching the
      // event here flushes any pending debounced edit before taking the snapshot.
      window.dispatchEvent(new Event("beforeunload"));
    }

    const active = readActiveCreateDraftForTemplate();
    if (!active) {
      modal.message({
        type: "warning",
        title: "No active Draft",
        message: "Create does not have an active Draft to save as a template yet.",
      });
      return;
    }

    openSaveDraftAsTemplate(active.draft, {
      ...options,
      defaultTitle: active.title,
      source: { kind: "create" },
    });
  }

  return {
    openStartFromTemplate,
    openSaveDraftAsTemplate,
    openSaveActiveCreateDraftAsTemplate,
  };
}
