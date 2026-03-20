import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="relative overflow-hidden pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.10),transparent_45%),radial-gradient(circle_at_85%_85%,hsl(var(--secondary)/0.12),transparent_40%)]" />
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-3 inline-flex rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Contact RideGuard
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">Get in touch</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Questions about RideGuard, deployments, or partnerships? Share your message and our team will get back to you quickly.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
            {/* Contact Info */}
            <ScrollReveal>
              <div className="space-y-6 lg:col-span-2">
                <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-card">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">Contact details</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Prefer a direct conversation? Reach us using these channels.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm text-foreground">Email</h3>
                      <p className="text-sm text-muted-foreground">hello@rideguard.in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm text-foreground">Phone</h3>
                      <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm text-foreground">Office</h3>
                      <p className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/70 p-5">
                  <p className="text-sm font-medium text-foreground">Average response time</p>
                  <p className="mt-1 text-sm text-muted-foreground">Within 24 hours on business days.</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal delay={100}>
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-card md:p-7">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
                      <input
                        type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                        placeholder="Your name"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                      <input
                        type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                    <input
                      type="text" value={form.subject} onChange={(e) => update("subject", e.target.value)}
                      placeholder="What's this about?"
                      className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
                    <textarea
                      value={form.message} onChange={(e) => update("message", e.target.value)}
                      placeholder="Tell us more..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                    />
                  </div>
                  <Button variant="hero" size="lg" className="w-full gap-2" type="submit" disabled={loading}>
                    <Send className="w-4 h-4" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
