from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Base, engine
from app.models import (
    AdminAuditLog,
    CityRiskBand,
    DisruptionSignal,
    FraudAlert,
    RiderSnapshot,
    TriggerEvent,
    WeeklyMetric,
)


def seed_if_empty(db: Session) -> None:
    has_metrics = db.scalar(select(WeeklyMetric.id).limit(1))
    if has_metrics is not None:
        return

    db.add(
        WeeklyMetric(
            active_policies=2842,
            payouts_today=196,
            fraud_alerts=14,
            avg_payout_time_min=3.8,
        )
    )

    db.add(
        RiderSnapshot(
            protected_earnings=4800,
            disruption_events_compensated=2,
            latest_payout_amount=1950,
            latest_payout_time="3m 12s",
            policy_status="Active",
            policy_window="Mon to Sun",
        )
    )

    db.add_all(
        [
            FraudAlert(
                id="FR-214",
                city="Bengaluru",
                level="high",
                reason="Mock-location signature and repeated claim timing",
            ),
            FraudAlert(
                id="FR-209",
                city="Hyderabad",
                level="medium",
                reason="Device-network mismatch during outage window",
            ),
            FraudAlert(
                id="FR-202",
                city="Pune",
                level="low",
                reason="Activity gap inconsistent with baseline behavior",
            ),
        ]
    )

    db.add_all(
        [
            CityRiskBand(city="Bengaluru", score=0.78, disruption="High rain + traffic volatility"),
            CityRiskBand(city="Mumbai", score=0.71, disruption="Monsoon intensity spikes"),
            CityRiskBand(city="Hyderabad", score=0.62, disruption="Platform downtime bursts"),
            CityRiskBand(city="Pune", score=0.57, disruption="Congestion and route constraints"),
            CityRiskBand(city="Chennai", score=0.53, disruption="Localized weather variability"),
        ]
    )

    db.add_all(
        [
            DisruptionSignal(
                name="Weather",
                status="critical",
                detail="Rainfall 68 mm/h in Bengaluru East",
            ),
            DisruptionSignal(
                name="Platform Uptime",
                status="watch",
                detail="Intermittent API retries in south region",
            ),
            DisruptionSignal(
                name="Traffic",
                status="watch",
                detail="Congestion index +32% in key zones",
            ),
            DisruptionSignal(
                name="Delivery Activity",
                status="critical",
                detail="Median trip count down 42%",
            ),
        ]
    )

    db.add_all(
        [
            TriggerEvent(
                time="07:15",
                event="Heavy Rain",
                effect="-48% delivery activity",
                status="Verified",
            ),
            TriggerEvent(
                time="09:40",
                event="Platform Downtime",
                effect="35 min outage",
                status="Verified",
            ),
            TriggerEvent(
                time="12:10",
                event="Traffic Lockdown",
                effect="Zone access reduced",
                status="Review",
            ),
            TriggerEvent(
                time="16:25",
                event="Mobility Restriction",
                effect="Curfew in 2 zones",
                status="Triggered",
            ),
        ]
    )

    db.add(
        AdminAuditLog(
            actor="system",
            action="seed_initialized",
            target_type="bootstrap",
            target_id="initial",
            details="Initialized RideGuard sample records",
            created_at="2026-03-20T00:00:00Z",
        )
    )

    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        seed_if_empty(db)
