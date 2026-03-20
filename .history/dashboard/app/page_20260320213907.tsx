"use client";

import { useMemo, useState } from "react";
import {
  cityRiskBands,
  disruptionSignals,
  fraudAlerts,
  triggerTimeline,
  weeklyMetrics
} from "./data";

type CoveragePlan = {
  name: string;
  amount: number;
  basePremium: number;
  rationale: string;
};

const plans: CoveragePlan[] = [
  {
    name: "Basic",
    amount: 1500,
    basePremium: 25,
    rationale: "Rain/day disruption focus"
  },
  {
    name: "Standard",
    amount: 3000,
    basePremium: 40,
    rationale: "Multiple disruption coverage"
  },
  {
    name: "Plus",
    amount: 5000,
    basePremium: 55,
    rationale: "Full-week protection"
  }
];

function statusClass(status: string): string {
  if (status === "critical" || status === "high" || status === "Verified") {
    return "chip chip-danger";
  }

  if (status === "watch" || status === "medium" || status === "Review") {
    return "chip chip-warn";
  }

  return "chip chip-safe";
}

export default function HomePage() {
  const [view, setView] = useState<"rider" | "admin">("rider");
  const [selectedPlan, setSelectedPlan] = useState<CoveragePlan>(plans[1]);
  const [locationRisk, setLocationRisk] = useState(0.7);
  const [weatherFactor, setWeatherFactor] = useState(0.65);
  const [incomeVariability, setIncomeVariability] = useState(0.5);
  const [reliabilityDiscount, setReliabilityDiscount] = useState(0.1);

  const computedPremium = useMemo(() => {
    const weightedRisk =
      0.4 * locationRisk + 0.35 * weatherFactor + 0.25 * incomeVariability;
    const riskMultiplier = 1 + weightedRisk;
    const rawPremium = selectedPlan.basePremium * riskMultiplier;
    const discountValue = rawPremium * reliabilityDiscount;
    return Math.max(12, Math.round(rawPremium - discountValue));
  }, [incomeVariability, locationRisk, reliabilityDiscount, selectedPlan, weatherFactor]);

  const riskScore = useMemo(() => {
    const raw = 100 * (0.45 * locationRisk + 0.35 * weatherFactor + 0.2 * incomeVariability);
    return Math.round(raw);
  }, [incomeVariability, locationRisk, weatherFactor]);

  return (
    <main className="page-shell">
      <div className="bg-grid" />
      <section className="hero reveal-1">
        <p className="badge">RideGuard Command Center</p>
        <h1>Protecting every ride, every shift, every week.</h1>
        <p className="hero-copy">
          AI-parametric protection built for delivery partners. Monitor disruption signals, estimate weekly
          premium, auto-trigger claims, and track instant payouts without manual paperwork.
        </p>
        <div className="toggle-row">
          <button
            className={view === "rider" ? "toggle active" : "toggle"}
            onClick={() => setView("rider")}
            type="button"
          >
            Rider View
          </button>
          <button
            className={view === "admin" ? "toggle active" : "toggle"}
            onClick={() => setView("admin")}
            type="button"
          >
            Admin View
          </button>
        </div>
      </section>

      <section className="metrics reveal-2">
        <article className="metric-card">
          <h3>Active Policies</h3>
          <p>{weeklyMetrics.activePolicies.toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <h3>Payouts Today</h3>
          <p>{weeklyMetrics.payoutsToday.toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <h3>Fraud Alerts</h3>
          <p>{weeklyMetrics.fraudAlerts}</p>
        </article>
        <article className="metric-card">
          <h3>Avg Payout Time</h3>
          <p>{weeklyMetrics.avgPayoutTimeMin} min</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel reveal-3">
          <header className="panel-head">
            <h2>Weekly Premium Studio</h2>
            <p>Dynamic AI pricing based on live risk factors</p>
          </header>

          <div className="plan-grid">
            {plans.map((plan) => (
              <button
                className={selectedPlan.name === plan.name ? "plan-card selected" : "plan-card"}
                key={plan.name}
                onClick={() => setSelectedPlan(plan)}
                type="button"
              >
                <h4>{plan.name}</h4>
                <p>INR {plan.amount.toLocaleString()} protection</p>
                <small>Base INR {plan.basePremium}/week</small>
                <span>{plan.rationale}</span>
              </button>
            ))}
          </div>

          <div className="slider-wrap">
            <label>
              Location risk weight ({locationRisk.toFixed(2)})
              <input
                max={1}
                min={0}
                onChange={(e) => setLocationRisk(Number(e.target.value))}
                step={0.01}
                type="range"
                value={locationRisk}
              />
            </label>
            <label>
              Weather probability factor ({weatherFactor.toFixed(2)})
              <input
                max={1}
                min={0}
                onChange={(e) => setWeatherFactor(Number(e.target.value))}
                step={0.01}
                type="range"
                value={weatherFactor}
              />
            </label>
            <label>
              Income variability score ({incomeVariability.toFixed(2)})
              <input
                max={1}
                min={0}
                onChange={(e) => setIncomeVariability(Number(e.target.value))}
                step={0.01}
                type="range"
                value={incomeVariability}
              />
            </label>
            <label>
              Reliability discount ({reliabilityDiscount.toFixed(2)})
              <input
                max={0.4}
                min={0}
                onChange={(e) => setReliabilityDiscount(Number(e.target.value))}
                step={0.01}
                type="range"
                value={reliabilityDiscount}
              />
            </label>
          </div>

          <div className="premium-output">
            <div>
              <h3>Suggested Premium</h3>
              <p className="price">INR {computedPremium}/week</p>
            </div>
            <div>
              <h3>Rider Risk Score</h3>
              <p className="risk">{riskScore}/100</p>
            </div>
          </div>
        </article>

        <article className="panel reveal-4">
          <header className="panel-head">
            <h2>Parametric Trigger Watch</h2>
            <p>Multi-signal monitoring for automatic claim eligibility</p>
          </header>

          <div className="signal-grid">
            {disruptionSignals.map((signal) => (
              <div className="signal-card" key={signal.name}>
                <div className="signal-top">
                  <h4>{signal.name}</h4>
                  <span className={statusClass(signal.status)}>{signal.status}</span>
                </div>
                <p>{signal.detail}</p>
              </div>
            ))}
          </div>

          <div className="timeline">
            {triggerTimeline.map((item) => (
              <div className="timeline-row" key={`${item.time}-${item.event}`}>
                <span>{item.time}</span>
                <strong>{item.event}</strong>
                <p>{item.effect}</p>
                <em className={statusClass(item.status)}>{item.status}</em>
              </div>
            ))}
          </div>
        </article>
      </section>

      {view === "rider" ? (
        <section className="panel reveal-5">
          <header className="panel-head">
            <h2>Rider Weekly Protection Snapshot</h2>
            <p>Personalized visibility into protection, triggers, and payout outcomes</p>
          </header>
          <div className="split">
            <div className="info-box">
              <h4>Protected Earnings (Week)</h4>
              <p className="figure">INR 4,800</p>
              <small>2 disruption events compensated</small>
            </div>
            <div className="info-box">
              <h4>Latest Auto-Payout</h4>
              <p className="figure">INR 1,950</p>
              <small>Processed in 3m 12s via mock UPI rail</small>
            </div>
            <div className="info-box">
              <h4>Policy Status</h4>
              <p className="figure">Active</p>
              <small>Coverage window: Mon to Sun</small>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel reveal-5">
          <header className="panel-head">
            <h2>Admin Risk and Fraud Intelligence</h2>
            <p>Operational controls for payout safety, trigger quality, and area-level exposure</p>
          </header>
          <div className="admin-grid">
            <div className="table-box">
              <h4>Fraud Alert Queue</h4>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>City</th>
                    <th>Level</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.id}</td>
                      <td>{alert.city}</td>
                      <td>
                        <span className={statusClass(alert.level)}>{alert.level}</span>
                      </td>
                      <td>{alert.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-box">
              <h4>City Risk Heat Bands</h4>
              <div className="heat-list">
                {cityRiskBands.map((city) => (
                  <div className="heat-row" key={city.city}>
                    <div>
                      <strong>{city.city}</strong>
                      <p>{city.disruption}</p>
                    </div>
                    <div className="heat-meter">
                      <span style={{ width: `${Math.round(city.score * 100)}%` }} />
                    </div>
                    <em>{Math.round(city.score * 100)}%</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
