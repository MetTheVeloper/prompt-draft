import type {
  AuthMeResponse,
  AuthSessionResponse,
  AuthUser,
  IdentifyAuthResponse,
} from "~/types/auth";

const AUTH_TOKEN_STORAGE_KEY = "prompt-draft:auth:token:v1";

const authState = reactive({
  initialized: false,
  loading: false,
  token: null as string | null,
  user: null as AuthUser | null,
});

let initializePromise: Promise<void> | null = null;

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useAuth() {
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  const isLoggedIn = computed(() => {
    return Boolean(authState.token && authState.user);
  });

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function readStoredToken() {
    if (!import.meta.client) return null;
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
    return token || null;
  }

  function writeToken(token: string | null) {
    authState.token = token;

    if (!import.meta.client) return;

    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  }

  function clearSession() {
    writeToken(null);
    authState.user = null;
  }

  function authHeaders(token = authState.token) {
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }

  async function initialize(force = false) {
    if (!import.meta.client) return;
    if (authState.initialized && !force) return;
    if (initializePromise && !force) return initializePromise;

    initializePromise = (async () => {
      authState.loading = true;

      const token = readStoredToken();
      if (!token) {
        clearSession();
        authState.initialized = true;
        authState.loading = false;
        return;
      }

      authState.token = token;

      try {
        const response = await $fetch<AuthMeResponse>(endpoint("/api/auth/me"), {
          headers: authHeaders(token),
        });
        authState.user = response.user;
      } catch {
        clearSession();
      } finally {
        authState.initialized = true;
        authState.loading = false;
      }
    })();

    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  }

  function identify(identifier: string) {
    return $fetch<IdentifyAuthResponse>(endpoint("/api/auth/identify"), {
      method: "POST",
      body: { identifier },
    });
  }

  async function applySession(response: AuthSessionResponse) {
    writeToken(response.token);
    authState.user = response.user;
    authState.initialized = true;
    return response;
  }

  async function login(identifier: string, password: string) {
    authState.loading = true;

    try {
      const response = await $fetch<AuthSessionResponse>(endpoint("/api/auth/login"), {
        method: "POST",
        body: { identifier, password },
      });
      return await applySession(response);
    } finally {
      authState.loading = false;
    }
  }

  async function register(identifier: string, password: string) {
    authState.loading = true;

    try {
      const response = await $fetch<AuthSessionResponse>(endpoint("/api/auth/register"), {
        method: "POST",
        body: { identifier, password },
      });
      return await applySession(response);
    } finally {
      authState.loading = false;
    }
  }

  async function logout() {
    const token = authState.token;
    authState.loading = true;

    try {
      if (token) {
        await $fetch(endpoint("/api/auth/logout"), {
          method: "POST",
          headers: authHeaders(token),
        });
      }
    } catch (error) {
      console.warn("[Prompt Draft] sign out request failed; clearing local session", error);
    } finally {
      clearSession();
      authState.initialized = true;
      authState.loading = false;
    }
  }

  return {
    state: readonly(authState),
    user: computed(() => authState.user),
    token: computed(() => authState.token),
    initialized: computed(() => authState.initialized),
    loading: computed(() => authState.loading),
    isLoggedIn,
    initialize,
    identify,
    login,
    register,
    logout,
    clearSession,
    authHeaders,
  };
}
