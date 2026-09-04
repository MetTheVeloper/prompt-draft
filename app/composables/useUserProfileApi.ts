import type {
  GetUserProfileResponse,
  ListUserProfileDraftsParams,
  ListUserProfileDraftsResponse,
  UpdateDraftVisibilityResponse,
  UserDraftVisibility,
} from "~/types/userProfileApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useUserProfileApi() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function optionalAuthHeaders() {
    return auth.token.value ? auth.authHeaders() : {};
  }

  function getProfile(userId: string) {
    return $fetch<GetUserProfileResponse>(
      endpoint(`/api/users/${encodeURIComponent(userId)}/profile`),
      {
        headers: optionalAuthHeaders(),
      },
    );
  }

  function listDrafts(
    userId: string,
    params: ListUserProfileDraftsParams = {},
  ) {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor !== undefined) query.set("cursor", params.cursor);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return $fetch<ListUserProfileDraftsResponse>(
      endpoint(`/api/users/${encodeURIComponent(userId)}/drafts${suffix}`),
      {
        headers: optionalAuthHeaders(),
      },
    );
  }

  function setDraftVisibility(
    draftId: string,
    visibility: UserDraftVisibility,
  ) {
    return $fetch<UpdateDraftVisibilityResponse>(
      endpoint(`/api/drafts/${encodeURIComponent(draftId)}/visibility`),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: { visibility },
      },
    );
  }

  return {
    getProfile,
    listDrafts,
    setDraftVisibility,
  };
}
