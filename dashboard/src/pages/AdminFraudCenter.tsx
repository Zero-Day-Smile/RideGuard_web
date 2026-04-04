import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PlusCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import AdminOpsLayout from "@/components/AdminOpsLayout";
import { Button } from "@/components/ui/button";
import {
  createFraudAlert,
  fetchAdminOverview,
  updateFraudAlert,
  type AdminOverviewResponse,
} from "@/lib/api";

const AdminFraudCenter = () => {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newAlert, setNewAlert] = useState({
    id: "",
    city: "Bengaluru",
    level: "medium" as "high" | "medium" | "low",
    reason: "GPS mismatch and unusual claim frequency",
  });

  async function load() {
    setLoading(true);
    try {
      setOverview(await fetchAdminOverview());
    } catch {
      toast.error("Failed to load fraud center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const alerts = overview?.fraudAlerts || [];
    return {
      total: alerts.length,
      high: alerts.filter((a) => a.level === "high").length,
      medium: alerts.filter((a) => a.level === "medium").length,
      low: alerts.filter((a) => a.level === "low").length,
    };
  }, [overview]);

  async function createAlert() {
    if (!newAlert.id || !newAlert.reason) {
      toast.error("Alert id and reason are required");
      return;
    }

    setBusyId("create");
    try {
      await createFraudAlert(newAlert);
      toast.success("Fraud alert created");
      setNewAlert((prev) => ({ ...prev, id: "" }));
      await load();
    } catch {
      toast.error("Could not create alert");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveAlert(alertId: string) {
    setBusyId(alertId);
    try {
      await updateFraudAlert(alertId, {
        level: "low",
        reason: "Resolved after investigation",
      });
      toast.success("Alert moved to low severity");
      await load();
    } catch {
      toast.error("Could not update alert");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminOpsLayout title="Fraud Center" subtitle="Fraud alerts queue with investigation controls.">
      <div className="grid xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Fraud Alerts Queue</h2>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>Refresh</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Metric label="Total" value={String(counts.total)} />
            <Metric label="High" value={String(counts.high)} />
            <Metric label="Medium" value={String(counts.medium)} />
            <Metric label="Low" value={String(counts.low)} />
          </div>

          <div className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading alerts...</p>}
            {!loading && (overview?.fraudAlerts || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No fraud alerts found.</p>
            )}
            {(overview?.fraudAlerts || []).map((alert) => (
              <div key={alert.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{alert.id}</p>
                    <p className="text-xs text-muted-foreground">{alert.city}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-1 ${badgeClass(alert.level)}`}>
                    {alert.level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{alert.reason}</p>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === alert.id}
                    onClick={() => void resolveAlert(alert.id)}
                  >
                    {busyId === alert.id ? "Updating..." : "Mark Investigated"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Create Alert</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Flag anomalies like GPS mismatch or high claims frequency for manual investigation.
          </p>

          <label className="text-sm text-muted-foreground block mb-3">
            Alert ID
            <input
              value={newAlert.id}
              onChange={(e) => setNewAlert((prev) => ({ ...prev, id: e.target.value }))}
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              placeholder="FRA-DEL-109"
            />
          </label>

          <label className="text-sm text-muted-foreground block mb-3">
            City
            <input
              value={newAlert.city}
              onChange={(e) => setNewAlert((prev) => ({ ...prev, city: e.target.value }))}
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="text-sm text-muted-foreground block mb-3">
            Severity
            <select
              value={newAlert.level}
              onChange={(e) => setNewAlert((prev) => ({ ...prev, level: e.target.value as "high" | "medium" | "low" }))}
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>

          <label className="text-sm text-muted-foreground block mb-4">
            Reason
            <textarea
              value={newAlert.reason}
              onChange={(e) => setNewAlert((prev) => ({ ...prev, reason: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[100px]"
            />
          </label>

          <Button variant="hero" className="w-full gap-2" onClick={() => void createAlert()} disabled={busyId === "create"}>
            <PlusCircle className="w-4 h-4" />
            {busyId === "create" ? "Creating..." : "Create Fraud Alert"}
          </Button>

          <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p>Fraud checks must complete before payout for zero-touch claims.</p>
            </div>
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

function badgeClass(level: string) {
  if (level === "high") return "bg-destructive/15 text-destructive";
  if (level === "medium") return "bg-warning/15 text-warning";
  return "bg-success/15 text-success";
}

export default AdminFraudCenter;
