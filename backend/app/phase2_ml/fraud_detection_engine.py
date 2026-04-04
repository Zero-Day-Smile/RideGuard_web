from __future__ import annotations

"""Phase 2 fraud detection stub.

Implements a small, self-contained anomaly-style scorer that
matches the public interface of the original `FraudDetector`.
This avoids external ML dependencies while still behaving like
an IsolationForest-style risk signal.
"""

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class FraudDetector:
    """Heuristic fraud detector.

    Features (in order):
        - gps_variance
        - claims_frequency
        - inactivity_ratio
        - device_changes
    """

    threshold: float = 0.6

    def __post_init__(self) -> None:
        # Baseline center of "normal" behaviour in feature space.
        self._baseline = [0.15, 0.25, 0.2, 0.1]

    def train(self, activity_data: List[List[float]]) -> None:  # pragma: no cover - optional
        """Training hook to match the original API.

        The production script would fit an IsolationForest here.
        For the backend we keep behaviour deterministic and
        lightweight, so this is a no-op.
        """

    def evaluate(self, sample: List[float]) -> Dict[str, float]:
        if len(sample) != 4:
            raise ValueError("FraudDetector.evaluate expects 4 features")

        # Simple distance from the baseline pattern, normalised to 0-1.
        diffs = [abs(s - b) for s, b in zip(sample, self._baseline)]
        raw_score = sum(diffs) / 4.0
        risk_score = max(0.0, min(1.0, raw_score * 2.0))

        fraud_suspected = risk_score >= self.threshold
        return {"fraud_suspected": fraud_suspected, "risk_score": risk_score}
