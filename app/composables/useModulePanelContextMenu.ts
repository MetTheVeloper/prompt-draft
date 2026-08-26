import type { GlobalMenuItem } from "~/composables/useMenu";

type ModulePanelContextMenuAction = () => void | Promise<void>;

export type ModulePanelContextMenuOptions = {
  getTitle: () => string;
  getExpanded: () => boolean;
  onToggleExpand: ModulePanelContextMenuAction;
  canToggleExpand?: () => boolean;
  getCustomMode?: () => boolean;
  onToggleCustomize?: ModulePanelContextMenuAction;
  canCopyOutput?: () => boolean;
  onCopyOutput?: ModulePanelContextMenuAction;
  onRemove: ModulePanelContextMenuAction;
};

export function useModulePanelContextMenu(
  options: ModulePanelContextMenuOptions,
) {
  const { t } = useI18n();
  const { openPageContextMenu } = usePageContextMenu();

  function getItems(): GlobalMenuItem[] {
    const isExpanded = options.getExpanded();
    const isCustomMode = Boolean(options.getCustomMode?.());
    const canToggleExpand = options.canToggleExpand
      ? options.canToggleExpand()
      : true;

    const customizeItem: GlobalMenuItem = {
      label: isCustomMode
        ? t("components.contextMenu.actions.disableCustomize")
        : t("components.contextMenu.actions.enableCustomize"),
      icon: "tune",
      active: isCustomMode,
      disabled: !options.onToggleCustomize,
    };

    if (options.onToggleCustomize) {
      customizeItem.handler = options.onToggleCustomize;
    }

    const copyOutputItem: GlobalMenuItem = {
      label: t("components.contextMenu.actions.copyOutput"),
      icon: "file_copy",
      disabled:
        !options.onCopyOutput ||
        (options.canCopyOutput ? !options.canCopyOutput() : false),
    };

    if (options.onCopyOutput) {
      copyOutputItem.handler = options.onCopyOutput;
    }

    return [
      {
        type: "header",
        label: options.getTitle(),
      },
      {
        label: isExpanded
          ? t("components.contextMenu.actions.collapse")
          : t("components.contextMenu.actions.expand"),
        icon: isExpanded ? "expand_less" : "expand_more",
        disabled: !canToggleExpand,
        handler: options.onToggleExpand,
      },
      customizeItem,
      {
        type: "divider",
      },
      copyOutputItem,
      {
        label: t("components.contextMenu.actions.removeFromKeyModules"),
        icon: "delete",
        color: "red",
        handler: options.onRemove,
      },
    ];
  }

  function openModulePanelContextMenu(event: MouseEvent) {
    return openPageContextMenu(event, {
      items: getItems(),
      minWidth: 220,
      maxWidth: 260,
      closeOnScroll: false,
      zIndex: 2300,
    });
  }

  return {
    openModulePanelContextMenu,
  };
}
