import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created! Let's set up your protection.");
      navigate("/onboarding");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <ScrollReveal>
          <div className="max-w-md text-primary-foreground">
            <Shield className="w-12 h-12 mb-6 opacity-90" />
            <h2 className="font-display font-bold text-3xl mb-4 leading-tight">Join 12,847 delivery partners already protected.</h2>
            <p className="opacity-80 leading-relaxed">Set up your weekly income protection in under 2 minutes. No paperwork, no long forms — just smart coverage.</p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "₹25/wk", label: "Starting from" },
                { value: "<5 min", label: "Payout speed" },
                { value: "0", label: "Manual claims" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display font-bold text-xl">{s.value}</div>
                  <div className="text-xs opacity-70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
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
              <span className="font-display font-bold text-xl text-foreground">RideGurd</span>
            </Link>

            <h1 className="font-display font-bold text-2xl text-foreground mb-1">Create your account</h1>
            <p className="text-muted-foreground mb-8">Start protecting your weekly income</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Kumar"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              </div>
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
                    placeholder="At least 6 characters"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
              By signing up, you agree to RideGurd's Terms of Service and Privacy Policy.
            </p>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Signup;
