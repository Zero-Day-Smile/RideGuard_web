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

export default function HomePage() {
  const [view, setView] = useState<"rider" | "admin">("rider");
  const [metricsData, setMetricsData] = useState(weeklyMetrics);
  const [riderData, setRiderData] = useState(riderSnapshot);
  const [signalsData, setSignalsData] = useState(disruptionSignals);
  const [timelineData, setTimelineData] = useState(triggerTimeline);
  const [fraudData, setFraudData] = useState(fraudAlerts);
  const [cityRiskData, setCityRiskData] = useState(cityRiskBands);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [riderRes, adminRes, triggerRes] = await Promise.all([
        fetch("/api/rider/summary", { cache: "no-store" }),
        fetch("/api/admin/overview", { cache: "no-store" }),
        fetch("/api/triggers", { cache: "no-store" })
      ]);

      if (!riderRes.ok || !adminRes.ok || !triggerRes.ok) {
        throw new Error("Live feeds unavailable");
      }

      const riderPayload = (await riderRes.json()) as {
        weeklyMetrics: typeof weeklyMetrics;
        riderSnapshot: typeof riderSnapshot;
      };

      const adminPayload = (await adminRes.json()) as {
        fraudAlerts: typeof fraudAlerts;
        cityRiskBands: typeof cityRiskBands;
      };

      const triggerPayload = (await triggerRes.json()) as {
        disruptionSignals: typeof disruptionSignals;
        triggerTimeline: typeof triggerTimeline;
      };

      setMetricsData(riderPayload.weeklyMetrics ?? weeklyMetrics);
      setRiderData(riderPayload.riderSnapshot ?? riderSnapshot);
      setFraudData(adminPayload.fraudAlerts ?? fraudAlerts);
      setCityRiskData(adminPayload.cityRiskBands ?? cityRiskBands);
      setSignalsData(triggerPayload.disruptionSignals ?? disruptionSignals);
      setTimelineData(triggerPayload.triggerTimeline ?? triggerTimeline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const topRiskCity = useMemo(() => {
    return [...cityRiskData].sort((a, b) => b.score - a.score)[0];
  }, [cityRiskData]);

  return (
    <main className="simple-shell">
      <section className="simple-hero">
        <p className="tag">RideGuard Dashboard</p>
        <h1>Protecting every ride, every shift, every week.</h1>
        <p>
          A simple live view of weekly income protection signals, payouts, and risk exposure for delivery
          partners.
        </p>
        <div className="segmented">
          <button
            className={view === "rider" ? "seg active" : "seg"}
            onClick={() => setView("rider")}
            type="button"
          >
            Rider
          </button>
          <button
            className={view === "admin" ? "seg active" : "seg"}
            onClick={() => setView("admin")}
            type="button"
          >
            Admin
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi">
          <h3>Active Policies</h3>
          <p>{metricsData.activePolicies.toLocaleString()}</p>
        </article>
        <article className="kpi">
          <h3>Payouts Today</h3>
          <p>{metricsData.payoutsToday.toLocaleString()}</p>
        </article>
        <article className="kpi">
          <h3>Fraud Alerts</h3>
          <p>{metricsData.fraudAlerts}</p>
        </article>
        <article className="kpi">
          <h3>Avg Payout Time</h3>
          <p>{metricsData.avgPayoutTimeMin} min</p>
        </article>
      </section>

      {(isLoading || error) && (
        <section className="notice">
          <p>{isLoading ? "Loading dashboard data..." : `Showing fallback data: ${error}`}</p>
        </section>
      )}

      {view === "rider" ? (
        <section className="panel-grid">
          <article className="panel">
            <h2>Rider Snapshot</h2>
            <div className="mini-grid">
              <div>
                <span>Protected Earnings</span>
                <strong>INR {riderData.protectedEarnings.toLocaleString()}</strong>
              </div>
              <div>
                <span>Latest Payout</span>
                <strong>INR {riderData.latestPayoutAmount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Policy Status</span>
                <strong>{riderData.policyStatus}</strong>
              </div>
              <div>
                <span>Coverage Window</span>
                <strong>{riderData.policyWindow}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h2>Disruption Signals</h2>
            <ul className="list">
              {signalsData.map((s) => (
                <li key={s.name}>
                  <div>
                    <strong>{s.name}</strong>
                    <p>{s.detail}</p>
                  </div>
                  <span className={`pill ${s.status}`}>{s.status}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : (
        <section className="panel-grid">
          <article className="panel">
            <h2>Fraud Alerts</h2>
            <ul className="list">
              {fraudData.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>
                      {a.id} - {a.city}
                    </strong>
                    <p>{a.reason}</p>
                  </div>
                  <span className={`pill ${a.level}`}>{a.level}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <h2>City Risk Overview</h2>
            <p className="top-risk">
              Highest current risk: <strong>{topRiskCity?.city}</strong>
            </p>
            <ul className="risk-list">
              {cityRiskData.map((c) => (
                <li key={c.city}>
                  <div>
                    <strong>{c.city}</strong>
                    <p>{c.disruption}</p>
                  </div>
                  <em>{Math.round(c.score * 100)}%</em>
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      <section className="panel">
        <h2>Recent Trigger Timeline</h2>
        <div className="timeline-simple">
          {timelineData.slice(-4).map((t) => (
            <div key={`${t.time}-${t.event}`}>
              <strong>{t.time}</strong>
              <span>{t.event}</span>
              <p>{t.effect}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
