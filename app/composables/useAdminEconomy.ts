import type {
  AdminEconomySettings,
  AdminEconomySettingsResponse,
  UpdateAdminEconomySettingsInput,
  UpdateAdminEconomySettingsResponse,
} from "~/types/economy";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  const value = error as {
    data?: { message?: unknown };
    response?: { _data?: { message?: unknown } };
  };

  const message = value?.data?.message ?? value?.response?._data?.message;
  return typeof message === "string" && message.trim() ? message.trim() : fallback;
}

export function useAdminEconomy() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  const settings = ref<AdminEconomySettings | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const loadError = ref("");
  const saveError = ref("");
  const lastSaveChanged = ref<boolean | null>(null);

  const endpoint = `${apiBase}/api/admin/economy/settings`;

  async function load() {
    if (!import.meta.client) return null;

    loading.value = true;
    loadError.value = "";

    try {
      const response = await $fetch<AdminEconomySettingsResponse>(endpoint, {
        headers: auth.authHeaders(),
      });

      settings.value = response.settings;
      return response.settings;
    } catch (error) {
      loadError.value = normalizeErrorMessage(
        error,
        "Failed to load economy settings",
      );
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function save(input: UpdateAdminEconomySettingsInput) {
    if (!import.meta.client || saving.value) return null;

    saving.value = true;
    saveError.value = "";
    lastSaveChanged.value = null;

    try {
      const response = await $fetch<UpdateAdminEconomySettingsResponse>(endpoint, {
        method: "PUT",
        headers: auth.authHeaders(),
        body: input,
      });

      settings.value = response.settings;
      lastSaveChanged.value = response.changed;
      return response;
    } catch (error) {
      saveError.value = normalizeErrorMessage(
        error,
        "Failed to update economy settings",
      );
      return null;
    } finally {
      saving.value = false;
    }
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    saving: readonly(saving),
    loadError: readonly(loadError),
    saveError: readonly(saveError),
    lastSaveChanged: readonly(lastSaveChanged),
    load,
    save,
  };
}
