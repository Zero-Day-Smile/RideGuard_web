import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Zap, TrendingUp } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Protection</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground mb-6">
              Income protection for every ride
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Weekly micro-insurance that monitors disruptions and pays out automatically. No claims, no paperwork — just protection.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/onboarding">
                <Button variant="hero" size="xl">Start from ₹20/week</Button>
              </Link>
              <Link to="/#strategy">
                <Button variant="hero-outline" size="lg">See Underwriting Deck</Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={360}>
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[
                { icon: Shield, label: "Zero Claims", value: "100%" },
                { icon: Zap, label: "Payout Speed", value: "<5 min" },
                { icon: TrendingUp, label: "Riders Protected", value: "12,847" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
