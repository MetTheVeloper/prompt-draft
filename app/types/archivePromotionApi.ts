import type { PromptDraftState } from "~/modules/promptDraft.types";

export type ArchivePromotionSourceImage = {
  id: string;
  url: string;
  position: number;
  width: number;
  height: number;
  sizeBytes: number;
};

export type ArchivePromotionSourceDraft = {
  userId: string;
  id: string;
  title: string;
  snapshot: PromptDraftState;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ArchivePromotionSourceImage[];
};

export type GetArchivePromotionSourceResponse = {
  ok: true;
  draft: ArchivePromotionSourceDraft;
};

export type PromoteDraftToArchiveInput = {
  sourceUserId: string;
  sourceDraftId: string;
  title: {
    en: string;
    fa: string;
  };
  telegramMessageId: number | null;
  prompt: string;
};

export type PromoteDraftToArchiveResponse = {
  ok: true;
  item: {
    id: string;
    publicId: number;
    telegramMessageId: number | null;
    sourceKind: "user_draft";
    sourceUserId: string;
    sourceDraftId: string;
    status: "draft";
  };
};

export type ModerateDeleteDraftResponse = {
  ok: true;
  draft: {
    id: string;
    userId: string;
    deletedAt: string;
  };
};
