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
  const profile = useState<ProfileManagementResponse | null>(
    "profile-management:owner",
    () => null,
  );

  function endpoint() {
    return `${apiBase}/api/profile`;
  }

  function creatorRequestEndpoint() {
    return `${apiBase}/api/creator-account/request`;
  }

  async function load() {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    const response = await $fetch<ProfileManagementResponse>(endpoint(), {
      method: "GET",
      headers: auth.authHeaders(),
    });
    profile.value = response;
    return response;
  }

  async function save(input: ProfileManagementInput) {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    const response = await $fetch<ProfileManagementResponse>(endpoint(), {
      method: "PUT",
      headers: auth.authHeaders(),
      body: input,
    });

    profile.value = response;
    await auth.refreshAuthorizationState();
    return response;
  }

  async function requestCreator() {
    await auth.initialize();
    if (!auth.token.value) throw new Error("Authentication required");

    const response = await $fetch<CreatorApplicationResponse>(creatorRequestEndpoint(), {
      method: "POST",
      headers: auth.authHeaders(),
    });

    if (profile.value) {
      profile.value = {
        ...profile.value,
        creator: {
          ...profile.value.creator,
          status: response.creator.status,
          readiness: response.creator.readiness,
        },
      };
    }

    return response;
  }

  return { profile, load, save, requestCreator };
}
