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
