from fastapi import Depends
from fastapi import FastAPI
from fastapi import Header
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os
import random
import requests
import uuid

from app.auth import decode_token, hash_password, issue_token, verify_password
from app.email_service import build_verification_url, create_verification_token, send_verification_email
from app.db import get_db
from app.ml_engine import PremiumModelConfig, score_dynamic_premium
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
from app.phase2_ml.fraud_detection_engine import FraudDetector
from app.phase2_ml.parametric_trigger_engine import ParametricTriggerEngine
from app.phase2_ml.payout_automation import PayoutProcessor
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


class PolicyUpsertRequest(BaseModel):
    riderName: str = Field(min_length=3, max_length=64)
    city: str = Field(min_length=2, max_length=64)
    platform: str = Field(min_length=2, max_length=32)
    planTier: str = Field(pattern="^(Basic|Standard|Plus)$")
    coverageAmount: int = Field(ge=1000, le=100000)
    deductible: int = Field(ge=0, le=5000)
    status: str = Field(pattern="^(Active|Paused|Expired)$")
    startDate: str = Field(min_length=10, max_length=32)
    endDate: str = Field(min_length=10, max_length=32)


class DynamicPremiumQuoteRequest(BaseModel):
    policyId: int | None = Field(default=None, ge=1)
    coverageAmount: int = Field(ge=1000, le=100000)
    planTier: str = Field(pattern="^(Basic|Standard|Plus)$")
    cityRisk: float = Field(ge=0, le=1)
    weatherRisk: float = Field(ge=0, le=1)
    trafficRisk: float = Field(ge=0, le=1)
    disruptionRisk: float = Field(ge=0, le=1)
    claimFrequencyRisk: float = Field(ge=0, le=1)
    weeklyDistanceKm: float = Field(ge=0, le=2000)
    nightShiftRatio: float = Field(ge=0, le=1)
    reliabilityScore: float = Field(ge=0, le=100)


class AutoClaimCreateRequest(BaseModel):
    policyId: int = Field(ge=1)
    incidentType: str = Field(min_length=3, max_length=64)
    incidentAt: str = Field(min_length=10, max_length=64)
    claimedAmount: int = Field(ge=100, le=100000)
    weatherSeverity: float = Field(ge=0, le=1)
    gpsConsistency: float = Field(ge=0, le=1)
    platformEvidence: float = Field(ge=0, le=1)
    trafficAnomaly: float = Field(ge=0, le=1)
    riderDelayMinutes: int = Field(ge=0, le=600)


class ManualClaimCreateRequest(BaseModel):
    policyId: int = Field(ge=1)
    incidentType: str = Field(min_length=3, max_length=64)
    incidentAt: str = Field(min_length=10, max_length=64)
    claimedAmount: int = Field(ge=100, le=100000)
    summary: str = Field(min_length=5, max_length=255)


class RegisterRequest(BaseModel):
    fullName: str = Field(min_length=3, max_length=64)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=120)
    role: str = Field(default="rider", pattern="^(admin|rider)$")
    city: str | None = Field(default=None, max_length=64)
    platform: str | None = Field(default=None, max_length=32)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=120)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=8, max_length=256)


class ResendVerificationRequest(BaseModel):
    email: str = Field(min_length=5, max_length=120)


class SettingsUpdateRequest(BaseModel):
    fullName: str | None = Field(default=None, min_length=3, max_length=64)
    city: str | None = Field(default=None, max_length=64)
    platform: str | None = Field(default=None, max_length=32)
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")
    language: str | None = Field(default=None, max_length=16)
    emailAlerts: bool | None = Field(default=None)
    smsAlerts: bool | None = Field(default=None)
    profilePicUrl: str | None = Field(default=None, max_length=255)
    idNumber: str | None = Field(default=None, max_length=64)
    vehicleType: str | None = Field(default=None, pattern="^(bike|scooter|cycle|ev)$")
    emergencyContact: str | None = Field(default=None, max_length=32)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=6, max_length=120)
    newPassword: str = Field(min_length=6, max_length=120)


class AdminUserUpsertRequest(BaseModel):
    fullName: str = Field(min_length=3, max_length=64)
    email: str = Field(min_length=5, max_length=120)
    role: str = Field(pattern="^(admin|rider)$")
    city: str = Field(default="", max_length=64)
    platform: str = Field(default="", max_length=32)
    password: str | None = Field(default=None, min_length=6, max_length=120)


app = FastAPI(title="RideGuard Backend API", version="0.1.0")

FRAUD_DETECTOR = FraudDetector()
PARAM_ENGINE = ParametricTriggerEngine()
PAYOUT_PROCESSOR = PayoutProcessor(processing_time=0.0)


def parse_cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost",
        "http://127.0.0.1",
        "capacitor://localhost",
        "ionic://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]


def _safe_float(value: str | None, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _resolve_coordinates(city: str | None, lat: float | None, lon: float | None) -> tuple[float, float, str, str]:
    if lat is not None and lon is not None:
        city_name = city.strip() if city and city.strip() else "Current Location"
        return lat, lon, city_name, "gps"

    fallback_city = (city or "Bengaluru").strip() or "Bengaluru"
    try:
        geo_resp = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": fallback_city, "count": 1, "language": "en", "format": "json"},
            timeout=5,
        )
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        first = (geo_data.get("results") or [None])[0]
        if first:
            return (
                float(first.get("latitude", 12.9716)),
                float(first.get("longitude", 77.5946)),
                str(first.get("name") or fallback_city),
                "city-geocode",
            )
    except Exception:
        pass

    return 12.9716, 77.5946, fallback_city, "fallback"


