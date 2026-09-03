import type {
  ApiHelloResponse,
  CreateWizardRunInput,
  CreateWizardRunResponse,
  GetWizardRunResponse,
  ListWizardRunsParams,
  ListWizardRunsResponse,
} from "~/types/wizardRunApi";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

export function usePromptDraftApi() {
  const config = useRuntimeConfig();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  function hello() {
    return $fetch<ApiHelloResponse>(endpoint("/api/hello"));
  }

  function createWizardRun(input: CreateWizardRunInput) {
    return $fetch<CreateWizardRunResponse>(endpoint("/api/wizard-runs"), {
      method: "POST",
      body: input,
    });
  }

  function listWizardRuns(params: ListWizardRunsParams = {}) {
    const query = new URLSearchParams();

    if (params.limit !== undefined) {
      query.set("limit", String(params.limit));
    }

    if (params.cursor !== undefined) {
      query.set("cursor", params.cursor);
    }

    if (params.wizardId !== undefined) {
      query.set("wizardId", params.wizardId);
    }

    const queryString = query.toString();
    const path = queryString
      ? `/api/wizard-runs?${queryString}`
      : "/api/wizard-runs";

    return $fetch<ListWizardRunsResponse>(endpoint(path));
  }

  function getWizardRun(id: string) {
    return $fetch<GetWizardRunResponse>(
      endpoint(`/api/wizard-runs/${encodeURIComponent(id)}`),
    );
  }

  return {
    apiBase,
    hello,
    createWizardRun,
    listWizardRuns,
    getWizardRun,
  };
}
