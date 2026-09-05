type ResolveAdminArchiveResponse = {
  ok: true;
  id: string;
  publicId: number;
  telegramMessageId: number | null;
};

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useAdminArchiveDeepLink() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function resolveByPublicId(publicId: number) {
    return $fetch<ResolveAdminArchiveResponse>(
      endpoint(`/api/admin/archive/public/${publicId}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  function resolveByTelegramId(telegramMessageId: number) {
    return $fetch<ResolveAdminArchiveResponse>(
      endpoint(`/api/admin/archive/telegram/${telegramMessageId}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  return {
    resolveByPublicId,
    resolveByTelegramId,
  };
}