def _fetch_weather_snapshot(lat: float, lon: float) -> dict:
    openweather_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
    if openweather_key:
        try:
            weather_resp = requests.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": openweather_key,
                    "units": "metric",
                },
                timeout=5,
            )
            weather_resp.raise_for_status()
            payload = weather_resp.json()
            weather_items = payload.get("weather") or [{}]
            main = payload.get("main", {})
            wind = payload.get("wind", {})
            rain = payload.get("rain", {})
            weather_code = int((weather_items[0].get("id") if weather_items else 0) or 0)
            rain_mm = float(rain.get("1h") or rain.get("3h") or 0)
            wind_speed = float(wind.get("speed") or 0) * 3.6
            status = "normal"
            if rain_mm >= 8 or wind_speed >= 30:
                status = "critical"
            elif rain_mm >= 2 or wind_speed >= 18:
                status = "watch"

            return {
                "status": status,
                "temperatureC": float(main.get("temp") or 0),
                "humidity": float(main.get("humidity") or 0),
                "rainMm": rain_mm,
                "windSpeedKmph": wind_speed,
                "weatherCode": weather_code,
                "source": "openweather",
                "observedAt": datetime.now(timezone.utc).isoformat(),
                "provider": "OpenWeather",
            }
        except Exception:
            pass

    try:
        weather_resp = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain,weather_code",
                "timezone": "auto",
            },
            timeout=5,
        )
        weather_resp.raise_for_status()
        current = weather_resp.json().get("current", {})

        rain_mm = float(current.get("rain") or current.get("precipitation") or 0)
        wind = float(current.get("wind_speed_10m") or 0)
        status = "normal"
        if rain_mm >= 8 or wind >= 30:
            status = "critical"
        elif rain_mm >= 2 or wind >= 18:
            status = "watch"

        return {
            "status": status,
            "temperatureC": float(current.get("temperature_2m") or 0),
            "humidity": float(current.get("relative_humidity_2m") or 0),
            "rainMm": rain_mm,
            "windSpeedKmph": wind,
            "weatherCode": int(current.get("weather_code") or 0),
            "source": "open-meteo",
            "observedAt": str(current.get("time") or datetime.now(timezone.utc).isoformat()),
            "provider": "Open-Meteo",
        }
    except Exception:
        return {
            "status": "unavailable",
            "temperatureC": 0.0,
            "humidity": 0.0,
            "rainMm": 0.0,
            "windSpeedKmph": 0.0,
            "weatherCode": 0,
            "source": "open-meteo",
            "observedAt": datetime.now(timezone.utc).isoformat(),
            "provider": "fallback",
        }


def _fallback_traffic_snapshot(weather: dict) -> dict:
    hour_utc = datetime.now(timezone.utc).hour
    rush = 1.0 if hour_utc in {3, 4, 11, 12, 13, 14} else 0.0
    weather_penalty = min(0.35, weather.get("rainMm", 0.0) / 30.0)
    congestion = max(0.05, min(0.95, 0.28 + rush * 0.32 + weather_penalty))
    free_flow = 42.0
    current_speed = round(free_flow * (1 - congestion), 1)
    delay = round(congestion * 16, 1)

    status = "normal"
    if congestion >= 0.65:
        status = "critical"
    elif congestion >= 0.4:
        status = "watch"

    return {
        "status": status,
        "congestion": round(congestion, 2),
        "currentSpeedKmph": current_speed,
        "freeFlowSpeedKmph": free_flow,
        "travelTimeDelayMin": delay,
        "source": "heuristic-fallback",
        "provider": "fallback",
        "observedAt": datetime.now(timezone.utc).isoformat(),
    }


def _fetch_traffic_snapshot(lat: float, lon: float, weather: dict) -> dict:
    google_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if google_key:
        try:
            traffic_resp = requests.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params={
                    "origin": f"{lat},{lon}",
                    "destination": f"{lat + 0.03:.5f},{lon + 0.03:.5f}",
                    "departure_time": "now",
                    "traffic_model": "best_guess",
                    "key": google_key,
                },
                timeout=5,
            )
            traffic_resp.raise_for_status()
            payload = traffic_resp.json()
            routes = payload.get("routes") or []
            legs = routes[0].get("legs") if routes else []
            leg = (legs or [{}])[0]
            duration_in_traffic = (leg.get("duration_in_traffic") or {}).get("value")
            duration = (leg.get("duration") or {}).get("value")
            if duration_in_traffic is None or duration is None:
                return _fallback_traffic_snapshot(weather)

            ratio = max(0.0, min(1.0, duration_in_traffic / max(duration, 1)))
            congestion = max(0.0, min(1.0, ratio - 1 if ratio > 1 else ratio * 0.9))
            free_flow = round((leg.get("distance") or {}).get("value", 0) / max(duration or 1, 1) * 3.6, 1)
            current_speed = round((leg.get("distance") or {}).get("value", 0) / max(duration_in_traffic or 1, 1) * 3.6, 1)
            delay = round(max(0, (duration_in_traffic - duration)) / 60, 1)

            status = "normal"
            if congestion >= 0.65:
                status = "critical"
            elif congestion >= 0.4:
                status = "watch"

            return {
                "status": status,
                "congestion": round(congestion, 2),
                "currentSpeedKmph": current_speed,
                "freeFlowSpeedKmph": free_flow,
                "travelTimeDelayMin": delay,
                "source": "google-directions",
                "observedAt": datetime.now(timezone.utc).isoformat(),
                "provider": "Google Maps",
            }
        except Exception:
            return _fallback_traffic_snapshot(weather)

    return _fallback_traffic_snapshot(weather)


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


def serialize_user(user: AppUser) -> dict:
    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "role": user.role,
        "city": user.city,
        "platform": user.platform,
        "emailVerified": bool(user.email_verified_at),
        "emailVerifiedAt": user.email_verified_at,
    }


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AppUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload.get("sub", 0))
    user = db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")

    return user


