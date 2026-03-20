import { Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">RideGurd</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Protecting every ride, every shift, every week.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 RideGurd. Built for India's gig economy.
          </p>
        </div>
      </div>
    </footer>
  );
};
