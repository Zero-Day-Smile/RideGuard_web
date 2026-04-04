import { useNavigate, useLocation } from "react-router-dom";
import { Home, Shield, Calculator, FileCheck, Settings, Bike } from "lucide-react";

const tabs = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/policy", icon: Shield, label: "Policy" },
  { path: "/premium", icon: Calculator, label: "Premium" },
  { path: "/claims", icon: FileCheck, label: "Claims" },
  { path: "/partners", icon: Bike, label: "Partners" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? "gradient-primary shadow-lg" : ""}`}>
                <tab.icon size={18} className={isActive ? "text-primary-foreground" : ""} />
              </div>
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
