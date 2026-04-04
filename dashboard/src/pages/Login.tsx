import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
import { login, resendVerificationEmail } from "@/lib/api";
import { setSession } from "@/lib/session";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
    if (searchParams.get("verification") === "pending") {
      toast.message("Verify your email before signing in.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const auth = await login({ email, password });
      setSession(auth.token, auth.user);
      toast.success("Welcome back!");
      navigate(auth.user.role === "admin" ? "/admin/dashboard" : "/rider/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("HTTP_401")) {
        toast.error("Invalid email or password");
      } else if (message.includes("HTTP_403") || message.toLowerCase().includes("email not verified")) {
        toast.error("Verify your email first. Check your inbox or resend the link.");
      } else if (message === "NETWORK_UNREACHABLE") {
        toast.error("Backend unreachable. Start API on http://localhost:8000");
      } else {
        toast.error("Login failed. Check backend and try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }

    setResending(true);
    try {
      const response = await resendVerificationEmail({ email: email.trim().toLowerCase() });
      toast.success(response.verificationSent ? "Verification email sent again." : "If the account exists, a verification email has been queued.");
    } catch {
      toast.error("Could not resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <ScrollReveal>
          <div className="max-w-md text-primary-foreground">
            <Shield className="w-12 h-12 mb-6 opacity-90" />
            <h2 className="font-display font-bold text-3xl mb-4 leading-tight">Protecting every ride, every shift, every week.</h2>
            <p className="opacity-80 leading-relaxed">Your income protection is always active. Log in to check your risk score, payouts, and policy status.</p>
          </div>
        </ScrollReveal>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <ScrollReveal>
          <div className="w-full max-w-sm">
            <Link to="/" className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">RideGuard</span>
            </Link>

            <h1 className="font-display font-bold text-2xl text-foreground mb-1">Welcome back</h1>
            <p className="text-muted-foreground mb-8">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>

              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">Verification</p>
              <p className="text-xs text-muted-foreground mb-3">If you have not verified your email yet, resend the link here before logging in.</p>
              <Button variant="outline" size="sm" className="w-full" type="button" onClick={handleResendVerification} disabled={resending}>
                {resending ? "Sending..." : "Resend verification email"}
              </Button>
            </div>

            <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">Demo Credentials</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/70 px-2.5 py-2">
                  <div>
                    <p className="text-foreground font-medium">Rider</p>
                    <p>rider@rideguard.dev / rider123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("rider@rideguard.dev");
                      setPassword("rider123");
                    }}
                    className="text-primary hover:underline"
                  >
                    Use
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/70 px-2.5 py-2">
                  <div>
                    <p className="text-foreground font-medium">Admin</p>
                    <p>admin@rideguard.dev / admin123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@rideguard.dev");
                      setPassword("admin123");
                    }}
                    className="text-primary hover:underline"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Login;
