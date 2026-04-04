from __future__ import annotations

"""Phase 2 parametric trigger engine stub.

Implements the same concept as the original
`ParametricTriggerEngine`: check whether rainfall and activity
drop cross configured thresholds and emit a trigger payload.
"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ParametricTriggerEngine:
    rainfall_threshold: float = 50.0  # mm per day
    activity_drop_threshold: float = 0.3  # 30% drop

    def check_trigger(
        self,
        weather_mm: float,
        current_deliveries: float,
        baseline_deliveries: float,
    ) -> Dict[str, float]:
        # Protect against division by zero.
        if baseline_deliveries <= 0:
            activity_drop = 0.0
        else:
            ratio = current_deliveries / baseline_deliveries
            activity_drop = max(0.0, 1.0 - ratio)

        triggered = (weather_mm >= self.rainfall_threshold) or (
            activity_drop >= self.activity_drop_threshold
        )

        return {
            "triggered": triggered,
            "rainfall": float(weather_mm),
            "activity_drop": float(activity_drop),
        }
