import type { AuthUserRole } from "~/types/auth";

export type AdminUserSummary = {
  id: string;
  username: string | null;
  email: string | null;
  role: AuthUserRole;
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
