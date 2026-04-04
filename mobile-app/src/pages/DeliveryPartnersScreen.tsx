import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Truck, RefreshCw, Activity, DollarSign, Star, ChevronRight, Wifi, WifiOff, Shield, CarFront
} from "lucide-react";
import { fetchHealth, fetchSettings, type SettingsResponse } from "@/lib/api";

const DeliveryPartnersScreen = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [backendOk, setBackendOk] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [health, profile] = await Promise.all([fetchHealth(), fetchSettings()]);
      setBackendOk(health.status === "ok");
      setSettings(profile);
    } catch {
      toast.error("Failed to load partner status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground mb-1">Delivery Partners</h1>
            <p className="text-primary-foreground/70 text-sm">Backend account and platform status</p>
          </div>
          <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={refresh}>
            <RefreshCw size={12} /> Sync
          </Button>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-3 animate-fade-up">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">{backendOk ? 1 : 0}</p>
              <p className="text-[10px] text-muted-foreground">Connected</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-success">{settings?.profile.platform || "N/A"}</p>
              <p className="text-[10px] text-muted-foreground">Primary platform</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{settings?.preferences.emailAlerts ? "On" : "Off"}</p>
              <p className="text-[10px] text-muted-foreground">Email alerts</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg animate-fade-up delay-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Backend Health</p>
                <p className="text-xs text-muted-foreground">Connected to the rider API</p>
              </div>
            </div>
            <Badge variant={backendOk ? "default" : "destructive"} className="text-[10px]">{backendOk ? "Online" : "Offline"}</Badge>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-150">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Integration Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-semibold text-foreground">{settings?.profile.city || "Loading..."}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="font-semibold text-foreground">{settings?.profile.platform || "Loading..."}</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/settings")}>Open Settings</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CarFront size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Partner Summary</h3>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Backend status</span>
                <span className="flex items-center gap-1">{backendOk ? <Wifi size={12} className="text-success" /> : <WifiOff size={12} className="text-warning" />} {backendOk ? "Online" : "Offline"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile sync</span>
                <span>{loading ? "Refreshing" : "Synced"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Alerts enabled</span>
                <span>{settings?.preferences.smsAlerts ? "SMS on" : "SMS off"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryPartnersScreen;
