from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class QuoteRequest(BaseModel):
    basePremium: float = Field(ge=1, le=100000)
    locationRisk: float = Field(ge=0, le=1)
    weatherFactor: float = Field(ge=0, le=1)
    incomeVariability: float = Field(ge=0, le=1)
    reliabilityDiscount: float = Field(ge=0, le=0.4)


weekly_metrics = {
    "activePolicies": 2842,
    "payoutsToday": 196,
    "fraudAlerts": 14,
    "avgPayoutTimeMin": 3.8,
}

rider_snapshot = {
    "protectedEarnings": 4800,
    "disruptionEventsCompensated": 2,
    "latestPayoutAmount": 1950,
    "latestPayoutTime": "3m 12s",
    "policyStatus": "Active",
    "policyWindow": "Mon to Sun",
}

fraud_alerts = [
    {
        "id": "FR-214",
        "city": "Bengaluru",
        "level": "high",
        "reason": "Mock-location signature and repeated claim timing",
    },
    {
        "id": "FR-209",
        "city": "Hyderabad",
        "level": "medium",
        "reason": "Device-network mismatch during outage window",
    },
    {
        "id": "FR-202",
        "city": "Pune",
        "level": "low",
        "reason": "Activity gap inconsistent with baseline behavior",
    },
]

city_risk_bands = [
    {"city": "Bengaluru", "score": 0.78, "disruption": "High rain + traffic volatility"},
    {"city": "Mumbai", "score": 0.71, "disruption": "Monsoon intensity spikes"},
    {"city": "Hyderabad", "score": 0.62, "disruption": "Platform downtime bursts"},
    {"city": "Pune", "score": 0.57, "disruption": "Congestion and route constraints"},
    {"city": "Chennai", "score": 0.53, "disruption": "Localized weather variability"},
]

disruption_signals = [
    {
        "name": "Weather",
        "status": "critical",
        "detail": "Rainfall 68 mm/h in Bengaluru East",
    },
    {
        "name": "Platform Uptime",
        "status": "watch",
        "detail": "Intermittent API retries in south region",
    },
    {
        "name": "Traffic",
        "status": "watch",
        "detail": "Congestion index +32% in key zones",
    },
    {
        "name": "Delivery Activity",
        "status": "critical",
        "detail": "Median trip count down 42%",
    },
]

trigger_timeline = [
    {
        "time": "07:15",
        "event": "Heavy Rain",
        "effect": "-48% delivery activity",
        "status": "Verified",
    },
    {
        "time": "09:40",
        "event": "Platform Downtime",
        "effect": "35 min outage",
        "status": "Verified",
    },
    {
        "time": "12:10",
        "event": "Traffic Lockdown",
        "effect": "Zone access reduced",
        "status": "Review",
    },
    {
        "time": "16:25",
        "event": "Mobility Restriction",
        "effect": "Curfew in 2 zones",
        "status": "Triggered",
    },
]


app = FastAPI(title="RideGuard Backend API", version="0.1.0")

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
def rider_summary() -> dict:
    return {
        "weeklyMetrics": weekly_metrics,
        "riderSnapshot": rider_snapshot,
    }


@app.get("/api/v1/admin/overview")
def admin_overview() -> dict:
    return {
        "weeklyMetrics": weekly_metrics,
        "fraudAlerts": fraud_alerts,
        "cityRiskBands": city_risk_bands,
    }


@app.get("/api/v1/triggers")
def triggers() -> dict:
    return {
        "disruptionSignals": disruption_signals,
        "triggerTimeline": trigger_timeline,
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
