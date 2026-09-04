type UserAvatarResponse = {
  ok: true;
  avatar: { url: string } | null;
};

const avatarState = reactive({
  url: null as string | null,
  loadedUserId: null as string | null,
  loading: false,
  saving: false,
  error: "",
});

let loadPromise: Promise<UserAvatarResponse | null> | null = null;

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useUserAvatar() {
  const auth = useAuth();
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint() {
    return `${apiBase}/api/profile/avatar`;
  }

  function reset() {
    avatarState.url = null;
    avatarState.loadedUserId = null;
    avatarState.loading = false;
    avatarState.saving = false;
    avatarState.error = "";
    loadPromise = null;
  }

  async function request(method: "GET" | "POST" | "DELETE", body?: Blob) {
    const response = await fetch(endpoint(), {
      method,
      headers: {
        Accept: "application/json",
        ...auth.authHeaders(),
        ...(body ? { "Content-Type": "image/webp" } : {}),
      },
      body,
      cache: "no-store",
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON error is normalized below.
    }

    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message || "")
        : "";
      throw new Error(message || `Avatar request failed with ${response.status}`);
    }

    return payload as UserAvatarResponse;
  }

  async function refresh(force = false) {
    if (!import.meta.client) return null;
    await auth.initialize();

    const userId = auth.user.value?.id ?? null;
    if (!userId) {
      reset();
      return null;
    }

    if (!force && avatarState.loadedUserId === userId) {
      return {
        ok: true as const,
        avatar: avatarState.url ? { url: avatarState.url } : null,
      };
    }

    if (loadPromise && !force) return loadPromise;

    avatarState.loading = true;
    avatarState.error = "";

    loadPromise = (async () => {
      try {
        const response = await request("GET");
        avatarState.url = response.avatar?.url || null;
        avatarState.loadedUserId = userId;
        return response;
      } catch (error) {
        avatarState.error = error instanceof Error ? error.message : "avatar-load-failed";
        throw error;
      } finally {
        avatarState.loading = false;
      }
    })();

    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  async function upload(blob: Blob) {
    if (!auth.user.value) throw new Error("Authentication required");

    avatarState.saving = true;
    avatarState.error = "";

    try {
      const response = await request("POST", blob);
      avatarState.url = response.avatar?.url || null;
      avatarState.loadedUserId = auth.user.value.id;
      return response;
    } catch (error) {
      avatarState.error = error instanceof Error ? error.message : "avatar-save-failed";
      throw error;
    } finally {
      avatarState.saving = false;
    }
  }

  async function remove() {
    if (!auth.user.value) throw new Error("Authentication required");

    avatarState.saving = true;
    avatarState.error = "";

    try {
      const response = await request("DELETE");
      avatarState.url = null;
      avatarState.loadedUserId = auth.user.value.id;
      return response;
    } catch (error) {
      avatarState.error = error instanceof Error ? error.message : "avatar-remove-failed";
      throw error;
    } finally {
      avatarState.saving = false;
    }
  }

  return {
    url: computed(() => avatarState.url),
    loading: computed(() => avatarState.loading),
    saving: computed(() => avatarState.saving),
    error: computed(() => avatarState.error),
    loadedUserId: computed(() => avatarState.loadedUserId),
    refresh,
    upload,
    remove,
    reset,
  };
}
