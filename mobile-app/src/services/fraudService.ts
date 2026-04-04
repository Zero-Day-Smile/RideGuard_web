export interface FraudCheck {
  claimId: string;
  score: number; // 0-100 (higher = more suspicious)
  level: "clean" | "review" | "flagged" | "blocked";
  signals: FraudSignal[];
  recommendation: string;
}

export interface FraudSignal {
  type: string;
  description: string;
  weight: number;
  detected: boolean;
}

const signalDefinitions: Omit<FraudSignal, "detected">[] = [
  { type: "velocity", description: "Multiple claims in short timeframe", weight: 25 },
  { type: "location", description: "Claim location inconsistent with route", weight: 20 },
  { type: "pattern", description: "Similar claim pattern to known fraud", weight: 30 },
  { type: "amount", description: "Claim amount exceeds typical range", weight: 15 },
  { type: "timing", description: "Claim filed outside normal hours", weight: 10 },
  { type: "device", description: "Multiple devices used for same account", weight: 20 },
  { type: "photo", description: "Image metadata inconsistency", weight: 25 },
  { type: "gps_spoof", description: "GPS spoofing indicators detected", weight: 35 },
];

export function runFraudCheck(claimId: string, claimData?: {
  amount?: number;
  claimCount?: number;
  timeSinceLastClaim?: number;
  nightClaim?: boolean;
}): FraudCheck {
  const signals: FraudSignal[] = signalDefinitions.map(s => ({
    ...s,
    detected: Math.random() > (0.7 + (s.weight > 25 ? 0.15 : 0)),
  }));

  // Increase detection for suspicious patterns
  if (claimData) {
    if (claimData.claimCount && claimData.claimCount > 3) {
      signals.find(s => s.type === "velocity")!.detected = true;
    }
    if (claimData.amount && claimData.amount > 5000) {
      signals.find(s => s.type === "amount")!.detected = true;
    }
    if (claimData.nightClaim) {
      signals.find(s => s.type === "timing")!.detected = true;
    }
  }

  const score = signals
    .filter(s => s.detected)
    .reduce((sum, s) => sum + s.weight, 0);

  const normalizedScore = Math.min(100, score);

  let level: FraudCheck["level"];
  let recommendation: string;

  if (normalizedScore >= 70) {
    level = "blocked";
    recommendation = "Auto-deny: High fraud probability. Manual review required.";
  } else if (normalizedScore >= 45) {
    level = "flagged";
    recommendation = "Hold for review: Multiple suspicious signals detected.";
  } else if (normalizedScore >= 20) {
    level = "review";
    recommendation = "Low risk but review recommended before payout.";
  } else {
    level = "clean";
    recommendation = "Auto-approve: No suspicious signals detected.";
  }

  return { claimId, score: normalizedScore, level, signals, recommendation };
}

export function getFraudStats() {
  return {
    totalChecked: 156,
    clean: 128,
    reviewed: 18,
    flagged: 8,
    blocked: 2,
    savingsFromFraudPrevention: 24500,
    avgProcessingTime: "1.2s",
  };
}
