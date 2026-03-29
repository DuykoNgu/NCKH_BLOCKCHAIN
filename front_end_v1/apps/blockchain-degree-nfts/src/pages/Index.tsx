import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import ProcessSection from "@/components/ProcessSection";
import BenefitsSection from "@/components/BenefitsSection";
import FooterSection from "@/components/FooterSection";
import { TrongDongDivider } from "@/components/TrongDongPattern";

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
