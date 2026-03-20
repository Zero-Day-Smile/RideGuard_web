import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Bike, IndianRupee, ChevronRight, ChevronLeft } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const steps = [
  { id: "platform", title: "Delivery Platform", subtitle: "Which platform do you ride for?" },
  { id: "location", title: "Your City", subtitle: "Where do you primarily deliver?" },
  { id: "earnings", title: "Weekly Earnings", subtitle: "Estimate your average weekly income" },
  { id: "coverage", title: "Choose Coverage", subtitle: "Select a plan that fits your needs" },
];

const platforms = ["Zomato", "Swiggy", "Blinkit", "Zepto", "Other"];
const cities = ["Mumbai", "Delhi NCR", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"];
const earningRanges = ["₹3,000 – ₹5,000", "₹5,000 – ₹8,000", "₹8,000 – ₹12,000", "₹12,000+"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const select = (key: string, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const currentStep = steps[step];
  const canNext = !!selections[currentStep.id];

  const handleFinish = () => {
    localStorage.setItem("ridegurd-onboarding", JSON.stringify(selections));
    localStorage.removeItem("rideguard-onboarding");
    navigate("/dashboard");
  };

  const renderOptions = () => {
    if (step === 0) {
      return platforms.map((p) => (
        <OptionCard key={p} label={p} icon={<Bike className="w-5 h-5" />} selected={selections.platform === p} onClick={() => select("platform", p)} />
      ));
    }
    if (step === 1) {
      return cities.map((c) => (
        <OptionCard key={c} label={c} icon={<MapPin className="w-5 h-5" />} selected={selections.location === c} onClick={() => select("location", c)} />
      ));
    }
    if (step === 2) {
      return earningRanges.map((e) => (
        <OptionCard key={e} label={e} icon={<IndianRupee className="w-5 h-5" />} selected={selections.earnings === e} onClick={() => select("earnings", e)} />
      ));
    }
    if (step === 3) {
      return (
        <div className="space-y-4">
          <CoverageCard name="Basic" premium="₹25/week" coverage="₹1,500" logic="Rain/day disruption" selected={selections.coverage === "basic"} onClick={() => select("coverage", "basic")} />
          <CoverageCard name="Standard" premium="₹40/week" coverage="₹3,000" logic="Multiple disruptions" selected={selections.coverage === "standard"} onClick={() => select("coverage", "standard")} recommended />
          <CoverageCard name="Plus" premium="₹55/week" coverage="₹5,000" logic="Full-week protection" selected={selections.coverage === "plus"} onClick={() => select("coverage", "plus")} />
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">RideGurd</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "gradient-hero" : "bg-border"}`} />
            ))}
          </div>

          <ScrollReveal key={step}>
            <div className="mb-2 text-xs font-semibold text-primary uppercase tracking-wider">
              Step {step + 1} of {steps.length}
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-1">{currentStep.title}</h2>
            <p className="text-muted-foreground mb-8">{currentStep.subtitle}</p>

            <div className={step === 3 ? "" : "grid grid-cols-2 gap-3"}>
              {renderOptions()}
            </div>
          </ScrollReveal>

          <div className="flex gap-3 mt-10">
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <Button
              variant="hero"
              size="lg"
              className="flex-1 gap-2"
              disabled={!canNext}
              onClick={() => (step < steps.length - 1 ? setStep(step + 1) : handleFinish())}
            >
              {step === steps.length - 1 ? "Activate Protection" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionCard = ({ label, icon, selected, onClick }: { label: string; icon: React.ReactNode; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] text-left ${
      selected ? "border-primary bg-primary/5 shadow-card" : "border-border/60 bg-card hover:border-primary/30"
    }`}
  >
    <span className={selected ? "text-primary" : "text-muted-foreground"}>{icon}</span>
    <span className={`font-medium text-sm ${selected ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
  </button>
);

const CoverageCard = ({ name, premium, coverage, logic, selected, onClick, recommended }: {
  name: string; premium: string; coverage: string; logic: string; selected: boolean; onClick: () => void; recommended?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`relative w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
      selected ? "border-primary bg-primary/5 shadow-card-hover" : "border-border/60 bg-card hover:border-primary/30"
    }`}
  >
    {recommended && (
      <div className="absolute -top-3 right-6 px-3 py-1 rounded-full gradient-hero text-xs font-semibold text-primary-foreground">
        Recommended
      </div>
    )}
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-display font-semibold text-lg text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Up to {coverage} protection</p>
        <p className="text-xs text-primary/70 mt-0.5">{logic}</p>
      </div>
      <div className="text-right">
        <div className="font-display font-bold text-xl text-foreground">{premium}</div>
      </div>
    </div>
  </button>
);

export default Onboarding;