def require_roles(*allowed: str):
    def _dep(current_user: AppUser = Depends(get_current_user)) -> AppUser:
        if current_user.role not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user

    return _dep


def policy_owned_by_user(policy: InsurancePolicy, user: AppUser) -> bool:
    if user.role == "admin":
        return True
    return policy.rider_name.strip().lower() == user.full_name.strip().lower()


def estimate_policy_weekly_premium(
    policy: InsurancePolicy,
    snapshot: PremiumModelSnapshot,
    city_scores: dict[str, float],
) -> int:
    tier_multiplier = {"Basic": 0.9, "Standard": 1.0, "Plus": 1.14}.get(policy.plan_tier, 1.0)
    coverage_multiplier = min(1.25, 0.85 + (policy.coverage_amount / 10000.0))
    city_band = city_scores.get(policy.city, 0.6)
    return round(snapshot.suggested_base_premium * tier_multiplier * coverage_multiplier * (1 + city_band * 0.05))


def compute_portfolio_metrics(db: Session) -> dict:
    snapshot = db.scalar(select(PremiumModelSnapshot).order_by(PremiumModelSnapshot.id.desc()).limit(1))
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Premium model snapshot unavailable")

    policies = db.scalars(select(InsurancePolicy)).all()
    claims = db.scalars(select(ClaimCase)).all()
    city_scores = {band.city: band.score for band in db.scalars(select(CityRiskBand)).all()}
    active_policies = [item for item in policies if item.status == "Active"]

    weekly_premium_collected = sum(
        estimate_policy_weekly_premium(item, snapshot, city_scores) for item in active_policies
    )
    total_premium_collected = max(weekly_premium_collected * 4, 1)
    total_claims = sum(item.claim_amount for item in claims if item.status == "Paid")
    bcr = round(total_claims / total_premium_collected, 2)
    loss_ratio = round(total_claims / total_premium_collected, 2)

    return {
        "activePolicies": len(active_policies),
        "policyCount": len(policies),
        "weeklyPremiumCollected": weekly_premium_collected,
        "totalPremiumCollected": total_premium_collected,
        "totalClaimsPaid": total_claims,
        "bcr": bcr,
        "targetBcrLower": 0.55,
        "targetBcrUpper": 0.7,
        "lossRatio": loss_ratio,
        "enrollmentState": "suspend new enrollments" if loss_ratio > 0.85 else "open new enrollments",
    }


def build_strategy_payload(db: Session) -> dict:
    metrics = compute_portfolio_metrics(db)

    return {
        "underwriting": {
            "title": "Underwriting - who gets covered",
            "rules": [
                "Active gig worker on Zomato / Swiggy / Zepto",
                "Minimum 7 active delivery days before cover starts",
                "City-based pools - Delhi AQI pool != Mumbai rain pool",
                "Workers with < 5 active days in 30 days move to a lower tier",
            ],
            "disclosure": "Keep underwriting and onboarding under 4-5 steps.",
        },
        "triggers": {
            "title": "Trigger design - what fires the payout",
            "rules": [
                "AQI > 300 via CPCB data feed - Delhi, Gurugram, Noida",
                "Weather + traffic + platform uptime checked together",
                "Use historical data and rolling forecasts to reduce false positives",
                "Trigger must match worker city AND active hours",
            ],
            "disclosure": "Use ward-level data, not city-average.",
        },
        "pricing": {
            "title": "Pricing - the weekly premium model",
            "targetRange": "₹20-₹50 per worker per week",
            "baseFormula": "trigger probability × avg income lost per day × days exposed",
            "adjustments": [
                "Adjust for city, peril type, worker activity tier",
                "Weekly cycle matches gig payout rhythm - never monthly",
            ],
            "modelVersion": db.scalar(select(PremiumModelSnapshot).order_by(PremiumModelSnapshot.id.desc()).limit(1)).model_version,
        },
        "actuarial": {
            "title": "Actuarial basics - does the math hold?",
            "bcr": metrics["bcr"],
            "targetBcrLower": metrics["targetBcrLower"],
            "targetBcrUpper": metrics["targetBcrUpper"],
            "lossRatio": metrics["lossRatio"],
            "lossRatioLimit": 0.85,
            "enrollmentState": metrics["enrollmentState"],
            "stressScenario": "14-day monsoon with traffic congestion and platform outages",
        },
        "settlement": {
            "title": "Settlement - payout strategies and channels",
            "steps": [
                "Trigger confirmed",
                "Worker eligibility check",
                "Payout calculated",
                "Transfer initiated",
                "Record updated",
            ],
            "channels": ["UPI transfer", "IMPS to bank", "Razorpay / Stripe sandbox"],
            "keyPoints": [
                "Zero-touch: worker does nothing to receive payout.",
                "Defined settlement time - keep it in minutes, not hours.",
                "Rollback logic if transfer fails mid-way.",
                "Fraud check before payment, not after payment.",
            ],
        },
        "metrics": metrics,
    }


