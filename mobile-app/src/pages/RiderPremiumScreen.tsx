import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator, TrendingDown, Clock, Shield, MapPin, CloudRain, Car, Zap,
  AlertTriangle, Route, Moon, Star, RefreshCw, Loader2, Droplets, Wind, ThermometerSun
} from "lucide-react";
import { fetchDynamicPremiumQuote, fetchPolicies, type DynamicPremiumQuoteResponse, type Policy } from "@/lib/api";
import { toast } from "sonner";

interface RiskInput {
  label: string;
  icon: React.ElementType;
  key: keyof PremiumInputState;
  min: number;
  max: number;
  step: number;
  unit: string;
}

type PremiumInputState = {
  coverageAmount: number;
  cityRisk: number;
  weatherRisk: number;
  trafficRisk: number;
  disruptionRisk: number;
  claimFrequencyRisk: number;
  weeklyDistanceKm: number;
  nightShiftRatio: number;
  reliabilityScore: number;
};

const riskInputs: RiskInput[] = [
  { label: "Coverage Amount", icon: Shield, key: "coverageAmount", min: 10000, max: 100000, step: 5000, unit: "₹" },
  { label: "City Risk", icon: MapPin, key: "cityRisk", min: 1, max: 10, step: 1, unit: "/10" },
  { label: "Weather Risk", icon: CloudRain, key: "weatherRisk", min: 1, max: 10, step: 1, unit: "/10" },
  { label: "Traffic Risk", icon: Car, key: "trafficRisk", min: 1, max: 10, step: 1, unit: "/10" },
  { label: "Disruption Risk", icon: AlertTriangle, key: "disruptionRisk", min: 1, max: 10, step: 1, unit: "/10" },
  { label: "Claim Frequency", icon: Zap, key: "claimFrequencyRisk", min: 0, max: 5, step: 1, unit: "claims" },
  { label: "Weekly Distance", icon: Route, key: "weeklyDistanceKm", min: 50, max: 500, step: 25, unit: "km" },
  { label: "Night Shift Ratio", icon: Moon, key: "nightShiftRatio", min: 0, max: 100, step: 5, unit: "%" },
  { label: "Reliability Score", icon: Star, key: "reliabilityScore", min: 1, max: 100, step: 1, unit: "/100" },
];

const RiderPremiumScreen = () => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [values, setValues] = useState<PremiumInputState>({
    coverageAmount: 50000,
    cityRisk: 5,
    weatherRisk: 5,
    trafficRisk: 5,
    disruptionRisk: 5,
    claimFrequencyRisk: 1,
    weeklyDistanceKm: 200,
    nightShiftRatio: 25,
    reliabilityScore: 85,
  });

  const [quote, setQuote] = useState<DynamicPremiumQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [city] = useState("Mumbai");

  const loadPolicyAndQuote = async () => {
    try {
      const response = await fetchPolicies();
      const currentPolicy = response.policies?.[0] ?? null;
      setPolicy(currentPolicy);
      if (currentPolicy) {
        const nextValues = {
          coverageAmount: currentPolicy.coverageAmount,
          cityRisk: 5,
          weatherRisk: 5,
          trafficRisk: 5,
          disruptionRisk: 5,
          claimFrequencyRisk: 1,
          weeklyDistanceKm: 200,
          nightShiftRatio: 25,
          reliabilityScore: 85,
        };
        setValues(nextValues);
        const result = await fetchDynamicPremiumQuote({
          policyId: currentPolicy.id,
          planTier: currentPolicy.planTier,
          ...nextValues,
        });
        setQuote(result);
      }
    } catch {
      toast.error("Failed to load policy for pricing");
    }
  };

  const recalculate = async () => {
    setLoading(true);
    try {
      const result = await fetchDynamicPremiumQuote({
        policyId: policy?.id,
        ...values,
      });
      setQuote(result);
    } catch {
      toast.error("Failed to calculate premium");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicyAndQuote();
  }, []); // Initial load

  const updateValue = (key: keyof PremiumInputState, val: number[]) => {
    setValues((prev) => ({ ...prev, [key]: val[0] }));
  };

  const premium = quote?.weeklyPremium ?? 0;
  const modelSummary = useMemo(() => quote?.model, [quote]);
  const riskBand = quote?.riskBand ?? "medium";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground mb-1">Premium Calculator</h1>
            <p className="text-primary-foreground/70 text-sm">Dynamic risk-based pricing</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs"
            onClick={recalculate}
            disabled={loading}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Recalculate
          </Button>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-4">
        {/* Output Card */}
        <Card className="border-0 shadow-xl animate-fade-up">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Premium</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gradient">₹{premium}</span>
                  <span className="text-sm text-muted-foreground">/week</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <Calculator size={24} className="text-primary-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Risk Band</p>
                <p className="text-sm font-bold text-success capitalize">{riskBand}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="text-sm font-bold text-success flex items-center justify-center gap-0.5">{modelSummary?.modelVersion || "Live"}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Refresh</p>
                <p className="text-sm font-bold text-info flex items-center justify-center gap-0.5">
                  <Clock size={12} /> {modelSummary?.refreshIntervalDays || 0}d
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {quote && (
          <Card className="border-0 shadow-lg animate-fade-up delay-100">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-foreground mb-3">Premium Breakdown</h3>
              <div className="space-y-2">
                {[
                  { label: "Coverage", value: `₹${quote.inputs.coverageAmount.toLocaleString()}`, color: "text-foreground" },
                  { label: "City Risk", value: `${quote.inputs.cityRisk}/10`, color: "text-foreground" },
                  { label: "Weather Risk", value: `${quote.inputs.weatherRisk}/10`, color: "text-foreground" },
                  { label: "Traffic Risk", value: `${quote.inputs.trafficRisk}/10`, color: "text-foreground" },
                  { label: "Disruption Risk", value: `${quote.inputs.disruptionRisk}/10`, color: "text-foreground" },
                  { label: "Claim Risk", value: `${quote.inputs.claimFrequencyRisk}`, color: "text-warning" },
                  { label: "Ensemble Risk", value: `${quote.ensembleRisk}`, color: "text-success" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg animate-fade-up delay-150">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Risk Parameters</h3>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={recalculate} disabled={loading}>
                {loading ? <Loader2 size={10} className="animate-spin mr-1" /> : null}
                Update
              </Button>
            </div>
            {riskInputs.map((input) => (
              <div key={input.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input.icon size={14} className="text-primary" />
                    <span className="text-xs font-medium text-foreground">{input.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {input.unit === "₹" ? `₹${values[input.key].toLocaleString()}` : `${values[input.key]}${input.unit}`}
                  </Badge>
                </div>
                <Slider
                  value={[values[input.key]]}
                  onValueChange={(v) => updateValue(input.key, v)}
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiderPremiumScreen;
