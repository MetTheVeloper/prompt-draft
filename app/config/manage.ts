import {
  AUTH_PERMISSIONS,
  type AuthPermission,
} from "~/config/authorization";

export type ManageSection = {
  key: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  requiredPermission: AuthPermission;
};

export const MANAGE_SECTIONS: readonly ManageSection[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Authorization foundation proof. System metrics and admin tools will be added later.",
    icon: "dashboard",
    route: "/manage/dashboard",
    requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    key: "users",
    label: "Users",
    description: "Browse account metadata and current Cloud usage.",
    icon: "group",
    route: "/manage/users",
    requiredPermission: AUTH_PERMISSIONS.USERS_VIEW,
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
