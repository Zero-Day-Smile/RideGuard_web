import { runFraudCheck, type FraudCheck } from "./fraudService";

export type TriggerType = "accident" | "weather" | "traffic" | "platform_outage";
export type ClaimStatus = "detected" | "verifying" | "filed" | "reviewing" | "approved" | "paid" | "denied";

export interface TriggerEvent {
  id: string;
  type: TriggerType;
  description: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  data: Record<string, any>;
  autoTriggered: boolean;
}

export interface Claim {
  id: string;
  triggerId: string;
  triggerType: TriggerType;
  status: ClaimStatus;
  amount: number;
  description: string;
  filedAt: Date;
  updatedAt: Date;
  pipelineSteps: PipelineStep[];
  fraudCheck: FraudCheck | null;
  payoutAmount: number;
  payoutDate: Date | null;
  timeline: TimelineEvent[];
}

export interface PipelineStep {
  label: string;
  status: "done" | "active" | "pending";
  timestamp: Date | null;
}

export interface TimelineEvent {
  time: Date;
  description: string;
  type: "info" | "success" | "warning" | "error";
}

const triggerTemplates: Record<TriggerType, Omit<TriggerEvent, "id" | "timestamp">> = {
  accident: {
    type: "accident",
    description: "Sudden deceleration and impact detected via device sensors",
    severity: "critical",
    data: { gForce: 4.2, speed: 35 },
    autoTriggered: true,
  },
  weather: {
    type: "weather",
    description: "Heavy rainfall causing unsafe riding conditions",
    severity: "high",
    data: { rainfall: "heavy", visibility: "poor" },
    autoTriggered: true,
  },
  traffic: {
    type: "traffic",
    description: "Major road blockage causing extended delay and lost earnings",
    severity: "medium",
    data: { delayMinutes: 45, lostOrders: 3 },
    autoTriggered: true,
  },
  platform_outage: {
    type: "platform_outage",
    description: "Delivery platform experiencing downtime — orders unavailable",
    severity: "high",
    data: { platform: "Swiggy", downtimeMinutes: 60 },
    autoTriggered: true,
  },
};

// Simulated claims store
let claimsStore: Claim[] = [
  createHistoricalClaim("#1042", "weather", "paid", 2400, -3),
  createHistoricalClaim("#1038", "accident", "paid", 8200, -20),
  createHistoricalClaim("#1035", "traffic", "denied", 1100, -27),
  createHistoricalClaim("#1029", "platform_outage", "paid", 600, -35),
];

let nextClaimNum = 1043;

function createHistoricalClaim(id: string, type: TriggerType, status: ClaimStatus, amount: number, daysAgo: number): Claim {
  const date = new Date(Date.now() + daysAgo * 86400000);
  const fraud = runFraudCheck(id);
  return {
    id,
    triggerId: `trigger-${id}`,
    triggerType: type,
    status,
    amount,
    description: triggerTemplates[type].description,
    filedAt: date,
    updatedAt: date,
    pipelineSteps: [
      { label: "Trigger Detected", status: "done", timestamp: date },
      { label: "Data Verified", status: "done", timestamp: new Date(date.getTime() + 60000) },
      { label: "Claim Filed", status: "done", timestamp: new Date(date.getTime() + 120000) },
      { label: "Under Review", status: "done", timestamp: new Date(date.getTime() + 300000) },
      { label: "Payout Sent", status: status === "paid" ? "done" : status === "denied" ? "pending" : "active", timestamp: status === "paid" ? new Date(date.getTime() + 600000) : null },
    ],
    fraudCheck: fraud,
    payoutAmount: status === "paid" ? amount : 0,
    payoutDate: status === "paid" ? new Date(date.getTime() + 600000) : null,
    timeline: [
      { time: date, description: `${type} trigger detected`, type: "info" },
      { time: new Date(date.getTime() + 60000), description: "Sensor data verified automatically", type: "success" },
      { time: new Date(date.getTime() + 120000), description: "Claim auto-filed", type: "success" },
      { time: new Date(date.getTime() + 300000), description: status === "denied" ? "Claim denied — fraud flagged" : "Review completed", type: status === "denied" ? "error" : "success" },
      ...(status === "paid" ? [{ time: new Date(date.getTime() + 600000), description: `₹${amount.toLocaleString()} paid to wallet`, type: "success" as const }] : []),
    ],
  };
}

