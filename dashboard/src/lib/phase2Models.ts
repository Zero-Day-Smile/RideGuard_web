// Lightweight frontend mirrors of the Phase 2 ML components.
// These are intentionally dependency-free and match the behaviour
// of the backend stubs so the UI can reference the same concepts
// (pricing model, fraud detector, parametric triggers, payout engine).

export type PremiumModelConfig = {
  basePremium: number;
  locationWeight: number;
  weatherWeight: number;
  trafficWeight: number;
  disruptionWeight: number;
  claimFrequencyWeight: number;
};

export type PremiumModelInputs = {
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

export type PremiumModelResult = {
  ensembleRisk: number;
  weeklyPremium: number;
};

// Mirrors backend WeeklyPricingModel in app/phase2_ml/dynamic_pricing_model.py
export class WeeklyPricingModel {
  private intercept = 20.0;
  private incomeCoef = 0.0008;
  private rainCoef = 12.0;
  private activeDaysCoef = 0.7;
  private cityRiskCoef = 2.0;

  predictPremium(
    avgIncome: number,
    rainProbability: number,
    activeDays: number,
    cityRisk: number,
  ): number {
    const raw =
      this.intercept +
      this.incomeCoef * avgIncome +
      this.rainCoef * rainProbability +
      this.activeDaysCoef * activeDays +
      this.cityRiskCoef * cityRisk;

    return Math.max(20, Math.min(55, raw));
  }
}

const WEEKLY_MODEL = new WeeklyPricingModel();

export function scoreDynamicPremiumFrontend(
  cfg: PremiumModelConfig,
  inputs: PremiumModelInputs,
): PremiumModelResult {
  const {
    coverageAmount,
    planTier,
    cityRisk,
    weatherRisk,
    trafficRisk,
    disruptionRisk,
    claimFrequencyRisk,
    weeklyDistanceKm,
    nightShiftRatio,
    reliabilityScore,
  } = inputs;

  const lrScore =
    cfg.locationWeight * cityRisk +
    cfg.weatherWeight * weatherRisk +
    cfg.trafficWeight * trafficRisk +
    cfg.disruptionWeight * disruptionRisk +
    cfg.claimFrequencyWeight * claimFrequencyRisk;

  const rfScore =
    0.28 * cityRisk +
    0.2 * weatherRisk +
    0.18 * trafficRisk +
    0.17 * disruptionRisk +
    0.17 * claimFrequencyRisk;

  const distanceFactor = Math.min(weeklyDistanceKm / 1200, 1);
  const xgbScore =
    0.26 * cityRisk +
    0.24 * weatherRisk +
    0.18 * trafficRisk +
    0.18 * disruptionRisk +
    0.14 * claimFrequencyRisk +
    0.12 * nightShiftRatio +
    0.1 * distanceFactor;

  const ensembleRisk = 0.35 * lrScore + 0.25 * rfScore + 0.4 * xgbScore;

  const tierMultiplier =
    planTier === "Basic" ? 0.9 : planTier === "Plus" ? 1.14 : 1.0;
  const coverageMultiplier = Math.min(1.25, 0.85 + coverageAmount / 10000);
  const reliabilityMultiplier = Math.max(
    0.82,
    Math.min(1.08, 1.02 - reliabilityScore / 500),
  );

  // Map rich features into the notebook-style WeeklyPricingModel features.
  const avgIncome = coverageAmount;
  const rainProbability = weatherRisk;
  const activeDays = Math.max(1, Math.min(7, weeklyDistanceKm / 40));
  const cityFactor = Math.max(1, Math.min(3, cityRisk * 3));

  const mlPremium = WEEKLY_MODEL.predictPremium(
    avgIncome,
    rainProbability,
    activeDays,
    cityFactor,
  );

  const heuristicPremium = cfg.basePremium * (1 + ensembleRisk);
  const blended = 0.45 * heuristicPremium + 0.55 * mlPremium;

  let weeklyPremium =
    blended * tierMultiplier * coverageMultiplier * reliabilityMultiplier;
  weeklyPremium = Math.max(18, Math.round(weeklyPremium));

  return { ensembleRisk, weeklyPremium };
}

// --- Fraud detection mirror ---

export type FraudEvaluation = {
  fraudSuspected: boolean;
  riskScore: number;
};

export function evaluateFraudFrontend(sample: [number, number, number, number]): FraudEvaluation {
  const baseline = [0.15, 0.25, 0.2, 0.1];
  const threshold = 0.6;

  const diffs = sample.map((value, index) => Math.abs(value - baseline[index]));
  const rawScore = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
  const riskScore = Math.max(0, Math.min(1, rawScore * 2));

  return {
    fraudSuspected: riskScore >= threshold,
    riskScore,
  };
}

// --- Parametric trigger mirror ---

export type TriggerResult = {
  triggered: boolean;
  rainfall: number;
  activityDrop: number;
};

export function checkParametricTriggerFrontend(
  weatherMm: number,
  currentDeliveries: number,
  baselineDeliveries: number,
): TriggerResult {
  const rainfallThreshold = 50; // mm per day
  const activityDropThreshold = 0.3; // 30%

  let activityDrop = 0;
  if (baselineDeliveries > 0) {
    const ratio = currentDeliveries / baselineDeliveries;
    activityDrop = Math.max(0, 1 - ratio);
  }

  const triggered =
    weatherMm >= rainfallThreshold || activityDrop >= activityDropThreshold;

  return {
    triggered,
    rainfall: weatherMm,
    activityDrop,
  };
}

// --- Payout automation mirror ---

export type PayoutDecision = {
  eligible: boolean;
};

export function validatePayoutFrontend(
  fraud: FraudEvaluation,
  trigger: TriggerResult,
): PayoutDecision {
  const fraudSuspected = fraud.fraudSuspected;
  const riskScore = fraud.riskScore;
  const triggered = trigger.triggered;

  if (fraudSuspected && riskScore >= 0.8) {
    return { eligible: false };
  }

  if (triggered && riskScore <= 0.75) {
    return { eligible: true };
  }

  return { eligible: riskScore <= 0.4 };
}
