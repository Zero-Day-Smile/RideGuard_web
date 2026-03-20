from fastapi import FastAPI
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CityRiskBand, DisruptionSignal, FraudAlert, RiderSnapshot, TriggerEvent, WeeklyMetric
from app.seed import init_db


class QuoteRequest(BaseModel):
    basePremium: float = Field(ge=1, le=100000)
    locationRisk: float = Field(ge=0, le=1)
    weatherFactor: float = Field(ge=0, le=1)
    incomeVariability: float = Field(ge=0, le=1)
    reliabilityDiscount: float = Field(ge=0, le=0.4)


app = FastAPI(title="RideGuard Backend API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/rider/summary")
def rider_summary(db: Session = Depends(get_db)) -> dict:
    metric = db.scalar(select(WeeklyMetric).limit(1))
    rider = db.scalar(select(RiderSnapshot).limit(1))

    if metric is None or rider is None:
        return {"weeklyMetrics": {}, "riderSnapshot": {}}

    return {
        "weeklyMetrics": {
            "activePolicies": metric.active_policies,
            "payoutsToday": metric.payouts_today,
            "fraudAlerts": metric.fraud_alerts,
            "avgPayoutTimeMin": metric.avg_payout_time_min,
        },
        "riderSnapshot": {
            "protectedEarnings": rider.protected_earnings,
            "disruptionEventsCompensated": rider.disruption_events_compensated,
            "latestPayoutAmount": rider.latest_payout_amount,
            "latestPayoutTime": rider.latest_payout_time,
            "policyStatus": rider.policy_status,
            "policyWindow": rider.policy_window,
        },
    }


@app.get("/api/v1/admin/overview")
def admin_overview(db: Session = Depends(get_db)) -> dict:
    metric = db.scalar(select(WeeklyMetric).limit(1))
    alerts = db.scalars(select(FraudAlert)).all()
    bands = db.scalars(select(CityRiskBand)).all()

    if metric is None:
        return {"weeklyMetrics": {}, "fraudAlerts": [], "cityRiskBands": []}

    return {
        "weeklyMetrics": {
            "activePolicies": metric.active_policies,
            "payoutsToday": metric.payouts_today,
            "fraudAlerts": metric.fraud_alerts,
            "avgPayoutTimeMin": metric.avg_payout_time_min,
        },
        "fraudAlerts": [
            {"id": item.id, "city": item.city, "level": item.level, "reason": item.reason}
            for item in alerts
        ],
        "cityRiskBands": [
            {"city": item.city, "score": item.score, "disruption": item.disruption}
            for item in bands
        ],
    }


@app.get("/api/v1/triggers")
def triggers(db: Session = Depends(get_db)) -> dict:
    signals = db.scalars(select(DisruptionSignal)).all()
    timeline = db.scalars(select(TriggerEvent).order_by(TriggerEvent.id.asc())).all()

    return {
        "disruptionSignals": [
            {"name": item.name, "status": item.status, "detail": item.detail} for item in signals
        ],
        "triggerTimeline": [
            {
                "time": item.time,
                "event": item.event,
                "effect": item.effect,
                "status": item.status,
            }
            for item in timeline
        ],
    }


@app.post("/api/v1/pricing/quote")
def pricing_quote(request: QuoteRequest) -> dict:
    weighted_risk = (
        0.4 * request.locationRisk
        + 0.35 * request.weatherFactor
        + 0.25 * request.incomeVariability
    )
    risk_multiplier = 1 + weighted_risk
    raw_premium = request.basePremium * risk_multiplier
    discount_value = raw_premium * request.reliabilityDiscount

    computed_premium = max(12, round(raw_premium - discount_value))
    risk_score = round(
        100
        * (
            0.45 * request.locationRisk
            + 0.35 * request.weatherFactor
            + 0.2 * request.incomeVariability
        )
    )

    return {
        "computedPremium": computed_premium,
        "riskScore": risk_score,
        "factors": {
            "locationRisk": request.locationRisk,
            "weatherFactor": request.weatherFactor,
            "incomeVariability": request.incomeVariability,
            "reliabilityDiscount": request.reliabilityDiscount,
        },
    }
