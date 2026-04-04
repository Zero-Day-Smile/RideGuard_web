import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { createAdminUser, fetchAdminUsers, updateAdminUser, type AdminUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { toast } from "sonner";

const emptyForm = {
  fullName: "",
  email: "",
  role: "rider" as "admin" | "rider",
  city: "",
  platform: "",
  password: "TempPass123",
};

const ManageUsers = () => {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const selectedUser = useMemo(() => users.find((item) => item.id === selectedUserId) || null, [users, selectedUserId]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminUsers();
      setUsers(response.users);
      if (response.users.length > 0 && selectedUserId === null) {
        const first = response.users[0];
        setSelectedUserId(first.id);
        setForm({
          fullName: first.fullName,
          email: first.email,
          role: first.role,
          city: first.city,
          platform: first.platform,
          password: "",
        });
      }
    } catch {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openUser(user: AdminUser) {
    setSelectedUserId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      city: user.city,
      platform: user.platform,
      password: "",
    });
  }

  function resetNewUser() {
    setSelectedUserId(null);
    setForm(emptyForm);
  }

  async function saveUser() {
    if (!form.fullName || !form.email) {
      toast.error("Fill full name and email");
      return;
    }

    setSaving(true);
    try {
      if (selectedUserId === null) {
        await createAdminUser(form.password ? form : { ...form, password: "TempPass123" });
        toast.success("User created");
      } else {
        await updateAdminUser(selectedUserId, form.password ? form : { ...form, password: undefined });
        toast.success("User updated");
      }
      await loadUsers();
    } catch {
      toast.error("Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  const homePath = currentUser?.role === "admin" ? "/admin/dashboard" : "/rider/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Manage Users</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetNewUser} className="gap-2"><Plus className="w-4 h-4" />New User</Button>
            <Button variant="hero" onClick={saveUser} disabled={saving || loading} className="gap-2">
              <Save className="w-4 h-4" />{saving ? "Saving..." : "Save User"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[0.95fr_1.05fr] gap-6 max-w-6xl">
        <ScrollReveal>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4 text-foreground font-semibold"><Users className="w-4 h-4 text-primary" /> Users</div>
            {loading && <p className="text-sm text-muted-foreground">Loading users...</p>}
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => openUser(user)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${selectedUser?.id === user.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-[11px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">{user.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{user.city || "—"} • {user.platform || "—"}</p>
                </button>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">{selectedUserId === null ? "Create User" : `Edit ${selectedUser?.fullName || "User"}`}</h2>
            <Field label="Full Name" value={form.fullName} onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))} />
            <Field label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
            <label className="text-sm text-muted-foreground block">
              Role
              <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as "admin" | "rider" }))} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="rider">Rider</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <Field label="City" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
            <Field label="Platform" value={form.platform} onChange={(value) => setForm((prev) => ({ ...prev, platform: value }))} />
            <Field label="Password / Reset Password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
            <p className="text-xs text-muted-foreground">Leave password blank on edit if you do not want to change it.</p>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="text-sm text-muted-foreground block">
    {label}
    <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
  </label>
);

export default ManageUsers;
