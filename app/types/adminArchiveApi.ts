import type {
  PromptArchiveLocalizedTitle,
  PromptArchiveModel,
  PromptArchiveVariant,
} from "~/types/promptArchive";

export type AdminArchiveStatus = "draft" | "published" | "archived";
export type AdminArchiveSourceKind = "managed" | "legacy_json";

export type AdminArchiveSummary = {
  id: string;
  telegramMessageId: number;
  title: PromptArchiveLocalizedTitle;
  publishedAt: string;
  telegramUrl: string;
  previewModel: PromptArchiveModel;
  optimizedFor: PromptArchiveModel[];
  tags: string[];
  status: AdminArchiveStatus;
  sourceKind: AdminArchiveSourceKind;
  imageCount: number;
  updatedAt: string;
};

export type AdminArchiveImage = {
  id: string;
  position: number;
  sourcePath: string | null;
  storageKey: string | null;
  fullUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  mimeType: string | null;
  sizeBytes: number | null;
  thumbnailSizeBytes: number | null;
};

export type AdminArchiveItem = AdminArchiveSummary & {
  channel: string;
  sourceTitle: string;
  prompt: string;
  variants: PromptArchiveVariant[];
  images: AdminArchiveImage[];
  createdAt: string;
};

export type AdminArchiveUpsertInput = {
  telegramMessageId: number;
  title: PromptArchiveLocalizedTitle;
  sourceTitle?: string | null;
  publishedAt: string;
  prompt: string;
  previewModel: PromptArchiveModel;
  optimizedFor: PromptArchiveModel[];
  tags: string[];
};

export type AdminArchiveImageUploadInput = {
  sourceName?: string;
  full: {
    base64: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
  thumbnail: {
    base64: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
};

export type AdminArchiveImageMutationResponse = {
  ok: true;
  image?: {
    id: string;
    fullUrl: string;
    thumbnailUrl: string;
    telegramMessageId: number;
  };
  cleanupFailures?: string[];
};

export type AdminArchiveImageOrderInput = {
  imageIds: string[];
};

export type ListAdminArchiveParams = {
  limit?: number;
  cursor?: string;
  query?: string;
  status?: AdminArchiveStatus;
  model?: PromptArchiveModel;
};

export type ListAdminArchiveResponse = {
  ok: true;
  items: AdminArchiveSummary[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type GetAdminArchiveResponse = {
  ok: true;
  item: AdminArchiveItem;
};

export type AdminArchiveMutationResponse = GetAdminArchiveResponse;

export type AdminArchiveTagsResponse = {
  ok: true;
  tags: string[];
};
