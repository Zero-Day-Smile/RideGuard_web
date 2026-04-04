import { useEffect, useMemo, useState } from "react";
import { CloudRain, Flame, PlusCircle, RadioTower, TrafficCone } from "lucide-react";
import { toast } from "sonner";
import AdminOpsLayout from "@/components/AdminOpsLayout";
import { Button } from "@/components/ui/button";
import { createTriggerEvent, fetchTriggers, refreshTriggers, type TriggersResponse } from "@/lib/api";

const triggerTemplates = [
  { key: "rain", label: "Heavy rain", icon: CloudRain, impact: "Outdoor delivery paused" },
  { key: "pollution", label: "Severe pollution", icon: Flame, impact: "Exposure limits reduce active hours" },
  { key: "traffic", label: "Traffic gridlock", icon: TrafficCone, impact: "Fulfillment delays spike" },
  { key: "outage", label: "Platform outage", icon: RadioTower, impact: "Order acceptance halted" },
  { key: "restriction", label: "Local restrictions", icon: Flame, impact: "Zone closures stop deliveries" },
];

const AdminTriggerOps = () => {
  const [data, setData] = useState<TriggersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setData(await fetchTriggers());
    } catch {
      toast.error("Could not load trigger feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const reliability = useMemo(() => {
    const timeline = data?.triggerTimeline || [];
    if (!timeline.length) return 0;
    const healthy = timeline.filter((t) => t.status.toLowerCase().includes("active") || t.status.toLowerCase().includes("auto")).length;
    return Math.round((healthy / timeline.length) * 100);
  }, [data]);

  async function handleRefresh() {
    setBusy(true);
    try {
      const refreshed = await refreshTriggers();
      setData(refreshed);
      toast.success("Trigger feed refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  async function simulate(type: (typeof triggerTemplates)[number]) {
    setBusy(true);
    try {
      await createTriggerEvent({
        time: new Date().toLocaleTimeString(),
        event: type.label,
        effect: type.impact,
        status: "active",
      });
      await load();
      toast.success(`${type.label} trigger simulated`);
    } catch {
      toast.error("Simulation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminOpsLayout title="Trigger Operations" subtitle="Live trigger feed and simulation controls.">
      <div className="grid xl:grid-cols-[1fr_1fr] gap-6">
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Live Trigger Feed</h2>
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={busy || loading}>
              {busy ? "Refreshing..." : "Refresh Feed"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Metric label="Active Signals" value={String(data?.disruptionSignals?.length || 0)} />
            <Metric label="Reliability Score" value={`${reliability}%`} />
          </div>

          <div className="space-y-3 mb-4">
            {(data?.disruptionSignals || []).map((signal) => (
              <div key={signal.name} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{signal.name}</p>
                  <span className="text-xs rounded-full px-2 py-1 bg-primary/10 text-primary">{signal.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{signal.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-sm font-semibold text-foreground mb-2">Timeline</p>
            <div className="space-y-2 max-h-[360px] overflow-auto">
              {loading && <p className="text-sm text-muted-foreground">Loading timeline...</p>}
              {(data?.triggerTimeline || []).map((entry) => (
                <div key={`${entry.time}-${entry.event}`} className="rounded-lg border border-border/40 p-2">
                  <p className="text-xs font-medium text-foreground">{entry.event}</p>
                  <p className="text-xs text-muted-foreground">{entry.time} • {entry.effect}</p>
                  <p className="text-[11px] text-primary mt-1">{entry.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Simulate Trigger Events</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Build and validate zero-touch claim flows by simulating all 5 disruption types.
          </p>

          <div className="space-y-3">
            {triggerTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div key={template.key} className="rounded-xl border border-border/60 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{template.label}</p>
                      <p className="text-xs text-muted-foreground">{template.impact}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => void simulate(template)} disabled={busy}>
                    <PlusCircle className="w-3.5 h-3.5" />
                    Simulate
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminOpsLayout>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-display font-semibold text-foreground">{value}</p>
  </div>
);

export default AdminTriggerOps;
