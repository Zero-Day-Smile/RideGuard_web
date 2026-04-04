import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailWarning, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { resendVerificationEmail, verifyEmail } from "@/lib/api";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        await verifyEmail(token);
        if (!active) return;
        setStatus("verified");
        setMessage("Your email is verified. You can sign in now.");
        toast.success("Email verified");
      } catch (error) {
        if (!active) return;
        const detail = error instanceof Error ? error.message : "";
        setStatus("error");
        setMessage(detail.includes("expired") ? "This verification link expired." : "Verification failed. Request a new link.");
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [token]);

  const icon = useMemo(() => {
    if (status === "verified") return <CheckCircle2 className="w-12 h-12 text-success" />;
    if (status === "error") return <MailWarning className="w-12 h-12 text-destructive" />;
    return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
  }, [status]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Open this page from your email or use the login page to resend.");
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail({ email });
      toast.success("Verification email sent.");
    } catch {
      toast.error("Could not resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <ScrollReveal>
        <div className="w-full max-w-md text-center bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div className="flex justify-center mb-4">{icon}</div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Email Verification</h1>
          <p className="text-muted-foreground text-sm mb-6">{message}</p>
          <div className="space-y-3">
            <Link to="/login">
              <Button variant="hero" className="w-full">Go to Login</Button>
            </Link>
            <Button variant="outline" className="w-full" type="button" onClick={handleResend} disabled={resending || !email}>
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default VerifyEmail;