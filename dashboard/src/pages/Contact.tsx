import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, MapPin, Phone, Send } from "lucide-react";
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
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">Get in touch</h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Questions about RideGurd? Want to partner with us? We'd love to hear from you.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-5 gap-8 max-w-4xl mx-auto">
            {/* Contact Info */}
            <ScrollReveal>
              <div className="md:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-card space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm text-foreground">Email</h3>
                      <p className="text-sm text-muted-foreground">hello@ridegurd.in</p>
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
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal delay={100}>
              <div className="md:col-span-3">
                <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-card border border-border/50 shadow-card space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
