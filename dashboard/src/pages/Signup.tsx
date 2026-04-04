import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Lock, Eye, EyeOff, User, MapPin, Bike } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
import { register } from "@/lib/api";

const PLATFORM_OPTIONS = ["Swiggy", "Zomato", "Blinkit", "Zepto", "Other"];
const CITY_OPTIONS = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata"];

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [platform, setPlatform] = useState("Swiggy");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    match: !confirmPassword || password === confirmPassword,
  }), [password, confirmPassword]);

  const validate = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) return "Enter your full name.";
    if (!trimmedEmail) return "Enter your email address.";
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use a password with at least one letter and one number.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!acceptTerms) return "Accept the terms to continue.";
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setFieldError(null);

    try {
      const response = await register({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "rider",
        city: city.trim(),
        platform: platform.trim(),
      });
      toast.success(response.verificationSent ? "Verification email sent" : "Account created. Verify your email to continue.");
      navigate(`/login?email=${encodeURIComponent(email.trim().toLowerCase())}&verification=pending`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("HTTP_409")) {
        toast.error("That email is already registered.");
      } else if (message.includes("NETWORK_UNREACHABLE")) {
        toast.error("Backend unreachable. Start API on http://localhost:8000");
      } else {
        toast.error("Signup failed. Check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
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
              <span className="font-display font-bold text-xl text-foreground">RideGuard</span>
            </Link>

            <h1 className="font-display font-bold text-2xl text-foreground mb-1">Create your account</h1>
            <p className="text-muted-foreground mb-8">Start protecting your weekly income with a verified rider account</p>

            {fieldError && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {fieldError}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Kumar"
                    autoComplete="name"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@example.com"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                <p>
                  Role is locked to <span className="font-semibold text-foreground">Rider</span> for self-signup. Admin accounts are created from the admin console.
                </p>
                <p>Use a real email and a strong password. This account is the source for policy activation and payouts.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    title="City"
                    aria-label="City"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-input bg-background text-foreground text-sm"
                  >
                    {CITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    title="Platform"
                    aria-label="Platform"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-input bg-background text-foreground text-sm"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy, and I understand that claims and payouts are based on verified rider activity.
                </span>
              </label>

              <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Password requirements</p>
                <p className={passwordChecks.length ? "text-success" : ""}>• At least 8 characters</p>
                <p className={passwordChecks.letter ? "text-success" : ""}>• Includes a letter</p>
                <p className={passwordChecks.number ? "text-success" : ""}>• Includes a number</p>
                <p className={passwordChecks.match ? "text-success" : ""}>• Passwords match</p>
              </div>

              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
              By signing up, you agree to RideGuard's Terms of Service and Privacy Policy.
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
