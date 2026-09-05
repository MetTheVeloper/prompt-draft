import type {
  AdminArchiveImageMutationResponse,
  AdminArchiveImageOrderInput,
  AdminArchiveImageUploadInput,
  AdminArchiveMutationResponse,
  AdminArchiveTagsResponse,
  AdminArchiveUpsertInput,
  GetAdminArchiveResponse,
  ListAdminArchiveParams,
  ListAdminArchiveResponse,
} from "~/types/adminArchiveApi";
import type { AdminDashboardSummaryResponse } from "~/types/adminDashboardApi";
import type {
  AdminUserMutationResponse,
  GetAdminUserResponse,
  ListAdminUsersParams,
  ListAdminUsersResponse,
  UpdateAdminUserRoleInput,
} from "~/types/adminUsersApi";
import type {
  DeletePromptDraftResponse,
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

type ResolveAdminArchiveResponse = {
  ok: true;
  id: string;
  telegramMessageId: number;
};

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

  async function upsertPromptDraft(id: string, input: UpsertPromptDraftInput) {
    const response = await $fetch<UpsertPromptDraftResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(id)}`),
      {
        method: "PUT",
        headers: auth.authHeaders(),
        body: input,
      },
    );

    if (response.score) {
      auth.applyScoreState(response.score);
    }

    return response;
  }

  function getPromptDraft(id: string) {
    return $fetch<GetPromptDraftResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(id)}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  function deletePromptDraft(id: string) {
    return $fetch<DeletePromptDraftResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(id)}`),
      {
        method: "DELETE",
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

  function getAdminDashboardSummary() {
    return $fetch<AdminDashboardSummaryResponse>(
      endpoint("/api/admin/dashboard/summary"),
      {
        headers: auth.authHeaders(),
      },
    );
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

  function listAdminArchive(params: ListAdminArchiveParams = {}) {
    const query = new URLSearchParams();

    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor !== undefined) query.set("cursor", params.cursor);
    if (params.query !== undefined) query.set("query", params.query);
    if (params.status !== undefined) query.set("status", params.status);
    if (params.model !== undefined) query.set("model", params.model);

    const queryString = query.toString();
    const path = queryString
      ? `/api/admin/archive?${queryString}`
      : "/api/admin/archive";

    return $fetch<ListAdminArchiveResponse>(endpoint(path), {
      headers: auth.authHeaders(),
    });
  }

  function getAdminArchive(id: string) {
    return $fetch<GetAdminArchiveResponse>(
      endpoint(`/api/admin/archive/${encodeURIComponent(id)}`),
      { headers: auth.authHeaders() },
    );
  }

  function resolveAdminArchiveByTelegramId(telegramMessageId: number) {
    return $fetch<ResolveAdminArchiveResponse>(
      endpoint(`/api/admin/archive/telegram/${telegramMessageId}`),
      { headers: auth.authHeaders() },
    );
  }

  function getAdminArchiveTags() {
    return $fetch<AdminArchiveTagsResponse>(endpoint("/api/admin/archive/tags"), {
      headers: auth.authHeaders(),
    });
  }

  function createAdminArchive(input: AdminArchiveUpsertInput) {
    return $fetch<AdminArchiveMutationResponse>(endpoint("/api/admin/archive"), {
      method: "POST",
      headers: auth.authHeaders(),
      body: input,
    });
  }

  function updateAdminArchive(id: string, input: AdminArchiveUpsertInput) {
    return $fetch<AdminArchiveMutationResponse>(
      endpoint(`/api/admin/archive/${encodeURIComponent(id)}`),
      {
        method: "PUT",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function setAdminArchiveStatus(
    id: string,
    action: "draft" | "publish" | "archive",
  ) {
    return $fetch<AdminArchiveMutationResponse>(
      endpoint(`/api/admin/archive/${encodeURIComponent(id)}/${action}`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  function uploadAdminArchiveImage(id: string, input: AdminArchiveImageUploadInput) {
    return $fetch<AdminArchiveImageMutationResponse>(
      endpoint(`/api/admin/archive/${encodeURIComponent(id)}/images`),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function deleteAdminArchiveImage(id: string, imageId: string) {
    return $fetch<AdminArchiveImageMutationResponse>(
      endpoint(
        `/api/admin/archive/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      ),
      {
        method: "DELETE",
        headers: auth.authHeaders(),
      },
    );
  }

  function reorderAdminArchiveImages(id: string, input: AdminArchiveImageOrderInput) {
    return $fetch<{ ok: true }>(
      endpoint(`/api/admin/archive/${encodeURIComponent(id)}/images/order`),
      {
        method: "PUT",
        headers: auth.authHeaders(),
        body: input,
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
    deletePromptDraft,
    listPromptDrafts,
    getTranslationStatus,
    translatePrompt,
    getAdminAccessCheck,
    getAdminDashboardSummary,
    listAdminUsers,
    getAdminUser,
    updateAdminUserRole,
    suspendAdminUser,
    unsuspendAdminUser,
    revokeAdminUserSessions,
    resetAdminUserCloudData,
    listAdminArchive,
    getAdminArchive,
    resolveAdminArchiveByTelegramId,
    getAdminArchiveTags,
    createAdminArchive,
    updateAdminArchive,
    setAdminArchiveStatus,
    uploadAdminArchiveImage,
    deleteAdminArchiveImage,
    reorderAdminArchiveImages,
  };
}
