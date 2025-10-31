import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { CookieConsentBanner } from "./components/CookieConsentBanner";

export default function App() {
  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
