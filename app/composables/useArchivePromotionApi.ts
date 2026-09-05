import type {
  GetArchivePromotionSourceResponse,
  ModerateDeleteDraftResponse,
  PromoteDraftToArchiveInput,
  PromoteDraftToArchiveResponse,
} from "~/types/archivePromotionApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useArchivePromotionApi() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path: string) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalized}`;
  }

  function sourcePath(userId: string, draftId: string) {
    return `/api/admin/archive/source-draft/${encodeURIComponent(userId)}/${encodeURIComponent(draftId)}`;
  }

  function getSourceDraft(userId: string, draftId: string) {
    return $fetch<GetArchivePromotionSourceResponse>(
      endpoint(sourcePath(userId, draftId)),
      { headers: auth.authHeaders() },
    );
  }

  async function getSourceImage(
    userId: string,
    draftId: string,
    imageId: string,
  ) {
    const response = await fetch(
      endpoint(`${sourcePath(userId, draftId)}/images/${encodeURIComponent(imageId)}`),
      { headers: auth.authHeaders() },
    );

    if (!response.ok) {
      let message = "Failed to read source Draft image";
      try {
        const payload = await response.json() as { message?: unknown };
        if (typeof payload.message === "string" && payload.message.trim()) {
          message = payload.message;
        }
      } catch {
        // Keep generic fallback when the error response is not JSON.
      }
      throw new Error(message);
    }

    return response.blob();
  }

  function promoteDraft(input: PromoteDraftToArchiveInput) {
    return $fetch<PromoteDraftToArchiveResponse>(
      endpoint("/api/admin/archive/promote-draft"),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function moderateDeleteDraft(userId: string, draftId: string) {
    return $fetch<ModerateDeleteDraftResponse>(
      endpoint(sourcePath(userId, draftId)),
      {
        method: "DELETE",
        headers: auth.authHeaders(),
      },
    );
  }

  return {
    getSourceDraft,
    getSourceImage,
    promoteDraft,
    moderateDeleteDraft,
  };
}
