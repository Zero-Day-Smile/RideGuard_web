from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WeeklyMetric(Base):
    __tablename__ = "weekly_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    active_policies: Mapped[int] = mapped_column(Integer)
    payouts_today: Mapped[int] = mapped_column(Integer)
    fraud_alerts: Mapped[int] = mapped_column(Integer)
    avg_payout_time_min: Mapped[float] = mapped_column(Float)


class RiderSnapshot(Base):
    __tablename__ = "rider_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protected_earnings: Mapped[int] = mapped_column(Integer)
    disruption_events_compensated: Mapped[int] = mapped_column(Integer)
    latest_payout_amount: Mapped[int] = mapped_column(Integer)
    latest_payout_time: Mapped[str] = mapped_column(String(64))
    policy_status: Mapped[str] = mapped_column(String(64))
    policy_window: Mapped[str] = mapped_column(String(64))


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    city: Mapped[str] = mapped_column(String(64))
    level: Mapped[str] = mapped_column(String(16))
    reason: Mapped[str] = mapped_column(String(255))


class CityRiskBand(Base):
    __tablename__ = "city_risk_bands"

    city: Mapped[str] = mapped_column(String(64), primary_key=True)
    score: Mapped[float] = mapped_column(Float)
    disruption: Mapped[str] = mapped_column(String(255))


class DisruptionSignal(Base):
    __tablename__ = "disruption_signals"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(16))
    detail: Mapped[str] = mapped_column(String(255))


class TriggerEvent(Base):
    __tablename__ = "trigger_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    time: Mapped[str] = mapped_column(String(16))
    event: Mapped[str] = mapped_column(String(64))
    effect: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32))


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor: Mapped[str] = mapped_column(String(64), default="dashboard-admin")
    action: Mapped[str] = mapped_column(String(64))
    target_type: Mapped[str] = mapped_column(String(64))
    target_id: Mapped[str] = mapped_column(String(64))
    details: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[str] = mapped_column(String(64))


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rider_name: Mapped[str] = mapped_column(String(64))
    city: Mapped[str] = mapped_column(String(64))
    platform: Mapped[str] = mapped_column(String(32))
    plan_tier: Mapped[str] = mapped_column(String(32))
    coverage_amount: Mapped[int] = mapped_column(Integer)
    deductible: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32))
    start_date: Mapped[str] = mapped_column(String(32))
    end_date: Mapped[str] = mapped_column(String(32))


class PremiumModelSnapshot(Base):
    __tablename__ = "premium_model_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    model_version: Mapped[str] = mapped_column(String(32))
    algorithm_mix: Mapped[str] = mapped_column(String(255))
    refresh_interval_days: Mapped[int] = mapped_column(Integer)
    last_refresh_at: Mapped[str] = mapped_column(String(64))
    next_refresh_at: Mapped[str] = mapped_column(String(64))
    location_risk_weight: Mapped[float] = mapped_column(Float)
    weather_risk_weight: Mapped[float] = mapped_column(Float)
    traffic_risk_weight: Mapped[float] = mapped_column(Float)
    disruption_risk_weight: Mapped[float] = mapped_column(Float)
    claim_frequency_weight: Mapped[float] = mapped_column(Float)
    suggested_base_premium: Mapped[int] = mapped_column(Integer)


class ClaimCase(Base):
    __tablename__ = "claim_cases"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    policy_id: Mapped[int] = mapped_column(Integer)
    incident_type: Mapped[str] = mapped_column(String(64))
    incident_at: Mapped[str] = mapped_column(String(64))
    claim_amount: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32))
    fraud_score: Mapped[float] = mapped_column(Float)
    auto_approved: Mapped[str] = mapped_column(String(8))
    notes: Mapped[str] = mapped_column(String(255))


class AppUser(Base):
    __tablename__ = "app_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16))
    city: Mapped[str] = mapped_column(String(64), default="")
    platform: Mapped[str] = mapped_column(String(32), default="")
    email_verified_at: Mapped[str] = mapped_column(String(64), nullable=True, default=None)
    email_verification_token: Mapped[str] = mapped_column(String(128), nullable=True, default=None)
    email_verification_expires_at: Mapped[str] = mapped_column(String(64), nullable=True, default=None)
    created_at: Mapped[str] = mapped_column(String(64))


class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    theme: Mapped[str] = mapped_column(String(16), default="system")
    language: Mapped[str] = mapped_column(String(16), default="en")
    email_alerts: Mapped[str] = mapped_column(String(8), default="yes")
    sms_alerts: Mapped[str] = mapped_column(String(8), default="no")
    profile_pic_url: Mapped[str] = mapped_column(String(255), default="")
    id_verification_status: Mapped[str] = mapped_column(String(32), default="unverified")
    id_number: Mapped[str] = mapped_column(String(64), default="")
    vehicle_type: Mapped[str] = mapped_column(String(32), default="bike")
    emergency_contact: Mapped[str] = mapped_column(String(32), default="")
