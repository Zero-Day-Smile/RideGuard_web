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