export function getClaims(): Claim[] {
  return [...claimsStore].sort((a, b) => b.filedAt.getTime() - a.filedAt.getTime());
}

export function getActiveClaim(): Claim | null {
  return claimsStore.find(c => !["paid", "denied"].includes(c.status)) || null;
}

export function simulateTrigger(type: TriggerType): { trigger: TriggerEvent; claim: Claim } {
  const trigger: TriggerEvent = {
    ...triggerTemplates[type],
    id: `trigger-${Date.now()}`,
    timestamp: new Date(),
  };

  const claimId = `#${nextClaimNum++}`;
  const amount = type === "accident" ? 5000 + Math.floor(Math.random() * 10000) :
    type === "weather" ? 1500 + Math.floor(Math.random() * 3000) :
    type === "traffic" ? 800 + Math.floor(Math.random() * 2000) :
    500 + Math.floor(Math.random() * 1500);

  const claim: Claim = {
    id: claimId,
    triggerId: trigger.id,
    triggerType: type,
    status: "detected",
    amount,
    description: trigger.description,
    filedAt: new Date(),
    updatedAt: new Date(),
    pipelineSteps: [
      { label: "Trigger Detected", status: "active", timestamp: new Date() },
      { label: "Data Verified", status: "pending", timestamp: null },
      { label: "Claim Filed", status: "pending", timestamp: null },
      { label: "Under Review", status: "pending", timestamp: null },
      { label: "Payout Sent", status: "pending", timestamp: null },
    ],
    fraudCheck: null,
    payoutAmount: 0,
    payoutDate: null,
    timeline: [{ time: new Date(), description: `${type} trigger detected automatically`, type: "info" }],
  };

  claimsStore.unshift(claim);
  return { trigger, claim };
}

export function advanceClaimPipeline(claimId: string): Claim | null {
  const claim = claimsStore.find(c => c.id === claimId);
  if (!claim) return null;

  const statusFlow: ClaimStatus[] = ["detected", "verifying", "filed", "reviewing", "approved", "paid"];
  const currentIdx = statusFlow.indexOf(claim.status);
  if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return claim;

  const nextStatus = statusFlow[currentIdx + 1];
  claim.status = nextStatus;
  claim.updatedAt = new Date();

  // Update pipeline steps
  const stepIdx = currentIdx + 1;
  if (stepIdx < claim.pipelineSteps.length) {
    claim.pipelineSteps[stepIdx].status = "active";
    claim.pipelineSteps[stepIdx].timestamp = new Date();
    if (stepIdx > 0) claim.pipelineSteps[stepIdx - 1].status = "done";
  }

  // Run fraud check at verification stage
  if (nextStatus === "verifying") {
    claim.fraudCheck = runFraudCheck(claimId);
    claim.timeline.push({ time: new Date(), description: `Fraud check: ${claim.fraudCheck.level} (score: ${claim.fraudCheck.score})`, type: claim.fraudCheck.level === "clean" ? "success" : "warning" });
  }

  if (nextStatus === "filed") {
    claim.timeline.push({ time: new Date(), description: "Claim auto-filed with verified data", type: "success" });
  }

  if (nextStatus === "reviewing") {
    claim.timeline.push({ time: new Date(), description: "Automated review in progress", type: "info" });
  }

  if (nextStatus === "approved") {
    claim.payoutAmount = claim.amount;
    claim.timeline.push({ time: new Date(), description: `Claim approved for ₹${claim.amount.toLocaleString()}`, type: "success" });
  }

  if (nextStatus === "paid") {
    claim.payoutDate = new Date();
    claim.pipelineSteps.forEach(s => s.status = "done");
    claim.timeline.push({ time: new Date(), description: `₹${claim.amount.toLocaleString()} sent to wallet`, type: "success" });
  }

  return claim;
}

export function getClaimStats() {
  const all = claimsStore;
  const paid = all.filter(c => c.status === "paid");
  return {
    totalClaims: all.length,
    totalPaid: paid.reduce((s, c) => s + c.payoutAmount, 0),
    avgProcessingTime: "4.2 min",
    autoApprovalRate: "87%",
    pendingPayout: all.filter(c => !["paid", "denied"].includes(c.status)).reduce((s, c) => s + c.amount, 0),
  };
}
