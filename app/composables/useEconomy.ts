import type { EconomyState, EconomyStateResponse } from "~/types/economy";

const economyState = reactive({
  userId: null as string | null,
  economy: null as EconomyState | null,
  loading: false,
  error: "",
});

let refreshPromise: Promise<EconomyState | null> | null = null;

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function useEconomy() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function reset() {
    economyState.userId = null;
    economyState.economy = null;
    economyState.loading = false;
    economyState.error = "";
    refreshPromise = null;
  }

  function ensureAccountBoundary() {
    const userId = auth.user.value?.id ?? null;

    if (!userId) {
      reset();
      return null;
    }

    if (economyState.userId !== userId) {
      economyState.userId = userId;
      economyState.economy = null;
      economyState.error = "";
      refreshPromise = null;
    }

    return userId;
  }

  function applyEconomy(value: EconomyState | null) {
    const userId = ensureAccountBoundary();
    if (!userId || !value) return;

    economyState.economy = value;
    economyState.error = "";
  }

  async function refresh(force = false) {
    if (!import.meta.client) return null;

    await auth.initialize();
    const userId = ensureAccountBoundary();
    if (!userId || !auth.isLoggedIn.value) return null;

    if (refreshPromise && !force) return refreshPromise;

    refreshPromise = (async () => {
      economyState.loading = true;
      economyState.error = "";

      try {
        const response = await $fetch<EconomyStateResponse>(
          `${apiBase}/api/economy`,
          {
            headers: auth.authHeaders(),
          },
        );

        if (auth.user.value?.id === userId) {
          economyState.economy = response.economy;
        }

        return response.economy;
      } catch (error) {
        if (auth.user.value?.id === userId) {
          const value = error as { data?: { message?: unknown } };
          economyState.error =
            typeof value?.data?.message === "string" && value.data.message.trim()
              ? value.data.message
              : "Failed to load Goin balance";
        }

        return null;
      } finally {
        if (auth.user.value?.id === userId) {
          economyState.loading = false;
        }
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  return {
    state: readonly(economyState),
    economy: computed(() => economyState.economy),
    balance: computed(() => economyState.economy?.balance ?? 0),
    lifetimeIssued: computed(() => economyState.economy?.lifetimeIssued ?? 0),
    lifetimeSpent: computed(() => economyState.economy?.lifetimeSpent ?? 0),
    transactionCount: computed(() => economyState.economy?.transactionCount ?? 0),
    unit: computed(() => economyState.economy?.unit ?? null),
    loading: computed(() => economyState.loading),
    error: computed(() => economyState.error),
    refresh,
    applyEconomy,
    reset,
  };
}
