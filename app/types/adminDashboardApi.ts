export type AdminDashboardSummary = {
  accounts: {
    total: number;
    active: number;
    suspended: number;
    newToday: number;
  };
  sessions: {
    active: number;
  };
  cloudDrafts: {
    total: number;
    updatedToday: number;
  };
  adminActions: {
    today: number;
  };
};

export type AdminDashboardSummaryResponse = {
  ok: true;
  summary: AdminDashboardSummary;
  period: {
    dayStartUtc: string | null;
    generatedAt: string;
  };
};
