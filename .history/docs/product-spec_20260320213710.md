# RideGuard Product Specification

## 1. Problem Statement

Delivery partners lose earnings due to disruption events that do not involve vehicle damage or medical incidents. Existing insurance products do not adequately protect this loss category because they are:
- Monthly or annual pricing models
- Claim-heavy with long turnaround times
- Weakly aligned with gig work behavior
- Difficult to understand and trust

## 2. Product Goal

Provide weekly income protection with automatic event-based claims and rapid payouts for verified disruptions.

## 3. Primary Persona

Name: Arjun (example)
- Works 6 days per week
- Earnings tied directly to completed deliveries
- Maintains low cash buffer
- Highly exposed to weather and traffic disruptions

## 4. Outcomes

User outcomes:
- Lower income volatility week-to-week
- Fast, low-friction protection
- Improved trust in insurance through automation

Business outcomes:
- High policy renewal through fair weekly pricing
- Lower operational claim overhead
- Better fraud loss control through telemetry signals

## 5. In-Scope Functional Requirements

1. Onboarding flow with:
- Delivery platform ID (mock)
- Location consent
- Weekly earnings estimate

2. Risk profiling engine:
- Weather disruption history
- Traffic congestion patterns
- Delivery activity window
- Income variability index
- Area risk index

3. Policy management:
- Coverage selection per week
- Dynamic premium quote
- Policy activation and status

4. Parametric trigger processing:
- Event ingestion
- Rule evaluation
- Eligibility verification
- Auto-claim initiation

5. Payout handling:
- Mock UPI/wallet payout initiation
- Payout status tracking

6. Fraud checks:
- Spoof location detection
- Duplicate trigger suppression
- Behavioral inconsistency checks

7. Dashboard analytics:
- Rider view: risk score, premium trend, payouts, protected earnings
- Admin view: active policies, trigger volume, fraud alerts, loss ratio

## 6. Non-Functional Requirements

- Payout flow target latency: under 5 minutes after verified trigger
- Rules engine determinism and audit logging
- Mobile-first UX and low onboarding friction
- Explainable premium output factors

## 7. Out of Scope (Hackathon)

- Full insurer-grade underwriting approvals
- Full production KYC stack
- Real delivery platform APIs in all regions
- Bank-grade payout rails in production mode

## 8. Risks and Mitigations

- False positives in trigger detection
  - Mitigation: multi-signal confirmation and cooldown windows
- User distrust in automation
  - Mitigation: transparent trigger logs and payout trace
- Gaming behavior for payouts
  - Mitigation: fraud model plus policy-level anomaly gating
