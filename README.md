
# RideGuard

Protecting every ride, every shift, every week.

RideGuard is an AI-powered, parametric micro-insurance platform built for delivery partners in the gig economy. It protects weekly income, not just physical assets, by detecting operational disruptions and triggering automatic payouts.

## Get Started (Main Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm
- (Optional) Android Studio / Xcode for mobile builds

### 1. Clone and open project
```bash
git clone https://github.com/Zero-Day-Smile/RideGuard_app_web.git
cd RideGuard_app_web
```

### 2. Start Backend API (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend URLs:
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 3. Start Web Dashboard (React + Vite)
Open a new terminal:

```bash
cd dashboard
npm install
cp .env.example .env
npm run dev
```

Web URL:
- Dashboard: http://localhost:5174

Make sure `VITE_API_BASE_URL` in `dashboard/.env` points to `http://localhost:8000`.

### 4. Run Mobile App (Optional)
```bash
cd mobile-app
npm install
npx cap sync
npx expo start
```

For device builds:
- Android: `npx cap open android`
- iOS (macOS): `npx cap open ios`

## Project Guides
- Backend details: [backend/README.md](backend/README.md)
- Web dashboard details: [dashboard/README.md](dashboard/README.md)
- Mobile app details: [mobile-app/README.md](mobile-app/README.md)

## Try It Out

- Android APK download: [downloads/RideGuard-riderweb-debug.apk](downloads/RideGuard-riderweb-debug.apk)
- Quick testing guide: [TRY_IT_OUT.md](TRY_IT_OUT.md)

## Built With

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- React
- TypeScript
- Vite
- Tailwind CSS
- Capacitor
- Vitest
- Playwright

## 1. Problem Statement

Gig delivery workers operate on weekly income cycles, but most insurance products are:

- Monthly or yearly priced
- Claim-heavy and slow
- Not aligned with gig-economy risks
- Difficult to access and trust

Delivery partners regularly lose income due to:

- Extreme weather disruptions
- Platform outages
- Traffic shutdowns
- City restrictions and operational disruptions

These events often cause wage loss without vehicle damage or medical incidents, leaving a major uninsured risk.

## 2. Solution Overview

RideGuard offers:

- Weekly income protection
- AI-based dynamic pricing
- Automatic claim triggering
- Instant payout simulation
- Fraud-resistant automation

The platform continuously monitors real-world disruption signals and compensates eligible riders automatically.

## 3. Persona Focus

Primary persona: Food delivery partner (Zomato / Swiggy style workflow)

Example rider: Arjun

- Works 6 days per week
- Income depends on completed deliveries
- Limited financial buffer
- Highly affected by weather and traffic volatility

Pain point summary:

| Problem | Impact |
|---|---|
| Heavy rain | Fewer orders and reduced earnings |
| Platform outage | Unable to accept deliveries |
| Traffic lockdown | Reduced serviceable zones |
| Traditional insurance | Manual, slow claims process |

RideGuard removes manual claim friction using parametric automation.

## 4. Why Weekly Insurance

Gig workers plan weekly, not yearly.

Benefits of weekly pricing:

- Matches payout cycles
- Affordable micro-premiums
- Adaptive risk-based pricing
- Higher potential adoption

## 5. User Workflow

### Step 1: Optimized Onboarding

User connects:

- Delivery platform ID (mock)
- Location permission
- Weekly earning estimate

### Step 2: AI Risk Profiling

System evaluates:

- Historical weather disruptions
- Traffic congestion patterns
- Active delivery windows
- Income variability
- Area risk index

Outputs:

- Personalized risk score
- Suggested weekly premium

### Step 3: Policy Creation

User selects coverage aligned to expected earnings.

| Coverage | Weekly Premium |
|---|---|
| INR 4,000 protection | INR 65/week |
| INR 6,000 protection | INR 92/week |

### Step 4: Real-Time Monitoring (Parametric Engine)

- Weather signals
- Traffic signals
- Platform uptime (mock API)
- Delivery activity patterns

### Step 5: Automatic Claim Trigger

Example condition:

Rainfall exceeds threshold AND delivery activity drops by 40%.

RideGuard then automatically:

- Validates disruption event
- Confirms eligibility
- Initiates claim

### Step 6: Instant Payout

- UPI payout simulation
- Wallet credit simulation
- Target processing time under 5 minutes

## 6. Core Feature Mapping (Hackathon)

### AI-Powered Risk Assessment

- Regression model for weekly premium pricing
- Time-series forecasting for income stability
- Risk scoring engine

Outputs:

- Dynamic weekly pricing
- Persona-specific risk evaluation

