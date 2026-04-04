import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Zap, CloudRain, Car, AlertTriangle, CheckCircle2, RefreshCw, Activity, Radar, Gauge } from "lucide-react";
import { createAutoClaim, createManualClaim, fetchClaims, fetchPolicies, fetchRealtimeContext, fetchSignal, type AutoClaimRequest, type Claim, type Policy } from "@/lib/api";
import { getSelectedPolicyId, setSelectedPolicyId } from "@/lib/policySelection";
import { computeAdvancedRisk } from "@/lib/riskEngine";
import { toast } from "sonner";

const RiderClaimsScreen = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyIdState] = useState<number | null>(getSelectedPolicyId());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [monitoring, setMonitoring] = useState(true);
  const [lastSignalSummary, setLastSignalSummary] = useState("Waiting for live signal checks...");
  const [lastAutoFileAt, setLastAutoFileAt] = useState<number>(0);
  const [lastAutoDecision, setLastAutoDecision] = useState("Engine idle");
  const [liveRiskScore, setLiveRiskScore] = useState(0);
  const [autoThreshold, setAutoThreshold] = useState(0.62);
  const [adaptiveCooldownMin, setAdaptiveCooldownMin] = useState(5);
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [form, setForm] = useState<AutoClaimRequest>({
    policyId: 0,
    incidentType: "accident",
    incidentAt: new Date().toISOString().slice(0, 16),
    claimedAmount: 1500,
    weatherSeverity: 0.7,
    gpsConsistency: 0.85,
    platformEvidence: 0.8,
    trafficAnomaly: 0.4,
    riderDelayMinutes: 15,
  });
  const [manualSummary, setManualSummary] = useState("Delivery loss due to severe weather and traffic disruption");

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsResponse, policiesResponse] = await Promise.all([fetchClaims(), fetchPolicies()]);
      setClaims(claimsResponse.claims || []);
      setPolicies(policiesResponse.policies || []);

      const allPolicies = policiesResponse.policies || [];
      const preferred = getSelectedPolicyId();
      const currentPolicy = allPolicies.find((item) => item.id === preferred) || allPolicies[0];
      if (currentPolicy) {
        setSelectedPolicyIdState(currentPolicy.id);
        setSelectedPolicyId(currentPolicy.id);
        setForm((prev) => ({
          ...prev,
          policyId: currentPolicy.id,
          claimedAmount: Math.max(1000, Math.round(currentPolicy.coverageAmount * 0.03)),
        }));
      }
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!monitoring || !selectedPolicyId) return;

    let active = true;
    const tick = async () => {
      if (!active) return;

      try {
        const [weatherSignal, trafficSignal, platformSignal, disruptionSignal] = await Promise.all([
          fetchSignal("weather"),
          fetchSignal("traffic"),
          fetchSignal("platform-outage"),
          fetchSignal("local-disruption"),
        ]);

        let coords: { lat: number; lon: number } | null = null;
        if (navigator.geolocation) {
          coords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 4000 }
            );
          });
        }

        const realtime = await fetchRealtimeContext({ lat: coords?.lat, lon: coords?.lon });

        const now = Date.now();
        const risk = computeAdvancedRisk({
          realtime,
          platformStatus: platformSignal.status,
          disruptionStatus: disruptionSignal.status,
          threshold: autoThreshold,
          aggressiveMode,
          baseCooldownMin: adaptiveCooldownMin,
          lastAutoFileAtMs: lastAutoFileAt,
          nowMs: now,
        });

        setLiveRiskScore(risk.score);
        setLastSignalSummary(
          `City ${realtime.location.city} | W:${realtime.weather.status} ${Math.round(realtime.weather.temperatureC)}°C | T:${realtime.traffic.status} ${Math.round(realtime.traffic.congestion * 100)}%`
        );

        if (risk.shouldAutoFile) {
          setSubmitting(true);
          await createAutoClaim({
            ...form,
            policyId: selectedPolicyId,
            incidentType: risk.weatherScore >= risk.trafficScore ? "weather" : "traffic",
            incidentAt: new Date().toISOString(),
            weatherSeverity: Number(risk.weatherScore.toFixed(2)),
            trafficAnomaly: Number(risk.trafficScore.toFixed(2)),
            gpsConsistency: Math.max(0.2, 1 - risk.gpsAnomaly),
            platformEvidence: Number(risk.platformScore.toFixed(2)),
            riderDelayMinutes: Math.round(18 + risk.score * 45),
          });
          setLastAutoFileAt(now);
          setLastAutoDecision(`Auto-filed at score ${risk.score.toFixed(2)} (threshold ${risk.dynamicThreshold.toFixed(2)})`);
          toast.success("Advanced zero-touch claim auto-filed");
          await loadData();
        } else {
          setLastAutoDecision(`No file. Score ${risk.score.toFixed(2)} below threshold ${risk.dynamicThreshold.toFixed(2)} or cooldown active.`);
        }
      } catch {
        setLastSignalSummary("Signal monitor temporarily unavailable");
        setLastAutoDecision("Decision skipped due to feed error");
      } finally {
        setSubmitting(false);
      }
    };

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, 12000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [monitoring, selectedPolicyId, form, lastAutoFileAt, autoThreshold, adaptiveCooldownMin, aggressiveMode]);

  const selectedPolicy = policies.find((item) => item.id === selectedPolicyId) || policies[0];

  const onSelectPolicy = (policyId: number) => {
    setSelectedPolicyIdState(policyId);
    setSelectedPolicyId(policyId);
    const policy = policies.find((item) => item.id === policyId);
    if (policy) {
      setForm((prev) => ({
        ...prev,
        policyId,
        claimedAmount: Math.max(1000, Math.round(policy.coverageAmount * 0.03)),
      }));
    }
  };

  const submitManualClaim = async () => {
    if (!selectedPolicyId) {
      toast.error("Select a policy first");
      return;
    }

    setSubmitting(true);
    try {
      await createManualClaim({
        policyId: selectedPolicyId,
        incidentType: form.incidentType,
        incidentAt: new Date(form.incidentAt).toISOString(),
        claimedAmount: form.claimedAmount,
        summary: manualSummary,
      });
      toast.success("Manual claim submitted");
      await loadData();
    } catch {
      toast.error("Failed to submit manual claim");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = claims.filter((claim) => claim.status === "Paid").reduce((sum, claim) => sum + claim.claimAmount, 0);
  const reviewCount = claims.filter((claim) => claim.status === "Review").length;
  const autoApprovedRate = claims.length === 0 ? "0%" : `${Math.round((claims.filter((claim) => claim.autoApproved).length / claims.length) * 100)}%`;
  const reviewWidthClass = reviewCount === 0 ? "w-0" : reviewCount === 1 ? "w-1/4" : reviewCount === 2 ? "w-1/2" : reviewCount === 3 ? "w-3/4" : "w-full";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground mb-1">Claims</h1>
            <p className="text-primary-foreground/70 text-sm">Backend auto-filed rider claims</p>
          </div>
          <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={() => setMonitoring((value) => !value)}>
            {monitoring ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-3 animate-fade-up">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{claims.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Claims</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-success">₹{totalPaid.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Paid</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{autoApprovedRate}</p>
              <p className="text-[10px] text-muted-foreground">Auto-Approve</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg animate-fade-up delay-100">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">File Auto-Claim</h3>
                <p className="text-xs text-muted-foreground">Zero-touch monitor uses weather, traffic, GPS and platform evidence</p>
              </div>
              <div className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {selectedPolicy ? `Policy ${selectedPolicy.id}` : "No policy"}
              </div>
            </div>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={selectedPolicy?.id || ""}
              onChange={(event) => onSelectPolicy(Number(event.target.value))}
              disabled={policies.length === 0}
            >
              {policies.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} · {item.planTier} · ₹{item.coverageAmount.toLocaleString()}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="p-2 rounded-lg bg-muted/50">Status: {monitoring ? "monitoring" : "paused"}</div>
              <div className="p-2 rounded-lg bg-muted/50">Feed: {loading ? "syncing" : "live"}</div>
              <div className="p-2 rounded-lg bg-muted/50 col-span-2">{lastSignalSummary}</div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Radar size={14} className="text-primary" />
                <p className="text-xs font-semibold text-foreground">Advanced Zero-Touch Engine</p>
                <span className="ml-auto text-[10px] rounded-full bg-primary/10 px-2 py-0.5 text-primary font-semibold">
                  {Math.round(liveRiskScore * 100)} risk
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="space-y-1">
                  <span className="text-muted-foreground">Threshold</span>
                  <input
                    className="w-full"
                    type="range"
                    min={0.4}
                    max={0.85}
                    step={0.01}
                    value={autoThreshold}
                    onChange={(e) => setAutoThreshold(Number(e.target.value))}
                  />
                  <p className="text-foreground font-semibold">{autoThreshold.toFixed(2)}</p>
                </label>
                <label className="space-y-1">
                  <span className="text-muted-foreground">Cooldown (min)</span>
                  <input
                    className="w-full"
                    type="range"
                    min={2}
                    max={15}
                    step={1}
                    value={adaptiveCooldownMin}
                    onChange={(e) => setAdaptiveCooldownMin(Number(e.target.value))}
                  />
                  <p className="text-foreground font-semibold">{adaptiveCooldownMin}m</p>
                </label>
              </div>
              <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><Gauge size={14} /> Aggressive Auto Mode</span>
                <input type="checkbox" checked={aggressiveMode} onChange={(e) => setAggressiveMode(e.target.checked)} />
              </label>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{lastAutoDecision}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-150">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Claim Form</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Policy ID</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="number" value={form.policyId} onChange={(event) => setForm((prev) => ({ ...prev, policyId: Number(event.target.value) }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Amount</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="number" value={form.claimedAmount} onChange={(event) => setForm((prev) => ({ ...prev, claimedAmount: Number(event.target.value) }))} />
              </label>
              <label className="space-y-1 col-span-2">
                <span className="text-xs text-muted-foreground">Incident Time</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="datetime-local" value={form.incidentAt} onChange={(event) => setForm((prev) => ({ ...prev, incidentAt: event.target.value }))} />
              </label>
              <label className="space-y-1 col-span-2">
                <span className="text-xs text-muted-foreground">Manual Claim Summary</span>
                <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2" rows={3} value={manualSummary} onChange={(event) => setManualSummary(event.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-2 rounded-lg bg-muted/50">Weather/GPS/Platform/Traffic use a 0-1 scale</div>
              <div className="p-2 rounded-lg bg-muted/50">Auto-file uses policy coverage as payout cap</div>
            </div>
            <Button className="w-full" onClick={() => void submitManualClaim()} disabled={!selectedPolicyId || submitting || !manualSummary.trim()}>
              Submit Manual Claim
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Claim History</h3>
            <div className="space-y-3">
              {loading && <div className="text-sm text-muted-foreground">Loading claims...</div>}
              {!loading && claims.length === 0 && <div className="text-sm text-muted-foreground">No claims filed yet.</div>}
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="w-full rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${claim.status === "Paid" ? "bg-success/10" : "bg-warning/10"}`}>
                      {claim.status === "Paid" ? <CheckCircle2 size={16} className="text-success" /> : <Activity size={16} className="text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{claim.id}</span>
                        <div className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {claim.incidentType}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{claim.claimAmount.toLocaleString()} · {new Date(claim.incidentAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${claim.status === "Paid" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {claim.status}
                    </div>
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {claim.notes}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-300">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
              <RefreshCw size={22} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Review Queue</p>
              <p className="text-xs text-muted-foreground mb-2">{reviewCount} claims awaiting backend review</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full gradient-primary rounded-full ${reviewWidthClass}`} />
              </div>
            </div>
            <span className="text-sm font-bold text-success">{reviewCount}</span>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default RiderClaimsScreen;
