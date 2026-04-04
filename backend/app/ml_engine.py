from __future__ import annotations

"""
Lightweight ML orchestration for dynamic premium quotes.

This module is intentionally simple: it exposes a single function that
transforms feature inputs into an ensemble risk score and premium
suggestion. For the hackathon, we keep the math transparent so you can
map it back to your actual notebook / script (LR + Random Forest +
XGBoost) and later swap this implementation with a real model without
changing the HTTP API surface.
"""

from dataclasses import dataclass

from .phase2_ml.dynamic_pricing_model import WeeklyPricingModel


@dataclass
class PremiumModelConfig:
    base_premium: int
    location_weight: float
    weather_weight: float
    traffic_weight: float
    disruption_weight: float
    claim_frequency_weight: float


@dataclass
class PremiumModelResult:
    ensemble_risk: float
    weekly_premium: int


_WEEKLY_MODEL = WeeklyPricingModel()


def score_dynamic_premium(
    cfg: PremiumModelConfig,
    *,
    coverage_amount: int,
    plan_tier: str,
    city_risk: float,
    weather_risk: float,
    traffic_risk: float,
    disruption_risk: float,
    claim_frequency_risk: float,
    weekly_distance_km: float,
    night_shift_ratio: float,
    reliability_score: float,
) -> PremiumModelResult:
    """Approximate blend of LR + RF + XGBoost style scores.

    In your actual Phase 2 submission you can plug your own
    sklearn / xgboost pipeline here and return compatible values.
    """

    lr_score = (
        cfg.location_weight * city_risk
        + cfg.weather_weight * weather_risk
        + cfg.traffic_weight * traffic_risk
        + cfg.disruption_weight * disruption_risk
        + cfg.claim_frequency_weight * claim_frequency_risk
    )

    rf_score = (
        0.28 * city_risk
        + 0.2 * weather_risk
        + 0.18 * traffic_risk
        + 0.17 * disruption_risk
        + 0.17 * claim_frequency_risk
    )

    distance_factor = min(weekly_distance_km / 1200.0, 1.0)
    xgb_score = (
        0.26 * city_risk
        + 0.24 * weather_risk
        + 0.18 * traffic_risk
        + 0.18 * disruption_risk
        + 0.14 * claim_frequency_risk
        + 0.12 * night_shift_ratio
        + 0.1 * distance_factor
    )

    ensemble_risk = (0.35 * lr_score) + (0.25 * rf_score) + (0.4 * xgb_score)

    tier_multiplier = {"Basic": 0.9, "Standard": 1.0, "Plus": 1.14}.get(plan_tier, 1.0)
    coverage_multiplier = min(1.25, 0.85 + (coverage_amount / 10000.0))
    reliability_multiplier = max(0.82, min(1.08, 1.02 - (reliability_score / 500.0)))

    # Call the Phase 2 WeeklyPricingModel with a compact feature
    # set derived from the richer API inputs. This mirrors the
    # hackathon script while keeping the HTTP contract unchanged.
    avg_income = float(coverage_amount)
    rain_probability = float(weather_risk)
    active_days = max(1.0, min(7.0, weekly_distance_km / 40.0))
    city_factor = max(1.0, min(3.0, city_risk * 3.0))

    ml_premium = _WEEKLY_MODEL.predict_premium(
        avg_income=avg_income,
        rain_probability=rain_probability,
        active_days=active_days,
        city_risk=city_factor,
    )

    heuristic_premium = cfg.base_premium * (1 + ensemble_risk)
    blended = 0.45 * heuristic_premium + 0.55 * ml_premium

    weekly_premium = round(
        blended * tier_multiplier * coverage_multiplier * reliability_multiplier
    )
    weekly_premium = max(18, weekly_premium)

    return PremiumModelResult(
        ensemble_risk=ensemble_risk,
        weekly_premium=weekly_premium,
    )
