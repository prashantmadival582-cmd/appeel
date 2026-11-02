
import Navbar from "../Navbar";
import Footer from "../Footer";

import HomeHero from "./HomeHero";
import PricingSection from "./PricingSection";
import BenefitsSection from "./BenefitsSection";
import AboutSection from "./AboutSection";
import ContactSection from "./ContactSection";
import HomeAccess from "./HomeAccess";
import YourJourney from "./YourJourney";

function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="landing-page">
        <HomeHero />
        <PricingSection />
        <BenefitsSection />
        <YourJourney/>
        <AboutSection />
        
        <HomeAccess />
      </main>

      <Footer />
    </>
  );
}

export default LandingPage;
