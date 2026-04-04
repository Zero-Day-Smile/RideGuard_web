import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  createAutoClaim,
  fetchClaims,
  fetchPolicies,
  fetchRealtimeContext,
  fetchSignal,
  type Claim,
  type Policy,
} from "@/lib/api";
import {
  checkParametricTriggerFrontend,
  evaluateFraudFrontend,
  validatePayoutFrontend,
} from "@/lib/phase2Models";
import { computeAdvancedRisk } from "@/lib/riskEngine";
import { toast } from "sonner";

function buildFallbackRealtime(cityName: string) {
  return {
    location: {
      city: cityName || "Bengaluru",
      latitude: 12.9716,
      longitude: 77.5946,
      source: "fallback" as const,
    },
    weather: {
      status: "normal" as const,
      temperatureC: 28,
      humidity: 62,
      rainMm: 0,
      windSpeedKmph: 11,
      weatherCode: 0,
      source: "fallback",
      observedAt: new Date().toISOString(),
    },
    traffic: {
      status: "normal" as const,
      congestion: 0.28,
      currentSpeedKmph: 30,
      freeFlowSpeedKmph: 42,
      travelTimeDelayMin: 4,
      source: "fallback",
      observedAt: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
  };
}

const ClaimsManagement = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [policyId, setPolicyId] = useState<number | null>(null);
  const [incidentType, setIncidentType] = useState("Weather Shutdown");
  const [claimedAmount, setClaimedAmount] = useState(1200);
  const [weatherSeverity, setWeatherSeverity] = useState(0.7);
  const [gpsConsistency, setGpsConsistency] = useState(0.85);
  const [platformEvidence, setPlatformEvidence] = useState(0.9);
  const [trafficAnomaly, setTrafficAnomaly] = useState(0.66);
  const [riderDelayMinutes, setRiderDelayMinutes] = useState(95);
  const [liveRiskScore, setLiveRiskScore] = useState(0);
  const [liveThreshold] = useState(0.62);
  const [liveDecisionText, setLiveDecisionText] = useState("Waiting for live risk feed...");
  const [realtimeSummary, setRealtimeSummary] = useState<ReturnType<typeof buildFallbackRealtime> | null>(null);

  const getCurrentCoordinates = async (): Promise<{ lat: number; lon: number } | null> => {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  };

  const selectedPolicy = useMemo(
    () => policies.find((item) => item.id === policyId) || null,
    [policies, policyId],
  );

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLiveRisk() {
      try {
        const coords = await getCurrentCoordinates();
        const [realtime, platformSignal, disruptionSignal] = await Promise.all([
          fetchRealtimeContext({ lat: coords?.lat, lon: coords?.lon, city: selectedPolicy?.city }),
          fetchSignal("platform-outage"),
          fetchSignal("local-disruption"),
        ]);

        if (!active) return;
        setRealtimeSummary(realtime);

        const risk = computeAdvancedRisk({
          realtime,
          platformStatus: platformSignal.status,
          disruptionStatus: disruptionSignal.status,
          threshold: liveThreshold,
          aggressiveMode: false,
          baseCooldownMin: 5,
          nowMs: Date.now(),
        });

        setLiveRiskScore(risk.score);
        setLiveDecisionText(
          `${realtime.location.city} | score ${risk.score.toFixed(2)} | threshold ${risk.dynamicThreshold.toFixed(2)} | ${risk.shouldAutoFile ? "auto-file ready" : "monitoring"}`,
        );
      } catch {
        if (active) {
          const fallback = buildFallbackRealtime(selectedPolicy?.city || policies[0]?.city || "Bengaluru");
          setRealtimeSummary(fallback);
          setLiveRiskScore(
            computeAdvancedRisk({
              realtime: fallback,
              threshold: liveThreshold,
              aggressiveMode: false,
              baseCooldownMin: 5,
              nowMs: Date.now(),
            }).score,
          );
          setLiveDecisionText("Live risk feed unavailable, showing fallback city values");
        }
      }
    }

    void loadLiveRisk();
    const timer = setInterval(() => {
      void loadLiveRisk();
    }, 45000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [liveThreshold]);

  async function loadPage() {
    setLoading(true);
    try {
      const [policyRes, claimsRes] = await Promise.all([fetchPolicies(), fetchClaims()]);
      setPolicies(policyRes.policies);
      setClaims(claimsRes.claims);
      if (policyRes.policies.length > 0) {
        setPolicyId(policyRes.policies[0].id);
      }
    } catch {
      toast.error("Failed to load claims workspace");
    } finally {
      setLoading(false);
    }
  }

  const flaggedCount = useMemo(
    () => claims.filter((item) => item.status === "Review").length,
    [claims],
  );

  const frontendDecision = useMemo(() => {
    if (!selectedPolicy) return null;

    const payoutCap = Math.max(0, selectedPolicy.coverageAmount - selectedPolicy.deductible);
    const cappedAmount = Math.min(claimedAmount, payoutCap || 1);

    const activitySample: [number, number, number, number] = [
      Math.max(0, Math.min(1, 1 - gpsConsistency)),
      Math.max(0, Math.min(1, cappedAmount / Math.max(selectedPolicy.coverageAmount, 1))),
      Math.max(0, Math.min(1, riderDelayMinutes / 600)),
      0.1,
    ];

    const fraud = evaluateFraudFrontend(activitySample);

    const weatherMm = weatherSeverity * 100;
    const baselineDeliveries = 40;
    const currentDeliveries = Math.max(1, baselineDeliveries * (1 - trafficAnomaly));
    const trigger = checkParametricTriggerFrontend(
      weatherMm,
      currentDeliveries,
      baselineDeliveries,
    );

    const payout = validatePayoutFrontend(fraud, trigger);

    return {
      payoutCap,
      cappedAmount,
      fraud,
      trigger,
      payout,
    };
  }, [
    selectedPolicy,
    claimedAmount,
    gpsConsistency,
    riderDelayMinutes,
    weatherSeverity,
    trafficAnomaly,
  ]);

  const triggerMonitor = useMemo(() => {
    const isTriggered = Boolean(frontendDecision?.trigger.triggered);
    return [
      { key: "rain", label: "Heavy rain", active: weatherSeverity >= 0.6, impact: "Outdoor movement drops" },
      { key: "pollution", label: "Severe pollution", active: weatherSeverity >= 0.75, impact: "Exposure limits reduce shifts" },
      { key: "traffic", label: "Traffic gridlock", active: trafficAnomaly >= 0.6, impact: "Delivery windows collapse" },
      { key: "outage", label: "Platform outage", active: platformEvidence <= 0.4, impact: "Order allocation halted" },
      { key: "restriction", label: "Local restrictions", active: riderDelayMinutes >= 90, impact: "Zone closure/curfew impact" },
      { key: "overall", label: "Auto Trigger", active: isTriggered, impact: "Claim auto-creation readiness" },
    ];
  }, [frontendDecision?.trigger.triggered, weatherSeverity, trafficAnomaly, platformEvidence, riderDelayMinutes]);

  async function handleAutoClaim() {
    if (!policyId) {
      toast.error("Select a policy first");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAutoClaim({
        policyId,
        incidentType,
        incidentAt: new Date().toISOString(),
        claimedAmount,
        weatherSeverity,
        gpsConsistency,
        platformEvidence,
        trafficAnomaly,
        riderDelayMinutes,
      });
      toast.success("Auto claim filed");
      await loadPage();
    } catch {
      toast.error("Auto claim failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Claims Management / Auto Claim</h1>
          </div>
          <Link to="/policy-management">
            <Button variant="outline">Back To Policy</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[1.1fr_1.3fr] gap-6">
        <ScrollReveal>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Zero-Touch Claim Filing</h2>
            <p className="text-sm text-muted-foreground">
              Submit one event packet. RideGuard checks evidence, caps amount by policy, and auto-pays low-fraud cases.
            </p>

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">Shared Zero-Touch Risk Engine</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {liveRiskScore.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Threshold: {liveThreshold.toFixed(2)} • live decision: {liveDecisionText}</p>
              {realtimeSummary && (
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground">
                  <div>Location: <span className="text-foreground font-medium">{realtimeSummary.location.city}</span></div>
                  <div>Source: <span className="text-foreground font-medium capitalize">{realtimeSummary.location.source}</span></div>
                  <div>Weather: <span className="text-foreground font-medium">{Math.round(realtimeSummary.weather.temperatureC)}°C</span></div>
                  <div>Weather API: <span className="text-foreground font-medium">{realtimeSummary.weather.provider || realtimeSummary.weather.source}</span></div>
                  <div>Rain: <span className="text-foreground font-medium">{realtimeSummary.weather.rainMm.toFixed(1)} mm</span></div>
                  <div>Traffic: <span className="text-foreground font-medium">{Math.round(realtimeSummary.traffic.congestion * 100)}%</span></div>
                  <div>Speed: <span className="text-foreground font-medium">{Math.round(realtimeSummary.traffic.currentSpeedKmph)} km/h</span></div>
                  <div>Traffic API: <span className="text-foreground font-medium">{realtimeSummary.traffic.provider || realtimeSummary.traffic.source}</span></div>
                </div>
              )}
            </div>

            <label className="text-sm text-muted-foreground block">
              Policy
              <select
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={policyId || ""}
                onChange={(event) => setPolicyId(Number(event.target.value))}
              >
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    #{policy.id} {policy.riderName} - {policy.city}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-border/50 p-3">
              <p className="text-sm font-medium text-foreground mb-2">Current Trigger Monitor</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {triggerMonitor.map((item) => (
                  <div key={item.key} className="rounded-lg border border-border/50 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground font-medium">{item.label}</span>
                      <span className={`rounded-full px-2 py-0.5 ${item.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {item.active ? "active" : "idle"}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{item.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Incident Type" value={incidentType} onChange={setIncidentType} />
            <NumberField label="Claimed Amount" value={claimedAmount} onChange={setClaimedAmount} />
            <NumberField label="Weather Severity (0-1)" value={weatherSeverity} onChange={setWeatherSeverity} step={0.01} />
            <NumberField label="GPS Consistency (0-1)" value={gpsConsistency} onChange={setGpsConsistency} step={0.01} />
            <NumberField label="Platform Evidence (0-1)" value={platformEvidence} onChange={setPlatformEvidence} step={0.01} />
            <NumberField label="Traffic Anomaly (0-1)" value={trafficAnomaly} onChange={setTrafficAnomaly} step={0.01} />
            <NumberField label="Rider Delay Minutes" value={riderDelayMinutes} onChange={setRiderDelayMinutes} />

            {frontendDecision && (
              <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Frontend ML preview</p>
                <p>
                  Cap Rs {frontendDecision.payoutCap} • effective Rs {frontendDecision.cappedAmount}
                </p>
                <p>
                  Fraud risk {frontendDecision.fraud.riskScore.toFixed(2)} •
                  {" "}
                  {frontendDecision.fraud.fraudSuspected ? "suspected" : "clean"}
                </p>
                <p>
                  Trigger {frontendDecision.trigger.triggered ? "ON" : "off"} • rainfall {frontendDecision.trigger.rainfall.toFixed(1)}mm • activity drop {(frontendDecision.trigger.activityDrop * 100).toFixed(0)}%
                </p>
                <p>
                  Decision: {frontendDecision.payout.eligible ? "would auto‑pay" : "would route to review"}
                </p>
                <div className="pt-2">
                  <p className="text-foreground font-medium mb-1">Zero-touch pipeline</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                    {[
                      "Trigger detected",
                      "Validated",
                      "Fraud check",
                      "Payout",
                      "Completed",
                    ].map((step, idx) => {
                      const active = frontendDecision.payout.eligible ? true : idx <= 2;
                      return (
                        <div key={step} className={`rounded-md px-2 py-1 text-[11px] ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {step}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <Button variant="hero" className="w-full" onClick={handleAutoClaim} disabled={isSubmitting || loading}>
              {isSubmitting ? "Submitting..." : "File Auto Claim"}
            </Button>

            {frontendDecision && !frontendDecision.trigger.triggered && (
              <Button variant="outline" className="w-full" onClick={() => toast.info("Manual fallback claim captured and queued") }>
                Manual Fallback Claim
              </Button>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Metric label="Total Claims" value={String(claims.length)} icon={<ShieldCheck className="w-4 h-4 text-primary" />} />
              <Metric label="Fraud Watch" value={String(flaggedCount)} icon={<AlertTriangle className="w-4 h-4 text-warning" />} />
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Claims</h3>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {loading && <p className="text-sm text-muted-foreground">Loading claims...</p>}
              {!loading && claims.length === 0 && (
                <p className="text-sm text-muted-foreground">No claims filed yet.</p>
              )}
              {claims.map((claim) => (
                <div key={claim.id} className="rounded-xl border border-border/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{claim.id}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${claim.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Policy #{claim.policyId} • {claim.incidentType}
                  </p>
                  <p className="text-xs text-muted-foreground">Fraud score: {claim.fraudScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Incident at: {claim.incidentAt}</p>
                  <p className="text-xs text-foreground mt-1">Rs {claim.claimAmount} • {claim.autoApproved ? "Auto approved" : "Manual review"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{claim.notes}</p>
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${claim.status === "Paid" ? "bg-success w-full" : claim.fraudScore >= 0.7 ? "bg-warning w-1/4" : "bg-warning w-2/3"}`}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {claim.status === "Paid" ? "Payout completed with transaction-ready ledger entry" : "In review: fraud and trigger validation pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
    />
  </label>
);

const NumberField = ({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input
      type="number"
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
    />
  </label>
);

const Metric = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border/50 p-3 bg-background/70">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
    <p className="text-xl font-display font-semibold text-foreground mt-1">{value}</p>
  </div>
);

export default ClaimsManagement;
