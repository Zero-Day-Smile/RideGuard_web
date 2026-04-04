import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { User, Bell, Moon, Lock, HelpCircle, FileText, LogOut, ChevronRight, Shield, Bike } from "lucide-react";
import { changePassword, fetchSettings, updateSettings, type SettingsResponse } from "@/lib/api";
import { toast } from "sonner";

type SettingAction = "profile" | "policy" | "platform" | "notifications" | "security";

const SettingsScreen = () => {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState<SettingAction | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"bike" | "scooter" | "cycle" | "ev">("bike");
  const [emergencyContact, setEmergencyContact] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchSettings();
        setSettings(response);
        setProfilePicUrl(response.preferences.profilePicUrl || "");
        setIdNumber(response.preferences.idNumber || "");
        setVehicleType(response.preferences.vehicleType || "bike");
        setEmergencyContact(response.preferences.emergencyContact || "");
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const profile = settings?.profile;
  const preferences = settings?.preferences;

  const persistToggle = async (nextTheme = isDark ? "dark" : "light") => {
    if (!profile || !preferences) return;
    setSaving(true);
    try {
      const response = await updateSettings({
        fullName: profile.fullName,
        city: profile.city,
        platform: profile.platform,
        theme: nextTheme === "dark" ? "dark" : "light",
        language: preferences.language,
        emailAlerts: preferences.emailAlerts,
        smsAlerts: preferences.smsAlerts,
      });
      setSettings(response);
      if (isDark !== (nextTheme === "dark")) {
        toggle();
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      await changePassword(passwordForm);
      toast.success("Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordOpen(false);
    } catch {
      toast.error("Unable to change password");
    } finally {
      setSaving(false);
    }
  };

  const saveProfileDetails = async () => {
    if (!profile || !preferences) return;
    setSaving(true);
    try {
      const response = await updateSettings({
        fullName: profile.fullName,
        city: profile.city,
        platform: profile.platform,
        theme: preferences.theme,
        language: preferences.language,
        emailAlerts: preferences.emailAlerts,
        smsAlerts: preferences.smsAlerts,
        profilePicUrl,
        idNumber,
        vehicleType,
        emergencyContact,
      });
      setSettings(response);
      toast.success("Profile and verification updated");
    } catch {
      toast.error("Unable to save profile details");
    } finally {
      setSaving(false);
    }
  };

  const saveIdentityAndPlatform = async () => {
    if (!profile || !preferences) return;
    setSaving(true);
    try {
      const response = await updateSettings({
        fullName: profile.fullName,
        city: profile.city,
        platform: profile.platform,
        theme: preferences.theme,
        language: preferences.language,
        emailAlerts: preferences.emailAlerts,
        smsAlerts: preferences.smsAlerts,
        idNumber,
        vehicleType,
        emergencyContact,
      });
      setSettings(response);
      toast.success("Delivery and ID settings updated");
      setActionOpen(null);
    } catch {
      toast.error("Unable to save delivery settings");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!profile || !preferences) return;
    setSaving(true);
    try {
      const response = await updateSettings({
        fullName: profile.fullName,
        city: profile.city,
        platform: profile.platform,
        theme: preferences.theme,
        language: preferences.language,
        emailAlerts: preferences.emailAlerts,
        smsAlerts: preferences.smsAlerts,
        profilePicUrl,
        idNumber,
        vehicleType,
        emergencyContact,
      });
      setSettings(response);
      toast.success("Notification preferences saved");
      setActionOpen(null);
    } catch {
      toast.error("Unable to save notifications");
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelected = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePicUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", subtitle: profile ? `${profile.fullName} · ${profile.email}` : "Loading profile...", action: "profile" as const },
        { icon: Shield, label: "Policy Preferences", subtitle: "Coverage & plan settings", action: "policy" as const },
        { icon: Bike, label: "Delivery Platform", subtitle: profile?.platform || "Loading platform...", action: "platform" as const },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", subtitle: preferences ? `${preferences.emailAlerts ? "Email on" : "Email off"} · ${preferences.smsAlerts ? "SMS on" : "SMS off"}` : "Loading preferences...", action: "notifications" as const },
        { icon: Moon, label: "Dark Mode", subtitle: isDark ? "On" : "Off", toggle: true },
        { icon: Lock, label: "Security", subtitle: "Password & account access", action: "security" as const },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", subtitle: "FAQs & support" },
        { icon: FileText, label: "Terms & Privacy", subtitle: "Legal documents" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-primary px-5 pt-12 pb-16 rounded-b-[2rem]">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">Settings</h1>
        <p className="text-primary-foreground/70 text-sm">Manage your backend-synced account</p>
      </div>

      <div className="px-5 -mt-8 space-y-4 pb-4">
        <Card className="border-0 shadow-xl animate-fade-up">
          <CardContent className="p-5 flex items-center gap-4">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">{profile?.fullName?.slice(0, 2).toUpperCase() || "RG"}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{profile?.fullName || "Loading profile"}</h2>
              <p className="text-sm text-muted-foreground">{profile ? `${profile.role} · ${profile.city}` : "Fetching backend profile..."}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-fade-up delay-100">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Profile & Verification</h3>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Upload Profile Photo</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">ID Number</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="DL/UID" />
              </label>
              <div className="block space-y-1">
                <span className="text-xs text-muted-foreground">Verification Status</span>
                <div className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm capitalize">
                  {settings?.preferences.idVerificationStatus || "unverified"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Vehicle Type</span>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as "bike" | "scooter" | "cycle" | "ev") }>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="cycle">Cycle</option>
                  <option value="ev">EV</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Emergency Contact</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="+91..." />
              </label>
            </div>
            <Button className="w-full" onClick={() => void saveProfileDetails()} disabled={saving || loading}>Save Profile Details</Button>
          </CardContent>
        </Card>

        {sections.map((section, si) => (
          <div key={section.title} className={`animate-fade-up ${si === 0 ? "delay-100" : si === 1 ? "delay-200" : "delay-300"}`}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</h3>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0 divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 p-4 text-left"
                    onClick={() => {
                      if (item.toggle) return;
                      if (item.action === "security") {
                        setPasswordOpen(true);
                        return;
                      }
                      if (item.action) {
                        setActionOpen(item.action);
                        return;
                      }
                      if (item.label === "Help Center") {
                        toast.message("Support: rideguard-support@demo.app");
                        return;
                      }
                      if (item.label === "Terms & Privacy") {
                        window.open("https://example.com/terms", "_blank");
                      }
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    {item.toggle ? (
                      <Switch checked={isDark} onCheckedChange={() => persistToggle(isDark ? "light" : "dark")} disabled={saving || loading} />
                    ) : (
                      <ChevronRight size={14} className="text-muted-foreground" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        <Button
          onClick={() => setPasswordOpen(true)}
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 animate-fade-up delay-400"
        >
          <Lock size={16} /> Change Password
        </Button>

        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 animate-fade-up delay-400"
        >
          <LogOut size={16} /> Log Out
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-2">RideGuard v1.0.0</p>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your backend account password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <Button className="w-full" onClick={savePassword} disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}>Save Password</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen === "profile"} onOpenChange={(open) => setActionOpen(open ? "profile" : null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Manage your profile details and verification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Full Name" value={profile?.fullName || ""} onChange={(e) => setSettings((prev) => prev ? { ...prev, profile: { ...prev.profile, fullName: e.target.value } } : prev)} />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="City" value={profile?.city || ""} onChange={(e) => setSettings((prev) => prev ? { ...prev, profile: { ...prev.profile, city: e.target.value } } : prev)} />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="ID Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            <Button className="w-full" onClick={() => void saveProfileDetails()} disabled={saving || loading}>Save Profile</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen === "policy"} onOpenChange={(open) => setActionOpen(open ? "policy" : null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Policy Preferences</DialogTitle>
            <DialogDescription>Select, compare, and switch premium plans with guided details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-semibold text-foreground">Current Plan</p>
              <p className="text-muted-foreground mt-1">Manage active coverage, proceed flow, and advanced policy details.</p>
            </div>
            <Button className="w-full" onClick={() => navigate("/policy")}>Open Policy Management</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen === "platform"} onOpenChange={(open) => setActionOpen(open ? "platform" : null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Delivery Platform</DialogTitle>
            <DialogDescription>Keep your platform and operations data synced for accurate premiums and claims.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={profile?.platform || "swiggy"} onChange={(e) => setSettings((prev) => prev ? { ...prev, profile: { ...prev.profile, platform: e.target.value } } : prev)}>
              <option value="swiggy">Swiggy</option>
              <option value="zomato">Zomato</option>
              <option value="zepto">Zepto</option>
              <option value="blinkit">Blinkit</option>
              <option value="dunzo">Dunzo</option>
            </select>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as "bike" | "scooter" | "cycle" | "ev") }>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
              <option value="cycle">Cycle</option>
              <option value="ev">EV</option>
            </select>
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Emergency Contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            <Button className="w-full" onClick={() => void saveIdentityAndPlatform()} disabled={saving || loading}>Save Delivery Settings</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen === "notifications"} onOpenChange={(open) => setActionOpen(open ? "notifications" : null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Choose where you receive premium alerts, claim updates, and security notices.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">Email Alerts</span>
              <Switch checked={Boolean(settings?.preferences.emailAlerts)} onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, preferences: { ...prev.preferences, emailAlerts: checked } } : prev)} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">SMS Alerts</span>
              <Switch checked={Boolean(settings?.preferences.smsAlerts)} onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, preferences: { ...prev.preferences, smsAlerts: checked } } : prev)} />
            </label>
            <Button className="w-full" onClick={() => void saveNotificationSettings()} disabled={saving || loading}>Save Notification Preferences</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsScreen;
