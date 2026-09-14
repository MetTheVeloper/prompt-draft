export type AdminCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "archived";

export type AdminCampaignDefinition = Record<string, unknown>;

export type AdminCampaignValidationIssue = {
  path?: string;
  field?: string;
  code?: string;
  message: string;
};

export type AdminCampaignValidation = {
  publishable: boolean;
  errors: AdminCampaignValidationIssue[];
  warnings: AdminCampaignValidationIssue[];
};

export type AdminCampaignListItem = {
  id: string;
  slug: string;
  internalName: string;
  status: AdminCampaignStatus;
  currentVersion: number | null;
  draftRevision: number;
  startsAt: string | null;
  endsAt: string | null;
  participants: number;
  completed: number;
  goinGranted: number;
  rewardBudgetRemaining: number | null;
  updatedAt: string;
};

export type AdminCampaignPublishedVersion = {
  id: string;
  version: number;
  schemaVersion: string;
  definition: AdminCampaignDefinition;
  definitionHash: string;
  publishedAt: string;
};

export type AdminCampaignDetail = {
  id: string;
  slug: string;
  internalName: string;
  status: AdminCampaignStatus;
  draftDefinition: AdminCampaignDefinition;
  draftRevision: number;
  validation: AdminCampaignValidation;
  publishedVersion: AdminCampaignPublishedVersion | null;
  lifecycleOverrides: {
    pausedAt: string | null;
    manuallyEndedAt: string | null;
    archivedAt: string | null;
  };
  summary: {
    participants: number;
    completed: number;
    qualified: number;
    rewarded: number;
    goinGranted: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminCampaignPageInfo = {
  hasMore: boolean;
  nextCursor: string | null;
};

export type AdminCampaignListResponse = {
  ok: true;
  campaigns: AdminCampaignListItem[];
  pageInfo: AdminCampaignPageInfo;
};

export type AdminCampaignDetailResponse = {
  ok: true;
  campaign: AdminCampaignDetail;
};

export type AdminCampaignDraftResponse = {
  ok: true;
  changed: boolean;
  draftRevision: number;
  validation: AdminCampaignValidation;
};

export type AdminCampaignValidationResponse = AdminCampaignValidation & {
  ok: true;
};

export type AdminCampaignPublishResponse = {
  ok: true;
  published: true;
  duplicate: boolean;
  campaign: {
    id: string;
    slug: string;
    version: number;
    status: AdminCampaignStatus;
  };
};

export type CreateAdminCampaignInput = {
  slug: string;
  internalName: string;
  definition?: AdminCampaignDefinition;
};

export type SaveAdminCampaignDraftInput = {
  expectedRevision: number;
  definition: AdminCampaignDefinition;
};

export type PublishAdminCampaignInput = {
  expectedDraftRevision: number;
  idempotencyKey: string;
};

export type AdminCampaignLifecycleAction =
  | "pause"
  | "resume"
  | "end"
  | "archive";
