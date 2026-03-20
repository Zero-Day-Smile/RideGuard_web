import { ScrollReveal } from "@/components/ScrollReveal";

export const ScooterAnimation = () => {
  return (
    <section className="py-4 overflow-hidden border-t border-b border-border/30 bg-secondary/30">
      <div className="relative h-16 flex items-center">
        {/* Road line */}
        <div className="absolute bottom-4 left-0 right-0 h-px bg-border/60" />
        <div className="absolute bottom-3.5 left-0 right-0 flex gap-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-6 h-px bg-muted-foreground/20 flex-shrink-0" />
          ))}
        </div>

        {/* Animated scooter */}
        <div className="animate-scooter-ride absolute bottom-5">
          <svg width="52" height="32" viewBox="0 0 52 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            {/* Back wheel */}
            <circle cx="10" cy="26" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="10" cy="26" r="1.5" fill="currentColor" />
            {/* Front wheel */}
            <circle cx="42" cy="26" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="42" cy="26" r="1.5" fill="currentColor" />
            {/* Body */}
            <path d="M10 22 L18 14 L32 14 L38 20 L42 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Seat */}
            <path d="M16 14 L22 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Handlebar */}
            <path d="M32 14 L34 10 L38 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Rider body */}
            <circle cx="22" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M22 10 L22 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Rider arm */}
            <path d="M22 12 L32 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Delivery box */}
            <rect x="14" y="3" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" fill="hsl(var(--primary) / 0.15)" />
            <path d="M16 6 L20 6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Trail particles */}
        <div className="animate-scooter-ride absolute bottom-7 -ml-4">
          <div className="flex gap-1.5 opacity-40">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: "0ms" }} />
            <div className="w-0.5 h-0.5 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: "200ms" }} />
            <div className="w-0.5 h-0.5 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    </section>
  );
};
