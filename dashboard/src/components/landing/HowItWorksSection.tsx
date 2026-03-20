import { ScrollReveal } from "@/components/ScrollReveal";

const steps = [
  { number: "01", title: "Connect", description: "Link your delivery platform and share your location. We build your risk profile in seconds." },
  { number: "02", title: "Choose Coverage", description: "Pick a weekly plan that matches your earnings. Premiums start at just ₹65/week." },
  { number: "03", title: "Stay Protected", description: "Our AI monitors weather, traffic, and platform uptime 24/7 while you ride." },
  { number: "04", title: "Get Paid", description: "When a disruption hits, your payout is triggered and deposited automatically." },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-secondary/50">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Protection in 4 simple steps
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              From sign-up to payout — everything happens without paperwork.
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-2xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 100}>
              <div className="flex gap-6 items-start relative py-8">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center font-display font-bold text-primary-foreground text-lg">
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-7 top-[72px] w-px h-[calc(100%-40px)] bg-border" />
                )}
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
