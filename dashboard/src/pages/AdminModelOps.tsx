import { useEffect, useState } from "react";
import { Bot, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import AdminOpsLayout from "@/components/AdminOpsLayout";
import { Button } from "@/components/ui/button";
import { fetchPricingModelSnapshot, fetchStrategy, retrainMlModels, type PricingModelSnapshotResponse, type StrategyResponse } from "@/lib/api";

const AdminModelOps = () => {
  const [snapshot, setSnapshot] = useState<PricingModelSnapshotResponse | null>(null);
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [snap, strat] = await Promise.all([fetchPricingModelSnapshot(), fetchStrategy()]);
      setSnapshot(snap);
      setStrategy(strat);
    } catch {
      toast.error("Could not load model ops data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function retrain() {
    setBusy(true);
    try {
      const updated = await retrainMlModels();
      setStrategy(updated);
      await load();
      toast.success("Model retrain complete");
    } catch {
      toast.error("Retrain failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminOpsLayout title="Model Operations" subtitle="ML snapshot, retraining, and feature drift indicators.">
      <div className="grid xl:grid-cols-[1fr_1fr] gap-6">
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Current Model Snapshot</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="w-4 h-4" />Refresh
            </Button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading model data...</p>}
          {!loading && snapshot && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Version: <span className="text-foreground font-medium">{snapshot.modelVersion}</span></p>
              <p>Algorithm Mix: <span className="text-foreground font-medium">{snapshot.algorithmMix}</span></p>
              <p>Refresh Interval: <span className="text-foreground font-medium">{snapshot.refreshIntervalDays} days</span></p>
              <p>Last Refresh: <span className="text-foreground font-medium">{snapshot.lastRefreshAt}</span></p>
              <p>Next Refresh: <span className="text-foreground font-medium">{snapshot.nextRefreshAt}</span></p>
              <p>Suggested Base Premium: <span className="text-foreground font-medium">Rs {snapshot.suggestedBasePremium}</span></p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-border/60 p-3">
            <p className="text-sm font-semibold text-foreground mb-2">Feature Weights</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <Weight label="Location" value={snapshot?.weights.locationRisk ?? 0} />
              <Weight label="Weather" value={snapshot?.weights.weatherRisk ?? 0} />
              <Weight label="Traffic" value={snapshot?.weights.trafficRisk ?? 0} />
              <Weight label="Disruption" value={snapshot?.weights.disruptionRisk ?? 0} />
              <Weight label="Claim Frequency" value={snapshot?.weights.claimFrequencyRisk ?? 0} />
            </div>
          </div>

          <Button variant="hero" className="w-full mt-4 gap-2" onClick={() => void retrain()} disabled={busy}>
            <Bot className="w-4 h-4" />
            {busy ? "Retraining..." : "Retrain Model"}
          </Button>
        </section>

        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Feature Drift Indicators</h2>
          {!strategy && !loading && <p className="text-sm text-muted-foreground">No strategy data available.</p>}
          {strategy && (
            <div className="space-y-3">
              <DriftRow label="BCR vs target" value={`${strategy.actuarial.bcr.toFixed(2)} (target ${strategy.actuarial.targetBcrLower}-${strategy.actuarial.targetBcrUpper})`} severity={strategy.actuarial.bcr > strategy.actuarial.targetBcrUpper ? "high" : "low"} />
              <DriftRow label="Loss ratio" value={`${(strategy.actuarial.lossRatio * 100).toFixed(1)}%`} severity={strategy.actuarial.lossRatio > strategy.actuarial.lossRatioLimit ? "high" : "medium"} />
              <DriftRow label="Enrollment state" value={strategy.actuarial.enrollmentState} severity={strategy.actuarial.enrollmentState === "suspended" ? "high" : "low"} />
              <DriftRow label="Stress scenario" value={strategy.actuarial.stressScenario} severity="medium" />
            </div>
          )}

          <div className="mt-5 rounded-xl border border-border/60 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
            <p>Drift indicators are computed from current strategy payload and are API-ready for future dedicated drift endpoints.</p>
          </div>
        </section>
      </div>
    </AdminOpsLayout>
  );
};

const Weight = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md bg-background/80 border border-border/60 p-2">
    <p>{label}</p>
    <p className="text-foreground font-medium">{value.toFixed(2)}</p>
  </div>
);

const DriftRow = ({ label, value, severity }: { label: string; value: string; severity: "low" | "medium" | "high" }) => (
  <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between gap-2">
    <div>
      <p className="text-sm text-foreground font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{value}</p>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full ${severity === "high" ? "bg-destructive/15 text-destructive" : severity === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
      {severity}
    </span>
  </div>
);

export default AdminModelOps;
