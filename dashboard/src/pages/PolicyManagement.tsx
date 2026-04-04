import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileCheck2, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  createPolicy,
  fetchPolicies,
  updatePolicy,
  type Policy,
  type PolicyUpsertRequest,
} from "@/lib/api";
import { toast } from "sonner";

const emptyForm: PolicyUpsertRequest = {
  riderName: "",
  city: "",
  platform: "",
  planTier: "Standard",
  coverageAmount: 4000,
  deductible: 300,
  status: "Active",
  startDate: "2026-04-01",
  endDate: "2026-07-01",
};

const PolicyManagement = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<PolicyUpsertRequest>(emptyForm);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPolicies();
      setPolicies(response.policies);
      if (response.policies.length > 0) {
        selectPolicy(response.policies[0]);
      }
    } catch {
      toast.error("Could not load policy records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  function selectPolicy(policy: Policy) {
    setSelectedId(policy.id);
    setForm({
      riderName: policy.riderName,
      city: policy.city,
      platform: policy.platform,
      planTier: policy.planTier,
      coverageAmount: policy.coverageAmount,
      deductible: policy.deductible,
      status: policy.status,
      startDate: policy.startDate,
      endDate: policy.endDate,
    });
  }

  function resetToNew() {
    setSelectedId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.riderName || !form.city || !form.platform) {
      toast.error("Fill rider name, city, and platform");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedId) {
        await updatePolicy(selectedId, form);
        toast.success("Policy updated");
      } else {
        await createPolicy(form);
        toast.success("Policy created");
      }
      await loadPolicies();
    } catch {
      toast.error("Failed to save policy");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePolicyStatus() {
    if (!selectedId) return;
    setForm((prev) => ({
      ...prev,
      status: prev.status === "Active" ? "Paused" : "Active",
    }));
  }

  const activePolicies = useMemo(
    () => policies.filter((item) => item.status === "Active").length,
    [policies],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Insurance Policy Management</h1>
          </div>
          <Button variant="outline" onClick={resetToNew}>New Policy</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[1.1fr_1.4fr] gap-6">
        <ScrollReveal>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <InfoTile label="Total Policies" value={String(policies.length)} />
              <InfoTile label="Active" value={String(activePolicies)} />
            </div>

            <h2 className="text-sm font-semibold text-foreground mb-3">Current Policies</h2>
            <div className="space-y-2">
              {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
              {!loading && policies.length === 0 && (
                <p className="text-sm text-muted-foreground">No policies yet.</p>
              )}
              {policies.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => selectPolicy(policy)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                    selectedId === policy.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{policy.riderName}</span>
                    <span className="text-xs text-muted-foreground">#{policy.id}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {policy.planTier} • Rs {policy.coverageAmount} • {policy.city}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-5">
              {selectedId ? <FileCheck2 className="w-4 h-4 text-primary" /> : <ShieldPlus className="w-4 h-4 text-primary" />}
              <h2 className="text-lg font-display font-semibold text-foreground">
                {selectedId ? `Edit Policy #${selectedId}` : "Create Policy"}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Rider Name" value={form.riderName} onChange={(value) => setForm((prev) => ({ ...prev, riderName: value }))} />
              <Field
                label="City"
                value={form.city}
                disabled={Boolean(selectedId)}
                onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              />
              <Field
                label="Platform"
                value={form.platform}
                disabled={Boolean(selectedId)}
                onChange={(value) => setForm((prev) => ({ ...prev, platform: value }))}
              />
              <SelectField
                label="Plan Tier"
                value={form.planTier}
                options={["Basic", "Standard", "Plus"]}
                onChange={(value) => setForm((prev) => ({ ...prev, planTier: value as PolicyUpsertRequest["planTier"] }))}
              />
              <NumberField
                label="Coverage Amount"
                value={form.coverageAmount}
                onChange={(value) => setForm((prev) => ({ ...prev, coverageAmount: value }))}
              />
              <NumberField
                label="Deductible"
                value={form.deductible}
                onChange={(value) => setForm((prev) => ({ ...prev, deductible: value }))}
              />
              <SelectField
                label="Status"
                value={form.status}
                options={["Active", "Paused", "Expired"]}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value as PolicyUpsertRequest["status"] }))}
              />
              <Field label="Start Date" value={form.startDate} onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))} />
              <Field label="End Date" value={form.endDate} onChange={(value) => setForm((prev) => ({ ...prev, endDate: value }))} />
            </div>

            <div className="pt-5 flex gap-3">
              <Button variant="hero" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : selectedId ? "Update Policy" : "Create Policy"}
              </Button>
              {selectedId && (
                <Button variant="outline" onClick={togglePolicyStatus}>
                  {form.status === "Active" ? "Pause Policy" : "Resume Policy"}
                </Button>
              )}
              <Link to="/premium-lab">
                <Button variant="outline">Go To Premium Lab</Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              City and platform stay read-only after onboarding for active policies.
            </p>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/50 p-3 bg-background/70">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-display font-semibold text-foreground">{value}</p>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <label className="text-sm text-muted-foreground">
    {label}
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background disabled:bg-muted/40 disabled:cursor-not-allowed px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </label>
);

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <label className="text-sm text-muted-foreground">
    {label}
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </label>
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="text-sm text-muted-foreground">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export default PolicyManagement;
