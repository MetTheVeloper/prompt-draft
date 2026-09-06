import {
  AUTH_PERMISSIONS,
  type AuthPermission,
} from "~/config/authorization";

export type ManageSection = {
  key: "dashboard" | "growth" | "users" | "archive" | "economy";
  icon: string;
  route: string;
  requiredPermission: AuthPermission;
};

export const MANAGE_SECTIONS: readonly ManageSection[] = [
  {
    key: "dashboard",
    icon: "dashboard",
    route: "/manage/dashboard",
    requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    key: "growth",
    icon: "monitoring",
    route: "/manage/growth",
    requiredPermission: AUTH_PERMISSIONS.SYSTEM_METRICS_VIEW,
  },
  {
    key: "users",
    icon: "group",
    route: "/manage/users",
    requiredPermission: AUTH_PERMISSIONS.USERS_VIEW,
  },
  {
    key: "archive",
    icon: "archive",
    route: "/manage/archive",
    requiredPermission: AUTH_PERMISSIONS.ARCHIVE_VIEW,
  },
  {
    key: "economy",
    icon: "account_balance_wallet",
    route: "/manage/economy",
    requiredPermission: AUTH_PERMISSIONS.SYSTEM_SETTINGS_MANAGE,
  },
];

export function getPermittedManageSections(
  can: (permission: AuthPermission) => boolean,
) {
  return MANAGE_SECTIONS.filter((section) => can(section.requiredPermission));
}

export function canAccessManage(
  can: (permission: AuthPermission) => boolean,
) {
  return MANAGE_SECTIONS.some((section) => can(section.requiredPermission));
}
