<script setup lang="ts">
type CreatePageContextMenuLabels = {
  draft: string;
  newDraft: string;
  importDraft: string;
  exportDraft: string;
  downloadDraft: string;
  resetDraft: string;
  deleteDraft: string;

  copy: string;
  modular: string;
  natural: string;
  json: string;

  variables: string;
  createVariable: string;
  showVariables: string;

  refreshPage: string;
};

type CreatePageContextMenuDisabled = {
  exportCollection?: boolean;
  downloadDraft?: boolean;
  resetDraft?: boolean;
  deleteDraft?: boolean;
  copyModular?: boolean;
  copyNatural?: boolean;
  copyJson?: boolean;
};

type CreatePageContextMenuDisabledKey = keyof CreatePageContextMenuDisabled;
type CreatePageContextMenuLabelKey = keyof CreatePageContextMenuLabels;
type CreatePageContextMenuAction = () => void | Promise<void>;

type CreatePageContextMenuActionKey =
  | "onNewDraft"
  | "onImportDraft"
  | "onExportCollection"
  | "onDownloadDraft"
  | "onResetDraft"
  | "onDeleteDraft"
  | "onCopyModular"
  | "onCopyNatural"
  | "onCopyJson"
  | "onCreateVariable"
  | "onShowVariables"
  | "onRefreshPage";

type CreatePageContextMenuButtonAttrs = Record<string, unknown>;

type CreatePageContextMenuItem = {
  key: string;
  labelKey: CreatePageContextMenuLabelKey;
  actionKey: CreatePageContextMenuActionKey;
  disabledKey?: CreatePageContextMenuDisabledKey;
  attrs?: CreatePageContextMenuButtonAttrs;
};

type CreatePageContextMenuRow = {
  key: string;
  cols: number | string[];
  attrs?: Record<string, unknown>;
  buttonAttrs?: CreatePageContextMenuButtonAttrs;
  items: CreatePageContextMenuItem[];
};

type CreatePageContextMenuGroup = {
  key: string;
  labelKey?: CreatePageContextMenuLabelKey;
  icon?: string;
  iconColor?: string;
  attrs?: Record<string, unknown>;
  headerAttrs?: Record<string, unknown>;
  rows: CreatePageContextMenuRow[];
};

const props = withDefaults(
  defineProps<{
    labels: CreatePageContextMenuLabels;
    disabled?: CreatePageContextMenuDisabled;

    onNewDraft?: CreatePageContextMenuAction;
    onImportDraft?: CreatePageContextMenuAction;
    onExportCollection?: CreatePageContextMenuAction;
    onDownloadDraft?: CreatePageContextMenuAction;
    onResetDraft?: CreatePageContextMenuAction;
    onDeleteDraft?: CreatePageContextMenuAction;

    onCopyModular?: CreatePageContextMenuAction;
    onCopyNatural?: CreatePageContextMenuAction;
    onCopyJson?: CreatePageContextMenuAction;

    onCreateVariable?: CreatePageContextMenuAction;
    onShowVariables?: CreatePageContextMenuAction;

    onRefreshPage?: CreatePageContextMenuAction;
  }>(),
  {
    disabled: () => ({}),
  },
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const menuGridAttrs = {
  gap: 16,
  p: [16],
};

const groupGridAttrs = {
  gap: 6,
};

const groupHeaderAttrs = {
  rules: "rsc",
  cols: ["auto", "minmax(0, 1fr)"],
  gap: 8,
  p: [0, 4],
};

const groupTitleAttrs = {
  size: 11,
  weight: 700,
  color: "normal55",
};

const rowGridAttrs = {
  gap: 6,
};

const fabButtonAttrs = {
  type: "fab",
  size: 12,
  p: [8],
};

const simpleButtonAttrs = {
  size: 12,
  rules: "rsc",
  p: [8, 12],
  color: 'blue',
};

const menuGroups: CreatePageContextMenuGroup[] = [
  {
    key: "draft",
    labelKey: "draft",
    icon: "description",
    iconColor: "normal50",
    rows: [
      {
        key: "draft-file",
        cols: 6,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "new-draft",
            labelKey: "newDraft",
            actionKey: "onNewDraft",
            attrs: {
              icon: "edit",
              color: "blue10",
              textColor: 'normal',
            },
          },
          {
            key: "import-draft",
            labelKey: "importDraft",
            actionKey: "onImportDraft",
            attrs: {
              icon: "upload_file",
              color: "blue10",
              textColor: 'normal',
            },
          },
          {
            key: "export-draft",
            labelKey: "exportDraft",
            actionKey: "onExportCollection",
            disabledKey: "exportCollection",
            attrs: {
              icon: "download",
              color: "blue10",
              textColor: 'normal',
            },
          },
          {
            key: "download-draft",
            labelKey: "downloadDraft",
            actionKey: "onDownloadDraft",
            disabledKey: "downloadDraft",
            attrs: {
              icon: "upload_file",
              color: "orange15",
              textColor: 'normal',
            },
          },
          {
            key: "reset-draft",
            labelKey: "resetDraft",
            actionKey: "onResetDraft",
            disabledKey: "resetDraft",
            attrs: {
              icon: "refresh",
              color: "orange",
            },
          },
          {
            key: "delete-draft",
            labelKey: "deleteDraft",
            actionKey: "onDeleteDraft",
            disabledKey: "deleteDraft",
            attrs: {
              icon: "delete",
              color: "red",
            },
          },
        ],
      },
    ],
  },
  {
    key: "copy",
    labelKey: "copy",
    icon: "content_copy",
    iconColor: "normal50",
    rows: [
      {
        key: "copy-format",
        cols: 3,
        buttonAttrs: fabButtonAttrs,
        items: [
          {
            key: "copy-modular",
            labelKey: "modular",
            actionKey: "onCopyModular",
            disabledKey: "copyModular",
            attrs: {
              icon: "description",
              color: "blue10",
              textColor: "normal",
            },
          },
          {
            key: "copy-natural",
            labelKey: "natural",
            actionKey: "onCopyNatural",
            disabledKey: "copyNatural",
            attrs: {
              icon: "text_fields",
              color: "blue10",
              textColor: "normal",
            },
          },
          {
            key: "copy-json",
            labelKey: "json",
            actionKey: "onCopyJson",
            disabledKey: "copyJson",
            attrs: {
              icon: "code",
              color: "blue10",
              textColor: "normal",
            },
          },
        ],
      },
    ],
  },
  {
    key: "variables",
    labelKey: "variables",
    icon: "code",
    iconColor: "normal50",
    rows: [
      {
        key: "variable-actions",
        cols: 2,
        buttonAttrs: simpleButtonAttrs,
        items: [
          {
            key: "create-variable",
            labelKey: "createVariable",
            actionKey: "onCreateVariable",
            attrs: {
              color: "blue10",
              textColor: 'normal',
              icon: 'add',
            },
          },
          {
            key: "show-variables",
            labelKey: "showVariables",
            actionKey: "onShowVariables",
            attrs: {
              color: "blue10",
              textColor: 'normal',
              icon: 'code',
            },
          },
        ],
      },
    ],
  },
];