def retrain_premium_snapshot(db: Session) -> PremiumModelSnapshot:
    snapshot = db.scalar(select(PremiumModelSnapshot).order_by(PremiumModelSnapshot.id.desc()).limit(1))
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Premium model snapshot unavailable")

    policies = db.scalars(select(InsurancePolicy)).all()
    claims = db.scalars(select(ClaimCase)).all()
    city_scores = {band.city: band.score for band in db.scalars(select(CityRiskBand)).all()}

    active_policies = [item for item in policies if item.status == "Active"]
    paid_claims = [item for item in claims if item.status == "Paid"]
    avg_city_score = sum(city_scores.get(item.city, 0.6) for item in active_policies) / max(len(active_policies), 1)
    claims_pressure = sum(item.claim_amount for item in paid_claims) / max(len(active_policies), 1)

    snapshot.location_risk_weight = round(min(0.32, 0.18 + avg_city_score * 0.12), 2)
    snapshot.weather_risk_weight = round(min(0.32, 0.2 + len(paid_claims) * 0.01), 2)
    snapshot.traffic_risk_weight = round(min(0.24, 0.16 + len(active_policies) * 0.005), 2)
    snapshot.disruption_risk_weight = round(min(0.26, 0.18 + len(db.scalars(select(DisruptionSignal)).all()) * 0.01), 2)
    snapshot.claim_frequency_weight = round(min(0.22, 0.12 + min(claims_pressure / 10000.0, 0.1)), 2)
    snapshot.suggested_base_premium = max(20, min(50, round(22 + claims_pressure / max(len(active_policies), 1) / 250)))
    snapshot.last_refresh_at = datetime.now(timezone.utc).isoformat()
    snapshot.next_refresh_at = (datetime.now(timezone.utc) + timedelta(days=snapshot.refresh_interval_days)).isoformat()
    return snapshot


@app.on_event("startup")
def on_startup() -> None:
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_origin_regex=r"^(capacitor|ionic|http|https)://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "RideGuard Backend API",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    existing = db.scalar(select(AppUser).where(AppUser.email == request.email.lower().strip()))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    verification_token, verification_expires_at = create_verification_token()

    user = AppUser(
        full_name=request.fullName.strip(),
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password),
        role=request.role,
        city=(request.city or "").strip(),
        platform=(request.platform or "").strip(),
        email_verified_at=None,
        email_verification_token=verification_token,
        email_verification_expires_at=verification_expires_at,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.flush()

    db.add(
        UserSetting(
            user_id=user.id,
            theme="system",
            language="en",
            email_alerts="yes",
            sms_alerts="yes" if user.role == "rider" else "no",
        )
    )

    if user.role == "rider":
        db.add(
            InsurancePolicy(
                rider_name=user.full_name,
                city=user.city or "Bengaluru",
                platform=user.platform or "Swiggy",
                plan_tier="Standard",
                coverage_amount=4000,
                deductible=300,
                status="Active",
                start_date=datetime.now(timezone.utc).date().isoformat(),
                end_date="2026-12-31",
            )
        )

    db.commit()

    verification_url = build_verification_url(verification_token)
    verification_sent = send_verification_email(user.email, user.full_name, verification_url)
    return {
        "verificationRequired": True,
        "verificationSent": verification_sent,
        "user": serialize_user(user),
    }


