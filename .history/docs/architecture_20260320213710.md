# RideGuard System Architecture

## 1. High-Level Flow

```text
Mobile App
  -> API Gateway
  -> Policy Service
  -> AI Risk Engine
  -> Parametric Trigger Engine
  -> Fraud Detection Layer
  -> Payout Processor
  -> Analytics Store
  -> Dashboard
```

## 2. Core Services

### API Gateway
- Auth, rate limiting, request routing
- Unified external interface for mobile and dashboard clients

### Policy Service
- Policy creation and lifecycle management
- Coverage options and weekly policy state

### AI Risk Engine
- Generates risk score and weekly premium recommendation
- Inputs: behavior telemetry, location risk, historical disruptions

### Parametric Trigger Engine
- Subscribes to event streams
- Evaluates policy trigger conditions
- Emits eligible claim events automatically

### Fraud Detection Layer
- Evaluates suspicious patterns before payout finalization
- Uses anomaly scoring and rule-based guardrails

### Payout Processor
- Integrates with mock payment rails
- Tracks payout request, processing, and completion states

### Analytics Store
- Stores policy, trigger, claim, payout, and risk history
- Supports rider and admin dashboards

## 3. Data Stores

- PostgreSQL:
  - Users, policies, claims, payouts, audit logs
- Redis:
  - Trigger events, queueing, short-lived state, dedup keys

## 4. External Data Integrations

- Weather API (OpenWeatherMap)
- Mock traffic API
- Mock delivery activity API
- Mock payout gateway (UPI/wallet)

## 5. Event Model (Draft)

Key event types:
- disruption.weather.detected
- disruption.platform.outage.detected
- disruption.traffic.detected
- claim.auto.initiated
- claim.verified
- payout.requested
- payout.completed
- fraud.alert.raised

## 6. Trust and Safety

- Event immutability via append-only audit logs
- Payout hold when fraud score exceeds threshold
- Policy-level cooldown to prevent repeated rapid triggers

## 7. Observability (Recommended)

- Request traces across gateway, policy, trigger, and payout layers
- Metrics:
  - trigger_to_payout_latency
  - false_trigger_rate
  - claim_approval_rate
  - fraud_alert_precision
