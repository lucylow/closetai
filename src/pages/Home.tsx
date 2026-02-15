import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import InteractiveDemo from "@/components/InteractiveDemo";
import HowItWorks from "@/components/HowItWorks";
import StatsSection from "@/components/StatsSection";
import ImpactDashboard from "@/components/impact/ImpactDashboard";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="page home">
      <HeroSection />
      <FeaturesSection />
      <InteractiveDemo />
      <HowItWorks />
      <StatsSection />
      <ImpactDashboard />
      <Footer />
    </div>
  );
};

export default Home;
