export type TranslationSource = "auto" | "fa" | "en";
export type TranslationTarget = "en" | "fa";

export type TranslationDetectedLanguage = {
  confidence?: number;
  language?: string;
} | null;

export type TranslationLanguage = {
  code: string;
  name: string;
};

export type TranslationStatusResponse = {
  ok: true;
  available: boolean;
  languages: TranslationLanguage[];
};

export type TranslatePromptInput = {
  text: string;
  source?: TranslationSource;
  target?: TranslationTarget;
  alternatives?: number;
};

export type TranslatePromptResponse = {
  ok: true;
  translatedText: string;
  alternatives: string[];
  detectedLanguage: TranslationDetectedLanguage;
};
