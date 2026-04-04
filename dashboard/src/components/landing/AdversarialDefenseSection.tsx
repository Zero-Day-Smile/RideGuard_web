import { ScrollReveal } from "@/components/ScrollReveal";
import { ShieldAlert, Fingerprint, Brain, Users, Radar, Globe } from "lucide-react";

const layers = [
  {
    icon: Fingerprint,
    title: "GPS Spoofing Detection",
    description: "Beyond raw coordinates — we analyze mock-location flags, GPS jitter patterns, and signal consistency to identify spoofed positions instantly.",
  },
  {
    icon: Brain,
    title: "Behavioral Analytics",
    description: "Isolation Forest anomaly detection flags riders whose claim patterns deviate from historical baselines — synchronized timing, unrealistic movement, or repeated trigger exploitation.",
  },
  {
    icon: Radar,
    title: "Device & Network Fingerprinting",
    description: "Cross-reference device metadata, network towers, Wi-Fi signatures, and IP geolocation against reported GPS. Mismatches trigger escalation, not rejection.",
  },
  {
    icon: Users,
    title: "Fraud Ring Detection",
    description: "Graph-based analysis identifies coordinated clusters — shared devices, synchronized claims, common Telegram groups, and payout wallet linkages across multiple accounts.",
  },
  {
    icon: Globe,
    title: "Local Disruption Intelligence",
    description: "Web scraping and mock APIs cross-verify claims against real disruption events — riots, curfews, emergency shutdowns — ensuring triggers match ground truth.",
  },
  {
    icon: ShieldAlert,
    title: "Fair UX for Honest Riders",
    description: "Flagged claims enter a fast-track review — not instant denial. Genuine riders with network drops or bad weather get a 15-minute verification window before any hold.",
  },
];

export const AdversarialDefenseSection = () => {
  return (
    <section id="defense" className="py-20 md:py-32 bg-foreground/[0.02]">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/8 border border-destructive/15 mb-5">
              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive tracking-wide uppercase">Market Crash Defense</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Adversarial Defense & Anti-Spoofing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              500 fake GPS claims. Coordinated fraud rings. Drained liquidity pools. 
              RideGuard's multi-layered AI pipeline stops them all — without punishing honest riders.
            </p>
          </div>
        </ScrollReveal>

        {/* The Crisis Context */}
        <ScrollReveal>
          <div className="max-w-3xl mx-auto mb-12 p-6 rounded-2xl border border-destructive/15 bg-destructive/[0.03]">
            <h3 className="font-display font-semibold text-base text-foreground mb-2">The Threat Scenario</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A syndicate of 500 delivery workers in a tier-1 city uses advanced GPS-spoofing apps. 
              While resting at home, they fake locations in severe weather zones — triggering mass false payouts 
              and draining liquidity pools. Simple GPS verification is officially obsolete. RideGuard's architecture 
              was built for exactly this.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {layers.map((layer, i) => (
            <ScrollReveal key={layer.title} delay={i * 80}>
              <div className="group p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 border border-border/50 h-full">
                <div className="w-11 h-11 rounded-xl bg-destructive/8 flex items-center justify-center mb-4">
                  <layer.icon className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-2">{layer.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Differentiation Logic */}
        <ScrollReveal>
          <div className="max-w-3xl mx-auto mt-12 space-y-6">
            <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-card">
              <h3 className="font-display font-semibold text-base text-foreground mb-3">
                How We Differentiate: Genuine vs. Bad Actor
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <span className="font-medium text-foreground">Genuine rider:</span> GPS signal degrades naturally in storms, device connects to local cell towers near the reported zone, delivery app shows recent order activity before disruption, and historical patterns match seasonal weather impact.
                </p>
                <p>
                  <span className="font-medium text-foreground">Bad actor:</span> GPS coordinates snap perfectly to a spoofed zone while device network metadata (Wi-Fi, cell towers, IP) places them kilometers away. No recent delivery activity. Claim timing synchronized with dozens of other accounts in the same fabricated location.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-card">
              <h3 className="font-display font-semibold text-base text-foreground mb-3">
                Data Points Beyond GPS
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {[
                  "Cell tower triangulation",
                  "Wi-Fi network signatures",
                  "IP geolocation cross-check",
                  "Device accelerometer data",
                  "Mock-location API flags",
                  "App activity timestamps",
                  "Payout wallet graph analysis",
                  "Claim timing correlation",
                  "Historical delivery baselines",
                  "Local event web scraping",
                ].map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-card">
              <h3 className="font-display font-semibold text-base text-foreground mb-3">
                UX Balance: No Honest Rider Left Behind
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Flagged claims are <span className="font-medium text-foreground">never auto-rejected</span>. They enter a fast-track review queue with a 15-minute verification window. 
                  Riders can submit supplementary proof — a photo of weather conditions, a screenshot of platform downtime, or simply wait for the system to cross-verify with external weather and traffic APIs.
                </p>
                <p>
                  Riders with clean history and high reliability scores get <span className="font-medium text-foreground">benefit-of-the-doubt payouts</span> — processed immediately with post-facto verification. 
                  Only repeat offenders with multiple anomaly flags face holds.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
