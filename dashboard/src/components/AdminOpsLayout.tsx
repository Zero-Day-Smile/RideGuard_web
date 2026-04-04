import { Link } from "react-router-dom";
import { BarChart3, ClipboardList, Flame, Gauge, History, LogOut, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getCurrentUser } from "@/lib/session";
import { useTheme } from "@/hooks/use-theme";

type AdminLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const items = [
  { to: "/admin/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/manage-users", label: "Users", icon: Users },
  { to: "/admin/fraud-center", label: "Fraud Center", icon: Shield },
  { to: "/admin/trigger-ops", label: "Trigger Ops", icon: Flame },
  { to: "/admin/claims-ops", label: "Claims Ops", icon: ClipboardList },
  { to: "/admin/model-ops", label: "Model Ops", icon: Gauge },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: History },
];

const AdminOpsLayout = ({ title, subtitle, children }: AdminLayoutProps) => {
  const user = getCurrentUser();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[260px_1fr] min-h-screen">
        <aside className="hidden lg:flex flex-col border-r border-border bg-card p-4 sticky top-0 h-screen">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">RideGuard</p>
              <p className="text-[11px] text-muted-foreground">Admin Ops</p>
            </div>
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={toggle}>
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                clearSession();
                window.location.href = "/login";
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </aside>

        <div>
          <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
            <div className="px-4 md:px-6 h-16 flex items-center justify-between">
              <div>
                <h1 className="font-display text-lg md:text-xl font-semibold text-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
              <span className="text-xs rounded-full px-2 py-1 bg-primary/10 text-primary font-medium">
                {user?.fullName || "Admin"}
              </span>
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminOpsLayout;
