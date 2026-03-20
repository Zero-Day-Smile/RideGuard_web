import { ScrollReveal } from "@/components/ScrollReveal";
import { AlertTriangle, Clock, DollarSign, FileX } from "lucide-react";

const problems = [
  { icon: Clock, problem: "Monthly/yearly pricing", impact: "Doesn't match weekly gig income cycles" },
  { icon: FileX, problem: "Claim-heavy processes", impact: "Paperwork takes weeks, riders give up" },
  { icon: AlertTriangle, problem: "Misaligned risks", impact: "Covers accidents, not income loss from weather/outages" },
  { icon: DollarSign, problem: "Unaffordable premiums", impact: "Annual costs too high for variable-income workers" },
];

export const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/50">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Insurance wasn't built for gig workers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Delivery partners lose income to weather, outages, and shutdowns — risks no traditional policy covers.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {problems.map((p, i) => (
            <ScrollReveal key={p.problem} delay={i * 80}>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-destructive/8 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-1">{p.problem}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.impact}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
