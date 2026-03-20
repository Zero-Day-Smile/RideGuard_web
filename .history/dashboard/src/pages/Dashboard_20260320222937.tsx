import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, CloudRain, Wifi, AlertTriangle, TrendingUp, ArrowLeft, IndianRupee, Activity, Clock } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { fetchQuote, fetchRiderSummary, fetchTriggers } from "@/lib/api";

const FALLBACK_RISK_SCORE = 72;
const FALLBACK_WEEKLY_PREMIUM = 65;
const coverageAmount = "₹4,000";

const triggerEvents = [
  { date: "Mar 18", type: "Heavy Rain", icon: CloudRain, status: "Payout Sent", amount: "₹1,200", color: "text-primary" },
  { date: "Mar 12", type: "Platform Outage", icon: Wifi, status: "Payout Sent", amount: "₹800", color: "text-primary" },
  { date: "Mar 5", type: "Traffic Shutdown", icon: AlertTriangle, status: "No Impact", amount: "—", color: "text-muted-foreground" },
];

const weeklyHistory = [
  { week: "Mar 10–16", premium: "₹65", payout: "₹2,000", net: "+₹1,935" },
  { week: "Mar 3–9", premium: "₹65", payout: "₹0", net: "–₹65" },
  { week: "Feb 24–Mar 2", premium: "₹65", payout: "₹1,200", net: "+₹1,135" },
  { week: "Feb 17–23", premium: "₹65", payout: "₹0", net: "–₹65" },
];

type DashboardState = {
  riskScore: number;
  weeklyPremium: number;
  latestPayoutAmount: number;
  latestPayoutTime: string;
  policyWindow: string;
  policyStatus: string;
  protectedEarnings: number;
  triggerTimeline: Array<{
    time: string;
    event: string;
    effect: string;
    status: string;
  }>;
};

function inferRiskLevel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiError, setHasApiError] = useState(false);
  const [state, setState] = useState<DashboardState>({
    riskScore: FALLBACK_RISK_SCORE,
    weeklyPremium: FALLBACK_WEEKLY_PREMIUM,
    latestPayoutAmount: 1200,
    latestPayoutTime: "03:40 PM",
    policyWindow: "Mon - Sun",
    policyStatus: "Active",
    protectedEarnings: 5400,
    triggerTimeline: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setHasApiError(false);

      try {
        const [summary, triggers, quote] = await Promise.all([
          fetchRiderSummary(),
          fetchTriggers(),
          fetchQuote({
            basePremium: 45,
            locationRisk: 0.62,
            weatherFactor: 0.58,
            incomeVariability: 0.48,
            reliabilityDiscount: 0.1,
          }),
        ]);

        if (!isMounted) return;

        setState({
          riskScore: quote.riskScore || FALLBACK_RISK_SCORE,
          weeklyPremium: quote.computedPremium || FALLBACK_WEEKLY_PREMIUM,
          latestPayoutAmount: summary.riderSnapshot?.latestPayoutAmount || 0,
          latestPayoutTime: summary.riderSnapshot?.latestPayoutTime || "--",
          policyWindow: summary.riderSnapshot?.policyWindow || "Mon - Sun",
          policyStatus: summary.riderSnapshot?.policyStatus || "Active",
          protectedEarnings: summary.riderSnapshot?.protectedEarnings || 0,
          triggerTimeline: triggers.triggerTimeline || [],
        });
      } catch {
        if (!isMounted) return;
        setHasApiError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const riskLevel = useMemo(() => inferRiskLevel(state.riskScore), [state.riskScore]);
  const recentEvents = useMemo(() => {
    if (state.triggerTimeline.length === 0) return triggerEvents;

    return state.triggerTimeline.slice(-3).reverse().map((item) => ({
      date: item.time,
      type: item.event,
      icon: item.event.toLowerCase().includes("rain")
        ? CloudRain
        : item.event.toLowerCase().includes("outage")
        ? Wifi
        : AlertTriangle,
      status: item.status,
      amount: item.status.toLowerCase().includes("payout") ? `₹${state.latestPayoutAmount}` : "—",
      color: item.status.toLowerCase().includes("payout") ? "text-primary" : "text-muted-foreground",
    }));
  }, [state.triggerTimeline, state.latestPayoutAmount]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
              A
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">Arjun</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ScrollReveal delay={0}>
            <StatCard icon={Activity} label="Risk Score" value={`${state.riskScore}/100`} subtitle={riskLevel} />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <StatCard icon={IndianRupee} label="Weekly Premium" value={`₹${state.weeklyPremium}`} subtitle="AI-adjusted" />
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <StatCard icon={Shield} label="Coverage" value={coverageAmount} subtitle="Per week" />
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <StatCard icon={Clock} label="Policy Status" value={state.policyStatus} subtitle={state.policyWindow} />
          </ScrollReveal>
        </div>

        {isLoading && (
          <div className="bg-card rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground mb-6">
            Loading live RideGuard data...
          </div>
        )}

        {hasApiError && (
          <div className="bg-card rounded-xl border border-warning/30 px-4 py-3 text-sm text-muted-foreground mb-6">
            Backend is not reachable. Showing fallback demo values.
          </div>
        )}

        {/* Risk Score Visual */}
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Your Risk Profile</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${state.riskScore * 2.64} 264`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display font-bold text-2xl text-foreground">{state.riskScore}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <RiskFactor label="Weather Risk" level="High" color="bg-accent" />
                <RiskFactor label="Traffic Risk" level="Medium" color="bg-primary" />
                <RiskFactor label="Platform Stability" level="Low" color="bg-success" />
                <RiskFactor label="Area Index" level="Medium" color="bg-primary" />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Trigger Events */}
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Recent Trigger Events</h2>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.date + event.type} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                      <event.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{event.type}</div>
                      <div className="text-xs text-muted-foreground">{event.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${event.color}`}>{event.amount}</div>
                    <div className="text-xs text-muted-foreground">{event.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Weekly History */}
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Weekly History</h2>
            <div className="text-xs text-muted-foreground mb-4">
              Protected earnings this cycle: <span className="font-semibold text-foreground">₹{state.protectedEarnings}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-medium text-muted-foreground">Week</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Premium</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Payout</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyHistory.map((row) => (
                    <tr key={row.week} className="border-b border-border/30 last:border-0">
                      <td className="py-3 text-foreground">{row.week}</td>
                      <td className="py-3 text-right text-muted-foreground">{row.premium}</td>
                      <td className="py-3 text-right text-foreground font-medium">{row.payout}</td>
                      <td className={`py-3 text-right font-semibold ${row.net.startsWith("+") ? "text-primary" : "text-muted-foreground"}`}>
                        {row.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="text-center py-8">
            <Link to="/">
              <Button variant="ghost" className="text-muted-foreground">← Back to Home</Button>
            </Link>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: string; subtitle: string }) => (
  <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
    <Icon className="w-5 h-5 text-primary mb-3" />
    <div className="font-display font-bold text-xl text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    <div className="text-xs text-primary/70 mt-1">{subtitle}</div>
  </div>
);

const RiskFactor = ({ label, level, color }: { label: string; level: string; color: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-muted-foreground w-32">{label}</span>
    <span className="font-medium text-foreground">{level}</span>
  </div>
);

export default Dashboard;
