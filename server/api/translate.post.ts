// server/api/translate.post.ts

type TranslateRequestBody = {
  text?: string;
  source?: "fa" | "auto";
  target?: "en";
  alternatives?: number;
};

type LibreTranslateResponse = {
  translatedText?: string;
  alternatives?: string[];
  detectedLanguage?: {
    confidence?: number;
    language?: string;
  };
};

export default defineEventHandler(async (event) => {
  const body = await readBody<TranslateRequestBody>(event);

  const text = body.text?.trim();

  if (!text) {
    return {
      translatedText: "",
      alternatives: [],
      detectedLanguage: null,
    };
  }

  const alternatives = Math.min(Math.max(Number(body.alternatives ?? 3), 0), 5);

  try {
    const result = await $fetch<LibreTranslateResponse>(
      "http://127.0.0.1:5000/translate",
      {
        method: "POST",
        body: {
          q: text,
          source: body.source ?? "fa",
          target: body.target ?? "en",
          format: "text",
          alternatives,
        },
      }
    );

    return {
      translatedText: result.translatedText || "",
      alternatives: result.alternatives || [],
      detectedLanguage: result.detectedLanguage || null,
    };
  } catch (error) {
    console.error("LibreTranslate error:", error);

    throw createError({
      statusCode: 503,
      statusMessage: "Translation service is not available",
    });
  }
});