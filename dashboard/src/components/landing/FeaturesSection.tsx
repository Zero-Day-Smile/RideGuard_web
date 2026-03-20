import { ScrollReveal } from "@/components/ScrollReveal";
import { Brain, ShieldCheck, Bolt, Smartphone } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Risk Profiling",
    description: "Our engine analyzes weather patterns, traffic data, and your delivery history to calculate a personalized risk score every week.",
  },
  {
    icon: Bolt,
    title: "Parametric Triggers",
    description: "When rainfall exceeds thresholds or platforms go down, claims trigger automatically — no human intervention needed.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Detection",
    description: "Behavioral analytics and geo-validation catch anomalies like location spoofing and artificial inactivity in real time.",
  },
  {
    icon: Smartphone,
    title: "Instant Payouts",
    description: "Compensation hits your UPI or wallet within minutes. Built for the speed gig workers need.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Built for how you actually work
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Insurance that understands gig economy realities — not legacy industry assumptions.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className="group relative p-8 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 border border-border/50">
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
