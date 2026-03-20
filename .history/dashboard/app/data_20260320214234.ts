export type DisruptionSignal = {
  name: string;
  status: "stable" | "watch" | "critical";
  detail: string;
};

export type FraudAlert = {
  id: string;
  city: string;
  level: "high" | "medium" | "low";
  reason: string;
};

export type WeeklyMetrics = {
  activePolicies: number;
  payoutsToday: number;
  fraudAlerts: number;
  avgPayoutTimeMin: number;
};

export type RiderSnapshot = {
  protectedEarnings: number;
  disruptionEventsCompensated: number;
  latestPayoutAmount: number;
  latestPayoutTime: string;
  policyStatus: string;
  policyWindow: string;
};

export const weeklyMetrics: WeeklyMetrics = {
  activePolicies: 2842,
  payoutsToday: 196,
  fraudAlerts: 14,
  avgPayoutTimeMin: 3.8
};

export const riderSnapshot: RiderSnapshot = {
  protectedEarnings: 4800,
  disruptionEventsCompensated: 2,
  latestPayoutAmount: 1950,
  latestPayoutTime: "3m 12s",
  policyStatus: "Active",
  policyWindow: "Mon to Sun"
};

export const triggerTimeline = [
  { time: "07:15", event: "Heavy Rain", effect: "-48% delivery activity", status: "Verified" },
  { time: "09:40", event: "Platform Downtime", effect: "35 min outage", status: "Verified" },
  { time: "12:10", event: "Traffic Lockdown", effect: "Zone access reduced", status: "Review" },
  { time: "16:25", event: "Mobility Restriction", effect: "Curfew in 2 zones", status: "Triggered" }
] as const;

export const disruptionSignals: DisruptionSignal[] = [
  {
    name: "Weather",
    status: "critical",
    detail: "Rainfall 68 mm/h in Bengaluru East"
  },
  {
    name: "Platform Uptime",
    status: "watch",
    detail: "Intermittent API retries in south region"
  },
  {
    name: "Traffic",
    status: "watch",
    detail: "Congestion index +32% in key zones"
  },
  {
    name: "Delivery Activity",
    status: "critical",
    detail: "Median trip count down 42%"
  }
];

export const fraudAlerts: FraudAlert[] = [
  {
    id: "FR-214",
    city: "Bengaluru",
    level: "high",
    reason: "Mock-location signature and repeated claim timing"
  },
  {
    id: "FR-209",
    city: "Hyderabad",
    level: "medium",
    reason: "Device-network mismatch during outage window"
  },
  {
    id: "FR-202",
    city: "Pune",
    level: "low",
    reason: "Activity gap inconsistent with baseline behavior"
  }
];

export const cityRiskBands = [
  { city: "Bengaluru", score: 0.78, disruption: "High rain + traffic volatility" },
  { city: "Mumbai", score: 0.71, disruption: "Monsoon intensity spikes" },
  { city: "Hyderabad", score: 0.62, disruption: "Platform downtime bursts" },
  { city: "Pune", score: 0.57, disruption: "Congestion and route constraints" },
  { city: "Chennai", score: 0.53, disruption: "Localized weather variability" }
];
