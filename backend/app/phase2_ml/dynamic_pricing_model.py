from __future__ import annotations

"""Phase 2 dynamic pricing model stub.

This mirrors the public interface of the hackathon script's
`WeeklyPricingModel` so that the FastAPI backend can call it
without pulling in heavy ML dependencies. The coefficients are
chosen to behave similarly to a trained linear model while
keeping the implementation simple and self-contained.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class WeeklyPricingModel:
    """Lightweight linear-style weekly premium model.

    Features (in order):
        - avg_income: estimated weekly income
        - rain_probability: 0-1
        - active_days: 1-7
        - city_risk: 1-3 style scalar
    """

    intercept: float = 20.0
    income_coef: float = 0.0008
    rain_coef: float = 12.0
    active_days_coef: float = 0.7
    city_risk_coef: float = 2.0

    def train(self, X: List[List[float]], y: List[float]) -> None:  # pragma: no cover - demo no-op
        """No-op training hook to match the original API.

        In the original notebook this would fit a LinearRegression
        model. For the hackathon backend we keep a fixed set of
        coefficients but expose the same method so that the class
        remains drop-in compatible.
        """

    def predict_premium(
        self,
        avg_income: float,
        rain_probability: float,
        active_days: float,
        city_risk: float,
    ) -> float:
        # Basic linear form with sensible bounds.
        raw = (
            self.intercept
            + self.income_coef * avg_income
            + self.rain_coef * rain_probability
            + self.active_days_coef * active_days
            + self.city_risk_coef * city_risk
        )

        # Clamp to a realistic band for weekly premiums.
        return max(20.0, min(55.0, raw))
