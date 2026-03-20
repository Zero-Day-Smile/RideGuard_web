from fastapi import Depends
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from app.db import get_db
from app.models import (
    AdminAuditLog,
    CityRiskBand,
    DisruptionSignal,
    FraudAlert,
    RiderSnapshot,
    TriggerEvent,
    WeeklyMetric,
)
from app.seed import init_db


class QuoteRequest(BaseModel):
    basePremium: float = Field(ge=1, le=100000)
    locationRisk: float = Field(ge=0, le=1)
    weatherFactor: float = Field(ge=0, le=1)
    incomeVariability: float = Field(ge=0, le=1)
    reliabilityDiscount: float = Field(ge=0, le=0.4)


class FraudAlertCreateRequest(BaseModel):
    id: str = Field(min_length=3, max_length=32)
    city: str = Field(min_length=2, max_length=64)
    level: str = Field(pattern="^(high|medium|low)$")
    reason: str = Field(min_length=5, max_length=255)


class FraudAlertUpdateRequest(BaseModel):
    level: str | None = Field(default=None, pattern="^(high|medium|low)$")
    reason: str | None = Field(default=None, min_length=5, max_length=255)


class TriggerEventCreateRequest(BaseModel):
    time: str = Field(min_length=3, max_length=16)
    event: str = Field(min_length=3, max_length=64)
    effect: str = Field(min_length=5, max_length=255)
    status: str = Field(min_length=3, max_length=32)


class RiderSnapshotUpdateRequest(BaseModel):
    protectedEarnings: int | None = Field(default=None, ge=0)
    disruptionEventsCompensated: int | None = Field(default=None, ge=0)
    latestPayoutAmount: int | None = Field(default=None, ge=0)
    latestPayoutTime: str | None = Field(default=None, min_length=2, max_length=64)
    policyStatus: str | None = Field(default=None, min_length=2, max_length=64)
    policyWindow: str | None = Field(default=None, min_length=2, max_length=64)


app = FastAPI(title="RideGuard Backend API", version="0.1.0")


def parse_cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def append_audit_log(
    db: Session,
    action: str,
    target_type: str,
    target_id: str,
    details: str,
    actor: str = "dashboard-admin",
) -> None:
    db.add(
        AdminAuditLog(
            actor=actor,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
    )


@app.on_event("startup")
def on_startup() -> None:
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
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


@app.get("/api/v1/admin/audit-logs")
def admin_audit_logs(limit: int = 20, db: Session = Depends(get_db)) -> dict:
    safe_limit = max(1, min(limit, 100))
    logs = db.scalars(select(AdminAuditLog).order_by(AdminAuditLog.id.desc()).limit(safe_limit)).all()

    return {
        "logs": [
            {
                "id": item.id,
                "actor": item.actor,
                "action": item.action,
                "targetType": item.target_type,
                "targetId": item.target_id,
                "details": item.details,
                "createdAt": item.created_at,
            }
            for item in logs
        ]
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


@app.post("/api/v1/admin/fraud-alerts")
def create_fraud_alert(request: FraudAlertCreateRequest, db: Session = Depends(get_db)) -> dict:
    existing = db.get(FraudAlert, request.id)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Fraud alert id already exists")

    alert = FraudAlert(
        id=request.id,
        city=request.city,
        level=request.level,
        reason=request.reason,
    )
    db.add(alert)

    metric = db.scalar(select(WeeklyMetric).limit(1))
    if metric is not None:
        metric.fraud_alerts += 1

    append_audit_log(
        db=db,
        action="fraud_alert_created",
        target_type="fraud_alert",
        target_id=request.id,
        details=f"Created alert in {request.city} with {request.level} severity",
    )

    db.commit()

    return {
        "id": alert.id,
        "city": alert.city,
        "level": alert.level,
        "reason": alert.reason,
    }


@app.patch("/api/v1/admin/fraud-alerts/{alert_id}")
def update_fraud_alert(
    alert_id: str,
    request: FraudAlertUpdateRequest,
    db: Session = Depends(get_db),
) -> dict:
    alert = db.get(FraudAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Fraud alert not found")

    if request.level is not None:
        alert.level = request.level

    if request.reason is not None:
        alert.reason = request.reason

    append_audit_log(
        db=db,
        action="fraud_alert_updated",
        target_type="fraud_alert",
        target_id=alert.id,
        details=f"Updated level={alert.level}",
    )

    db.commit()

    return {
        "id": alert.id,
        "city": alert.city,
        "level": alert.level,
        "reason": alert.reason,
    }


@app.post("/api/v1/admin/trigger-events")
def create_trigger_event(request: TriggerEventCreateRequest, db: Session = Depends(get_db)) -> dict:
    event = TriggerEvent(
        time=request.time,
        event=request.event,
        effect=request.effect,
        status=request.status,
    )
    db.add(event)

    append_audit_log(
        db=db,
        action="trigger_event_created",
        target_type="trigger_event",
        target_id=request.event,
        details=f"Added trigger at {request.time} with status {request.status}",
    )

    db.commit()
    db.refresh(event)

    return {
        "id": event.id,
        "time": event.time,
        "event": event.event,
        "effect": event.effect,
        "status": event.status,
    }


@app.patch("/api/v1/rider/snapshot")
def update_rider_snapshot(
    request: RiderSnapshotUpdateRequest,
    db: Session = Depends(get_db),
) -> dict:
    rider = db.scalar(select(RiderSnapshot).limit(1))
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider snapshot not found")

    if request.protectedEarnings is not None:
        rider.protected_earnings = request.protectedEarnings
    if request.disruptionEventsCompensated is not None:
        rider.disruption_events_compensated = request.disruptionEventsCompensated
    if request.latestPayoutAmount is not None:
        rider.latest_payout_amount = request.latestPayoutAmount
    if request.latestPayoutTime is not None:
        rider.latest_payout_time = request.latestPayoutTime
    if request.policyStatus is not None:
        rider.policy_status = request.policyStatus
    if request.policyWindow is not None:
        rider.policy_window = request.policyWindow

    append_audit_log(
        db=db,
        action="rider_snapshot_updated",
        target_type="rider_snapshot",
        target_id=str(rider.id),
        details="Updated payout or policy snapshot fields",
    )

    db.commit()

    return {
        "protectedEarnings": rider.protected_earnings,
        "disruptionEventsCompensated": rider.disruption_events_compensated,
        "latestPayoutAmount": rider.latest_payout_amount,
        "latestPayoutTime": rider.latest_payout_time,
        "policyStatus": rider.policy_status,
        "policyWindow": rider.policy_window,
    }
