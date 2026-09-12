export type AdminGrowthWindowDays = 7 | 30;

export type AdminGrowthSummary = {
  audience: {
    trackedVisitors: number;
    trackedSessions: number;
    trackedAuthenticatedUsers: number;
    returningAuthenticatedUsers: number;
    newAccounts: number;
  };
  prompts: {
    views: number;
    copies: number;
    viewSessions: number;
    copySessions: number;
    copySessionRate: number;
    unlocks: number;
  };
  launchFunnel: {
    publicPromptViews: number;
    publicPromptViewSessions: number;
    publicCreatorViews: number;
    publicCreatorViewSessions: number;
    publicBlogIndexViews: number;
    publicBlogIndexViewSessions: number;
    publicBlogArticleViews: number;
    publicBlogArticleViewSessions: number;
    publicDiscoveryViews: number;
    publicDiscoveryViewSessions: number;
    copyClicks: number;
    copyClickSessions: number;
    unlockClicks: number;
    unlockClickSessions: number;
    completedUnlocks: number;
  };
  referrals: {
    linkOpens: number;
    signups: number;
    shareOfNewAccounts: number;
    openToSignupRatio: number;
  };
  economy: {
    issued: number;
    spent: number;
    netFlow: number;
    outstanding: number;
    holders: number;
    activeSpenders: number;
  };
  trackedEvents: number;
  period: {
    days: AdminGrowthWindowDays;
    startAt: string | null;
    generatedAt: string;
  };
};

export type AdminGrowthDailyPoint = {
  day: string;
  promptViews: number;
  promptCopies: number;
  publicPromptViews: number;
  publicCreatorViews: number;
  publicBlogIndexViews: number;
  publicBlogArticleViews: number;
  publicDiscoveryViews: number;
  promptCopyClicks: number;
  promptUnlockClicks: number;
  referralOpens: number;
  referralSignups: number;
  goinIssued: number;
  goinSpent: number;
  promptUnlocks: number;
};

export type AdminGrowthTopTag = {
  slug: string;
  views: number;
  copies: number;
};

export type AdminGrowthSummaryResponse = {
  ok: true;
  summary: AdminGrowthSummary;
  series: AdminGrowthDailyPoint[];
  topTags: AdminGrowthTopTag[];
  measurement: {
    scope: "instrumented_growth_surfaces";
    analyticsEvents: string[];
    note: string;
  };
};