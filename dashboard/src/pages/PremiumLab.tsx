import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  fetchDynamicPremiumQuote,
  fetchPolicies,
  fetchPricingModelSnapshot,
  fetchRealtimeContext,
  fetchSignal,
  type DynamicPremiumQuoteResponse,
  type Policy,
  type PricingModelSnapshotResponse,
} from "@/lib/api";
import {
  scoreDynamicPremiumFrontend,
  type PremiumModelConfig,
  type PremiumModelInputs,
} from "@/lib/phase2Models";
import { computeAdvancedRisk, toRiskScale10 } from "@/lib/riskEngine";
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

const PremiumLab = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<PricingModelSnapshotResponse | null>(null);
  const [quote, setQuote] = useState<DynamicPremiumQuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [cityRisk, setCityRisk] = useState(0.62);
  const [weatherRisk, setWeatherRisk] = useState(0.58);
  const [trafficRisk, setTrafficRisk] = useState(0.49);
  const [disruptionRisk, setDisruptionRisk] = useState(0.52);
  const [claimFrequencyRisk, setClaimFrequencyRisk] = useState(0.31);
  const [weeklyDistanceKm, setWeeklyDistanceKm] = useState(460);
  const [nightShiftRatio, setNightShiftRatio] = useState(0.34);
  const [reliabilityScore, setReliabilityScore] = useState(78);
  const [liveEngineScore, setLiveEngineScore] = useState(0);
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

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);
    try {
      const [policyRes, modelRes] = await Promise.all([
        fetchPolicies(),
        fetchPricingModelSnapshot(),
      ]);
      setPolicies(policyRes.policies);
      setSnapshot(modelRes);
      if (policyRes.policies.length > 0) {
        setSelectedPolicyId(policyRes.policies[0].id);
      }

      const initialPolicy = policyRes.policies[0];
      if (initialPolicy) {
        const coords = await getCurrentCoordinates();
        const [realtime, platform, disruption] = await Promise.all([
          fetchRealtimeContext({ lat: coords?.lat, lon: coords?.lon, city: initialPolicy.city }),
          fetchSignal("platform-outage"),
          fetchSignal("local-disruption"),
        ]);
        setRealtimeSummary(realtime);
        const risk = computeAdvancedRisk({
          realtime,
          platformStatus: platform.status,
          disruptionStatus: disruption.status,
          threshold: 0.62,
          baseCooldownMin: 5,
          aggressiveMode: false,
          nowMs: Date.now(),
        });
        setLiveEngineScore(risk.score);
        setCityRisk(toRiskScale10(risk.score));
        setWeatherRisk(toRiskScale10(risk.weatherScore));
        setTrafficRisk(toRiskScale10(risk.trafficScore));
        setDisruptionRisk(toRiskScale10(risk.disruptionScore));
      }
    } catch {
      const fallback = buildFallbackRealtime("Bengaluru");
      setRealtimeSummary(fallback);
      setLiveEngineScore(0.34);
      setCityRisk(toRiskScale10(0.34));
      setWeatherRisk(toRiskScale10(0.25));
      setTrafficRisk(toRiskScale10(0.22));
      setDisruptionRisk(toRiskScale10(0.2));
      toast.error("Could not load model data");
    } finally {
      setLoading(false);
    }
  }

  const selectedPolicy = useMemo(
    () => policies.find((item) => item.id === selectedPolicyId) || null,
    [policies, selectedPolicyId],
  );

  const premiumDelta = useMemo(() => {
    if (!quote || !snapshot) return 0;
    return quote.weeklyPremium - snapshot.suggestedBasePremium;
  }, [quote, snapshot]);

  const hyperLocalDiscount = useMemo(() => {
    if (!quote) return 0;
    const safeZone = cityRisk < 0.3 && weatherRisk < 0.3;
    return safeZone ? 2 : 0;
  }, [quote, cityRisk, weatherRisk]);

  const suggestedCoverageHours = useMemo(() => {
    const riskMix = (weatherRisk + disruptionRisk + trafficRisk) / 3;
    return riskMix > 0.65 ? 48 : riskMix > 0.4 ? 36 : 24;
  }, [weatherRisk, disruptionRisk, trafficRisk]);

  const frontendPreview = useMemo(() => {
    if (!snapshot || !selectedPolicy) return null;

    const cfg: PremiumModelConfig = {
      basePremium: snapshot.suggestedBasePremium,
      locationWeight: snapshot.weights.locationRisk,
      weatherWeight: snapshot.weights.weatherRisk,
      trafficWeight: snapshot.weights.trafficRisk,
      disruptionWeight: snapshot.weights.disruptionRisk,
      claimFrequencyWeight: snapshot.weights.claimFrequencyRisk,
    };

    const inputs: PremiumModelInputs = {
      coverageAmount: selectedPolicy.coverageAmount,
      planTier: selectedPolicy.planTier,
      cityRisk,
      weatherRisk,
      trafficRisk,
      disruptionRisk,
      claimFrequencyRisk,
      weeklyDistanceKm,
      nightShiftRatio,
      reliabilityScore,
    };

    return scoreDynamicPremiumFrontend(cfg, inputs);
  }, [
    snapshot,
    selectedPolicy,
    cityRisk,
    weatherRisk,
    trafficRisk,
    disruptionRisk,
    claimFrequencyRisk,
    weeklyDistanceKm,
    nightShiftRatio,
    reliabilityScore,
  ]);

  async function computeQuote() {
    if (!selectedPolicy) {
      toast.error("Pick a policy first");
      return;
    }

    setCalculating(true);
    try {
      let realtime = null;
      let platform = null;
      let disruption = null;
      if (selectedPolicy) {
        const coords = await getCurrentCoordinates();
        [realtime, platform, disruption] = await Promise.all([
          fetchRealtimeContext({ lat: coords?.lat, lon: coords?.lon, city: selectedPolicy.city }),
          fetchSignal("platform-outage"),
          fetchSignal("local-disruption"),
        ]);
        setRealtimeSummary(realtime);
        const risk = computeAdvancedRisk({
          realtime,
          platformStatus: platform.status,
          disruptionStatus: disruption.status,
          threshold: 0.62,
          baseCooldownMin: 5,
          aggressiveMode: false,
          nowMs: Date.now(),
        });
        setLiveEngineScore(risk.score);
        setCityRisk(toRiskScale10(risk.score));
        setWeatherRisk(toRiskScale10(risk.weatherScore));
        setTrafficRisk(toRiskScale10(risk.trafficScore));
        setDisruptionRisk(toRiskScale10(risk.disruptionScore));
        setReliabilityScore(Math.max(55, Math.round(100 - risk.score * 35)));
      } else {
        setRealtimeSummary(buildFallbackRealtime("Bengaluru"));
      }

      const result = await fetchDynamicPremiumQuote({
        policyId: selectedPolicy.id,
        coverageAmount: selectedPolicy.coverageAmount,
        planTier: selectedPolicy.planTier,
        cityRisk,
        weatherRisk,
        trafficRisk,
        disruptionRisk,
        claimFrequencyRisk,
        weeklyDistanceKm,
        nightShiftRatio,
        reliabilityScore,
      });
      setQuote(result);
      toast.success("Premium recalculated");
    } catch {
      toast.error("Failed to calculate premium");
    } finally {
      setCalculating(false);
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
            <h1 className="font-display text-xl font-bold text-foreground">Dynamic Premium Calculation</h1>
          </div>
          <Link to="/claims">
            <Button variant="outline">Go To Claims</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <ScrollReveal>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-foreground">Risk Inputs</h2>
              <Button variant="ghost" size="sm" className="gap-2" onClick={computeQuote} disabled={calculating || loading}>
                <RefreshCw className="w-4 h-4" />
                {calculating ? "Calculating..." : "Recompute"}
              </Button>
            </div>

            <label className="text-sm text-muted-foreground block">
              Policy
              <select
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={selectedPolicyId || ""}
                onChange={(event) => setSelectedPolicyId(Number(event.target.value))}
              >
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    #{policy.id} {policy.riderName} - {policy.planTier}
                  </option>
                ))}
              </select>
            </label>

            <SliderInput label="City Risk" value={cityRisk} onChange={setCityRisk} />
            <SliderInput label="Weather Risk" value={weatherRisk} onChange={setWeatherRisk} />
            <SliderInput label="Traffic Risk" value={trafficRisk} onChange={setTrafficRisk} />
            <SliderInput label="Disruption Risk" value={disruptionRisk} onChange={setDisruptionRisk} />
            <SliderInput label="Claim Frequency Risk" value={claimFrequencyRisk} onChange={setClaimFrequencyRisk} />
            <NumberInput label="Weekly Distance (km)" value={weeklyDistanceKm} onChange={setWeeklyDistanceKm} />
            <SliderInput label="Night Shift Ratio" value={nightShiftRatio} onChange={setNightShiftRatio} />
            <NumberInput label="Reliability Score" value={reliabilityScore} onChange={setReliabilityScore} min={0} max={100} />
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-5">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-primary font-semibold">Weekly Premium</p>
              <p className="text-3xl font-display font-bold text-foreground mt-1">
                Rs {quote?.weeklyPremium ?? "--"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Risk band: <span className="font-semibold text-foreground">{quote?.riskBand ?? "--"}</span>
              </p>
              {quote && (
                <p className="text-xs text-muted-foreground mt-1">
                  Backend ensemble risk: {quote.ensembleRisk.toFixed(3)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Shared zero-touch risk engine: {liveEngineScore.toFixed(2)}
              </p>
              {realtimeSummary && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
              {frontendPreview && (
                <p className="text-xs text-muted-foreground mt-2">
                  Frontend model mirror: Rs {frontendPreview.weeklyPremium} • ensemble risk {frontendPreview.ensembleRisk.toFixed(3)}
                </p>
              )}
              {quote && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-border/60 bg-background/70 p-2">
                    <p className="text-muted-foreground">Change vs last week</p>
                    <p className={`font-semibold ${premiumDelta >= 0 ? "text-warning" : "text-success"}`}>
                      {premiumDelta >= 0 ? "+" : ""}Rs {premiumDelta.toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/70 p-2">
                    <p className="text-muted-foreground">Hyper-local discount</p>
                    <p className="font-semibold text-success">-Rs {hyperLocalDiscount}/week</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/70 p-2 col-span-2">
                    <p className="text-muted-foreground">Suggested protected coverage hours</p>
                    <p className="font-semibold text-foreground">{suggestedCoverageHours} hours/week</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Bot className="w-4 h-4 text-primary" /> Rolling Model Snapshot
              </div>
              {loading && <p className="text-sm text-muted-foreground">Loading model...</p>}
              {!loading && snapshot && (
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Version: <span className="text-foreground">{snapshot.modelVersion}</span></p>
                  <p>Algo Mix: <span className="text-foreground">{snapshot.algorithmMix}</span></p>
                  <p>Refresh: every <span className="text-foreground">{snapshot.refreshIntervalDays} days</span></p>
                  <p>Next refresh: <span className="text-foreground">{snapshot.nextRefreshAt}</span></p>
                </div>
              )}
            </div>

            {quote && (
              <div className="rounded-xl border border-border/50 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Latest backend inference packet</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Model used: <span className="text-foreground">{quote.model.modelVersion}</span></p>
                  <p>Mix: <span className="text-foreground">{quote.model.algorithmMix}</span></p>
                  <p>Next retrain window: <span className="text-foreground">{quote.model.nextRefreshAt}</span></p>
                  <p>Policy #{quote.inputs.policyId ?? "N/A"} • Tier {quote.inputs.planTier} • Coverage Rs {quote.inputs.coverageAmount}</p>
                  <p>City/Weather/Traffic: {quote.inputs.cityRisk.toFixed(2)} / {quote.inputs.weatherRisk.toFixed(2)} / {quote.inputs.trafficRisk.toFixed(2)}</p>
                  <p>Disruption/Claims Freq: {quote.inputs.disruptionRisk.toFixed(2)} / {quote.inputs.claimFrequencyRisk.toFixed(2)}</p>
                  <p>Distance/Night/Reliability: {quote.inputs.weeklyDistanceKm.toFixed(0)}km / {quote.inputs.nightShiftRatio.toFixed(2)} / {quote.inputs.reliabilityScore.toFixed(0)}</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/50 p-4 text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-medium">Pricing factor explanations</p>
              <p>Safe zone discount: if city + weather risk are both low, weekly premium can reduce by Rs 2.</p>
              <p>High disruption risk increases premium because trigger probability and payout pressure are higher.</p>
              <p>Higher reliability score reduces premium drift and improves weekly affordability.</p>
            </div>

            <Button variant="hero" className="w-full" onClick={computeQuote} disabled={calculating || loading}>
              {calculating ? "Running LR + RF + XGBoost blend..." : "Calculate Dynamic Premium"}
            </Button>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
};

const SliderInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <label className="text-sm text-muted-foreground block">
    {label}: <span className="text-foreground font-medium">{value.toFixed(2)}</span>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full mt-2"
    />
  </label>
);

const NumberInput = ({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
    />
  </label>
);

export default PremiumLab;
