import type { RealtimeContextResponse } from "@/lib/api";

type SignalLevel = "critical" | "watch" | "normal";

export type AdvancedRiskInput = {
  realtime: RealtimeContextResponse;
  platformStatus?: string;
  disruptionStatus?: string;
  threshold: number;
  aggressiveMode?: boolean;
  baseCooldownMin: number;
  lastAutoFileAtMs?: number;
  nowMs?: number;
};

export type AdvancedRiskOutput = {
  score: number;
  weatherScore: number;
  trafficScore: number;
  platformScore: number;
  disruptionScore: number;
  gpsAnomaly: number;
  dynamicThreshold: number;
  cooldownMs: number;
  shouldAutoFile: boolean;
};

function normalizeSignal(status?: string): SignalLevel {
  const lowered = (status || "").toLowerCase();
  if (lowered === "critical") return "critical";
  if (lowered === "watch") return "watch";
  return "normal";
}

function scoreSignal(level: SignalLevel, weights: { critical: number; watch: number; normal: number }): number {
  if (level === "critical") return weights.critical;
  if (level === "watch") return weights.watch;
  return weights.normal;
}

export function computeAdvancedRisk(input: AdvancedRiskInput): AdvancedRiskOutput {
  const now = input.nowMs ?? Date.now();
  const weatherLevel = normalizeSignal(input.realtime.weather.status);
  const trafficLevel = normalizeSignal(input.realtime.traffic.status);
  const platformLevel = normalizeSignal(input.platformStatus);
  const disruptionLevel = normalizeSignal(input.disruptionStatus);

  const weatherScore = scoreSignal(weatherLevel, { critical: 0.95, watch: 0.62, normal: 0.25 });
  const trafficScore = scoreSignal(trafficLevel, { critical: 0.9, watch: 0.58, normal: 0.22 });
  const platformScore = scoreSignal(platformLevel, { critical: 0.88, watch: 0.55, normal: 0.18 });
  const disruptionScore = scoreSignal(disruptionLevel, { critical: 0.92, watch: 0.52, normal: 0.2 });

  const congestion = input.realtime.traffic.congestion;
  const gpsAnomaly = congestion > 0.7 ? 0.78 : congestion > 0.45 ? 0.55 : 0.25;

  const score =
    weatherScore * 0.3 +
    trafficScore * 0.24 +
    platformScore * 0.16 +
    disruptionScore * 0.2 +
    gpsAnomaly * 0.1;

  const dynamicThreshold = input.aggressiveMode
    ? Math.max(0.45, input.threshold - 0.07)
    : input.threshold;

  const trafficPenaltyCooldown = trafficLevel === "critical" ? input.baseCooldownMin + 1 : input.baseCooldownMin;
  const cooldownMs = trafficPenaltyCooldown * 60 * 1000;
  const lastAutoFileAtMs = input.lastAutoFileAtMs ?? 0;

  return {
    score,
    weatherScore,
    trafficScore,
    platformScore,
    disruptionScore,
    gpsAnomaly,
    dynamicThreshold,
    cooldownMs,
    shouldAutoFile: score >= dynamicThreshold && now - lastAutoFileAtMs > cooldownMs,
  };
}

export function toRiskScale10(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value * 10)));
}