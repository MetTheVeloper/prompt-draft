import type {
  AdminTelegramConfigResponse,
  AdminTelegramPublicationsResponse,
  AdminTelegramPublishResponse,
  AdminTelegramRetryResponse,
  TelegramPublicationInput,
} from "~/types/adminTelegramApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useAdminTelegram() {
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);
  const auth = useAuth();

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function getConfig() {
    return $fetch<AdminTelegramConfigResponse>(
      endpoint("/api/admin/telegram/config"),
      { headers: auth.authHeaders() },
    );
  }

  function listPublications(limit = 20) {
    return $fetch<AdminTelegramPublicationsResponse>(
      endpoint(`/api/admin/telegram/publications?limit=${limit}`),
      { headers: auth.authHeaders() },
    );
  }

  function publish(input: TelegramPublicationInput) {
    return $fetch<AdminTelegramPublishResponse>(
      endpoint("/api/admin/telegram/publications"),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: input,
      },
    );
  }

  function retry(publicationId: string) {
    return $fetch<AdminTelegramRetryResponse>(
      endpoint(`/api/admin/telegram/publications/${encodeURIComponent(publicationId)}/retry`),
      {
        method: "POST",
        headers: auth.authHeaders(),
      },
    );
  }

  return {
    getConfig,
    listPublications,
    publish,
    retry,
  };
}
