export interface EconomyUnitState {
  code: string;
  name: string;
  decimals: number;
  referenceValueToman: number;
  referenceValueKind: string;
}

export interface EconomyState {
  unit: EconomyUnitState;
  balance: number;
  lifetimeIssued: number;
  lifetimeSpent: number;
  transactionCount: number;
}

export interface EconomyPolicyIssuance {
  ruleVersion: number;
  accountCreated: number;
  profileEmailAdded: number;
  referralJoined: number;
  referralReward: number;
  draftCreated: number;
}

export interface EconomyPolicySinks {
  ruleVersion: number;
  promptArchiveUnlock: {
    costGoin: number;
  };
}

export interface EconomyPolicy {
  referenceValueToman: number;
  referenceValueKind: string;
  issuance: EconomyPolicyIssuance;
  sinks: EconomyPolicySinks;
}

export interface EconomyStateResponse {
  ok: true;
  economy: EconomyState;
  policy: EconomyPolicy;
}

export interface EconomyEvent {
  id: string;
  eventType: string;
  unitDelta: number;
  sourceType: string | null;
  sourceId: string | null;
  sourceScoreEventId: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EconomyEventsResponse {
  ok: true;
  events: EconomyEvent[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface AdminEconomyIssuanceSettings {
  ruleVersion: number;
  accountCreated: number;
  profileEmailAdded: number;
  referralJoined: number;
  referralReward: number;
  draftCreated: number;
}

export interface AdminEconomySinkSettings {
  ruleVersion: number;
  promptArchiveUnlock: {
    costGoin: number;
  };
}

export interface AdminEconomySettings {
  unit: Omit<EconomyUnitState, "referenceValueToman">;
  goinReferenceValueToman: number;
  issuance: AdminEconomyIssuanceSettings;
  sinks: AdminEconomySinkSettings;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AdminEconomySettingsResponse {
  ok: true;
  settings: AdminEconomySettings;
}

export interface UpdateAdminEconomySettingsInput {
  goinReferenceValueToman?: number;
  issuance?: Partial<
    Omit<AdminEconomyIssuanceSettings, "ruleVersion">
  >;
  sinks?: {
    promptArchiveUnlock?: {
      costGoin: number;
    };
  };
}

export interface UpdateAdminEconomySettingsResponse {
  ok: true;
  changed: boolean;
  settings: AdminEconomySettings;
}
