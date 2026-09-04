import type {
  AuthMeResponse,
  AuthProfileField,
  AuthProfileState,
  AuthScoreState,
  AuthSessionResponse,
  AuthUser,
  CompleteAuthProfileInput,
  CompleteAuthProfileResponse,
  IdentifyAuthResponse,
} from "~/types/auth";
import type {
  AuthGrantedPermission,
  AuthPermission,
} from "~/config/authorization";

const AUTH_TOKEN_STORAGE_KEY = "prompt-draft:auth:token:v1";
const AUTH_PROFILE_FIELDS: AuthProfileField[] = ["username", "email"];

const authState = reactive({
  initialized: false,
  loading: false,
  token: null as string | null,
  user: null as AuthUser | null,
  profile: null as AuthProfileState | null,
  score: null as AuthScoreState | null,
  permissions: [] as AuthGrantedPermission[],
});

let initializePromise: Promise<void> | null = null;

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

function deriveProfileState(user: AuthUser): AuthProfileState {
  const completedFields: AuthProfileField[] = [];

  if (user.username) completedFields.push("username");
  if (user.email) completedFields.push("email");

  return {
    supportedFields: [...AUTH_PROFILE_FIELDS],
    completedFields,
    missingFields: AUTH_PROFILE_FIELDS.filter(
      (field) => !completedFields.includes(field),
    ),
  };
}

function normalizeProfileState(
  user: AuthUser,
  profile?: AuthProfileState | null,
): AuthProfileState {
  if (
    profile &&
    Array.isArray(profile.supportedFields) &&
    Array.isArray(profile.completedFields) &&
    Array.isArray(profile.missingFields)
  ) {
    return profile;
  }

  return deriveProfileState(user);
}

function normalizeScoreState(score?: AuthScoreState | null): AuthScoreState | null {
  if (!score) return null;

  const totalXp = Number(score.totalXp);
  const eventCount = Number(score.eventCount);

  if (!Number.isFinite(totalXp) || !Number.isFinite(eventCount)) {
    return null;
  }

  return {
    totalXp,
    eventCount: Math.max(0, eventCount),
  };
}

export function useAuth() {
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  const isLoggedIn = computed(() => {
    return Boolean(authState.token && authState.user);
  });

  const role = computed(() => authState.user?.role ?? null);
  const missingProfileFields = computed(() => {
    if (authState.profile) return authState.profile.missingFields;
    if (authState.user) return deriveProfileState(authState.user).missingFields;
    return [];
  });
  const totalXp = computed(() => authState.score?.totalXp ?? 0);

  const isSuperAdmin = computed(() => role.value === "super_admin");
  const isAdmin = computed(() => {
    return role.value === "admin" || role.value === "super_admin";
  });

  function can(permission: AuthPermission) {
    return (
      authState.permissions.includes("*") ||
      authState.permissions.includes(permission)
    );
  }

  function canAny(permissions: AuthPermission[]) {
    return permissions.some((permission) => can(permission));
  }

  function canAll(permissions: AuthPermission[]) {
    return permissions.every((permission) => can(permission));
  }

  function hasProfileField(field: AuthProfileField) {
    if (authState.profile) {
      return authState.profile.completedFields.includes(field);
    }

    if (!authState.user) return false;
    return deriveProfileState(authState.user).completedFields.includes(field);
  }

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
    authState.profile = null;
    authState.score = null;
    authState.permissions = [];
  }

  function applyScoreState(score?: AuthScoreState | null) {
    const normalized = normalizeScoreState(score);
    if (normalized) {
      authState.score = normalized;
    }
  }

  function applyAuthorizationState(response: {
    user: AuthUser;
    profile?: AuthProfileState | null;
    score?: AuthScoreState | null;
    permissions: AuthGrantedPermission[];
  }) {
    authState.user = response.user;
    authState.profile = normalizeProfileState(response.user, response.profile);
    authState.score = normalizeScoreState(response.score);
    authState.permissions = [...response.permissions];
  }

  function authHeaders(token = authState.token) {
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }

  async function refreshAuthorizationState() {
    if (!import.meta.client) return null;

    const token = authState.token || readStoredToken();
    if (!token) return null;

    const response = await $fetch<AuthMeResponse>(endpoint("/api/auth/me"), {
      headers: authHeaders(token),
    });

    authState.token = token;
    applyAuthorizationState(response);
    authState.initialized = true;
    return response;
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
        await refreshAuthorizationState();
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
    applyAuthorizationState(response);
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

  async function completeProfile(input: CompleteAuthProfileInput) {
    const token = authState.token;

    if (!token) {
      throw new Error("Authentication required");
    }

    authState.loading = true;

    try {
      const response = await $fetch<CompleteAuthProfileResponse>(
        endpoint("/api/auth/profile/complete"),
        {
          method: "POST",
          headers: authHeaders(token),
          body: input,
        },
      );

      applyAuthorizationState(response);
      return response;
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
    profile: computed(() => authState.profile),
    score: computed(() => authState.score),
    totalXp,
    token: computed(() => authState.token),
    permissions: computed(() => authState.permissions),
    missingProfileFields,
    role,
    initialized: computed(() => authState.initialized),
    loading: computed(() => authState.loading),
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    can,
    canAny,
    canAll,
    hasProfileField,
    initialize,
    refreshAuthorizationState,
    applyScoreState,
    identify,
    login,
    register,
    completeProfile,
    logout,
    clearSession,
    authHeaders,
  };
}
