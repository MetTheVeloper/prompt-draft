import type { AuthGrantedPermission, AuthPermission } from "~/config/authorization";

export type AuthUserRole = "user" | "admin" | "super_admin";
export type AuthUserStatus = "active" | "suspended";

export type AuthUser = {
  id: string;
  username: string | null;
  email: string | null;
  role: AuthUserRole;
  status: AuthUserStatus;
  createdAt: string;
};

export type AuthIdentifierType = "username" | "email";

export type IdentifyAuthResponse = {
  ok: true;
  exists: boolean;
  identifierType: AuthIdentifierType;
  identifier: string;
};

export type AuthSessionResponse = {
  ok: true;
  token: string;
  user: AuthUser;
  permissions: AuthGrantedPermission[];
};

export type AuthMeResponse = {
  ok: true;
  user: AuthUser;
  permissions: AuthGrantedPermission[];
};

export type AuthLogoutResponse = {
  ok: true;
};

export type AdminAccessCheckResponse = {
  ok: true;
  user: AuthUser;
  permissions: AuthGrantedPermission[];
  requiredPermission: AuthPermission;
};
