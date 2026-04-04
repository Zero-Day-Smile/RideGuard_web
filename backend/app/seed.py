from sqlalchemy import select, text
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.auth import hash_password
from app.db import Base, engine
from app.models import (
    AdminAuditLog,
    AppUser,
    ClaimCase,
    CityRiskBand,
    DisruptionSignal,
    FraudAlert,
    InsurancePolicy,
    PremiumModelSnapshot,
    RiderSnapshot,
    TriggerEvent,
    UserSetting,
    WeeklyMetric,
)


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(WeeklyMetric.id).limit(1)) is None:
        db.add(
            WeeklyMetric(
                active_policies=2842,
                payouts_today=196,
                fraud_alerts=14,
                avg_payout_time_min=3.8,
            )
        )

    if db.scalar(select(RiderSnapshot.id).limit(1)) is None:
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

    if db.scalar(select(FraudAlert.id).limit(1)) is None:
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

    if db.scalar(select(CityRiskBand.city).limit(1)) is None:
        db.add_all(
            [
                CityRiskBand(city="Bengaluru", score=0.78, disruption="High rain + traffic volatility"),
                CityRiskBand(city="Mumbai", score=0.71, disruption="Monsoon intensity spikes"),
                CityRiskBand(city="Hyderabad", score=0.62, disruption="Platform downtime bursts"),
                CityRiskBand(city="Pune", score=0.57, disruption="Congestion and route constraints"),
                CityRiskBand(city="Chennai", score=0.53, disruption="Localized weather variability"),
            ]
        )

    if db.scalar(select(DisruptionSignal.name).limit(1)) is None:
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

    if db.scalar(select(TriggerEvent.id).limit(1)) is None:
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

    if db.scalar(select(InsurancePolicy.id).limit(1)) is None:
        db.add_all(
            [
                InsurancePolicy(
                    rider_name="Arjun Kumar",
                    city="Bengaluru",
                    platform="Swiggy",
                    plan_tier="Standard",
                    coverage_amount=4000,
                    deductible=300,
                    status="Active",
                    start_date="2026-03-01",
                    end_date="2026-06-01",
                ),
                InsurancePolicy(
                    rider_name="Nisha Rao",
                    city="Hyderabad",
                    platform="Zomato",
                    plan_tier="Plus",
                    coverage_amount=5500,
                    deductible=250,
                    status="Active",
                    start_date="2026-02-15",
                    end_date="2026-05-15",
                ),
            ]
        )

    if db.scalar(select(PremiumModelSnapshot.id).limit(1)) is None:
        db.add(
            PremiumModelSnapshot(
                model_version="v2.3.1",
                algorithm_mix="logistic_regression:0.35,random_forest:0.25,xgboost:0.40",
                refresh_interval_days=14,
                last_refresh_at="2026-03-28T08:00:00Z",
                next_refresh_at="2026-04-11T08:00:00Z",
                location_risk_weight=0.22,
                weather_risk_weight=0.24,
                traffic_risk_weight=0.19,
                disruption_risk_weight=0.21,
                claim_frequency_weight=0.14,
                suggested_base_premium=52,
            )
        )

    if db.scalar(select(ClaimCase.id).limit(1)) is None:
        db.add_all(
            [
                ClaimCase(
                    id="CLM-1042",
                    policy_id=1,
                    incident_type="Weather Shutdown",
                    incident_at="2026-03-18T09:40:00Z",
                    claim_amount=1200,
                    status="Paid",
                    fraud_score=0.14,
                    auto_approved="yes",
                    notes="Auto-paid in 2m 11s after signal verification",
                ),
                ClaimCase(
                    id="CLM-1049",
                    policy_id=2,
                    incident_type="Platform Outage",
                    incident_at="2026-03-29T14:05:00Z",
                    claim_amount=900,
                    status="Review",
                    fraud_score=0.68,
                    auto_approved="no",
                    notes="Device and platform trace mismatch",
                ),
            ]
        )

    if db.scalar(select(AdminAuditLog.id).limit(1)) is None:
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

    if db.scalar(select(AppUser.id).limit(1)) is None:
        admin = AppUser(
            full_name="Admin User",
            email="admin@rideguard.dev",
            password_hash=hash_password("admin123"),
            role="admin",
            city="Bengaluru",
            platform="RideGuard",
            email_verified_at=datetime.now(timezone.utc).isoformat(),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        rider = AppUser(
            full_name="Arjun Kumar",
            email="rider@rideguard.dev",
            password_hash=hash_password("rider123"),
            role="rider",
            city="Bengaluru",
            platform="Swiggy",
            email_verified_at=datetime.now(timezone.utc).isoformat(),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add_all([admin, rider])
        db.flush()

        db.add_all(
            [
                UserSetting(
                    user_id=admin.id,
                    theme="system",
                    language="en",
                    email_alerts="yes",
                    sms_alerts="no",
                ),
                UserSetting(
                    user_id=rider.id,
                    theme="system",
                    language="en",
                    email_alerts="yes",
                    sms_alerts="yes",
                ),
            ]
        )

    elif db.scalar(select(UserSetting.id).limit(1)) is None:
        users = db.scalars(select(AppUser)).all()
        for user in users:
            db.add(
                UserSetting(
                    user_id=user.id,
                    theme="system",
                    language="en",
                    email_alerts="yes",
                    sms_alerts="no",
                )
            )

    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    # Backfill columns for older SQLite files without Alembic migrations.
    with engine.begin() as conn:
        user_settings_columns = {
            row[1] for row in conn.execute(text("PRAGMA table_info(user_settings)"))
        }
        app_users_columns = {
            row[1] for row in conn.execute(text("PRAGMA table_info(app_users)"))
        }

        app_users_alter_stmts = [
            ("email_verified_at", "ALTER TABLE app_users ADD COLUMN email_verified_at VARCHAR(64)"),
            ("email_verification_token", "ALTER TABLE app_users ADD COLUMN email_verification_token VARCHAR(128)"),
            ("email_verification_expires_at", "ALTER TABLE app_users ADD COLUMN email_verification_expires_at VARCHAR(64)"),
        ]
        for column, stmt in app_users_alter_stmts:
            if column not in app_users_columns:
                conn.execute(text(stmt))

        user_settings_alter_stmts = [
            ("profile_pic_url", "ALTER TABLE user_settings ADD COLUMN profile_pic_url VARCHAR(255) DEFAULT ''"),
            ("id_verification_status", "ALTER TABLE user_settings ADD COLUMN id_verification_status VARCHAR(32) DEFAULT 'unverified'"),
            ("id_number", "ALTER TABLE user_settings ADD COLUMN id_number VARCHAR(64) DEFAULT ''"),
            ("vehicle_type", "ALTER TABLE user_settings ADD COLUMN vehicle_type VARCHAR(32) DEFAULT 'bike'"),
            ("emergency_contact", "ALTER TABLE user_settings ADD COLUMN emergency_contact VARCHAR(32) DEFAULT ''"),
        ]
        for column, stmt in user_settings_alter_stmts:
            if column not in user_settings_columns:
                conn.execute(text(stmt))

        if "email_verified_at" not in app_users_columns:
            conn.execute(text("UPDATE app_users SET email_verified_at = created_at WHERE email_verified_at IS NULL"))
    with Session(engine) as db:
        seed_if_empty(db)
