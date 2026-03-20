import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScooterAnimation } from "@/components/landing/ScooterAnimation";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ParametricSection } from "@/components/landing/ParametricSection";
import { AdversarialDefenseSection } from "@/components/landing/AdversarialDefenseSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ScooterAnimation />
        <ProblemSection />
        <FeaturesSection />
        <PersonaSection />
        <HowItWorksSection />
        <ParametricSection />
        <AdversarialDefenseSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