### Intelligent Fraud Detection

Detects:

- Location spoofing
- Duplicate claims
- Activity inconsistencies
- Artificial inactivity

Techniques:

- Isolation Forest anomaly detection
- Behavioral analytics
- Geo-validation checks

### Parametric Automation

| Event | Trigger Condition |
|---|---|
| Heavy Rain | Rainfall above threshold |
| Platform Downtime | API inactive > 30 minutes |
| Traffic Shutdown | Congestion spike |
| Mobility Restriction | Delivery activity collapse |

Automates:

- Claim initiation
- Verification
- Instant payout

### Integration Capabilities

| Integration | Implementation |
|---|---|
| Weather API | OpenWeatherMap (free tier) |
| Traffic data | Mock congestion API |
| Delivery platform | Simulated activity API |
| Payments | Razorpay sandbox / mock UPI |

## 7. Adversarial Defense & Anti-Spoofing Strategy

Phase 1 "Market Crash" response (logic-only, no code): this section defines how RideGuard resists coordinated GPS-spoofing fraud rings and protects liquidity without harming genuine workers.

Requirement coverage snapshot:

1. The Differentiation: separate genuinely stranded partners from spoofing bad actors using multi-signal validation.
2. The Data: analyze fraud indicators beyond GPS, including device, network, behavior, and ring-level graph signals.
3. The UX Balance: handle flagged claims with tiered review and fairness safeguards so honest riders are not unfairly penalized.

Evaluator quick-check table:

| Required by Phase 1 | Where addressed in this strategy |
|---|---|
| Differentiation (genuine vs spoofing actor) | Section 7.1 multi-signal alignment across event, behavior, and device/network truth |
| Data beyond GPS | Section 7.2 device integrity, sensor, network, temporal, platform, and graph fraud signals |
| UX balance for flagged claims | Section 7.3 tiered decisions, grace windows, alternate evidence, and fast appeal path |

RideGuard is designed for a high-adversary environment where organized fraud rings can coordinate spoofed locations to trigger mass false payouts ("Market Crash" scenario).

The defense strategy uses a multi-layer verification pipeline that combines event truth, rider truth, and network truth before payout execution.

### 7.1 The Differentiation: Genuine Stranded Rider vs Spoofing Bad Actor

RideGuard does not trust any single signal, including GPS.

A rider is considered genuinely stranded only when three classes of evidence align:

- Event truth: A disruption is independently validated in the rider's operating zone (weather severity, traffic shutdown, platform instability, or city restriction).
- Behavioral truth: Rider activity change is plausible relative to personal and zone baseline (normal login times, delivery acceptance behavior, and expected drop pattern during the disruption window).
- Device and network truth: Device telemetry and network behavior are consistent with physical presence and normal app usage.

Suspicion increases when patterns indicate synthetic behavior, for example:

- Claimed disruption without corresponding zone-level disruption evidence.
- Sudden location jumps, impossible movement paths, or repeated high-risk claims from the same device profile.
- Clustered claim timing from many accounts showing near-identical trajectories and inactivity signatures.

### 7.2 The Data: Signals Beyond Basic GPS

To detect individual spoofers and coordinated fraud rings, RideGuard analyzes:

- Device integrity signals: mock-location flag indicators, emulator/root/jailbreak indicators, app tamper signals, device fingerprint consistency.
- Motion and sensor consistency: speed and acceleration plausibility, route continuity, heading drift, coarse motion confidence.
- Network consistency: IP-to-cell/area coherence, sudden ASN or geo mismatches, repeated proxy or VPN style patterns.
- Temporal behavior: shift start/stop regularity, claim timing entropy, repeated trigger exploitation just above thresholds.
- Platform activity signals: order acceptance/decline cadence, online duration vs historical baseline, active-hours drop profile.
- Zone-level context: weather intensity, hyperlocal traffic disruption, outage reports, curfew or emergency restrictions (from trusted feeds plus web-scraped disruption intelligence).
- Graph fraud indicators: shared devices, shared payment handles, synchronized claim bursts, community-level anomaly clusters.

Modeling and decision layer:

- Isolation Forest for anomaly scoring per rider and per cluster.
- Behavioral baselines with rolling windows to separate true disruption patterns from synthetic inactivity.
- Risk graph analysis to surface coordinated rings instead of only isolated bad actors.

### 7.3 The UX Balance: Flagging Without Penalizing Honest Riders

RideGuard uses a tiered claim decision workflow to preserve trust while protecting liquidity:

