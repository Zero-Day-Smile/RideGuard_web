const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
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

export async function fetchHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health");
}

export async function fetchRiderSummary(): Promise<RiderSummaryResponse> {
  return requestJson<RiderSummaryResponse>("/api/v1/rider/summary");
}

export async function fetchTriggers(): Promise<TriggersResponse> {
  return requestJson<TriggersResponse>("/api/v1/triggers");
}

export async function fetchQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  return requestJson<QuoteResponse>("/api/v1/pricing/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminAuditLogs(limit = 8): Promise<AdminAuditLogsResponse> {
  return requestJson<AdminAuditLogsResponse>(`/api/v1/admin/audit-logs?limit=${limit}`);
}

export async function createFraudAlert(payload: FraudAlertCreateRequest): Promise<void> {
  await requestJson("/api/v1/admin/fraud-alerts", {
    method: "POST",
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
