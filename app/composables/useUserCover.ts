import type { PreparedUserCover } from "~/utils/userCoverImage";

type UserCoverMedia = {
  fullUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

type UserCoverResponse = {
  ok: true;
  cover: UserCoverMedia | null;
};

const coverState = reactive({
  cover: null as UserCoverMedia | null,
  loadedUserId: null as string | null,
  loading: false,
  saving: false,
  error: "",
});

let loadPromise: Promise<UserCoverResponse | null> | null = null;

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = value.indexOf(",");
      if (commaIndex < 0) {
        reject(new Error("Could not encode cover image"));
        return;
      }
      resolve(value.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read cover image"));
    reader.readAsDataURL(blob);
  });
}

export function useUserCover() {
  const auth = useAuth();
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint() {
    return `${apiBase}/api/profile/cover`;
  }

  function reset() {
    coverState.cover = null;
    coverState.loadedUserId = null;
    coverState.loading = false;
    coverState.saving = false;
    coverState.error = "";
    loadPromise = null;
  }

  async function request(
    method: "GET" | "POST" | "DELETE",
    body?: Record<string, unknown>,
  ) {
    const response = await fetch(endpoint(), {
      method,
      headers: {
        Accept: "application/json",
        ...auth.authHeaders(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON response is normalized below.
    }

    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message || "")
        : "";
      throw new Error(message || `Cover request failed with ${response.status}`);
    }

    return payload as UserCoverResponse;
  }

  async function refresh(force = false) {
    if (!import.meta.client) return null;
    await auth.initialize();

    const userId = auth.user.value?.id ?? null;
    if (!userId) {
      reset();
      return null;
    }

    if (!force && coverState.loadedUserId === userId) {
      return { ok: true as const, cover: coverState.cover };
    }

    if (loadPromise && !force) return loadPromise;

    coverState.loading = true;
    coverState.error = "";

    loadPromise = (async () => {
      try {
        const response = await request("GET");
        coverState.cover = response.cover;
        coverState.loadedUserId = userId;
        return response;
      } catch (error) {
        coverState.error = error instanceof Error ? error.message : "cover-load-failed";
        throw error;
      } finally {
        coverState.loading = false;
      }
    })();

    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  async function upload(output: PreparedUserCover) {
    if (!auth.user.value) throw new Error("Authentication required");

    coverState.saving = true;
    coverState.error = "";

    try {
      const [fullBase64, thumbnailBase64] = await Promise.all([
        blobToBase64(output.fullBlob),
        blobToBase64(output.thumbnailBlob),
      ]);

      const response = await request("POST", {
        full: {
          base64: fullBase64,
          sizeBytes: output.fullSizeBytes,
        },
        thumbnail: {
          base64: thumbnailBase64,
          sizeBytes: output.thumbnailSizeBytes,
        },
      });

      coverState.cover = response.cover;
      coverState.loadedUserId = auth.user.value.id;
      return response;
    } catch (error) {
      coverState.error = error instanceof Error ? error.message : "cover-save-failed";
      throw error;
    } finally {
      coverState.saving = false;
    }
  }

  async function remove() {
    if (!auth.user.value) throw new Error("Authentication required");

    coverState.saving = true;
    coverState.error = "";

    try {
      const response = await request("DELETE");
      coverState.cover = null;
      coverState.loadedUserId = auth.user.value.id;
      return response;
    } catch (error) {
      coverState.error = error instanceof Error ? error.message : "cover-remove-failed";
      throw error;
    } finally {
      coverState.saving = false;
    }
  }

  return {
    cover: computed(() => coverState.cover),
    fullUrl: computed(() => coverState.cover?.fullUrl || null),
    thumbnailUrl: computed(() => coverState.cover?.thumbnailUrl || null),
    loading: computed(() => coverState.loading),
    saving: computed(() => coverState.saving),
    error: computed(() => coverState.error),
    loadedUserId: computed(() => coverState.loadedUserId),
    refresh,
    upload,
    remove,
    reset,
  };
}
