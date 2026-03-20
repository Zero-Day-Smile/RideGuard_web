import { ScrollReveal } from "@/components/ScrollReveal";
import { CloudRain, Wifi, Car, Ban } from "lucide-react";

const triggers = [
  { event: "Heavy Rain", condition: "Rainfall exceeds threshold", icon: CloudRain },
  { event: "Platform Downtime", condition: "API inactive > 30 mins", icon: Wifi },
  { event: "Traffic Shutdown", condition: "Congestion spike detected", icon: Car },
  { event: "Mobility Restriction", condition: "Delivery activity collapse", icon: Ban },
];

export const ParametricSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Parametric trigger engine
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Real-time monitoring detects disruptions automatically. When conditions are met, claims trigger without any rider action.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {triggers.map((t, i) => (
            <ScrollReveal key={t.event} delay={i * 80}>
              <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
                  <t.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-1">{t.event}</h3>
                <p className="text-xs text-muted-foreground">{t.condition}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
