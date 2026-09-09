import type {
  CreatorAdminAction,
  CreatorAdminEventsResponse,
  CreatorAdminListParams,
  CreatorAdminListResponse,
  CreatorAdminReviewResponse,
} from "~/types/creatorAdmin";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useCreatorAdmin() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path = "") {
    return `${apiBase}/api/admin/creators${path}`;
  }

  async function list(params: CreatorAdminListParams = {}) {
    await auth.initialize();
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.query) query.set("query", params.query);
    if (params.status) query.set("status", params.status);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return $fetch<CreatorAdminListResponse>(endpoint(suffix), {
      headers: auth.authHeaders(),
    });
  }

  async function getReview(userId: string) {
    await auth.initialize();
    return $fetch<CreatorAdminReviewResponse>(
      endpoint(`/${encodeURIComponent(userId)}`),
      { headers: auth.authHeaders() },
    );
  }

  async function getEvents(userId: string) {
    await auth.initialize();
    return $fetch<CreatorAdminEventsResponse>(
      endpoint(`/${encodeURIComponent(userId)}/events`),
      { headers: auth.authHeaders() },
    );
  }

  async function applyAction(
    userId: string,
    action: CreatorAdminAction,
    note: string | null = null,
  ) {
    await auth.initialize();
    return $fetch<CreatorAdminReviewResponse>(
      endpoint(`/${encodeURIComponent(userId)}/${action}`),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: note ? { note } : undefined,
      },
    );
  }

  return {
    list,
    getReview,
    getEvents,
    applyAction,
  };
}
