# RideGuard API Design (Draft)

## Conventions

- Base path: /api/v1
- JSON request/response payloads
- Idempotency key required for payout initiation endpoints

## 1. Onboarding and User

### POST /users/onboard
Create or update a rider profile.

Request:
```json
{
  "name": "Arjun",
  "platform_id": "swiggy_mock_123",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "weekly_income_estimate": 7000
}
```

Response:
```json
{
  "user_id": "usr_001",
  "risk_profile_status": "queued"
}
```

## 2. Risk and Pricing

### GET /users/{user_id}/risk-profile
Return current risk score and recommended premium.

Response:
```json
{
  "user_id": "usr_001",
  "risk_score": 0.68,
  "recommended_weekly_premium": 92,
  "calculated_at": "2026-03-20T10:00:00Z"
}
```

## 3. Policy

### POST /policies
Create weekly protection policy.

Request:
```json
{
  "user_id": "usr_001",
  "coverage_amount": 6000,
  "weekly_premium": 92,
  "effective_start": "2026-03-25",
  "effective_end": "2026-03-31"
}
```

Response:
```json
{
  "policy_id": "pol_001",
  "status": "active"
}
```

### GET /policies/{policy_id}
Fetch policy details and trigger history summary.

## 4. Trigger and Claims

### POST /events/disruption
Ingest disruption event from weather/traffic/platform signals.

### POST /claims/auto-evaluate
Evaluate trigger conditions and policy eligibility.

Response:
```json
{
  "claim_id": "clm_001",
  "status": "verified",
  "payout_recommended": true
}
```

## 5. Payout

### POST /payouts
Initiate payout for verified claim.

Request:
```json
{
  "claim_id": "clm_001",
  "channel": "upi",
  "amount": 2800,
  "idempotency_key": "9a65d9f8-8ce4-4d41-a472-4a4f947f2b2f"
}
```

Response:
```json
{
  "payout_id": "pay_001",
  "status": "processing",
  "eta_seconds": 180
}
```

## 6. Dashboard Analytics

### GET /analytics/rider/{user_id}
Return rider-specific weekly metrics.

### GET /analytics/admin/overview
Return aggregate operational metrics:
- active_policies
- trigger_frequency
- fraud_alerts
- loss_ratio

## 7. Error Shape

```json
{
  "error": {
    "code": "POLICY_NOT_ACTIVE",
    "message": "Policy is not active for the evaluated time window"
  }
}
```
