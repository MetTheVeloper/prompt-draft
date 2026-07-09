<script setup lang="ts">
import { computed } from "vue";

type ModulePanelContextMenuLabels = {
  title: string;
  expand: string;
  collapse: string;
  enableCustomize: string;
  disableCustomize: string;
  copyOutput: string;
  remove: string;
};

type ModulePanelContextMenuDisabled = {
  toggleCustomize?: boolean;
  copyOutput?: boolean;
  remove?: boolean;
};

type ModulePanelContextMenuAction = () => void | Promise<void>;
type ModulePanelContextMenuActionKey =
  | "onToggleExpand"
  | "onToggleCustomize"
  | "onCopyOutput"
  | "onRemove";
type ModulePanelContextMenuDisabledKey = keyof ModulePanelContextMenuDisabled;
type ModulePanelContextMenuButtonAttrs = Record<string, unknown>;

type ModulePanelContextMenuItem = {
  key: string;
  label: string;
  actionKey: ModulePanelContextMenuActionKey;
  disabledKey?: ModulePanelContextMenuDisabledKey;
  attrs?: ModulePanelContextMenuButtonAttrs;
};

type ModulePanelContextMenuRow = {
  key: string;
  cols: number | string[];
  attrs?: Record<string, unknown>;
  buttonAttrs?: ModulePanelContextMenuButtonAttrs;
  items: ModulePanelContextMenuItem[];
};

type ModulePanelContextMenuGroup = {
  key: string;
  label?: string;
  icon?: string;
  iconColor?: string;
  attrs?: Record<string, unknown>;
  rows: ModulePanelContextMenuRow[];
};

const props = withDefaults(
  defineProps<{
    labels: ModulePanelContextMenuLabels;
    isExpanded?: boolean;
    isCustomMode?: boolean;
    disabled?: ModulePanelContextMenuDisabled;
    onToggleExpand?: ModulePanelContextMenuAction;
    onToggleCustomize?: ModulePanelContextMenuAction;
    onCopyOutput?: ModulePanelContextMenuAction;
    onRemove?: ModulePanelContextMenuAction;
  }>(),
  {
    isExpanded: false,
    isCustomMode: false,
    disabled: () => ({}),
  },
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const menuGridAttrs = {
  gap: 14,
  p: [14],
} as const;

const groupGridAttrs = {
  gap: 6,
} as const;

const groupHeaderAttrs = {
  rules: "rsc",
  cols: ["auto", "minmax(0, 1fr)"],
  gap: 8,
  p: [0, 2],
} as const;

const groupTitleAttrs = {
  size: 11,
  weight: 700,
  color: "normal55",
} as const;

const rowGridAttrs = {
  gap: 6,
} as const;

const fabButtonAttrs = {
  type: "fab",
  size: 12,
  p: [8],
} as const;

const menuGroups = computed<ModulePanelContextMenuGroup[]>(() => [
  {
    key: "panel",
    label: props.labels.title,
    icon: "component",
    iconColor: "normal55",
    rows: [
      {
        key: "panel-actions",
        cols: 2,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "toggle-expand",
            label: props.isExpanded ? props.labels.collapse : props.labels.expand,
            actionKey: "onToggleExpand",
            attrs: {
              icon: props.isExpanded ? "arrow-up" : "arrow-down-1",
              color: "blue10",
              textColor: "normal",
            },
          },
          {
            key: "toggle-customize",
            label: props.isCustomMode
              ? props.labels.disableCustomize
              : props.labels.enableCustomize,
            actionKey: "onToggleCustomize",
            disabledKey: "toggleCustomize",
            attrs: {
              icon: props.isCustomMode ? "close-circle" : "edit",
              color: "blue10",
              textColor: "normal",
            },
          },
        ],
      },
    ],
  },
  {
    key: "output",
    label: props.labels.copyOutput,
    icon: "document-copy",
    iconColor: "normal55",
    rows: [
      {
        key: "output-actions",
        cols: 1,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "copy-output",
            label: props.labels.copyOutput,
            actionKey: "onCopyOutput",
            disabledKey: "copyOutput",
            attrs: {
              icon: "document-copy",
              color: "prim",
            },
          },
        ],
      },
    ],
  },
  {
    key: "danger",
    rows: [
      {
        key: "danger-actions",
        cols: 1,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "remove-module",
            label: props.labels.remove,
            actionKey: "onRemove",
            disabledKey: "remove",
            attrs: {
              icon: "trash",
              color: "red",
            },
          },
        ],
      },
    ],
  },
]);

function isDisabled(key?: ModulePanelContextMenuDisabledKey) {
  if (!key) return false;

  return !!props.disabled?.[key];
}

function getAction(key: ModulePanelContextMenuActionKey) {
  return props[key];
}

function getGroupAttrs(group: ModulePanelContextMenuGroup) {
  return {
    ...groupGridAttrs,
    ...group.attrs,
  };
}

function getRowAttrs(row: ModulePanelContextMenuRow) {
  return {
    ...rowGridAttrs,
    ...row.attrs,
    cols: row.cols,
  };
}

function getButtonAttrs(row: ModulePanelContextMenuRow, item: ModulePanelContextMenuItem) {
  return {
    ...row.buttonAttrs,
    ...item.attrs,
    disable: isDisabled(item.disabledKey),
  };
}

async function runItem(item: ModulePanelContextMenuItem) {
  if (isDisabled(item.disabledKey)) return;

  await getAction(item.actionKey)?.();
  emit("close");
}
</script>

<template>
  <el-grid v-bind="menuGridAttrs">
    <template v-for="(group, groupIndex) in menuGroups" :key="group.key">
      <el-grid v-if="groupIndex > 0" :gap="0">
        <el-divider mode="dashed" />
      </el-grid>

      <el-grid v-bind="getGroupAttrs(group)">
        <el-grid v-if="group.label" v-bind="groupHeaderAttrs">
          <el-icon v-if="group.icon" :icon="group.icon" :size="15" :color="group.iconColor || 'normal55'" />

          <el-text v-bind="groupTitleAttrs">
            {{ group.label }}
          </el-text>
        </el-grid>

        <el-grid v-for="row in group.rows" :key="row.key" v-bind="getRowAttrs(row)">
          <el-button
            v-for="item in row.items"
            :key="item.key"
            v-bind="getButtonAttrs(row, item)"
            :label="item.label"
            @click="runItem(item)"
          />
        </el-grid>
      </el-grid>
    </template>
  </el-grid>
</template>
