import type { AuthUserRole, AuthUserStatus } from "~/types/auth";

export type AdminUserSummary = {
  id: string;
  username: string | null;
  email: string | null;
  role: AuthUserRole;
  status: AuthUserStatus;
  createdAt: string;
  cloudDraftCount: number;
  activeSessionCount: number;
};

export type ListAdminUsersParams = {
  limit?: number;
  cursor?: string;
  query?: string;
  role?: AuthUserRole;
};

export type AdminUsersPageInfo = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type ListAdminUsersResponse = {
  ok: true;
  users: AdminUserSummary[];
  pageInfo: AdminUsersPageInfo;
};

export type GetAdminUserResponse = {
  ok: true;
  user: AdminUserSummary;
};

export type UpdateAdminUserRoleInput = {
  role: AuthUserRole;
};

export type AdminUserMutationResponse = {
  ok: true;
  user: AdminUserSummary;
  revokedSessionCount?: number;
  deletedDraftCount?: number;
};
