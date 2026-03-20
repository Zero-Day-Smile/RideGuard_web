import { ScrollReveal } from "@/components/ScrollReveal";
import { User, CloudSun, Car, Smartphone, MapPin, IndianRupee } from "lucide-react";

export const PersonaSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <ScrollReveal>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 mb-4">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">Built for Arjun</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-foreground mb-4">
                Meet your typical rider
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Arjun delivers for Zomato 6 days a week. His income depends entirely on completed deliveries, 
                and he has minimal financial buffer. When it rains heavily or the platform goes down, 
                he loses hours of wages with zero protection.
              </p>
              <div className="space-y-3">
                {[
                  { icon: CloudSun, label: "Heavy rain → fewer orders → reduced earnings" },
                  { icon: Smartphone, label: "Platform outage → cannot accept deliveries" },
                  { icon: Car, label: "Traffic lockdown → reduced delivery zones" },
                  { icon: MapPin, label: "City restrictions → operational disruptions" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120} direction="right">
            <div className="bg-card rounded-2xl border border-border/50 shadow-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-lg font-bold text-primary-foreground">
                  A
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground">Arjun K.</div>
                  <div className="text-xs text-muted-foreground">Zomato Partner • Mumbai</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Weekly Income" value="₹5,200" />
                <MiniStat label="Risk Score" value="72/100" />
                <MiniStat label="Active Days" value="6/week" />
                <MiniStat label="Premium" value="₹40/wk" />
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-xs">
                  <IndianRupee className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-medium">Last payout: ₹1,200 — Heavy rain disruption (Mar 18)</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary/60">
    <div className="font-display font-bold text-sm text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);
