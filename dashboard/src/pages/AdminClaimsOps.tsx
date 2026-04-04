import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import AdminOpsLayout from "@/components/AdminOpsLayout";
import { Button } from "@/components/ui/button";
import { fetchClaims, retryClaim, rollbackClaim, type Claim } from "@/lib/api";

const AdminClaimsOps = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetchClaims();
      setClaims(response.claims);
    } catch {
      toast.error("Could not load claims queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const pending = claims.filter((c) => c.status === "Review").length;
    const paid = claims.filter((c) => c.status === "Paid").length;
    const failed = claims.filter((c) => c.fraudScore >= 0.7).length;
    return { pending, paid, failed };
  }, [claims]);

  async function onRetry(claimId: string) {
    setBusyClaimId(claimId);
    try {
      await retryClaim(claimId);
      toast.success(`Retried claim ${claimId}`);
      await load();
    } catch {
      toast.error("Retry failed");
    } finally {
      setBusyClaimId(null);
    }
  }

  async function onRollback(claimId: string) {
    setBusyClaimId(claimId);
    try {
      await rollbackClaim(claimId);
      toast.success(`Rolled back claim ${claimId}`);
      await load();
    } catch {
      toast.error("Rollback failed");
    } finally {
      setBusyClaimId(null);
    }
  }

  return (
    <AdminOpsLayout title="Claims Operations" subtitle="Queue management for pending, approved, paid, and failed claims.">
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Claims Queue</h2>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Metric label="Pending" value={String(stats.pending)} />
          <Metric label="Paid" value={String(stats.paid)} />
          <Metric label="Failed Risk" value={String(stats.failed)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/60 text-muted-foreground">
                <th className="py-2 pr-3">Claim</th>
                <th className="py-2 pr-3">Policy</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Fraud Score</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-3 text-muted-foreground" colSpan={6}>Loading claims...</td></tr>
              )}
              {!loading && claims.length === 0 && (
                <tr><td className="py-3 text-muted-foreground" colSpan={6}>No claims found.</td></tr>
              )}
              {claims.map((claim) => (
                <tr key={claim.id} className="border-b border-border/40">
                  <td className="py-2 pr-3 font-medium text-foreground">{claim.id}</td>
                  <td className="py-2 pr-3">#{claim.policyId}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs rounded-full px-2 py-1 ${claim.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {claim.status === "Paid" ? "paid" : "pending"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{claim.fraudScore.toFixed(2)}</td>
                  <td className="py-2 pr-3">Rs {claim.claimAmount}</td>
                  <td className="py-2 space-x-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={busyClaimId === claim.id}
                      onClick={() => void onRetry(claim.id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={busyClaimId === claim.id}
                      onClick={() => void onRollback(claim.id)}
                    >
                      <XCircle className="w-3.5 h-3.5" />Rollback
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <Info icon={<CheckCircle2 className="w-4 h-4 text-success" />} text="Auto-approved claims move to paid immediately." />
          <Info icon={<ShieldAlert className="w-4 h-4 text-warning" />} text="High-risk claims remain in review queue." />
          <Info icon={<RotateCcw className="w-4 h-4 text-primary" />} text="Retry and rollback are wired to live admin claim actions." />
        </div>
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

const Info = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="rounded-lg border border-border/60 bg-background/70 p-3 flex items-start gap-2 text-xs text-muted-foreground">
    {icon}
    <p>{text}</p>
  </div>
);

export default AdminClaimsOps;
