import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Shield,
  DollarSign,
  TrendingUp,
  Zap,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  CloudRain,
  Car,
  Bell,
  LogOut,
  MapPin,
} from "lucide-react";
import { fetchHealth, fetchPolicies, fetchRiderSummary, fetchTriggers, fetchDynamicPremiumQuote, fetchRealtimeContext, type Policy, type TriggersResponse, type RiderSummaryResponse, type DynamicPremiumQuoteResponse, type RealtimeContextResponse } from "@/lib/api";
import { getSelectedPolicyId, setSelectedPolicyId } from "@/lib/policySelection";
import { clearSession, getCurrentUser } from "@/lib/session";
import { toast } from "sonner";

const quickActions = [
  { icon: Shield, label: "Policy", path: "/policy", color: "bg-primary/10 text-primary" },
  { icon: DollarSign, label: "Premium", path: "/premium", color: "bg-success/10 text-success" },
  { icon: Zap, label: "Claims", path: "/claims", color: "bg-warning/10 text-warning" },
  { icon: Bell, label: "Settings", path: "/settings", color: "bg-info/10 text-info" },
];

const RiderHomeScreen = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [summary, setSummary] = useState<RiderSummaryResponse | null>(null);
  const [triggers, setTriggers] = useState<TriggersResponse | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [premiumQuote, setPremiumQuote] = useState<DynamicPremiumQuoteResponse | null>(null);
  const [realtime, setRealtime] = useState<RealtimeContextResponse | null>(null);

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

  const loadRealtime = async () => {
    try {
      const coords = await getCurrentCoordinates();
      const ctx = await fetchRealtimeContext({
        lat: coords?.lat,
        lon: coords?.lon,
        city: user?.city,
      });
      setRealtime(ctx);
    } catch {
      // keep dashboard usable even if realtime feed fails
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [health, riderSummary, triggerData, policyData] = await Promise.all([
          fetchHealth(),
          fetchRiderSummary(),
          fetchTriggers(),
          fetchPolicies(),
        ]);
        if (!active) return;

        setApiOnline(health.status === "ok");
        setSummary(riderSummary);
        setTriggers(triggerData);
        const allPolicies = policyData.policies || [];
        setPolicies(allPolicies);

        const selected = getSelectedPolicyId();
        const policy = allPolicies.find((item) => item.id === selected) || allPolicies[0];
        if (policy) {
          setSelectedPolicyId(policy.id);
          const quote = await fetchDynamicPremiumQuote({
            policyId: policy.id,
            coverageAmount: policy.coverageAmount,
            planTier: policy.planTier,
            cityRisk: 0.62,
            weatherRisk: 0.58,
            trafficRisk: 0.49,
            disruptionRisk: 0.52,
            claimFrequencyRisk: 0.31,
            weeklyDistanceKm: 460,
            nightShiftRatio: 0.34,
            reliabilityScore: 78,
          });
          if (active) setPremiumQuote(quote);
        }

        await loadRealtime();
      } catch {
        if (!active) return;
        setApiOnline(false);
        toast.error("Unable to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadRealtime();
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const activePolicy = policies.find((item) => item.id === getSelectedPolicyId()) || policies[0];
  const recentEvents = useMemo(() => (triggers?.triggerTimeline || []).slice(-5).reverse(), [triggers]);
  const alerts = useMemo(() => triggers?.disruptionSignals || [], [triggers]);

  const handleLogout = () => {
    clearSession();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem] relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">Good Morning 👋</p>
            <h1 className="text-xl font-bold text-primary-foreground">{user?.fullName || "Rider"}</h1>
            <p className="text-[11px] text-primary-foreground/70 mt-1">{apiOnline ? "Live updates active" : "Live updates reconnecting"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 relative"
              onClick={() => setShowAlertDialog(true)}
            >
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-2 border-primary animate-pulse" />
            </Button>
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={handleLogout}>
              <LogOut size={12} />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
            <p className="text-primary-foreground/70 text-xs">Weekly Coverage</p>
            <p className="text-primary-foreground text-xl font-bold">₹{activePolicy?.coverageAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5">
            <p className="text-primary-foreground/70 text-xs">Weekly Premium</p>
            <p className="text-primary-foreground text-xl font-bold">₹{premiumQuote?.weeklyPremium || 0}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-4">
        <Card className="border-0 shadow-lg animate-fade-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <p className="text-xs font-semibold text-foreground">Live Location, Weather & Traffic</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{realtime?.location?.city || user?.city || "Locating..."}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-muted-foreground">Weather</p>
                <p className="font-semibold text-foreground">{realtime ? `${Math.round(realtime.weather.temperatureC)}°C` : "--"}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{realtime?.weather.status || "pending"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-muted-foreground">Traffic</p>
                <p className="font-semibold text-foreground">{realtime ? `${Math.round(realtime.traffic.congestion * 100)}%` : "--"}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{realtime?.traffic.status || "pending"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-muted-foreground">Speed</p>
                <p className="font-semibold text-foreground">{realtime ? `${Math.round(realtime.traffic.currentSpeedKmph)} km/h` : "--"}</p>
                <p className="text-[10px] text-muted-foreground">live feed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 animate-fade-up">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Protected Earnings</p>
              </div>
              <p className="text-lg font-bold text-foreground">₹{summary?.riderSnapshot.protectedEarnings?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Latest Payout</p>
              </div>
              <p className="text-lg font-bold text-foreground">₹{summary?.riderSnapshot.latestPayoutAmount?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg ring-1 ring-warning/20 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-warning" />
              <p className="text-xs font-semibold text-foreground">Active Alert</p>
              <div className="bg-warning/10 text-warning border border-warning/20 text-[10px] ml-auto rounded-full px-2.5 py-0.5 font-semibold">
                {alerts.length} signals
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{alerts[0]?.detail || "No active disruptions right now"}</p>
            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-primary p-0" onClick={() => setShowAlertDialog(true)}>
              View All Alerts <ArrowUpRight size={12} className="ml-1" />
            </Button>
          </CardContent>
        </Card>

        <div className="animate-fade-up delay-100">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <action.icon size={18} />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up delay-150">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Events</h3>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0 divide-y divide-border">
              {loading && <div className="p-4 text-sm text-muted-foreground">Loading dashboard...</div>}
              {!loading && recentEvents.length === 0 && <div className="p-4 text-sm text-muted-foreground">No trigger events yet.</div>}
              {recentEvents.map((event, i) => (
                <div key={`${event.time}-${event.event}-${i}`} className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info/10">
                    <CloudRain size={14} className="text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{event.event} · {event.effect}</p>
                    <p className="text-[10px] text-muted-foreground">{event.time} • {event.status}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Alerts & Notifications</DialogTitle>
            <DialogDescription>Live disruption signals from the backend</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={`${alert.name}-${idx}`} className="p-3 rounded-xl border border-border bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">{alert.name}</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">{alert.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </div>
            ))}
            {summary?.riderSnapshot.latestPayoutTime && (
              <div className="p-3 rounded-xl border border-success/20 bg-success/5">
                <p className="text-sm font-semibold text-foreground">Latest payout</p>
                <p className="text-xs text-muted-foreground">₹{summary.riderSnapshot.latestPayoutAmount} at {summary.riderSnapshot.latestPayoutTime}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderHomeScreen;
