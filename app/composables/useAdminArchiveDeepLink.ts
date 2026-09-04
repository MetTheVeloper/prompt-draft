type ResolveAdminArchiveResponse = {
  ok: true;
  id: string;
  telegramMessageId: number;
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

  function resolveByTelegramId(telegramMessageId: number) {
    return $fetch<ResolveAdminArchiveResponse>(
      endpoint(`/api/admin/archive/telegram/${telegramMessageId}`),
      {
        headers: auth.authHeaders(),
      },
    );
  }

  return {
    resolveByTelegramId,
  };
}
