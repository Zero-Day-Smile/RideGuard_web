import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  CloudRain,
  Wifi,
  AlertTriangle,
  ArrowLeft,
  IndianRupee,
  Activity,
  Clock,
  FileText,
  Calculator,
  ClipboardCheck,
  Users as UsersIcon,
  Settings,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import {
  createFraudAlert,
  createTriggerEvent,
  fetchAdminAuditLogs,
  fetchHealth,
  fetchQuote,
  fetchRealtimeContext,
  fetchRiderSummary,
  fetchTriggers,
  refreshTriggers,
  updateRiderSnapshot,
  type AdminAuditLogItem,
  type RealtimeContextResponse,
} from "@/lib/api";
import { computeAdvancedRisk } from "@/lib/riskEngine";

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

function formatRelativeTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function actionBadgeClass(action: string): string {
  if (action.includes("created")) return "bg-success/15 text-success";
  if (action.includes("updated")) return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

const Dashboard = () => {
  const user = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiError, setHasApiError] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [adminActionStatus, setAdminActionStatus] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [realtime, setRealtime] = useState<RealtimeContextResponse | null>(null);
  const [liveEngineRisk, setLiveEngineRisk] = useState(0);
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

    const getCurrentCoordinates = async (): Promise<{ lat: number; lon: number } | null> => {
      if (!navigator.geolocation) return null;
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
    };
  type RealtimeFallback = RealtimeContextResponse;

  function buildFallbackRealtime(cityName: string): RealtimeFallback {
    return {
      location: {
        city: cityName || "Bengaluru",
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

    async function loadRealtime() {
      try {
        const coords = await getCurrentCoordinates();
        const cityName = user?.city || "Bengaluru";
        const live = await fetchRealtimeContext({ lat: coords?.lat, lon: coords?.lon, city: cityName });
        if (!isMounted) return;
        setRealtime(live);
        const latestTriggers = await fetchTriggers();
        if (!isMounted) return;
        const platformStatus = (latestTriggers.disruptionSignals || []).find((item) => item.name.toLowerCase().includes("platform"))?.status;
        const disruptionStatus = (latestTriggers.disruptionSignals || []).find((item) => item.name.toLowerCase().includes("local"))?.status;
        setLiveEngineRisk(
          computeAdvancedRisk({
            realtime: live,
            platformStatus,
            disruptionStatus,
            threshold: 0.62,
            aggressiveMode: false,
            baseCooldownMin: 5,
            nowMs: Date.now(),
          }).score,
        );
      } catch {
        if (!isMounted) return;
        const fallback = buildFallbackRealtime(user?.city || "Bengaluru");
        setRealtime(fallback);
        setLiveEngineRisk(
          computeAdvancedRisk({
            realtime: fallback,
            threshold: 0.62,
            aggressiveMode: false,
            baseCooldownMin: 5,
            nowMs: Date.now(),
          }).score,
        );
      }
    }

    async function loadDashboard() {
      setIsLoading(true);
      setHasApiError(false);

      try {
        const [health, summary, triggers, quote] = await Promise.all([
          fetchHealth(),
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
        const audits = await fetchAdminAuditLogs(8);

        if (!isMounted) return;

  setApiOnline(health.status === "ok");

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
        setAuditLogs(audits.logs || []);
        await loadRealtime();
      } catch {
        if (!isMounted) return;
        setHasApiError(true);
        setApiOnline(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    void loadRealtime();

    const timer = setInterval(() => {
      void loadRealtime();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(timer);
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

  async function refreshDashboardData() {
    setIsLoading(true);
    setHasApiError(false);
    try {
      const [health, summary, triggers, quote] = await Promise.all([
        fetchHealth(),
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
      const audits = await fetchAdminAuditLogs(8);

      setApiOnline(health.status === "ok");
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
      setAuditLogs(audits.logs || []);
    } catch {
      setHasApiError(true);
      setApiOnline(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshSignals() {
    setIsLoading(true);
    setHasApiError(false);
    try {
      const triggers = await refreshTriggers();
      setState((prev) => ({
        ...prev,
        triggerTimeline: triggers.triggerTimeline || prev.triggerTimeline,
      }));
    } catch {
      setHasApiError(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateFraudAlert() {
    setIsSubmittingAction(true);
    setAdminActionStatus("");
    try {
      await createFraudAlert({
        id: `alert-${Date.now()}`,
        city: "Bengaluru",
        level: "high",
        reason: "Suspicious synchronized inactivity pattern detected",
      });
      setAdminActionStatus("Fraud alert created.");
      await refreshDashboardData();
    } catch {
      setAdminActionStatus("Failed to create fraud alert.");
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleCreateTriggerEvent() {
    setIsSubmittingAction(true);
    setAdminActionStatus("");
    try {
      await createTriggerEvent({
        time: "Now",
        event: "Heavy Rain",
        effect: "Order volume drop in active zones",
        status: "Payout Evaluating",
      });
      setAdminActionStatus("Trigger event added.");
      await refreshDashboardData();
    } catch {
      setAdminActionStatus("Failed to add trigger event.");
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleUpdateRiderSnapshot() {
    setIsSubmittingAction(true);
    setAdminActionStatus("");
    try {
      await updateRiderSnapshot({
        protectedEarnings: state.protectedEarnings + 500,
        latestPayoutAmount: Math.max(state.latestPayoutAmount, 1200),
        latestPayoutTime: "2m 40s",
      });
      setAdminActionStatus("Rider snapshot updated.");
      await refreshDashboardData();
    } catch {
      setAdminActionStatus("Failed to update rider snapshot.");
    } finally {
      setIsSubmittingAction(false);
    }
  }

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
            <span
              className={`hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                apiOnline ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              API {apiOnline ? "Online" : "Offline"}
            </span>
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
              A
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">Arjun</span>
            {user?.role === "admin" && (
              <span className="hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary">
                Admin Center
              </span>
            )}
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

        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Real-Time Location, Weather & Traffic</h2>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-semibold text-foreground">{realtime?.location.city || "Locating..."}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{realtime?.location.source || "loading"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Weather</p>
                <p className="font-semibold text-foreground">
                  {realtime ? `${Math.round(realtime.weather.temperatureC)}°C` : "--"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{realtime?.weather.status || "pending"}</p>
                <p className="text-[10px] text-muted-foreground">source: {realtime?.weather.source || "loading"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Traffic Congestion</p>
                <p className="font-semibold text-foreground">
                  {realtime ? `${Math.round(realtime.traffic.congestion * 100)}%` : "--"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{realtime?.traffic.status || "pending"}</p>
                <p className="text-[10px] text-muted-foreground">source: {realtime?.traffic.source || "loading"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Avg Speed</p>
                <p className="font-semibold text-foreground">
                  {realtime ? `${Math.round(realtime.traffic.currentSpeedKmph)} km/h` : "--"}
                </p>
                <p className="text-xs text-muted-foreground">live feed</p>
                <p className="text-[10px] text-muted-foreground">delay {realtime ? `${Math.round(realtime.traffic.travelTimeDelayMin)}m` : "--"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 bg-muted/20 sm:col-span-4">
                <p className="text-xs text-muted-foreground">Shared risk engine</p>
                <p className="font-semibold text-foreground">{liveEngineRisk.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Used by premium and zero-touch claims</p>
                <p className="text-[10px] text-muted-foreground">{realtime ? `generated ${new Date(realtime.generatedAt).toLocaleTimeString()}` : "waiting for live feed"}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Phase 2 Feature Hub</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <FeatureNavCard
                icon={FileText}
                title="Policy Management"
                caption="Create and edit rider policy terms"
                to="/policy-management"
              />
              <FeatureNavCard
                icon={Calculator}
                title="Dynamic Premium"
                caption="Run LR + RF + XGBoost blend quote"
                to="/premium-lab"
              />
              <FeatureNavCard
                icon={ClipboardCheck}
                title="Claims / Auto Claim"
                caption="Zero-touch filing with fraud watch"
                to="/claims"
              />
              <FeatureNavCard
                icon={UsersIcon}
                title="Manage Users"
                caption="Create riders and admins"
                to="/manage-users"
              />
              <FeatureNavCard
                icon={Settings}
                title="Settings"
                caption="Profile and security controls"
                to="/settings"
              />
            </div>
          </div>
        </ScrollReveal>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-foreground">Recent Trigger Events</h2>
              <Button variant="outline" size="sm" onClick={handleRefreshSignals}>
                Refresh Signals
              </Button>
            </div>
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

        {/* Admin Actions */}
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Admin Actions</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Demo controls wired to backend mutation APIs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" disabled={isSubmittingAction} onClick={handleCreateFraudAlert}>
                Add Fraud Alert
              </Button>
              <Button variant="outline" disabled={isSubmittingAction} onClick={handleCreateTriggerEvent}>
                Add Trigger Event
              </Button>
              <Button variant="outline" disabled={isSubmittingAction} onClick={handleUpdateRiderSnapshot}>
                Update Rider Snapshot
              </Button>
            </div>
            {adminActionStatus && <p className="text-xs text-primary mt-4">{adminActionStatus}</p>}
          </div>
        </ScrollReveal>

        {/* Admin Activity */}
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Admin Activity</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent admin actions.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border/50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actionBadgeClass(log.action)}`}>
                          {log.action.replaceAll("_", " ")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.actor} • {log.targetType}:{log.targetId}
                    </p>
                    <p className="text-xs text-foreground mt-1">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
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

const FeatureNavCard = ({
  icon: Icon,
  title,
  caption,
  to,
}: {
  icon: any;
  title: string;
  caption: string;
  to: string;
}) => (
  <Link to={to} className="rounded-xl border border-border/50 p-4 hover:border-primary/40 transition-colors">
    <Icon className="w-5 h-5 text-primary mb-2" />
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{caption}</p>
  </Link>
);

export default Dashboard;
