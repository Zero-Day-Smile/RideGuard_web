"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cityRiskBands,
  disruptionSignals,
  fraudAlerts,
  riderSnapshot,
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
  const [metricsData, setMetricsData] = useState(weeklyMetrics);
  const [riderData, setRiderData] = useState(riderSnapshot);
  const [signalsData, setSignalsData] = useState(disruptionSignals);
  const [timelineData, setTimelineData] = useState(triggerTimeline);
  const [fraudData, setFraudData] = useState(fraudAlerts);
  const [cityRiskData, setCityRiskData] = useState(cityRiskBands);
  const [pricingData, setPricingData] = useState<{ computedPremium: number; riskScore: number } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [newFraudId, setNewFraudId] = useState("FR-301");
  const [newFraudCity, setNewFraudCity] = useState("Bengaluru");
  const [newFraudLevel, setNewFraudLevel] = useState<"high" | "medium" | "low">("medium");
  const [newFraudReason, setNewFraudReason] = useState("Unusual claim burst in same 20-minute window");
  const [newTriggerTime, setNewTriggerTime] = useState("18:20");
  const [newTriggerEvent, setNewTriggerEvent] = useState("Platform Downtime");
  const [newTriggerEffect, setNewTriggerEffect] = useState("API outage 40 min in central zone");
  const [newTriggerStatus, setNewTriggerStatus] = useState("Review");
  const [newPayoutAmount, setNewPayoutAmount] = useState(riderSnapshot.latestPayoutAmount);
  const [newPayoutTime, setNewPayoutTime] = useState(riderSnapshot.latestPayoutTime);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: number;
      actor: string;
      action: string;
      targetType: string;
      targetId: string;
      details: string;
      createdAt: string;
    }>
  >([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [riderRes, adminRes, triggersRes, auditRes] = await Promise.all([
        fetch("/api/rider/summary", { cache: "no-store" }),
        fetch("/api/admin/overview", { cache: "no-store" }),
        fetch("/api/triggers", { cache: "no-store" }),
        fetch("/api/admin/audit-logs?limit=12", { cache: "no-store" })
      ]);

      if (!riderRes.ok || !adminRes.ok || !triggersRes.ok || !auditRes.ok) {
        throw new Error("Could not load dashboard feeds");
      }

      const riderPayload = (await riderRes.json()) as {
        weeklyMetrics: typeof weeklyMetrics;
        riderSnapshot: typeof riderSnapshot;
      };

      const adminPayload = (await adminRes.json()) as {
        weeklyMetrics: typeof weeklyMetrics;
        fraudAlerts: typeof fraudAlerts;
        cityRiskBands: typeof cityRiskBands;
      };

      const triggerPayload = (await triggersRes.json()) as {
        disruptionSignals: typeof disruptionSignals;
        triggerTimeline: typeof triggerTimeline;
      };

      const auditPayload = (await auditRes.json()) as {
        logs: Array<{
          id: number;
          actor: string;
          action: string;
          targetType: string;
          targetId: string;
          details: string;
          createdAt: string;
        }>;
      };

      setMetricsData(riderPayload.weeklyMetrics ?? adminPayload.weeklyMetrics ?? weeklyMetrics);
      setRiderData(riderPayload.riderSnapshot ?? riderSnapshot);
      setFraudData(adminPayload.fraudAlerts ?? fraudAlerts);
      setCityRiskData(adminPayload.cityRiskBands ?? cityRiskBands);
      setSignalsData(triggerPayload.disruptionSignals ?? disruptionSignals);
      setTimelineData(triggerPayload.triggerTimeline ?? triggerTimeline);
      setAuditLogs(auditPayload.logs ?? []);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unexpected dashboard data error");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [loadDashboardData]);

  async function handleCreateFraudAlert() {
    setAdminBusy(true);
    setAdminMessage(null);

    try {
      const response = await fetch("/api/admin/fraud-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: newFraudId,
          city: newFraudCity,
          level: newFraudLevel,
          reason: newFraudReason
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { detail?: string };
        throw new Error(payload.detail ?? "Could not create fraud alert");
      }

      setAdminMessage(`Fraud alert ${newFraudId} created`);
      await loadDashboardData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleLowerAlertSeverity(alertId: string, current: string) {
    const next = current === "high" ? "medium" : "low";
    setAdminBusy(true);
    setAdminMessage(null);

    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ level: next })
      });

      if (!response.ok) {
        throw new Error("Could not update fraud alert");
      }

      setAdminMessage(`Fraud alert ${alertId} moved to ${next}`);
      await loadDashboardData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleCreateTrigger() {
    setAdminBusy(true);
    setAdminMessage(null);

    try {
      const response = await fetch("/api/admin/trigger-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          time: newTriggerTime,
          event: newTriggerEvent,
          effect: newTriggerEffect,
          status: newTriggerStatus
        })
      });

      if (!response.ok) {
        throw new Error("Could not add trigger event");
      }

      setAdminMessage("Trigger event added to timeline");
      await loadDashboardData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleUpdateRiderSnapshot() {
    setAdminBusy(true);
    setAdminMessage(null);

    try {
      const response = await fetch("/api/rider/snapshot", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          latestPayoutAmount: newPayoutAmount,
          latestPayoutTime: newPayoutTime
        })
      });

      if (!response.ok) {
        throw new Error("Could not update rider snapshot");
      }

      setAdminMessage("Rider snapshot updated");
      await loadDashboardData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setAdminBusy(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function quotePremium() {
      try {
        const response = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            basePremium: selectedPlan.basePremium,
            locationRisk,
            weatherFactor,
            incomeVariability,
            reliabilityDiscount
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Quote API failed");
        }

        const payload = (await response.json()) as {
          computedPremium: number;
          riskScore: number;
        };

        setPricingData(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setPricingData(null);
      }
    }

    quotePremium();

    return () => {
      controller.abort();
    };
  }, [incomeVariability, locationRisk, reliabilityDiscount, selectedPlan.basePremium, weatherFactor]);

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

  const premiumToDisplay = pricingData?.computedPremium ?? computedPremium;
  const riskToDisplay = pricingData?.riskScore ?? riskScore;

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
          <p>{metricsData.activePolicies.toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <h3>Payouts Today</h3>
          <p>{metricsData.payoutsToday.toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <h3>Fraud Alerts</h3>
          <p>{metricsData.fraudAlerts}</p>
        </article>
        <article className="metric-card">
          <h3>Avg Payout Time</h3>
          <p>{metricsData.avgPayoutTimeMin} min</p>
        </article>
      </section>

      {(isLoadingData || dataError) && (
        <section className="panel">
          <p className="meta-state">
            {isLoadingData
              ? "Loading disruption and policy feeds..."
              : `Using local fallback data: ${dataError}`}
          </p>
        </section>
      )}

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
              <p className="price">INR {premiumToDisplay}/week</p>
            </div>
            <div>
              <h3>Rider Risk Score</h3>
              <p className="risk">{riskToDisplay}/100</p>
            </div>
          </div>
        </article>

        <article className="panel reveal-4">
          <header className="panel-head">
            <h2>Parametric Trigger Watch</h2>
            <p>Multi-signal monitoring for automatic claim eligibility</p>
          </header>

          <div className="signal-grid">
            {signalsData.map((signal) => (
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
            {timelineData.map((item) => (
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
              <p className="figure">INR {riderData.protectedEarnings.toLocaleString()}</p>
              <small>{riderData.disruptionEventsCompensated} disruption events compensated</small>
            </div>
            <div className="info-box">
              <h4>Latest Auto-Payout</h4>
              <p className="figure">INR {riderData.latestPayoutAmount.toLocaleString()}</p>
              <small>Processed in {riderData.latestPayoutTime} via mock UPI rail</small>
            </div>
            <div className="info-box">
              <h4>Policy Status</h4>
              <p className="figure">{riderData.policyStatus}</p>
              <small>Coverage window: {riderData.policyWindow}</small>
            </div>
          </div>
          <div className="action-form">
            <h4>Update Latest Payout</h4>
            <div className="form-grid two-up">
              <label>
                Payout Amount (INR)
                <input
                  min={0}
                  onChange={(e) => setNewPayoutAmount(Number(e.target.value))}
                  type="number"
                  value={newPayoutAmount}
                />
              </label>
              <label>
                Processing Time
                <input
                  onChange={(e) => setNewPayoutTime(e.target.value)}
                  type="text"
                  value={newPayoutTime}
                />
              </label>
            </div>
            <button className="action-btn" disabled={adminBusy} onClick={handleUpdateRiderSnapshot} type="button">
              Save Rider Snapshot
            </button>
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
                  {fraudData.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.id}</td>
                      <td>{alert.city}</td>
                      <td>
                        <span className={statusClass(alert.level)}>{alert.level}</span>
                      </td>
                      <td>
                        {alert.reason}
                        <button
                          className="table-action"
                          disabled={adminBusy}
                          onClick={() => handleLowerAlertSeverity(alert.id, alert.level)}
                          type="button"
                        >
                          Lower Severity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-box">
              <h4>City Risk Heat Bands</h4>
              <div className="heat-list">
                {cityRiskData.map((city) => (
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
          <div className="form-stack">
            <div className="action-form">
              <h4>Create Fraud Alert</h4>
              <div className="form-grid">
                <label>
                  Alert ID
                  <input onChange={(e) => setNewFraudId(e.target.value)} type="text" value={newFraudId} />
                </label>
                <label>
                  City
                  <input onChange={(e) => setNewFraudCity(e.target.value)} type="text" value={newFraudCity} />
                </label>
                <label>
                  Level
                  <select
                    onChange={(e) => setNewFraudLevel(e.target.value as "high" | "medium" | "low")}
                    value={newFraudLevel}
                  >
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>
                </label>
                <label>
                  Reason
                  <input onChange={(e) => setNewFraudReason(e.target.value)} type="text" value={newFraudReason} />
                </label>
              </div>
              <button className="action-btn" disabled={adminBusy} onClick={handleCreateFraudAlert} type="button">
                Add Fraud Alert
              </button>
            </div>

            <div className="action-form">
              <h4>Add Trigger Event</h4>
              <div className="form-grid">
                <label>
                  Time
                  <input onChange={(e) => setNewTriggerTime(e.target.value)} type="text" value={newTriggerTime} />
                </label>
                <label>
                  Event
                  <input onChange={(e) => setNewTriggerEvent(e.target.value)} type="text" value={newTriggerEvent} />
                </label>
                <label>
                  Effect
                  <input onChange={(e) => setNewTriggerEffect(e.target.value)} type="text" value={newTriggerEffect} />
                </label>
                <label>
                  Status
                  <input onChange={(e) => setNewTriggerStatus(e.target.value)} type="text" value={newTriggerStatus} />
                </label>
              </div>
              <button className="action-btn" disabled={adminBusy} onClick={handleCreateTrigger} type="button">
                Add Trigger
              </button>
            </div>
          </div>
          <div className="action-form">
            <h4>Recent Admin Actions</h4>
            <div className="audit-list">
              {auditLogs.length === 0 ? (
                <p className="meta-state">No admin actions recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div className="audit-row" key={log.id}>
                    <div>
                      <strong>{log.action}</strong>
                      <p>
                        {log.targetType}:{" "}
                        {log.targetId}
                      </p>
                    </div>
                    <div>
                      <small>{log.actor}</small>
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                    <em>{log.details}</em>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
      {adminMessage && <p className="meta-state">{adminMessage}</p>}
    </main>
  );
}
