import { useEffect, useState } from "react";
import { BadgeCheck, Building2, Calculator, Waves, WalletCards, RefreshCw } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { fetchStrategy, retrainMlModels, type StrategyResponse } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { toast } from "sonner";

const iconMap = {
  underwriting: Building2,
  triggers: Waves,
  pricing: Calculator,
  actuarial: BadgeCheck,
  settlement: WalletCards,
};

export const StrategySection = () => {
  const user = getCurrentUser();
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStrategy()
      .then((data) => {
        if (active) setStrategy(data);
      })
      .catch(() => toast.error("Could not load strategy snapshot"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRetrain() {
    setRetraining(true);
    try {
      const data = await retrainMlModels();
      setStrategy(data);
      toast.success("Pricing model retrained");
    } catch {
      toast.error("Retrain failed");
    } finally {
      setRetraining(false);
    }
  }

  return (
    <section id="strategy" className="py-20 md:py-32 bg-secondary/40">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">Underwriting + Triggers + Pricing + Actuarial</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              The operating model behind RideGuard
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              This is the same strategy deck the judges want to see: who gets covered, what fires, how pricing works, and how we keep the math sustainable.
            </p>
          </div>
        </ScrollReveal>

        {user?.role === "admin" && (
          <div className="flex justify-center mb-8">
            <Button variant="outline" onClick={handleRetrain} disabled={loading || retraining} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {retraining ? "Retraining..." : "Retrain Pricing Model"}
            </Button>
          </div>
        )}

        {loading && <p className="text-center text-sm text-muted-foreground">Loading strategy model...</p>}

        {strategy && (
          <div className="space-y-5 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricTile label="Active Policies" value={String(strategy.metrics.activePolicies)} />
              <MetricTile label="Portfolio Size" value={String(strategy.metrics.policyCount)} />
              <MetricTile label="Weekly Premium" value={`Rs ${strategy.metrics.weeklyPremiumCollected}`} />
              <MetricTile label="Claims Paid" value={`Rs ${strategy.metrics.totalClaimsPaid}`} />
              <MetricTile label="Current BCR" value={strategy.metrics.bcr.toFixed(2)} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <StrategyCard icon={iconMap.underwriting} title={`A · ${strategy.underwriting.title}`} subtitle={strategy.underwriting.disclosure} items={strategy.underwriting.rules} />
              <StrategyCard icon={iconMap.triggers} title={`B · ${strategy.triggers.title}`} subtitle={strategy.triggers.disclosure} items={strategy.triggers.rules} />
              <StrategyCard icon={iconMap.pricing} title={`C · ${strategy.pricing.title}`} subtitle={`Model ${strategy.pricing.modelVersion} · ${strategy.pricing.targetRange}`} items={[strategy.pricing.baseFormula, ...strategy.pricing.adjustments]} />
              <StrategyCard icon={iconMap.actuarial} title={`D · ${strategy.actuarial.title}`} subtitle={`BCR ${strategy.actuarial.bcr} · Loss ratio ${Math.round(strategy.actuarial.lossRatio * 100)}%`} items={[
                `Target BCR: ${strategy.actuarial.targetBcrLower}-${strategy.actuarial.targetBcrUpper}`,
                `Enrollment state: ${strategy.actuarial.enrollmentState}`,
                `Stress scenario: ${strategy.actuarial.stressScenario}`,
              ]} />
            </div>
            <div className="lg:col-span-2">
              <StrategyCard icon={iconMap.settlement} title={`E · ${strategy.settlement.title}`} subtitle="Zero-touch settlement flow and channel options" items={[
                ...strategy.settlement.steps.map((step, index) => `${index + 1}. ${step}`),
                `Channels: ${strategy.settlement.channels.join(" / ")}`,
                ...strategy.settlement.keyPoints,
              ]} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const MetricTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/50 bg-card p-3 shadow-card">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-display text-lg font-semibold text-foreground mt-1">{value}</p>
  </div>
);

const StrategyCard = ({
  icon: Icon,
  title,
  subtitle,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  items: string[];
}) => (
  <ScrollReveal>
    <div className="h-full rounded-2xl border border-border/50 bg-card shadow-card p-6">
      <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-xs text-primary/70 mb-4">{subtitle}</p>
      <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </ScrollReveal>
);
