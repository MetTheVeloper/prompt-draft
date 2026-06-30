import { readonly, ref } from "vue";

export type PromptTranslationSource = "auto" | "fa" | "en";
export type PromptTranslationTarget = "en" | "fa";

export type PromptTranslationApiResponse = {
  translatedText?: string;
  alternatives?: string[];
  detectedLanguage?: {
    confidence?: number;
    language?: string;
  } | null;
};

export type ProtectedPromptVariableToken = {
  token: string;
  placeholder: string;
};

export type PromptTranslationOptions = {
  text: string;
  source?: PromptTranslationSource;
  target?: PromptTranslationTarget;
  alternatives?: number;
  protectVariables?: boolean;
};

export type PromptTranslationResult = {
  sourceText: string;
  requestText: string;
  translatedText: string;
  alternatives: string[];
  options: string[];
  detectedLanguage: PromptTranslationApiResponse["detectedLanguage"];
  protectedTokens: ProtectedPromptVariableToken[];
  raw: PromptTranslationApiResponse | null;
};

const VARIABLE_TOKEN_PATTERN = /\{[a-zA-Z][a-zA-Z0-9_]*\}/g;

function clampAlternatives(value: number | undefined) {
  if (!Number.isFinite(value)) return 3;

  return Math.min(Math.max(Number(value), 0), 5);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createEmptyTranslationResult(text = ""): PromptTranslationResult {
  return {
    sourceText: text,
    requestText: text,
    translatedText: "",
    alternatives: [],
    options: [],
    detectedLanguage: null,
    protectedTokens: [],
    raw: null,
  };
}

function normalizeTranslationOptions(
  translatedText: string,
  alternatives: string[] = []
) {
  return Array.from(
    new Set(
      [translatedText, ...alternatives]
        .map((item) => item?.trim())
        .filter(Boolean)
    )
  );
}

function createVariablePlaceholder(index: number) {
  return `PDVAR${index}TOKEN`;
}

function protectVariableTokens(text: string) {
  const protectedTokens: ProtectedPromptVariableToken[] = [];

  const requestText = text.replace(VARIABLE_TOKEN_PATTERN, (token) => {
    const existingToken = protectedTokens.find((item) => item.token === token);

    if (existingToken) {
      return existingToken.placeholder;
    }

    const placeholder = createVariablePlaceholder(protectedTokens.length);

    protectedTokens.push({
      token,
      placeholder,
    });

    return placeholder;
  });

  return {
    requestText,
    protectedTokens,
  };
}

function restoreProtectedTokens(
  text: string,
  protectedTokens: ProtectedPromptVariableToken[]
) {
  if (!text || !protectedTokens.length) return text || "";

  return protectedTokens.reduce((output, item, index) => {
    const exactPattern = new RegExp(escapeRegExp(item.placeholder), "g");

    const loosePattern = new RegExp(
      `(?:[_\\-−–—@#\\s]*)PD\\s*VAR\\s*${index}\\s*(?:TOKEN)?(?:[_\\-−–—@#\\s]*)`,
      "gi"
    );

    return output
      .replace(exactPattern, item.token)
      .replace(loosePattern, item.token);
  }, text);
}

export function usePromptTranslation() {
  const isTranslating = ref(false);
  const translationError = ref<unknown>(null);
  const lastTranslation = ref<PromptTranslationResult | null>(null);

  async function translateText(
    options: PromptTranslationOptions
  ): Promise<PromptTranslationResult> {
    const sourceText = options.text?.trim() || "";

    if (!sourceText) {
      const emptyResult = createEmptyTranslationResult(sourceText);
      lastTranslation.value = emptyResult;

      return emptyResult;
    }

    const shouldProtectVariables = options.protectVariables !== false;

    const protectedPayload = shouldProtectVariables
      ? protectVariableTokens(sourceText)
      : {
        requestText: sourceText,
        protectedTokens: [],
      };

    isTranslating.value = true;
    translationError.value = null;

    try {
      const raw = await $fetch<PromptTranslationApiResponse>("/api/translate", {
        method: "POST",
        body: {
          text: protectedPayload.requestText,
          source: options.source ?? "auto",
          target: options.target ?? "en",
          alternatives: clampAlternatives(options.alternatives),
        },
      });

      const translatedText = restoreProtectedTokens(
        raw.translatedText || "",
        protectedPayload.protectedTokens
      );

      const alternatives = (raw.alternatives || []).map((item) => {
        return restoreProtectedTokens(item, protectedPayload.protectedTokens);
      });

      const result: PromptTranslationResult = {
        sourceText,
        requestText: protectedPayload.requestText,
        translatedText,
        alternatives,
        options: normalizeTranslationOptions(translatedText, alternatives),
        detectedLanguage: raw.detectedLanguage || null,
        protectedTokens: protectedPayload.protectedTokens,
        raw,
      };

      lastTranslation.value = result;

      return result;
    } catch (error) {
      translationError.value = error;

      throw error;
    } finally {
      isTranslating.value = false;
    }
  }

  function clearTranslationState() {
    isTranslating.value = false;
    translationError.value = null;
    lastTranslation.value = null;
  }

  return {
    isTranslating: readonly(isTranslating),
    translationError: readonly(translationError),
    lastTranslation: readonly(lastTranslation),

    translateText,
    clearTranslationState,

    protectVariableTokens,
    restoreProtectedTokens,
    normalizeTranslationOptions,
  };
}