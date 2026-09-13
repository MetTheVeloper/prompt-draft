export type TelegramPublicationSourceType = "manual" | "prompt_archive" | "campaign";
export type TelegramPublicationStatus =
  | "created"
  | "publishing"
  | "published"
  | "failed"
  | "delivery_unknown";

export type TelegramPublicationSource = {
  type: TelegramPublicationSourceType;
  id?: string | null;
  version?: string | null;
};

export type TelegramPostMediaInput = {
  type: "photo";
  url: string;
};

export type TelegramPostCtaInput = {
  label: string;
  startParam: string;
};

export type TelegramPostCta = TelegramPostCtaInput & {
  url: string;
};

export type TelegramPublicationInput = {
  idempotencyKey: string;
  source?: TelegramPublicationSource;
  post: {
    caption: string;
    media?: TelegramPostMediaInput[];
    ctas: TelegramPostCtaInput[];
    multiMediaCtaText?: string | null;
  };
};

export type TelegramPublicationPayload = {
  source: {
    type: TelegramPublicationSourceType;
    id: string | null;
    version: string | null;
  };
  destinationChatId: string;
  post: {
    caption: string;
    media: TelegramPostMediaInput[];
    ctas: TelegramPostCta[];
    multiMediaCtaText: string | null;
  };
};

export type TelegramPublication = {
  id: string;
  idempotencyKey: string;
  source: {
    type: TelegramPublicationSourceType;
    id: string | null;
    version: string | null;
  };
  destinationChatId: string;
  payload: TelegramPublicationPayload;
  payloadHash: string;
  status: TelegramPublicationStatus;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastAttemptAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminTelegramConfig = {
  configured: boolean;
  destinationChatId: string | null;
  botUsername: string | null;
  miniAppShortName: string | null;
  maxMedia: number;
  maxCtas: number;
};

export type AdminTelegramConfigResponse = {
  ok: true;
  telegram: AdminTelegramConfig;
};

export type AdminTelegramPublicationsResponse = {
  ok: true;
  publications: TelegramPublication[];
};

export type AdminTelegramPublishResponse = {
  ok: true;
  duplicate: boolean;
  publication: TelegramPublication;
};

export type AdminTelegramRetryResponse = {
  ok: true;
  publication: TelegramPublication;
};
