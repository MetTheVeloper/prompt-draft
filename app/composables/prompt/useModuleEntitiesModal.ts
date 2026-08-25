import type { Component } from "vue";
import type {
  ModuleEntity,
  ModuleEntityPayload,
} from "~/modules/entityContracts";
import type { PromptKeyModule } from "~/modules/types";

type ModuleEntitiesModalOptions = {
  module: () => PromptKeyModule;
  component: Component;
  getProps: () => Record<string, unknown>;
  onUpdate: (entities: ModuleEntity<ModuleEntityPayload>[]) => void;
};

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function useModuleEntitiesModal(options: ModuleEntitiesModalOptions) {
  const modal = useModal();
  const { t } = useI18n();
  const { mobile } = useScreen();

  let activeModalId: string | null = null;

  function translate(path: string, fallback = "") {
    const translated = t(path);
    return translated === path ? fallback : translated;
  }

  function buildProps(
    onUpdate: (entities: ModuleEntity<ModuleEntityPayload>[]) => void,
    modelValue?: ModuleEntity<ModuleEntityPayload>[],
  ) {
    return {
      ...options.getProps(),
      ...(modelValue ? { modelValue } : {}),
      "onUpdate:modelValue": onUpdate,
    };
  }

  function openModuleEntitiesModal() {
    const module = options.module();
    const moduleTitle = translate(
      `modules.${module.key}.title`,
      humanize(module.key),
    );

    const handleUpdate = (
      nextEntities: ModuleEntity<ModuleEntityPayload>[],
    ) => {
      options.onUpdate(nextEntities);

      if (!activeModalId) return;

      // Keep the mounted modal editor in sync with its own live edits. Parent
      // state is updated immediately, so closing the modal never rolls back.
      modal.update(
        {
          props: buildProps(handleUpdate, nextEntities),
        },
        activeModalId,
      );
    };

    activeModalId = modal.open({
      header: {
        icon: "layers",
        title: `${translate("components.moduleEntities.title", "Named Configurations")} — ${moduleTitle}`,
        subtitle: translate(
          "components.moduleEntities.description",
          "Create reusable module configurations that inherit from the global/default values.",
        ),
        color: "blue",
      },
      component: options.component,
      props: buildProps(handleUpdate),
      actions: [
        {
          label: translate("modal.actions.done", "Done"),
          icon: "check",
          color: "prim",
          close: true,
        },
      ],
      options: {
        width: mobile.value ? "calc(100% - 16px)" : 1080,
        maxHeight: mobile.value ? "96vh" : "92vh",
        closeOnBackdrop: true,
        closeOnEsc: true,
        persistent: false,
      },
    });
  }

  return {
    openModuleEntitiesModal,
  };
}
