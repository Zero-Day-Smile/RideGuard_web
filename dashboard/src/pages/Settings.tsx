import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePassword, fetchSettings, updateSettings } from "@/lib/api";
import { getCurrentUser, setSession, getToken } from "@/lib/session";
import { toast } from "sonner";

const Settings = () => {
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [city, setCity] = useState(user?.city || "");
  const [platform, setPlatform] = useState(user?.platform || "");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("en");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [upiId, setUpiId] = useState("arjun@upi");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchSettings();
        if (!active) return;
        setFullName(data.profile.fullName || "");
        setCity(data.profile.city || "");
        setPlatform(data.profile.platform || "");
        setTheme(data.preferences.theme);
        setLanguage(data.preferences.language);
        setEmailAlerts(data.preferences.emailAlerts);
        setSmsAlerts(data.preferences.smsAlerts);
      } catch {
        if (!active) return;
        toast.error("Could not load settings");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const data = await updateSettings({
        fullName,
        city,
        platform,
        theme,
        language,
        emailAlerts,
        smsAlerts,
      });
      const token = getToken();
      if (token) {
        setSession(token, data.profile);
      }
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Enter current and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch {
      toast.error("Password change failed");
    } finally {
      setSaving(false);
    }
  }

  const homePath = user?.role === "admin" ? "/admin/dashboard" : "/rider/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>
          </div>
          <Button variant="hero" className="gap-2" onClick={saveSettings} disabled={saving || loading}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Profile</h2>
          <TextField label="Full Name" value={fullName} onChange={setFullName} />
          <TextField label="City" value={city} onChange={setCity} />
          <TextField label="Platform" value={platform} onChange={setPlatform} />
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4 mt-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Preferences</h2>

          <label className="text-sm text-muted-foreground block">
            Theme
            <select className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system") }>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <TextField label="Language" value={language} onChange={setLanguage} />

          <Toggle label="Email Alerts" checked={emailAlerts} onChange={setEmailAlerts} />
          <Toggle label="SMS Alerts" checked={smsAlerts} onChange={setSmsAlerts} />
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4 mt-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Linked Payment Method</h2>
          <TextField label="UPI ID (mock)" value={upiId} onChange={setUpiId} />
          <p className="text-xs text-muted-foreground">
            Zero-touch payouts will be routed to this linked destination in demo mode.
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4 mt-6">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2"><Lock className="w-4 h-4" /> Security</h2>
          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
          <Button variant="outline" onClick={handleChangePassword} disabled={saving || loading} className="w-full">
            Update Password
          </Button>
        </div>
      </main>
    </div>
  );
};

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
  </label>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm text-foreground">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

const PasswordField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input
      type="password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
    />
  </label>
);

export default Settings;
