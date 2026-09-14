import type {
  AdminCampaignDefinition,
  AdminCampaignDetail,
  AdminCampaignDetailResponse,
  AdminCampaignDraftResponse,
  AdminCampaignLifecycleAction,
  AdminCampaignListItem,
  AdminCampaignListResponse,
  AdminCampaignPublishResponse,
  AdminCampaignStatus,
  AdminCampaignValidationResponse,
  CreateAdminCampaignInput,
} from "~/types/adminCampaignApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

type ApiErrorPayload = {
  code?: unknown;
  message?: unknown;
  currentRevision?: unknown;
};

function getApiErrorPayload(error: unknown): ApiErrorPayload {
  const value = error as {
    data?: ApiErrorPayload;
    response?: { _data?: ApiErrorPayload };
  };
  return value?.data ?? value?.response?._data ?? {};
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  const payload = getApiErrorPayload(error);
  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message.trim()
    : fallback;
}

export function useAdminCampaigns() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);
  const endpoint = `${apiBase}/api/admin/campaigns`;

  const campaigns = ref<AdminCampaignListItem[]>([]);
  const selected = ref<AdminCampaignDetail | null>(null);
  const nextCursor = ref<string | null>(null);
  const hasMore = ref(false);
  const loading = ref(false);
  const loadingDetail = ref(false);
  const mutating = ref(false);
  const error = ref("");
  const errorCode = ref("");
  const conflictRevision = ref<number | null>(null);

  function clearError() {
    error.value = "";
    errorCode.value = "";
    conflictRevision.value = null;
  }

  function captureError(value: unknown, fallback: string) {
    const payload = getApiErrorPayload(value);
    error.value = normalizeErrorMessage(value, fallback);
    errorCode.value = typeof payload.code === "string" ? payload.code : "";
    conflictRevision.value = Number.isSafeInteger(payload.currentRevision)
      ? Number(payload.currentRevision)
      : null;
  }

  async function list(options: {
    status?: AdminCampaignStatus | "";
    append?: boolean;
  } = {}) {
    if (!import.meta.client || loading.value) return null;

    loading.value = true;
    clearError();

    try {
      const query: Record<string, string | number> = { limit: 30 };
      if (options.status) query.status = options.status;
      if (options.append && nextCursor.value) query.cursor = nextCursor.value;

      const response = await $fetch<AdminCampaignListResponse>(endpoint, {
        headers: auth.authHeaders(),
        query,
      });

      campaigns.value = options.append
        ? [...campaigns.value, ...response.campaigns]
        : response.campaigns;
      nextCursor.value = response.pageInfo.nextCursor;
      hasMore.value = response.pageInfo.hasMore;
      return response;
    } catch (value) {
      captureError(value, "Failed to load Campaigns");
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string) {
    if (!import.meta.client || loadingDetail.value) return null;

    loadingDetail.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignDetailResponse>(`${endpoint}/${id}`, {
        headers: auth.authHeaders(),
      });
      selected.value = response.campaign;
      return response.campaign;
    } catch (value) {
      captureError(value, "Failed to load Campaign");
      return null;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function create(input: CreateAdminCampaignInput) {
    if (!import.meta.client || mutating.value) return null;

    mutating.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignDetailResponse>(endpoint, {
        method: "POST",
        headers: auth.authHeaders(),
        body: input,
      });
      selected.value = response.campaign;
      return response.campaign;
    } catch (value) {
      captureError(value, "Failed to create Campaign");
      return null;
    } finally {
      mutating.value = false;
    }
  }

  async function saveDraft(id: string, expectedRevision: number, definition: AdminCampaignDefinition) {
    if (!import.meta.client || mutating.value) return null;

    mutating.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignDraftResponse>(`${endpoint}/${id}/draft`, {
        method: "PUT",
        headers: auth.authHeaders(),
        body: {
          expectedRevision,
          definition,
        },
      });

      if (selected.value?.id === id) {
        selected.value = {
          ...selected.value,
          draftDefinition: definition,
          draftRevision: response.draftRevision,
          validation: response.validation,
        };
      }
      return response;
    } catch (value) {
      captureError(value, "Failed to save Campaign draft");
      return null;
    } finally {
      mutating.value = false;
    }
  }

  async function validate(id: string, expectedRevision: number) {
    if (!import.meta.client || mutating.value) return null;

    mutating.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignValidationResponse>(`${endpoint}/${id}/validate`, {
        method: "POST",
        headers: auth.authHeaders(),
        body: { expectedRevision },
      });
      if (selected.value?.id === id) {
        selected.value = { ...selected.value, validation: response };
      }
      return response;
    } catch (value) {
      captureError(value, "Failed to validate Campaign draft");
      return null;
    } finally {
      mutating.value = false;
    }
  }

  async function publish(id: string, expectedDraftRevision: number) {
    if (!import.meta.client || mutating.value) return null;

    mutating.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignPublishResponse>(`${endpoint}/${id}/publish`, {
        method: "POST",
        headers: auth.authHeaders(),
        body: {
          expectedDraftRevision,
          idempotencyKey: crypto.randomUUID(),
        },
      });
      await get(id);
      return response;
    } catch (value) {
      captureError(value, "Failed to publish Campaign");
      return null;
    } finally {
      mutating.value = false;
    }
  }

  async function lifecycle(id: string, action: AdminCampaignLifecycleAction) {
    if (!import.meta.client || mutating.value) return null;

    mutating.value = true;
    clearError();

    try {
      const response = await $fetch<AdminCampaignDetailResponse>(`${endpoint}/${id}/${action}`, {
        method: "POST",
        headers: auth.authHeaders(),
      });
      selected.value = response.campaign;
      return response.campaign;
    } catch (value) {
      captureError(value, `Failed to ${action} Campaign`);
      return null;
    } finally {
      mutating.value = false;
    }
  }

  function clearSelected() {
    selected.value = null;
    clearError();
  }

  return {
    campaigns: readonly(campaigns),
    selected: readonly(selected),
    nextCursor: readonly(nextCursor),
    hasMore: readonly(hasMore),
    loading: readonly(loading),
    loadingDetail: readonly(loadingDetail),
    mutating: readonly(mutating),
    error: readonly(error),
    errorCode: readonly(errorCode),
    conflictRevision: readonly(conflictRevision),
    list,
    get,
    create,
    saveDraft,
    validate,
    publish,
    lifecycle,
    clearSelected,
    clearError,
  };
}
