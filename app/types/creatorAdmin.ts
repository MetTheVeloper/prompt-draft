import type { AuthUserRole, AuthUserStatus } from "~/types/auth";
import type {
  CreatorAccountStatus,
  CreatorReadiness,
  LocalizedProfileText,
  ProfileLink,
} from "~/types/profileManagement";

export type CreatorReviewStatus = Exclude<CreatorAccountStatus, "none">;
export type CreatorAdminAction = "approve" | "reject" | "suspend" | "unsuspend";

export type CreatorAdminSummary = {
  id: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: AuthUserRole;
  accountStatus: AuthUserStatus;
  creatorStatus: CreatorReviewStatus;
  createdAt: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  creatorUpdatedAt: string | null;
};

export type CreatorAdminListParams = {
  limit?: number;
  cursor?: string;
  query?: string;
  status?: CreatorReviewStatus;
};

export type CreatorAdminListResponse = {
  ok: true;
  creators: CreatorAdminSummary[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type CreatorReviewSkill = {
  slug: string;
  categorySlug: string;
  title: { en: string; fa: string };
  categoryTitle: { en: string; fa: string };
  active: boolean;
};

export type CreatorAdminReview = {
  account: {
    id: string;
    username: string | null;
    email: string | null;
    role: AuthUserRole;
    status: AuthUserStatus;
    createdAt: string | null;
  };
  profile: {
    screenName: LocalizedProfileText;
    bio: LocalizedProfileText;
    article: LocalizedProfileText;
    birthday: string | null;
    location: { text: string } | null;
    skills: CreatorReviewSkill[];
    links: ProfileLink[];
  };
  creator: {
    status: CreatorReviewStatus;
    requestedAt: string | null;
    reviewedAt: string | null;
    reviewedByUserId: string | null;
    reviewNote: string | null;
    approvedAt: string | null;
    suspendedAt: string | null;
  };
  readiness: CreatorReadiness;
};

export type CreatorAdminReviewResponse = {
  ok: true;
  review: CreatorAdminReview;
};

export type CreatorAdminEvent = {
  id: string;
  actorUserId: string | null;
  eventType: "requested" | "approved" | "rejected" | "suspended" | "unsuspended" | "reapplied";
  metadata: Record<string, unknown>;
  createdAt: string | null;
};

export type CreatorAdminEventsResponse = {
  ok: true;
  events: CreatorAdminEvent[];
};