const footerGroups: CreatePageContextMenuGroup[] = [
  {
    key: "page",
    rows: [
      {
        key: "page-actions",
        cols: 1,
        items: [
          {
            key: "refresh-page",
            labelKey: "refreshPage",
            actionKey: "onRefreshPage",
            attrs: {
              size: 12,
              mode: 'flat',
              icon: "refresh",
              color: "blue0",
              textColor: "normal",
              p: [10, 12],
              rules: 'rsc',
            },
          },
        ],
      },
    ],
  },
];

function getLabel(key: CreatePageContextMenuLabelKey) {
  return props.labels[key];
}

function isDisabled(key?: CreatePageContextMenuDisabledKey) {
  if (!key) return false;

  return !!props.disabled?.[key];
}

function getAction(key: CreatePageContextMenuActionKey) {
  return props[key];
}

function getGroupAttrs(group: CreatePageContextMenuGroup) {
  return {
    ...groupGridAttrs,
    ...group.attrs,
  };
}

function getHeaderAttrs(group: CreatePageContextMenuGroup) {
  return {
    ...groupHeaderAttrs,
    ...group.headerAttrs,
  };
}

function getRowAttrs(row: CreatePageContextMenuRow) {
  return {
    ...rowGridAttrs,
    ...row.attrs,
    cols: row.cols,
  };
}

function getButtonAttrs(row: CreatePageContextMenuRow, item: CreatePageContextMenuItem) {
  return {
    ...row.buttonAttrs,
    ...item.attrs,
    disable: isDisabled(item.disabledKey),
  };
}

async function runItem(item: CreatePageContextMenuItem) {
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
        <el-grid v-if="group.labelKey" v-bind="getHeaderAttrs(group)">
          <el-icon v-if="group.icon" :icon="group.icon" :size="15" :color="group.iconColor || 'normal55'" />

          <el-text v-bind="groupTitleAttrs">
            {{ getLabel(group.labelKey) }}
          </el-text>
        </el-grid>

        <el-grid v-for="row in group.rows" :key="row.key" v-bind="getRowAttrs(row)">
          <el-button v-for="item in row.items" :key="item.key" v-bind="getButtonAttrs(row, item)"
            :label="getLabel(item.labelKey)" @click="runItem(item)" />
        </el-grid>
      </el-grid>
    </template>

    <el-grid :gap="0">
      <el-divider mode="dashed" />
    </el-grid>

    <el-grid v-for="group in footerGroups" :key="group.key" v-bind="getGroupAttrs(group)">
      <el-grid v-for="row in group.rows" :key="row.key" v-bind="getRowAttrs(row)">
        <el-button v-for="item in row.items" :key="item.key" v-bind="getButtonAttrs(row, item)"
          :label="getLabel(item.labelKey)" @click="runItem(item)" />
      </el-grid>
    </el-grid>
  </el-grid>
</template>
