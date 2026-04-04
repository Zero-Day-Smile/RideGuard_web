import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Bike, ChevronRight } from "lucide-react";
import { login, register } from "@/lib/api";
import { clearSession, getCurrentUser, setSession } from "@/lib/session";
import { toast } from "sonner";

const platforms = ["Swiggy", "Zomato", "Uber Eats", "Dunzo", "Blinkit", "Other"];

const RiderAuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "rider") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const auth = await login({ email, password });
        if (auth.user.role !== "rider") {
          clearSession();
          toast.error("This app is only for riders");
          return;
        }
        setSession(auth.token, auth.user);
        toast.success("Signed in successfully");
        navigate("/home", { replace: true });
        return;
      }

      if (!fullName || !city || !selectedPlatform) {
        toast.error("Fill name, city, and platform");
        return;
      }

      const auth = await register({
        fullName,
        email,
        password,
        role: "rider",
        city,
        platform: selectedPlatform,
      });

      if ("token" in auth && auth.token) {
        setSession(auth.token, auth.user);
        toast.success("Account created");
        navigate("/home", { replace: true });
        return;
      }

      toast.success(
        auth.verificationRequired
          ? "Account created. Verification required before login."
          : "Account created. Please login."
      );
      setIsLogin(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("HTTP_401")) {
        toast.error("Invalid email or password");
      } else if (message.includes("HTTP_409")) {
        toast.error("Email already registered");
      } else if (message.includes("HTTP_422")) {
        toast.error("Please fill all required fields correctly");
      } else if (message === "NETWORK_UNREACHABLE") {
        toast.error("Backend unreachable. Start RideGuard API on port 8000");
      } else {
        toast.error("Auth failed. Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-16 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute animate-scooter" style={{ top: `${20 + i * 15}%`, left: '-20%', animationDelay: `${i * 0.5}s`, opacity: 0.3 }}>
              <Bike size={24} className="text-primary-foreground" />
            </div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm animate-pulse-glow">
            <Shield size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">RideGuard</h1>
          <p className="text-primary-foreground/80 text-sm text-center">Insurance built for delivery riders</p>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 -mt-8 flex-1">
        <Card className="shadow-xl border-0 animate-fade-up">
          <CardContent className="p-6">
            {/* Toggle */}
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? "gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? "gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5 animate-fade-up">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="rider@email.com" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary" />
              </div>
              {!isLogin && (
                <>
                  <div className="space-y-1.5 animate-fade-up">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-1.5 animate-fade-up">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</Label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setSelectedPlatform(p)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            selectedPlatform === p
                              ? "gradient-primary text-primary-foreground shadow-md"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Button disabled={loading} type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-lg hover:opacity-90 transition-opacity mt-2">
                {loading ? "Working..." : isLogin ? "Login" : "Create Account"}
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </form>

            <div className="mt-4 rounded-xl border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
              Demo users: rider@rideguard.dev / rider123 and admin@rideguard.dev / admin123. Rider app blocks admin access.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiderAuthScreen;
