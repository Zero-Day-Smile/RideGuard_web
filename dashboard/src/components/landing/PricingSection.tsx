import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    premium: "₹25",
    coverage: "₹1,500",
    logic: "Rain/day disruption",
    features: ["Weather disruption coverage", "Basic fraud detection", "UPI payouts", "Weekly risk score"],
    popular: false,
  },
  {
    name: "Standard",
    premium: "₹40",
    coverage: "₹3,000",
    logic: "Multiple disruptions",
    features: ["All Basic features", "Platform outage protection", "Traffic shutdown coverage", "Priority payouts (<3 min)", "Weekly risk analytics"],
    popular: true,
  },
  {
    name: "Plus",
    premium: "₹55",
    coverage: "₹5,000",
    logic: "Full-week protection",
    features: ["All Standard features", "Full-week income shield", "Mobility restriction coverage", "Reliability discounts", "Advanced fraud protection"],
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Weekly plans that fit your hustle
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Pay weekly, stay protected weekly. Cancel anytime. AI recalculates your premium each week.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div className={`relative p-7 rounded-2xl border transition-[box-shadow] duration-300 h-full flex flex-col ${
                plan.popular
                  ? "border-primary/30 shadow-elevated bg-card"
                  : "border-border/50 shadow-card hover:shadow-card-hover bg-card"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-7 px-3 py-1 rounded-full gradient-hero text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display font-semibold text-xl text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display font-bold text-3xl text-foreground">{plan.premium}</span>
                  <span className="text-muted-foreground text-sm">/week</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Up to {plan.coverage} income protection</p>
                <p className="text-xs text-primary/70 mb-5">{plan.logic}</p>
                
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/onboarding">
                  <Button variant={plan.popular ? "hero" : "hero-outline"} size="lg" className="w-full">
                    Choose {plan.name}
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
