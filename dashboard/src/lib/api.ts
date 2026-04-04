import { getToken, type AuthUser } from "@/lib/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

export type TriggersResponse = {
  disruptionSignals: Array<{
    name: string;
    status: string;
    detail: string;
  }>;
  triggerTimeline: Array<{
    time: string;
    event: string;
    effect: string;
    status: string;
  }>;
};

export type QuoteResponse = {
  computedPremium: number;
  riskScore: number;
  factors: {
    locationRisk: number;
    weatherFactor: number;
    incomeVariability: number;
    reliabilityDiscount: number;
  };
};

export type QuoteRequest = {
  basePremium: number;
  locationRisk: number;
  weatherFactor: number;
  incomeVariability: number;
  reliabilityDiscount: number;
};

export type HealthResponse = {
  status: string;
};

export type FraudAlertCreateRequest = {
  id: string;
  city: string;
  level: "high" | "medium" | "low";
  reason: string;
};

export type FraudAlertUpdateRequest = {
  level?: "high" | "medium" | "low";
  reason?: string;
};

export type TriggerEventCreateRequest = {
  time: string;
  event: string;
  effect: string;
  status: string;
};

export type RiderSnapshotUpdateRequest = {
  protectedEarnings?: number;
  disruptionEventsCompensated?: number;
  latestPayoutAmount?: number;
  latestPayoutTime?: string;
  policyStatus?: string;
  policyWindow?: string;
};

export type AdminAuditLogItem = {
  id: number;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

export type AdminAuditLogsResponse = {
  logs: AdminAuditLogItem[];
};

export type AdminOverviewResponse = {
  weeklyMetrics: {
    activePolicies: number;
    payoutsToday: number;
    fraudAlerts: number;
    avgPayoutTimeMin: number;
  };
  fraudAlerts: Array<{
    id: string;
    city: string;
    level: string;
    reason: string;
  }>;
  cityRiskBands: Array<{
    city: string;
    score: number;
    disruption: string;
  }>;
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
  inputs: {
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

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  verificationRequired: boolean;
  verificationSent: boolean;
  user: AuthUser;
};

export type VerifyEmailResponse = {
  status: string;
  user?: AuthUser;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "rider";
  city?: string;
  platform?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ResendVerificationRequest = {
  email: string;
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

export type RealtimeContextResponse = {
  location: {
    city: string;
    latitude: number;
    longitude: number;
    source: "gps" | "city-geocode" | "fallback";
  };
  weather: {
    status: "normal" | "watch" | "critical" | "unavailable";
    temperatureC: number;
    humidity: number;
    rainMm: number;
    windSpeedKmph: number;
    weatherCode: number;
    source: string;
    provider?: string;
    observedAt: string;
  };
  traffic: {
    status: "normal" | "watch" | "critical";
    congestion: number;
    currentSpeedKmph: number;
    freeFlowSpeedKmph: number;
    travelTimeDelayMin: number;
    source: string;
    provider?: string;
    observedAt: string;
  };
  generatedAt: string;
};

export type StrategyResponse = {
  underwriting: {
    title: string;
    rules: string[];
    disclosure: string;
  };
  triggers: {
    title: string;
    rules: string[];
    disclosure: string;
  };
  pricing: {
    title: string;
    targetRange: string;
    baseFormula: string;
    adjustments: string[];
    modelVersion: string;
  };
  actuarial: {
    title: string;
    bcr: number;
    targetBcrLower: number;
    targetBcrUpper: number;
    lossRatio: number;
    lossRatioLimit: number;
    enrollmentState: string;
    stressScenario: string;
  };
  settlement: {
    title: string;
    steps: string[];
    channels: string[];
    keyPoints: string[];
  };
  metrics: {
    activePolicies: number;
    policyCount: number;
    weeklyPremiumCollected: number;
    totalPremiumCollected: number;
    totalClaimsPaid: number;
    bcr: number;
    targetBcrLower: number;
    targetBcrUpper: number;
    lossRatio: number;
    enrollmentState: string;
  };
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type AdminUser = AuthUser & {
  createdAt: string;
};

export type AdminUsersResponse = {
  users: AdminUser[];
};

export type AdminUserUpsertRequest = {
  fullName: string;
  email: string;
  role: "admin" | "rider";
  city?: string;
  platform?: string;
  password?: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health");
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return requestJson<VerifyEmailResponse>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function resendVerificationEmail(payload: ResendVerificationRequest): Promise<{ status: string; verificationSent?: boolean }> {
  return requestJson<{ status: string; verificationSent?: boolean }>("/api/v1/auth/resend-verification", {
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

export async function fetchRealtimeContext(params?: {
  lat?: number;
  lon?: number;
  city?: string;
}): Promise<RealtimeContextResponse> {
  const query = new URLSearchParams();
  if (typeof params?.lat === "number") query.set("lat", String(params.lat));
  if (typeof params?.lon === "number") query.set("lon", String(params.lon));
  if (params?.city) query.set("city", params.city);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return requestJson<RealtimeContextResponse>(`/api/v1/realtime/context${suffix}`);
}

export async function fetchSignal(signalName: string): Promise<{ name: string; status: string; detail: string }> {
  return requestJson<{ name: string; status: string; detail: string }>(`/api/v1/signals/${signalName}`);
}

export async function fetchStrategy(): Promise<StrategyResponse> {
  return requestJson<StrategyResponse>("/api/v1/ml/strategy");
}

export async function retrainMlModels(): Promise<StrategyResponse> {
  return requestJson<StrategyResponse>("/api/v1/ml/retrain", {
    method: "POST",
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

export async function refreshTriggers(): Promise<TriggersResponse> {
  return requestJson<TriggersResponse>("/api/v1/triggers/refresh", {
    method: "POST",
  });
}

export async function fetchQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  return requestJson<QuoteResponse>("/api/v1/pricing/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  return requestJson<AdminOverviewResponse>("/api/v1/admin/overview");
}

export async function fetchAdminAuditLogs(limit = 8): Promise<AdminAuditLogsResponse> {
  return requestJson<AdminAuditLogsResponse>(`/api/v1/admin/audit-logs?limit=${limit}`);
}

export async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  return requestJson<AdminUsersResponse>("/api/v1/admin/users");
}

export async function createAdminUser(payload: AdminUserUpsertRequest): Promise<{ user: AuthUser }> {
  return requestJson<{ user: AuthUser }>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  userId: number,
  payload: AdminUserUpsertRequest,
): Promise<{ user: AuthUser }> {
  return requestJson<{ user: AuthUser }>(`/api/v1/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createFraudAlert(payload: FraudAlertCreateRequest): Promise<void> {
  await requestJson("/api/v1/admin/fraud-alerts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFraudAlert(alertId: string, payload: FraudAlertUpdateRequest): Promise<void> {
  await requestJson(`/api/v1/admin/fraud-alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createTriggerEvent(payload: TriggerEventCreateRequest): Promise<void> {
  await requestJson("/api/v1/admin/trigger-events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRiderSnapshot(payload: RiderSnapshotUpdateRequest): Promise<void> {
  await requestJson("/api/v1/rider/snapshot", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export async function retryClaim(claimId: string): Promise<Claim> {
  return requestJson<Claim>(`/api/v1/admin/claims/${claimId}/retry`, {
    method: "POST",
  });
}

export async function rollbackClaim(claimId: string): Promise<Claim> {
  return requestJson<Claim>(`/api/v1/admin/claims/${claimId}/rollback`, {
    method: "POST",
  });
}
