import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Clock, FileText, IndianRupee, Shield, ClipboardCheck, Settings, LogOut, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fetchHealth, fetchQuote, fetchRealtimeContext, fetchRiderSummary, fetchTriggers, type RealtimeContextResponse } from "@/lib/api";
import { clearSession, getCurrentUser } from "@/lib/session";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildFallbackRealtime(city: string): RealtimeContextResponse {
  return {
    location: {
      city,
      latitude: 12.9716,
      longitude: 77.5946,
      source: "fallback",
    },
    weather: {
      status: "normal",
      temperatureC: 28,
      humidity: 62,
      rainMm: 0,
      windSpeedKmph: 11,
      weatherCode: 0,
      source: "fallback",
      observedAt: new Date().toISOString(),
    },
    traffic: {
      status: "normal",
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

function deriveQuoteInputs(realtime: RealtimeContextResponse) {
  return {
    basePremium: 45,
    locationRisk: clamp(realtime.location.source === "gps" ? 0.35 : 0.48 + realtime.traffic.congestion * 0.1),
    weatherFactor: clamp((realtime.weather.rainMm / 40) + (realtime.weather.status === "critical" ? 0.3 : realtime.weather.status === "watch" ? 0.14 : 0.05)),
    incomeVariability: 0.48,
    reliabilityDiscount: realtime.location.source === "gps" ? 0.14 : 0.1,
  };
}

const RiderDashboard = () => {
  const user = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [riskScore, setRiskScore] = useState(0);
  const [weeklyPremium, setWeeklyPremium] = useState(0);
  const [policyStatus, setPolicyStatus] = useState("Active");
  const [policyWindow, setPolicyWindow] = useState("Mon to Sun");
  const [protectedEarnings, setProtectedEarnings] = useState(0);
  const [latestPayoutAmount, setLatestPayoutAmount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Array<{ time: string; event: string; status: string }>>([]);
  const [realtime, setRealtime] = useState<RealtimeContextResponse | null>(null);

  useEffect(() => {
    let active = true;

    const timer = window.setInterval(() => {
      void load();
    }, 60000);

    async function load() {
      try {
        const city = user?.city || "Bengaluru";
        const [health, summary, triggers, liveRealtime] = await Promise.all([
          fetchHealth(),
          fetchRiderSummary(),
          fetchTriggers(),
          fetchRealtimeContext({ city }),
        ]);
        const resolvedRealtime = liveRealtime || buildFallbackRealtime(city);
        setRealtime(resolvedRealtime);
        const quoteResponse = await fetchQuote({
          ...deriveQuoteInputs(resolvedRealtime),
        });
        if (!active) return;

        setApiOnline(health.status === "ok");
        setRiskScore(quoteResponse.riskScore || 68);
        setWeeklyPremium(quoteResponse.computedPremium || 55);
        setPolicyStatus(summary.riderSnapshot?.policyStatus || "Active");
        setPolicyWindow(summary.riderSnapshot?.policyWindow || "Mon to Sun");
        setProtectedEarnings(summary.riderSnapshot?.protectedEarnings || 0);
        setLatestPayoutAmount(summary.riderSnapshot?.latestPayoutAmount || 0);
        setRecentEvents((triggers.triggerTimeline || []).slice(-3).reverse());
      } catch {
        if (!active) return;
        setApiOnline(false);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.city]);

  const riskLevel = useMemo(() => (riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low"), [riskScore]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display font-bold text-lg text-foreground">Rider Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings"><Button variant="outline" size="sm" className="gap-2"><Settings className="w-4 h-4" />Settings</Button></Link>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => { clearSession(); window.location.href = "/login"; }}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-sm text-muted-foreground mb-4">
          Signed in as <span className="text-foreground font-medium">{user?.fullName}</span> ({user?.role}) • API {apiOnline ? "Online" : "Offline"}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Activity} label="Risk Score" value={`${riskScore}/100`} subtitle={riskLevel} />
          <StatCard icon={IndianRupee} label="Weekly Premium" value={`₹${weeklyPremium}`} subtitle="Dynamic" />
          <StatCard icon={Shield} label="Protected" value={`₹${protectedEarnings}`} subtitle="Cycle total" />
          <StatCard icon={Clock} label="Policy" value={policyStatus} subtitle={policyWindow} />
        </div>

        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Live Location, Weather & Traffic</h2>
            {realtime ? (
              <div className="grid md:grid-cols-4 gap-3 text-sm text-foreground">
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{realtime.location.city}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weather</p>
                  <p className="font-medium">{Math.round(realtime.weather.temperatureC)}°C</p>
                  <p className="text-[10px] text-muted-foreground">{realtime.weather.provider || realtime.weather.source}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                  <p className="font-medium">{Math.round(realtime.traffic.congestion * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">{realtime.traffic.provider || realtime.traffic.source}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-medium">{Math.round(realtime.traffic.currentSpeedKmph)} km/h</p>
                  <p className="text-[10px] text-muted-foreground">delay {Math.round(realtime.traffic.travelTimeDelayMin)}m</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading live context...</p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Your Rider Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <FeatureCard to="/policy-management" title="Policy Management" caption="Update coverage and plan" icon={<FileText className="w-5 h-5 text-primary" />} />
              <FeatureCard to="/premium-lab" title="Dynamic Premium" caption="Tune risk and calculate premium" icon={<Activity className="w-5 h-5 text-primary" />} />
              <FeatureCard to="/claims" title="Claims" caption="File and track auto-claims" icon={<ClipboardCheck className="w-5 h-5 text-primary" />} />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Recent Trigger Events</h2>
            {isLoading && <p className="text-sm text-muted-foreground">Loading events...</p>}
            {!isLoading && recentEvents.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
            <div className="space-y-3">
              {recentEvents.map((item) => (
                <div key={`${item.time}-${item.event}`} className="rounded-xl border border-border/50 px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{item.event}</p>
                  <p className="text-xs text-muted-foreground">{item.time} • {item.status}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground mt-4">Latest payout: ₹{latestPayoutAmount}</p>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subtitle }: { icon: LucideIcon; label: string; value: string; subtitle: string }) => (
  <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
    <Icon className="w-5 h-5 text-primary mb-3" />
    <div className="font-display font-bold text-xl text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    <div className="text-xs text-primary/70 mt-1">{subtitle}</div>
  </div>
);

const FeatureCard = ({ to, title, caption, icon }: { to: string; title: string; caption: string; icon: React.ReactNode }) => (
  <Link to={to} className="rounded-xl border border-border/50 p-4 hover:border-primary/40 transition-colors">
    {icon}
    <p className="text-sm font-semibold text-foreground mt-2">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{caption}</p>
  </Link>
);

export default RiderDashboard;
