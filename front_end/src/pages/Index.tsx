import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ProcessSection from "@/components/landing/ProcessSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FooterSection from "@/components/landing/FooterSection";
import { TrongDongDivider } from "@/components/landing/TrongDongPattern";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TrongDongDivider />
      <ProblemSection />
      <TrongDongDivider />
      <SolutionSection />
      <TrongDongDivider />
      <ProcessSection />
      <TrongDongDivider />
      <BenefitsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
