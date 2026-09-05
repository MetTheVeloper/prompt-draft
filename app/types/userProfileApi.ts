export type UserDraftVisibility = "private" | "public";

export type UserProfileCover = {
  fullUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

export type PublicUserProfile = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  cover: UserProfileCover | null;
  createdAt: string;
  totalXp: number;
  publicDraftCount: number;
  totalDraftCount?: number;
};

export type UserProfileViewer = {
  isOwner: boolean;
};

export type ResolveUserProfileResponse = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

export type GetUserProfileResponse = {
  ok: true;
  profile: PublicUserProfile;
  viewer: UserProfileViewer;
};

export type UserDraftPreviewImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  position: number;
  createdAt: string;
};

export type UserProfileDraftSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  outputFormat: "modular" | "natural" | "json";
  moduleCount: number;
  publishedAt: string | null;
  images: UserDraftPreviewImage[];
  visibility?: UserDraftVisibility;
};

export type ListUserProfileDraftsParams = {
  limit?: number;
  cursor?: string;
};

export type ListUserProfileDraftsResponse = {
  ok: true;
  drafts: UserProfileDraftSummary[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  viewer: UserProfileViewer;
};

export type UpdateDraftVisibilityResponse = {
  ok: true;
  draft: {
    id: string;
    visibility: UserDraftVisibility;
    publishedAt: string | null;
  };
};

export type UpdateDraftImagesResponse = {
  ok: true;
  images: UserDraftPreviewImage[];
};
