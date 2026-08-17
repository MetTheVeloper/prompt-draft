<script setup lang="ts">
import { computed } from "vue";

type SetupPanelContextMenuLabels = {
  title: string;
  expand: string;
  collapse: string;
  reset: string;
};

type SetupPanelContextMenuAction = () => void | Promise<void>;
type SetupPanelContextMenuActionKey = "onToggle" | "onReset";
type SetupPanelContextMenuDisabledKey = "reset";
type SetupPanelContextMenuButtonAttrs = Record<string, unknown>;

type SetupPanelContextMenuItem = {
  key: string;
  label: string;
  actionKey: SetupPanelContextMenuActionKey;
  disabledKey?: SetupPanelContextMenuDisabledKey;
  attrs?: SetupPanelContextMenuButtonAttrs;
};

type SetupPanelContextMenuGroup = {
  key: string;
  rows: {
    key: string;
    cols: number | string[];
    attrs?: Record<string, unknown>;
    buttonAttrs?: SetupPanelContextMenuButtonAttrs;
    items: SetupPanelContextMenuItem[];
  }[];
};

const props = withDefaults(
  defineProps<{
    labels: SetupPanelContextMenuLabels;
    isExpanded?: boolean;
    disabled?: Partial<Record<SetupPanelContextMenuDisabledKey, boolean>>;
    onToggle?: SetupPanelContextMenuAction;
    onReset?: SetupPanelContextMenuAction;
  }>(),
  {
    isExpanded: false,
    disabled: () => ({}),
  },
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const menuGridAttrs = {
  gap: 10,
  p: [14],
} as const;

const headerAttrs = {
  rules: "rsc",
  cols: ["auto", "minmax(0, 1fr)"],
  gap: 8,
  p: [0, 2],
} as const;

const titleAttrs = {
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

const menuGroups = computed<SetupPanelContextMenuGroup[]>(() => [
  {
    key: "panel",
    rows: [
      {
        key: "panel-actions",
        cols: 2,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "toggle-panel",
            label: props.isExpanded ? props.labels.collapse : props.labels.expand,
            actionKey: "onToggle",
            attrs: {
              icon: props.isExpanded ? "expand_less" : "expand_more",
              color: "blue10",
              textColor: "normal",
            },
          },
          {
            key: "reset-panel",
            label: props.labels.reset,
            actionKey: "onReset",
            disabledKey: "reset",
            attrs: {
              icon: "refresh",
              color: "orange15",
              textColor: "normal",
            },
          },
        ],
      },
    ],
  },
]);

function isDisabled(key?: SetupPanelContextMenuDisabledKey) {
  if (!key) return false;

  return !!props.disabled?.[key];
}

function getAction(key: SetupPanelContextMenuActionKey) {
  return props[key];
}

function getRowAttrs(row: SetupPanelContextMenuGroup["rows"][number]) {
  return {
    ...rowGridAttrs,
    ...row.attrs,
    cols: row.cols,
  };
}

function getButtonAttrs(
  row: SetupPanelContextMenuGroup["rows"][number],
  item: SetupPanelContextMenuItem,
) {
  return {
    ...row.buttonAttrs,
    ...item.attrs,
    disable: isDisabled(item.disabledKey),
  };
}

async function runItem(item: SetupPanelContextMenuItem) {
  if (isDisabled(item.disabledKey)) return;

  await getAction(item.actionKey)?.();
  emit("close");
}
</script>

<template>
  <el-grid v-bind="menuGridAttrs">
    <el-grid v-bind="headerAttrs">
      <el-icon icon="tune" :size="15" color="normal55" />

      <el-text v-bind="titleAttrs">
        {{ labels.title }}
      </el-text>
    </el-grid>

    <el-grid v-for="group in menuGroups" :key="group.key" :gap="6">
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
  </el-grid>
</template>
