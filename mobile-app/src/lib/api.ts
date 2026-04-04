import { getToken, type AuthUser } from "@/lib/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("NETWORK_UNREACHABLE");
  }

  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = typeof payload?.detail === "string" ? payload.detail : "";
    } catch {
      detail = "";
    }
    throw new Error(detail ? `HTTP_${response.status}:${detail}` : `HTTP_${response.status}`);
  }

  return (await response.json()) as T;
}

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  role: "rider";
  city: string;
  platform: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RiderSummaryResponse = {
  weeklyMetrics: {
    activePolicies: number;
    payoutsToday: number;
    fraudAlerts: number;
    avgPayoutTimeMin: number;
  };
  riderSnapshot: {
    protectedEarnings: number;
    disruptionEventsCompensated: number;
    latestPayoutAmount: number;
    latestPayoutTime: string;
    policyStatus: string;
    policyWindow: string;
  };
};

export type TriggerTimelineItem = {
  time: string;
  event: string;
  effect: string;
  status: string;
};

export type TriggersResponse = {
  disruptionSignals: Array<{
    name: string;
    status: string;
    detail: string;
  }>;
  triggerTimeline: TriggerTimelineItem[];
};

export type Policy = {
  id: number;
  riderName: string;
  city: string;
  platform: string;
  planTier: "Basic" | "Standard" | "Plus";
  coverageAmount: number;
  deductible: number;
  status: "Active" | "Paused" | "Expired";
  startDate: string;
  endDate: string;
};

export type PoliciesResponse = {
  policies: Policy[];
};

export type PolicyUpsertRequest = Omit<Policy, "id">;

export type DynamicPremiumQuoteRequest = {
  policyId?: number;
  coverageAmount: number;
  planTier: "Basic" | "Standard" | "Plus";
  cityRisk: number;
  weatherRisk: number;
  trafficRisk: number;
  disruptionRisk: number;
  claimFrequencyRisk: number;
  weeklyDistanceKm: number;
  nightShiftRatio: number;
  reliabilityScore: number;
};

export type DynamicPremiumQuoteResponse = {
  weeklyPremium: number;
  riskBand: "low" | "medium" | "high";
  ensembleRisk: number;
  model: {
    modelVersion: string;
    algorithmMix: string;
    nextRefreshAt: string;
    refreshIntervalDays: number;
  };
  inputs: DynamicPremiumQuoteRequest;
};

export type PricingModelSnapshotResponse = {
  modelVersion: string;
  algorithmMix: string;
  refreshIntervalDays: number;
  lastRefreshAt: string;
  nextRefreshAt: string;
  weights: {
    locationRisk: number;
    weatherRisk: number;
    trafficRisk: number;
    disruptionRisk: number;
    claimFrequencyRisk: number;
  };
  suggestedBasePremium: number;
};

export type Claim = {
  id: string;
  policyId: number;
  incidentType: string;
  incidentAt: string;
  claimAmount: number;
  status: "Paid" | "Review";
  fraudScore: number;
  autoApproved: boolean;
  notes: string;
};

export type ClaimsResponse = {
  claims: Claim[];
};

export type AutoClaimRequest = {
  policyId: number;
  incidentType: string;
  incidentAt: string;
  claimedAmount: number;
  weatherSeverity: number;
  gpsConsistency: number;
  platformEvidence: number;
  trafficAnomaly: number;
  riderDelayMinutes: number;
};

export type SettingsResponse = {
  profile: AuthUser;
  preferences: {
    theme: "light" | "dark" | "system";
    language: string;
    emailAlerts: boolean;
    smsAlerts: boolean;
  };
};

export type SettingsUpdateRequest = {
  fullName?: string;
  city?: string;
  platform?: string;
  theme?: "light" | "dark" | "system";
  language?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export async function fetchHealth(): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/health");
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return requestJson<{ user: AuthUser }>("/api/v1/auth/me");
}

export async function fetchSettings(): Promise<SettingsResponse> {
  return requestJson<SettingsResponse>("/api/v1/settings");
}

export async function updateSettings(payload: SettingsUpdateRequest): Promise<SettingsResponse> {
  return requestJson<SettingsResponse>("/api/v1/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordRequest): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/api/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRiderSummary(): Promise<RiderSummaryResponse> {
  return requestJson<RiderSummaryResponse>("/api/v1/rider/summary");
}

export async function fetchTriggers(): Promise<TriggersResponse> {
  return requestJson<TriggersResponse>("/api/v1/triggers");
}

export async function fetchPolicies(): Promise<PoliciesResponse> {
  return requestJson<PoliciesResponse>("/api/v1/policies");
}

export async function createPolicy(payload: PolicyUpsertRequest): Promise<Policy> {
  return requestJson<Policy>("/api/v1/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePolicy(policyId: number, payload: PolicyUpsertRequest): Promise<Policy> {
  return requestJson<Policy>(`/api/v1/policies/${policyId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchPricingModelSnapshot(): Promise<PricingModelSnapshotResponse> {
  return requestJson<PricingModelSnapshotResponse>("/api/v1/pricing/model-snapshot");
}

export async function fetchDynamicPremiumQuote(
  payload: DynamicPremiumQuoteRequest,
): Promise<DynamicPremiumQuoteResponse> {
  return requestJson<DynamicPremiumQuoteResponse>("/api/v1/pricing/dynamic-quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchClaims(): Promise<ClaimsResponse> {
  return requestJson<ClaimsResponse>("/api/v1/claims");
}

export async function createAutoClaim(payload: AutoClaimRequest): Promise<Claim> {
  return requestJson<Claim>("/api/v1/claims/auto-file", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
