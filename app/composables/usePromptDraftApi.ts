import type {
  AdminUserMutationResponse,
  GetAdminUserResponse,
  ListAdminUsersParams,
  ListAdminUsersResponse,
  UpdateAdminUserRoleInput,
} from "~/types/adminUsersApi";
import type {
  GetPromptDraftResponse,
  ListPromptDraftsParams,
  ListPromptDraftsResponse,
  UpsertPromptDraftInput,
  UpsertPromptDraftResponse,
} from "~/types/draftSyncApi";
import type {
  TranslatePromptInput,
  TranslatePromptResponse,
  TranslationStatusResponse,
} from "~/types/translationApi";
import type { AdminAccessCheckResponse } from "~/types/auth";
import type {
  ApiHelloResponse,
  CreateWizardRunInput,
  CreateWizardRunResponse,
  GetWizardRunResponse,
  ListWizardRunsParams,
  ListWizardRunsResponse,
} from "~/types/wizardRunApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function usePromptDraftApi() {
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);
  const auth = useAuth();

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function hello() {
    return $fetch<ApiHelloResponse>(endpoint("/api/hello"));
  }

  function createWizardRun(input: CreateWizardRunInput) {
    return $fetch<CreateWizardRunResponse>(endpoint("/api/wizard-runs"), {
      method: "POST",
      body: input,
    });
  }

  function listWizardRuns(params: ListWizardRunsParams = {}) {
    const query = new URLSearchParams();

    if (params.limit !== undefined) {
      query.set("limit", String(params.limit));
    }

    if (params.cursor !== undefined) {
      query.set("cursor", params.cursor);
    }

    if (params.wizardId !== undefined) {
      query.set("wizardId", params.wizardId);
    }

    const queryString = query.toString();
    const path = queryString
      ? `/api/wizard-runs?${queryString}`
      : "/api/wizard-runs";

    return $fetch<ListWizardRunsResponse>(endpoint(path));
  }

  function getWizardRun(id: string) {
    return $fetch<GetWizardRunResponse>(
      endpoint(`/api/wizard-runs/${encodeURIComponent(id)}`),
    );
  }

  function upsertPromptDraft(id: string, input: UpsertPromptDraftInput) {
    return $fetch<UpsertPromptDraftResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(id)}`),
      {
        method: "PUT",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function getPromptDraft(id: string) {
    return $fetch<GetPromptDraftResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(id)}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  function listPromptDrafts(params: ListPromptDraftsParams = {}) {
    const query = new URLSearchParams();

    if (params.limit !== undefined) {
      query.set("limit", String(params.limit));
    }

    if (params.cursor !== undefined) {
      query.set("cursor", params.cursor);
    }

    const queryString = query.toString();
    const path = queryString ? `/api/drafts?${queryString}` : "/api/drafts";

    return $fetch<ListPromptDraftsResponse>(endpoint(path), {
      headers: auth.authHeaders(),
    });
  }

  function getTranslationStatus() {
    return $fetch<TranslationStatusResponse>(endpoint("/api/translate/status"));
  }

  function translatePrompt(input: TranslatePromptInput) {
    return $fetch<TranslatePromptResponse>(endpoint("/api/translate"), {
      method: "POST",
      body: input,
    });
  }

  function getAdminAccessCheck() {
    return $fetch<AdminAccessCheckResponse>(endpoint("/api/admin/access-check"), {
      headers: auth.authHeaders(),
    });
  }

  function listAdminUsers(params: ListAdminUsersParams = {}) {
    const query = new URLSearchParams();

    if (params.limit !== undefined) {
      query.set("limit", String(params.limit));
    }

    if (params.cursor !== undefined) {
      query.set("cursor", params.cursor);
    }

    if (params.query !== undefined) {
      query.set("query", params.query);
    }

    if (params.role !== undefined) {
      query.set("role", params.role);
    }

    const queryString = query.toString();
    const path = queryString
      ? `/api/admin/users?${queryString}`
      : "/api/admin/users";

    return $fetch<ListAdminUsersResponse>(endpoint(path), {
      headers: auth.authHeaders(),
    });
  }

  function getAdminUser(id: string) {
    return $fetch<GetAdminUserResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  function updateAdminUserRole(id: string, input: UpdateAdminUserRoleInput) {
    return $fetch<AdminUserMutationResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}/role`),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function suspendAdminUser(id: string) {
    return $fetch<AdminUserMutationResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}/suspend`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  function unsuspendAdminUser(id: string) {
    return $fetch<AdminUserMutationResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}/unsuspend`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  function revokeAdminUserSessions(id: string) {
    return $fetch<AdminUserMutationResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}/revoke-sessions`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  function resetAdminUserCloudData(id: string) {
    return $fetch<AdminUserMutationResponse>(
      endpoint(`/api/admin/users/${encodeURIComponent(id)}/reset-cloud-data`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  return {
    apiBase,
    hello,
    createWizardRun,
    listWizardRuns,
    getWizardRun,
    upsertPromptDraft,
    getPromptDraft,
    listPromptDrafts,
    getTranslationStatus,
    translatePrompt,
    getAdminAccessCheck,
    listAdminUsers,
    getAdminUser,
    updateAdminUserRole,
    suspendAdminUser,
    unsuspendAdminUser,
    revokeAdminUserSessions,
    resetAdminUserCloudData,
  };
}
