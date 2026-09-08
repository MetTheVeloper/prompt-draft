import type {
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

  return { load, save };
}
