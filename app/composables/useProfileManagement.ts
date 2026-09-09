import type {
  CreatorApplicationResponse,
  ProfileManagementInput,
  ProfileManagementResponse,
} from "~/types/profileManagement";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useProfileManagement() {
  const auth = useAuth();
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint() {
    return `${apiBase}/api/profile`;
  }

  function creatorRequestEndpoint() {
    return `${apiBase}/api/creator-account/request`;
  }

  async function load() {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    return $fetch<ProfileManagementResponse>(endpoint(), {
      method: "GET",
      headers: auth.authHeaders(),
    });
  }

  async function save(input: ProfileManagementInput) {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    const response = await $fetch<ProfileManagementResponse>(endpoint(), {
      method: "PUT",
      headers: auth.authHeaders(),
      body: input,
    });

    await auth.refreshAuthorizationState();
    return response;
  }

  async function requestCreator() {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    return $fetch<CreatorApplicationResponse>(creatorRequestEndpoint(), {
      method: "POST",
      headers: auth.authHeaders(),
    });
  }

  return { load, save, requestCreator };
}
