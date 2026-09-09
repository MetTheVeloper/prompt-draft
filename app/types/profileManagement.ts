export type CreatorAccountStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export type LocalizedProfileText = {
  en: string | null;
  fa: string | null;
};

export type ProfileLocation = {
  text: string;
  source: "custom" | "suggestion";
  providerPlaceId: string | null;
  countryCode: string | null;
};

export type ProfileLinkType =
  | "website"
  | "github"
  | "linkedin"
  | "instagram"
  | "telegram"
  | "x"
  | "youtube"
  | "other";

export type ProfileLink = {
  id?: string;
  type: ProfileLinkType;
  url: string;
  label: string | null;
  position?: number;
};

export type ProfileSkillCategory = {
  slug: string;
  title: { en: string; fa: string };
  sortOrder: number;
};

export type ProfileSkill = {
  slug: string;
  categorySlug: string;
  title: { en: string; fa: string };
  sortOrder: number;
};

export type CreatorReadiness = {
  ready: boolean;
  missingFields: string[];
  invalidFields: string[];
  errors: Array<{ field: string; message: string }>;
  normalizedUsername: string | null;
  activeSkillSlugs: string[];
  signals: Record<string, boolean>;
};

export type ProfileManagementResponse = {
  ok: true;
  account: {
    username: string | null;
    email: string | null;
  };
  profile: {
    screenName: LocalizedProfileText;
    bio: LocalizedProfileText;
    article: LocalizedProfileText;
    birthday: string | null;
    skills: string[];
    links: ProfileLink[];
    location: ProfileLocation | null;
  };
  creator: {
    status: CreatorAccountStatus;
    readiness: CreatorReadiness;
    usernameChangeRequiresAlias: boolean;
  };
  taxonomy: {
    categories: ProfileSkillCategory[];
    skills: ProfileSkill[];
  };
};

export type ProfileManagementInput = {
  account: {
    username: string | null;
    email: string | null;
  };
  profile: {
    screenName: LocalizedProfileText;
    bio: LocalizedProfileText;
    article: LocalizedProfileText;
    birthday: string | null;
    skills: string[];
    links: Array<{
      type: ProfileLinkType;
      url: string;
      label: string | null;
    }>;
    location: ProfileLocation | null;
  };
};

export type CreatorApplicationResponse = {
  ok: true;
  creator: {
    status: "pending";
    readiness: CreatorReadiness;
    requestedAt: string | null;
    idempotent: boolean;
  };
};
