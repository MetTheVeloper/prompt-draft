import type {
  ApiHelloResponse,
  CreateWizardRunInput,
  CreateWizardRunResponse,
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

  function listWizardRuns() {
    return $fetch<ListWizardRunsResponse>(endpoint("/api/wizard-runs"));
  }

  return {
    apiBase,
    hello,
    createWizardRun,
    listWizardRuns,
  };
}