- Auto-approve: Low-risk claims with strong multi-signal consistency are paid instantly.
- Soft-review: Medium-risk claims receive a short verification hold and lightweight checks (no heavy paperwork).
- Escalation: High-risk or ring-linked claims are queued for deeper review before payout.

Fairness controls for genuine riders in poor weather or weak networks:

- Grace windows for intermittent connectivity loss during severe disruption periods.
- Alternate evidence paths (recent delivery history, platform heartbeat, and zone-level corroboration) when one signal is missing.
- Explainable status messaging so riders know whether claim is approved, under quick review, or escalated.
- Fast appeal path with priority resolution for first-time flags and high-confidence genuine cases.

Operational guardrails:

- Progressive trust scoring: consistent legitimate behavior reduces future friction.
- Adaptive thresholds by zone and disruption type to minimize false positives.
- Liquidity protection mode under mass-attack signals, with controlled payout throttling only for high-risk cohorts.

Measurable operating targets:

- Soft-review completion target: under 15 minutes for standard cases.
- Appeal resolution target: under 60 minutes for first-time flagged riders with corroborating signals.
- Fraud-ring response target: under 5 minutes to activate high-risk cohort throttling after coordinated attack detection.
- Fairness target: keep false-positive flag rate under 2% for riders later validated as genuine.

### 7.4 Failure Modes and Fallback Logic

If one signal source fails during severe weather (for example GPS drift, network instability, or delayed third-party feeds), RideGuard degrades gracefully instead of auto-denying claims:

- Missing location confidence: increase weight on platform heartbeat, historical route continuity, and zone-level disruption truth.
- Missing external weather or traffic feed: use secondary provider cache plus recent trusted observations before claim decisions.
- Conflicting signals: route to soft-review, not rejection, unless ring-level coordination risk is high.
- Prolonged data outage: freeze only high-risk cohort instant payouts and preserve quick-review path for low and medium-risk riders.

This architecture prioritizes both fraud resilience and rider fairness: stop coordinated spoofing at scale without blocking honest workers who are truly stranded.

Reference for challenge context: https://drive.google.com/file/d/1KupMiV_pLLGe0DNwUYzHi-AIh1qWdGxo/view?usp=drive_link

## 8. Weekly Premium Model (Core Innovation)

Conceptual formula:

Weekly Premium =

(Base Risk x Location Risk Weight x Weather Probability Factor x Income Variability Score)

- Reliability Discount

The model recalculates weekly based on updated behavioral and environmental signals.

Benefits:

- Fair pricing
- Adaptive insurance
- Better engagement incentives

## 9. Analytics Dashboard

Rider view:

- Weekly risk score
- Premium history
- Trigger events
- Earnings protected

Admin / insurer view:

- Active policies
- Trigger frequency
- Fraud alerts
- Loss ratios
- Geographic risk heatmaps

## 10. Platform Choice: Mobile First

Delivery partners primarily operate via smartphones and need:

- Real-time alerts
- Low-friction onboarding
- Fast policy and payout visibility

Architecture:

- Mobile app (primary)
- Web dashboard (analytics/admin)

## 11. Tech Stack

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- React
- TypeScript
- Vite
- Tailwind CSS
- Capacitor
- Vitest
- Playwright
- scikit-learn
- pandas
- Requests

## 12. High-Level System Architecture

Mobile App
-> API Gateway
-> AI Risk Engine
-> Parametric Trigger Engine
-> Fraud Detection Layer
-> Payment Processor
-> Analytics Dashboard

## 13. Development Plan (Hackathon Scope)

### Phase 1 (Current)

- Persona workflow
- Weekly pricing logic
- Parametric trigger simulation (mocked)
- Concept documentation

### Phase 2

- Mobile UI prototype
- Risk scoring engine
- API integrations

### Phase 3

- Automated payouts
- Fraud detection module
- Analytics dashboard

## 14. Innovation Highlights

- Weekly-first insurance model
- Zero manual claims
- AI-driven adaptive pricing
- Parametric payouts for gig workers
- Fraud-aware automation

## 15. Future Scope

- Expand to grocery and e-commerce delivery partners
- Real platform integrations
- Embedded insurance inside delivery apps
- Reinforcement-learning based pricing

## 16. Repository Structure

```text
/rideguard
├── README.md
├── backend/
├── mobile-app/
├── ai-models/
├── dashboard/
└── docs/
```

## 17. Documentation Index

- [docs/product-spec.md](docs/product-spec.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-design.md](docs/api-design.md)
- [docs/implementation-plan.md](docs/implementation-plan.md)

## Vision

RideGuard transforms insurance from reactive claims processing into real-time income protection built for the realities of the gig economy.