@app.post("/api/v1/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(AppUser).where(AppUser.email == request.email.lower().strip()))
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_verified_at:
        raise HTTPException(status_code=403, detail="Email not verified")

    token = issue_token({"sub": user.id, "role": user.role, "email": user.email})
    return {"token": token, "user": serialize_user(user)}


@app.get("/api/v1/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(AppUser).where(AppUser.email_verification_token == token))
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if user.email_verification_expires_at:
        expires_at = datetime.fromisoformat(user.email_verification_expires_at)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Verification token expired")

    user.email_verified_at = datetime.now(timezone.utc).isoformat()
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    return {"status": "verified", "user": serialize_user(user)}


@app.post("/api/v1/auth/resend-verification")
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(AppUser).where(AppUser.email == request.email.lower().strip()))
    if user is None:
        return {"status": "ok"}

    if user.email_verified_at:
        return {"status": "already_verified"}

    verification_token, verification_expires_at = create_verification_token()
    user.email_verification_token = verification_token
    user.email_verification_expires_at = verification_expires_at
    db.commit()
    verification_url = build_verification_url(verification_token)
    verification_sent = send_verification_email(user.email, user.full_name, verification_url)
    return {"status": "ok", "verificationSent": verification_sent}


@app.get("/api/v1/auth/me")
def auth_me(current_user: AppUser = Depends(get_current_user)) -> dict:
    return {"user": serialize_user(current_user)}


@app.get("/api/v1/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    settings = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
    if settings is None:
        settings = UserSetting(
            user_id=current_user.id,
            theme="system",
            language="en",
            email_alerts="yes",
            sms_alerts="no",
        )
        db.add(settings)
        db.commit()

    return {
        "profile": serialize_user(current_user),
        "preferences": {
            "theme": settings.theme,
            "language": settings.language,
            "emailAlerts": settings.email_alerts == "yes",
            "smsAlerts": settings.sms_alerts == "yes",
            "profilePicUrl": settings.profile_pic_url,
            "idVerificationStatus": settings.id_verification_status,
            "idNumber": settings.id_number,
            "vehicleType": settings.vehicle_type,
            "emergencyContact": settings.emergency_contact,
        },
    }


@app.patch("/api/v1/settings")
def update_settings(
    request: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    settings = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
    if settings is None:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)

    if request.fullName is not None:
        current_user.full_name = request.fullName
    if request.city is not None:
        current_user.city = request.city
    if request.platform is not None:
        current_user.platform = request.platform
    if request.theme is not None:
        settings.theme = request.theme
    if request.language is not None:
        settings.language = request.language
    if request.emailAlerts is not None:
        settings.email_alerts = "yes" if request.emailAlerts else "no"
    if request.smsAlerts is not None:
        settings.sms_alerts = "yes" if request.smsAlerts else "no"
    if request.profilePicUrl is not None:
        settings.profile_pic_url = request.profilePicUrl
    if request.idNumber is not None:
        settings.id_number = request.idNumber
        # Verification status is system-managed. User submission moves to pending.
        if request.idNumber.strip() == "":
            settings.id_verification_status = "unverified"
        elif settings.id_verification_status != "verified":
            settings.id_verification_status = "pending"
    if request.vehicleType is not None:
        settings.vehicle_type = request.vehicleType
    if request.emergencyContact is not None:
        settings.emergency_contact = request.emergencyContact

    db.commit()
    return get_settings(db=db, current_user=current_user)


@app.post("/api/v1/auth/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    if not verify_password(request.currentPassword, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(request.newPassword)
    db.commit()
    return {"status": "ok"}


@app.get("/api/v1/rider/summary")
def rider_summary(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
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
def admin_overview(
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
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
def triggers(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
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


@app.get("/api/v1/location/risk-bands")
def location_risk_bands(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    bands = db.scalars(select(CityRiskBand).order_by(CityRiskBand.score.desc())).all()
    return {
        "cityRiskBands": [
            {"city": item.city, "score": item.score, "disruption": item.disruption}
            for item in bands
        ]
    }


@app.get("/api/v1/realtime/context")
def realtime_context(
    lat: str | None = None,
    lon: str | None = None,
    city: str | None = None,
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    requested_lat = _safe_float(lat, default=999.0)
    requested_lon = _safe_float(lon, default=999.0)

    valid_lat = requested_lat if -90 <= requested_lat <= 90 else None
    valid_lon = requested_lon if -180 <= requested_lon <= 180 else None

    default_city = city or current_user.city or "Bengaluru"
    resolved_lat, resolved_lon, resolved_city, location_source = _resolve_coordinates(
        default_city,
        valid_lat,
        valid_lon,
    )

    weather = _fetch_weather_snapshot(resolved_lat, resolved_lon)
    traffic = _fetch_traffic_snapshot(resolved_lat, resolved_lon, weather)

    return {
        "location": {
            "city": resolved_city,
            "latitude": round(resolved_lat, 6),
            "longitude": round(resolved_lon, 6),
            "source": location_source,
        },
        "weather": weather,
        "traffic": traffic,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/signals/{signal_name}")
def get_signal(
    signal_name: str,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    lookup = {
        "weather": "Weather",
        "traffic": "Traffic",
        "platform-outage": "Platform Uptime",
        "platform_outage": "Platform Uptime",
        "local-disruption": "Local Disruption",
        "local_disruption": "Local Disruption",
        "location": "Location",
    }.get(signal_name.lower())

    if lookup == "Location":
        bands = db.scalars(select(CityRiskBand).order_by(CityRiskBand.score.desc())).all()
        return {
            "name": "Location",
            "status": "ready",
            "details": [
                {"city": item.city, "score": item.score, "disruption": item.disruption}
                for item in bands
            ],
        }

    if lookup is None:
        raise HTTPException(status_code=404, detail="Signal not found")

    signal = db.scalar(select(DisruptionSignal).where(DisruptionSignal.name == lookup))
    if signal is None:
        raise HTTPException(status_code=404, detail="Signal not found")

    return {
        "name": signal.name,
        "status": signal.status,
        "detail": signal.detail,
    }


@app.post("/api/v1/triggers/refresh")
def refresh_triggers(
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    """Simulate 3–5 automated triggers using public/mock APIs.

    - Weather: Open-Meteo (public, free) for current rain intensity.
    - Platform outage / traffic / local disruption: mocked signals that
      follow the same shape, so the dashboard can treat them uniformly.
    """

    # Weather via Open-Meteo (Bengaluru coordinates by default)
    try:
        weather_res = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": 12.97,
                "longitude": 77.59,
                "hourly": "rain,weathercode",
                "forecast_days": 1,
            },
            timeout=3,
        )
        weather_res.raise_for_status()
        weather_data = weather_res.json()
        rain_series = weather_data.get("hourly", {}).get("rain", [])
        latest_rain = float(rain_series[-1]) if rain_series else 0.0
    except Exception:
        latest_rain = 0.0

    # Clear existing signals for a simple demo refresh.
    db.query(DisruptionSignal).delete()
    db.query(TriggerEvent).delete()

    db.add_all(
        [
            DisruptionSignal(
                name="Weather",
                status="critical" if latest_rain >= 10 else "watch" if latest_rain > 0 else "normal",
                detail=f"Rainfall {latest_rain:.1f} mm/h in core zones",
            ),
            DisruptionSignal(
                name="Platform Uptime",
                status="watch",
                detail="Mock API latency spike in south region",
            ),
            DisruptionSignal(
                name="Traffic",
                status="watch",
                detail=f"Mock congestion index +{random.randint(15,40)}% vs baseline",
            ),
            DisruptionSignal(
                name="Local Disruption",
                status="critical",
                detail="Mock civic alert: water-logging in 3 zones",
            ),
        ]
    )

    now_label = datetime.now(timezone.utc).strftime("%H:%M")
    db.add_all(
        [
            TriggerEvent(
                time=now_label,
                event="Heavy Rain" if latest_rain >= 10 else "Light Rain",
                effect=f"Delivery activity down {random.randint(20,50)}%",
                status="Verified" if latest_rain >= 5 else "Review",
            ),
            TriggerEvent(
                time=now_label,
                event="Platform Downtime",
                effect="Synthetic API error burst",
                status="Review",
            ),
            TriggerEvent(
                time=now_label,
                event="Traffic Lockdown",
                effect="Mock police advisory for 2 corridors",
                status="Triggered",
            ),
        ]
    )

    append_audit_log(
        db=db,
        action="triggers_refreshed",
        target_type="trigger_batch",
        target_id="auto-refresh",
        details="Pulled latest weather + mock platform/traffic/local disruptions",
    )
    db.commit()

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
def admin_audit_logs(
    limit: int = 20,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
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


@app.get("/api/v1/admin/users")
def list_users(
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    users = db.scalars(select(AppUser).order_by(AppUser.id.asc())).all()
    return {
        "users": [
            {
                "id": user.id,
                "fullName": user.full_name,
                "email": user.email,
                "role": user.role,
                "city": user.city,
                "platform": user.platform,
                "createdAt": user.created_at,
            }
            for user in users
        ]
    }


@app.post("/api/v1/admin/users")
def create_user(
    request: AdminUserUpsertRequest,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    existing = db.scalar(select(AppUser).where(AppUser.email == request.email.lower().strip()))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = AppUser(
        full_name=request.fullName.strip(),
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password or "TempPass123"),
        role=request.role,
        city=request.city,
        platform=request.platform,
        email_verified_at=datetime.now(timezone.utc).isoformat(),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.flush()
    db.add(
        UserSetting(
            user_id=user.id,
            theme="system",
            language="en",
            email_alerts="yes",
            sms_alerts="yes" if user.role == "rider" else "no",
        )
    )
    db.commit()
    return {"user": serialize_user(user)}


@app.patch("/api/v1/admin/users/{user_id}")
def update_user(
    user_id: int,
    request: AdminUserUpsertRequest,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    user = db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.full_name = request.fullName.strip()
    user.email = request.email.lower().strip()
    user.role = request.role
    user.city = request.city
    user.platform = request.platform
    if request.password:
        user.password_hash = hash_password(request.password)
    user.email_verified_at = datetime.now(timezone.utc).isoformat()
    user.email_verification_token = None
    user.email_verification_expires_at = None

    settings = db.scalar(select(UserSetting).where(UserSetting.user_id == user.id))
    if settings is None:
        settings = UserSetting(user_id=user.id)
        db.add(settings)
    if user.role == "rider" and settings.sms_alerts not in {"yes", "no"}:
        settings.sms_alerts = "yes"

    db.commit()
    return {"user": serialize_user(user)}


@app.post("/api/v1/pricing/quote")
def pricing_quote(
    request: QuoteRequest,
    current_user: AppUser = Depends(get_current_user),
) -> dict:
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
def create_fraud_alert(
    request: FraudAlertCreateRequest,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
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
    _: AppUser = Depends(require_roles("admin")),
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
def create_trigger_event(
    request: TriggerEventCreateRequest,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
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
    _: AppUser = Depends(require_roles("admin")),
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


@app.get("/api/v1/policies")
def list_policies(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    all_policies = db.scalars(select(InsurancePolicy).order_by(InsurancePolicy.id.asc())).all()
    if current_user.role == "admin":
        policies = all_policies
    else:
        policies = [item for item in all_policies if policy_owned_by_user(item, current_user)]
    return {
        "policies": [
            {
                "id": item.id,
                "riderName": item.rider_name,
                "city": item.city,
                "platform": item.platform,
                "planTier": item.plan_tier,
                "coverageAmount": item.coverage_amount,
                "deductible": item.deductible,
                "status": item.status,
                "startDate": item.start_date,
                "endDate": item.end_date,
            }
            for item in policies
        ]
    }


@app.post("/api/v1/policies")
def create_policy(
    request: PolicyUpsertRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    rider_name = current_user.full_name if current_user.role == "rider" else request.riderName
    policy = InsurancePolicy(
        rider_name=rider_name,
        city=request.city,
        platform=request.platform,
        plan_tier=request.planTier,
        coverage_amount=request.coverageAmount,
        deductible=request.deductible,
        status=request.status,
        start_date=request.startDate,
        end_date=request.endDate,
    )
    db.add(policy)
    db.flush()

    append_audit_log(
        db=db,
        action="policy_created",
        target_type="policy",
        target_id=str(policy.id),
        details=f"Created {policy.plan_tier} plan for {policy.rider_name}",
    )
    db.commit()

    return {
        "id": policy.id,
        "riderName": policy.rider_name,
        "city": policy.city,
        "platform": policy.platform,
        "planTier": policy.plan_tier,
        "coverageAmount": policy.coverage_amount,
        "deductible": policy.deductible,
        "status": policy.status,
        "startDate": policy.start_date,
        "endDate": policy.end_date,
    }


@app.patch("/api/v1/policies/{policy_id}")
def update_policy(
    policy_id: int,
    request: PolicyUpsertRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    policy = db.get(InsurancePolicy, policy_id)
    if policy is None:
        raise HTTPException(status_code=404, detail="Policy not found")

    if not policy_owned_by_user(policy, current_user):
        raise HTTPException(status_code=403, detail="You cannot edit this policy")

    policy.rider_name = current_user.full_name if current_user.role == "rider" else request.riderName
    policy.city = request.city
    policy.platform = request.platform
    policy.plan_tier = request.planTier
    policy.coverage_amount = request.coverageAmount
    policy.deductible = request.deductible
    policy.status = request.status
    policy.start_date = request.startDate
    policy.end_date = request.endDate

    append_audit_log(
        db=db,
        action="policy_updated",
        target_type="policy",
        target_id=str(policy.id),
        details=f"Updated {policy.plan_tier} coverage to {policy.coverage_amount}",
    )
    db.commit()

    return {
        "id": policy.id,
        "riderName": policy.rider_name,
        "city": policy.city,
        "platform": policy.platform,
        "planTier": policy.plan_tier,
        "coverageAmount": policy.coverage_amount,
        "deductible": policy.deductible,
        "status": policy.status,
        "startDate": policy.start_date,
        "endDate": policy.end_date,
    }


@app.get("/api/v1/pricing/model-snapshot")
def pricing_model_snapshot(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    snapshot = db.scalar(select(PremiumModelSnapshot).order_by(PremiumModelSnapshot.id.desc()).limit(1))
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Premium model snapshot unavailable")

    return {
        "modelVersion": snapshot.model_version,
        "algorithmMix": snapshot.algorithm_mix,
        "refreshIntervalDays": snapshot.refresh_interval_days,
        "lastRefreshAt": snapshot.last_refresh_at,
        "nextRefreshAt": snapshot.next_refresh_at,
        "weights": {
            "locationRisk": snapshot.location_risk_weight,
            "weatherRisk": snapshot.weather_risk_weight,
            "trafficRisk": snapshot.traffic_risk_weight,
            "disruptionRisk": snapshot.disruption_risk_weight,
            "claimFrequencyRisk": snapshot.claim_frequency_weight,
        },
        "suggestedBasePremium": snapshot.suggested_base_premium,
    }


@app.post("/api/v1/pricing/dynamic-quote")
def dynamic_pricing_quote(
    request: DynamicPremiumQuoteRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    if request.policyId is not None and current_user.role != "admin":
        policy = db.get(InsurancePolicy, request.policyId)
        if policy is None or not policy_owned_by_user(policy, current_user):
            raise HTTPException(status_code=403, detail="Policy not accessible")

    snapshot = db.scalar(select(PremiumModelSnapshot).order_by(PremiumModelSnapshot.id.desc()).limit(1))
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Premium model snapshot unavailable")

    cfg = PremiumModelConfig(
        base_premium=snapshot.suggested_base_premium,
        location_weight=snapshot.location_risk_weight,
        weather_weight=snapshot.weather_risk_weight,
        traffic_weight=snapshot.traffic_risk_weight,
        disruption_weight=snapshot.disruption_risk_weight,
        claim_frequency_weight=snapshot.claim_frequency_weight,
    )

    model_result = score_dynamic_premium(
        cfg,
        coverage_amount=request.coverageAmount,
        plan_tier=request.planTier,
        city_risk=request.cityRisk,
        weather_risk=request.weatherRisk,
        traffic_risk=request.trafficRisk,
        disruption_risk=request.disruptionRisk,
        claim_frequency_risk=request.claimFrequencyRisk,
        weekly_distance_km=request.weeklyDistanceKm,
        night_shift_ratio=request.nightShiftRatio,
        reliability_score=request.reliabilityScore,
    )

    return {
        "weeklyPremium": model_result.weekly_premium,
        "riskBand": "high" if model_result.ensemble_risk >= 0.67 else "medium" if model_result.ensemble_risk >= 0.4 else "low",
        "ensembleRisk": round(model_result.ensemble_risk, 3),
        "model": {
            "modelVersion": snapshot.model_version,
            "algorithmMix": snapshot.algorithm_mix,
            "nextRefreshAt": snapshot.next_refresh_at,
            "refreshIntervalDays": snapshot.refresh_interval_days,
        },
        "inputs": {
            "policyId": request.policyId,
            "coverageAmount": request.coverageAmount,
            "planTier": request.planTier,
            "cityRisk": request.cityRisk,
            "weatherRisk": request.weatherRisk,
            "trafficRisk": request.trafficRisk,
            "disruptionRisk": request.disruptionRisk,
            "claimFrequencyRisk": request.claimFrequencyRisk,
            "weeklyDistanceKm": request.weeklyDistanceKm,
            "nightShiftRatio": request.nightShiftRatio,
            "reliabilityScore": request.reliabilityScore,
        },
    }


@app.get("/api/v1/ml/strategy")
def ml_strategy(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    return build_strategy_payload(db)


@app.post("/api/v1/ml/retrain")
def ml_retrain(
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    snapshot = retrain_premium_snapshot(db)
    append_audit_log(
        db=db,
        action="ml_retrained",
        target_type="premium_model",
        target_id=str(snapshot.id),
        details=f"Updated snapshot to base premium {snapshot.suggested_base_premium}",
    )
    db.commit()
    return build_strategy_payload(db)


@app.get("/api/v1/claims")
def list_claims(
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    all_claims = db.scalars(select(ClaimCase).order_by(ClaimCase.id.desc())).all()
    if current_user.role == "admin":
        claims = all_claims
    else:
        policies = db.scalars(select(InsurancePolicy)).all()
        owned_ids = {item.id for item in policies if policy_owned_by_user(item, current_user)}
        claims = [item for item in all_claims if item.policy_id in owned_ids]
    return {
        "claims": [
            {
                "id": item.id,
                "policyId": item.policy_id,
                "incidentType": item.incident_type,
                "incidentAt": item.incident_at,
                "claimAmount": item.claim_amount,
                "status": item.status,
                "fraudScore": round(item.fraud_score, 2),
                "autoApproved": item.auto_approved == "yes",
                "notes": item.notes,
            }
            for item in claims
        ]
    }


@app.post("/api/v1/claims/auto-file")
def auto_file_claim(
    request: AutoClaimCreateRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    policy = db.get(InsurancePolicy, request.policyId)
    if policy is None:
        raise HTTPException(status_code=404, detail="Policy not found")

    if not policy_owned_by_user(policy, current_user):
        raise HTTPException(status_code=403, detail="Cannot file claim on this policy")

    payout_cap = max(0, policy.coverage_amount - policy.deductible)
    capped_amount = min(request.claimedAmount, payout_cap)
    activity_sample = [
        max(0.0, min(1.0, 1 - request.gpsConsistency)),
        max(0.0, min(1.0, capped_amount / max(float(policy.coverage_amount), 1.0))),
        max(0.0, min(1.0, request.riderDelayMinutes / 600.0)),
        0.1,
    ]

    fraud_result = FRAUD_DETECTOR.evaluate(activity_sample)
    fraud_score = float(fraud_result["risk_score"])

    weather_mm = float(request.weatherSeverity * 100.0)
    baseline_deliveries = 40.0
    current_deliveries = max(1.0, baseline_deliveries * (1.0 - request.trafficAnomaly))
    trigger_result = PARAM_ENGINE.check_trigger(
        weather_mm=weather_mm,
        current_deliveries=current_deliveries,
        baseline_deliveries=baseline_deliveries,
    )

    auto_approved = (
        capped_amount <= payout_cap
        and PAYOUT_PROCESSOR.validate_user(fraud_result, trigger_result)
    )
    status = "Paid" if auto_approved else "Review"
    delay_flag = "Delayed" if request.riderDelayMinutes > 120 else "Within SLA"
    claim_id = f"CLM-{uuid.uuid4().hex[:10].upper()}"
    notes = (
        f"{delay_flag}; cap={payout_cap}; gps={request.gpsConsistency:.2f}; "
        f"platform={request.platformEvidence:.2f}; traffic={request.trafficAnomaly:.2f}; "
        f"ml_fraud={fraud_score:.2f}; param_trigger={'on' if trigger_result['triggered'] else 'off'}"
    )

    claim = ClaimCase(
        id=claim_id,
        policy_id=policy.id,
        incident_type=request.incidentType,
        incident_at=request.incidentAt,
        claim_amount=capped_amount,
        status=status,
        fraud_score=fraud_score,
        auto_approved="yes" if auto_approved else "no",
        notes=notes,
    )
    db.add(claim)

    append_audit_log(
        db=db,
        action="claim_auto_filed",
        target_type="claim",
        target_id=claim.id,
        details=f"status={status}, fraud_score={fraud_score:.2f}, policy={policy.id}",
    )
    db.commit()

    return {
        "id": claim.id,
        "policyId": claim.policy_id,
        "incidentType": claim.incident_type,
        "incidentAt": claim.incident_at,
        "claimAmount": claim.claim_amount,
        "status": claim.status,
        "fraudScore": round(claim.fraud_score, 2),
        "autoApproved": claim.auto_approved == "yes",
        "notes": claim.notes,
    }


@app.post("/api/v1/claims/manual-file")
def manual_file_claim(
    request: ManualClaimCreateRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
) -> dict:
    policy = db.get(InsurancePolicy, request.policyId)
    if policy is None:
        raise HTTPException(status_code=404, detail="Policy not found")

    if not policy_owned_by_user(policy, current_user):
        raise HTTPException(status_code=403, detail="Cannot file claim on this policy")

    payout_cap = max(0, policy.coverage_amount - policy.deductible)
    capped_amount = min(request.claimedAmount, payout_cap)

    claim_id = f"CLM-M-{uuid.uuid4().hex[:10].upper()}"
    claim = ClaimCase(
        id=claim_id,
        policy_id=policy.id,
        incident_type=request.incidentType,
        incident_at=request.incidentAt,
        claim_amount=capped_amount,
        status="Pending Valuation",
        fraud_score=0.0,
        auto_approved="no",
        notes=f"manual_submission; summary={request.summary}",
    )
    db.add(claim)

    append_audit_log(
        db=db,
        action="claim_manual_filed",
        target_type="claim",
        target_id=claim.id,
        details=f"status={claim.status}, policy={policy.id}",
    )
    db.commit()

    return {
        "id": claim.id,
        "policyId": claim.policy_id,
        "incidentType": claim.incident_type,
        "incidentAt": claim.incident_at,
        "claimAmount": claim.claim_amount,
        "status": claim.status,
        "fraudScore": round(claim.fraud_score, 2),
        "autoApproved": claim.auto_approved == "yes",
        "notes": claim.notes,
    }


@app.post("/api/v1/admin/claims/{claim_id}/retry")
def retry_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    claim = db.get(ClaimCase, claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Retry flow: if risk is acceptable, move the claim to paid.
    if claim.status != "Paid" and claim.fraud_score < 0.7:
        claim.status = "Paid"
        claim.auto_approved = "yes"
        claim.notes = f"{claim.notes}; admin_retry=paid"
    else:
        claim.notes = f"{claim.notes}; admin_retry=review"

    append_audit_log(
        db=db,
        action="claim_retried",
        target_type="claim",
        target_id=claim.id,
        details=f"status={claim.status}, fraud_score={claim.fraud_score:.2f}",
    )
    db.commit()

    return {
        "id": claim.id,
        "policyId": claim.policy_id,
        "incidentType": claim.incident_type,
        "incidentAt": claim.incident_at,
        "claimAmount": claim.claim_amount,
        "status": claim.status,
        "fraudScore": round(claim.fraud_score, 2),
        "autoApproved": claim.auto_approved == "yes",
        "notes": claim.notes,
    }


@app.post("/api/v1/admin/claims/{claim_id}/rollback")
def rollback_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    _: AppUser = Depends(require_roles("admin")),
) -> dict:
    claim = db.get(ClaimCase, claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Rollback flow: return any paid claim back to review.
    claim.status = "Review"
    claim.auto_approved = "no"
    claim.notes = f"{claim.notes}; admin_rollback=review"

    append_audit_log(
        db=db,
        action="claim_rolled_back",
        target_type="claim",
        target_id=claim.id,
        details=f"status={claim.status}, fraud_score={claim.fraud_score:.2f}",
    )
    db.commit()

    return {
        "id": claim.id,
        "policyId": claim.policy_id,
        "incidentType": claim.incident_type,
        "incidentAt": claim.incident_at,
        "claimAmount": claim.claim_amount,
        "status": claim.status,
        "fraudScore": round(claim.fraud_score, 2),
        "autoApproved": claim.auto_approved == "yes",
        "notes": claim.notes,
    }
