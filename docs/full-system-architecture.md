# RideGuard Full System Architecture (App + Website + ML Backend)

## 1. End-to-End Flow

```text
Mobile App (React Native) + Website Dashboard (React)
                   |
                   v
          FastAPI Backend API
                   |
                   v
              ML Engines
      - Dynamic Pricing
      - Fraud Detection
      - Trigger Engine
      - Payout Automation
                   |
                   v
               Database
                   |
                   v
            External APIs
      - Weather (Open-Meteo)
      - Traffic (mock/live)
      - Location (mock/live)
```

## 2. Frontend Channels

### Worker Mobile App
- Registration / Login
- Dashboard
- Policy Management
- Dynamic Premium
- Claims / Auto Claim

### Website
- Rider dashboard flow for workers
- Admin dashboard flow for operations

## 3. Backend API and ML Connections

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Dashboard and Policy
- `GET /api/v1/rider/summary`
- `GET /api/v1/policies`
- `POST /api/v1/policies`
- `PATCH /api/v1/policies/{policy_id}`

### Dynamic Premium
- `GET /api/v1/pricing/model-snapshot`
- `POST /api/v1/pricing/dynamic-quote`

### Claims / Automation
- `GET /api/v1/claims`
- `POST /api/v1/claims/auto-file`

### Triggers and Operations
- `GET /api/v1/triggers`
- `POST /api/v1/triggers/refresh`
- `GET /api/v1/ml/strategy`
- `POST /api/v1/ml/retrain`

## 4. ML Engine Integration

- `backend/app/phase2_ml/dynamic_pricing_model.py`: weekly premium estimator
- `backend/app/phase2_ml/fraud_detection_engine.py`: fraud risk scoring
- `backend/app/phase2_ml/parametric_trigger_engine.py`: disruption trigger logic
- `backend/app/phase2_ml/payout_automation.py`: eligibility and payout workflow

These are orchestrated in `backend/app/main.py` for pricing and zero-touch claim routes.

## 5. Claim Automation Pipeline

```text
Trigger data (weather/traffic/platform)
          -> Trigger Engine
          -> Fraud Detection
          -> Eligibility Validation
          -> Payout Processor
          -> Claim + Audit persistence
```

## 6. Data Model (Current)

- Users: `AppUser`, `UserSetting`
- Policies: `InsurancePolicy`
- Claims: `ClaimCase`
- Model state: `PremiumModelSnapshot`
- Operations: `AdminAuditLog`, `TriggerEvent`, `DisruptionSignal`, `FraudAlert`

## 7. Deployment Shape

- One backend shared by both channels
- Two frontends:
  - `dashboard/` (React web)
  - `mobile-app/` (React Native Expo)
- Shared business logic and model behavior from backend APIs
