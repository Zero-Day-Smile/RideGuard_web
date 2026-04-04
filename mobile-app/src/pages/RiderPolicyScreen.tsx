import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Calendar, DollarSign, Pause, Play, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchPolicies, updatePolicy, type Policy } from "@/lib/api";
import { getSelectedPolicyId, setSelectedPolicyId } from "@/lib/policySelection";
import { toast } from "sonner";

type PlanChoice = {
  tier: "Basic" | "Standard" | "Plus";
  coverage: number;
  deductible: number;
};

const RiderPolicyScreen = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyIdState] = useState<number | null>(getSelectedPolicyId());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchStep, setSwitchStep] = useState<"confirm" | "details">("confirm");
  const [pendingPlan, setPendingPlan] = useState<PlanChoice | null>(null);
  const [switchDetails, setSwitchDetails] = useState({
    expectedWeeklyOrders: 70,
    avgDailyHours: 9,
    zeroTouchEnabled: true,
    emergencyBufferEnabled: true,
  });

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetchPolicies();
      setPolicies(response.policies || []);
      if ((response.policies || []).length > 0) {
        const existing = getSelectedPolicyId();
        const chosen = existing && response.policies.some((p) => p.id === existing) ? existing : response.policies[0].id;
        setSelectedPolicyIdState(chosen);
        setSelectedPolicyId(chosen);
      }
    } catch {
      toast.error("Failed to load policy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
  }, []);

  const policy = policies.find((item) => item.id === selectedPolicyId) || policies[0];
  const status = policy?.status === "Paused" ? "paused" : "active";

  const handleSelectPolicy = (policyId: number) => {
    setSelectedPolicyIdState(policyId);
    setSelectedPolicyId(policyId);
    toast.success(`Policy #${policyId} selected`);
  };

  const handleOpenPlanFlow = (plan: PlanChoice) => {
    if (!policy) return;
    if (policy.planTier === plan.tier && policy.coverageAmount === plan.coverage && policy.deductible === plan.deductible) {
      toast.message(`${plan.tier} already active`);
      return;
    }
    setPendingPlan(plan);
    setSwitchStep("confirm");
    setSwitchOpen(true);
  };

  const handleConfirmPlanSwitch = async () => {
    if (!policy || !pendingPlan) return;
    setSaving(true);
    try {
      await updatePolicy(policy.id, {
        ...policy,
        planTier: pendingPlan.tier,
        coverageAmount: pendingPlan.coverage,
        deductible: pendingPlan.deductible,
      });
      setSwitchOpen(false);
      toast.success(`${pendingPlan.tier} activated. Zero-touch: ${switchDetails.zeroTouchEnabled ? "ON" : "OFF"}`);
      toast.message(`Updated with ${switchDetails.expectedWeeklyOrders} expected weekly orders and ${switchDetails.avgDailyHours}h daily average.`);
      await loadPolicies();
    } catch {
      toast.error("Unable to switch plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      await updatePolicy(policy.id, {
        ...policy,
        status: policy.status === "Paused" ? "Active" : "Paused",
      });
      toast.success(policy.status === "Paused" ? "Policy resumed" : "Policy paused");
      await loadPolicies();
    } catch {
      toast.error("Unable to update policy");
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradeTier = async () => {
    if (!policy) return;
    const nextTier = policy.planTier === "Basic" ? "Standard" : policy.planTier === "Standard" ? "Plus" : "Plus";
    if (nextTier === policy.planTier) {
      toast.message("Policy already on highest tier");
      return;
    }

    setSaving(true);
    try {
      await updatePolicy(policy.id, { ...policy, planTier: nextTier });
      toast.success(`Upgraded to ${nextTier}`);
      await loadPolicies();
    } catch {
      toast.error("Unable to upgrade policy");
    } finally {
      setSaving(false);
    }
  };

  const policyDetails = policy
    ? [
        { label: "Plan Tier", value: policy.planTier, icon: Shield },
        { label: "Coverage Amount", value: `₹${policy.coverageAmount.toLocaleString()}`, icon: Shield },
        { label: "Deductible", value: `₹${policy.deductible.toLocaleString()}`, icon: DollarSign },
        { label: "City", value: policy.city, icon: Calendar },
        { label: "Platform", value: policy.platform, icon: Calendar },
        { label: "Start Date", value: new Date(policy.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }), icon: Calendar },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem]">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">My Policy</h1>
        <p className="text-primary-foreground/70 text-sm">Manage your backend-synced coverage plan</p>
      </div>

      <div className="px-5 -mt-8 space-y-4 pb-4">
        <Card className="border-0 shadow-xl animate-fade-up">
          <CardContent className="p-5">
            <div className="mb-4">
              <label className="text-xs text-muted-foreground">Choose Plan</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { tier: "Basic", coverage: 3000, deductible: 400 },
                  { tier: "Standard", coverage: 4000, deductible: 300 },
                  { tier: "Plus", coverage: 5500, deductible: 250 },
                ].map((plan) => (
                  <button
                    key={plan.tier}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${policy?.planTier === plan.tier ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"}`}
                    onClick={() => handleOpenPlanFlow({ tier: plan.tier as "Basic" | "Standard" | "Plus", coverage: plan.coverage, deductible: plan.deductible })}
                    disabled={!policy || saving}
                  >
                    <div>{plan.tier}</div>
                    <div className="text-[10px] font-normal">₹{plan.coverage}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === "active" ? "bg-success/10" : "bg-warning/10"}`}>
                  {status === "active" ? <CheckCircle2 size={24} className="text-success" /> : <AlertCircle size={24} className="text-warning" />}
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">{policy ? `${policy.planTier} Plan` : "No active policy"}</h2>
                  <Badge variant={status === "active" ? "default" : "secondary"} className={`mt-1 text-xs ${status === "active" ? "gradient-primary text-primary-foreground" : ""}`}>
                    {status === "active" ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${status === "active" ? "bg-success animate-pulse" : "bg-warning"}`} />
            </div>

            <div className="mb-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Coverage Used</span>
                <span className="font-semibold text-foreground">
                  {loading || !policy ? "Loading..." : `₹${Math.round(policy.coverageAmount * 0.25).toLocaleString()} / ₹${policy.coverageAmount.toLocaleString()}`}
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full gradient-primary rounded-full transition-all duration-1000 ${loading || !policy ? "w-0" : "w-1/4"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-100">
          <CardContent className="p-0">
            {loading && <div className="p-4 text-sm text-muted-foreground">Loading policy details...</div>}
            {!loading && !policy && <div className="p-4 text-sm text-muted-foreground">No policy found for this account.</div>}
            {policyDetails.map((detail, i) => (
              <div key={i} className={`flex items-center justify-between p-4 ${i < policyDetails.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <detail.icon size={16} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{detail.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{detail.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 animate-fade-up delay-150">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            className="h-12 rounded-xl font-semibold gap-2"
            disabled={!policy || saving}
          >
            {status === "active" ? <Pause size={16} /> : <Play size={16} />} {status === "active" ? "Pause Policy" : "Resume"}
          </Button>
          <Button onClick={loadPolicies} className="h-12 rounded-xl font-semibold gap-2 gradient-primary text-primary-foreground" disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button
            onClick={handleUpgradeTier}
            variant="outline"
            className="h-12 rounded-xl font-semibold gap-2 col-span-2"
            disabled={!policy || saving || policy.planTier === "Plus"}
          >
            <Shield size={16} /> Quick Upgrade
          </Button>
        </div>
      </div>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{switchStep === "confirm" ? "Proceed With New Plan" : "Provide Plan Details"}</DialogTitle>
            <DialogDescription>
              {switchStep === "confirm"
                ? "Review your selected premium policy and proceed."
                : "These details fine-tune your dynamic premium and zero-touch claim automation."}
            </DialogDescription>
          </DialogHeader>

          {switchStep === "confirm" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-semibold text-foreground">Selected Plan: {pendingPlan?.tier}</p>
                <p className="text-muted-foreground mt-1">Coverage: ₹{pendingPlan?.coverage.toLocaleString()} · Deductible: ₹{pendingPlan?.deductible.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setSwitchOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={() => setSwitchStep("details")} disabled={saving}>Proceed</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Expected Weekly Orders</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  type="number"
                  min={20}
                  max={250}
                  value={switchDetails.expectedWeeklyOrders}
                  onChange={(e) => setSwitchDetails((prev) => ({ ...prev, expectedWeeklyOrders: Number(e.target.value) || 0 }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Average Riding Hours / Day</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  type="number"
                  min={2}
                  max={18}
                  value={switchDetails.avgDailyHours}
                  onChange={(e) => setSwitchDetails((prev) => ({ ...prev, avgDailyHours: Number(e.target.value) || 0 }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>Enable Zero-Touch Claims</span>
                <input
                  type="checkbox"
                  checked={switchDetails.zeroTouchEnabled}
                  onChange={(e) => setSwitchDetails((prev) => ({ ...prev, zeroTouchEnabled: e.target.checked }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>Enable Emergency Buffer</span>
                <input
                  type="checkbox"
                  checked={switchDetails.emergencyBufferEnabled}
                  onChange={(e) => setSwitchDetails((prev) => ({ ...prev, emergencyBufferEnabled: e.target.checked }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setSwitchStep("confirm")} disabled={saving}>Back</Button>
                <Button onClick={() => void handleConfirmPlanSwitch()} disabled={saving || !pendingPlan}>
                  {saving ? "Switching..." : "Confirm Switch"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderPolicyScreen;
