import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
// import { DemoScreenshots } from "./components/DemoScreenshots";
// import { Testimonials } from "./components/Testimonials";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        {/* <DemoScreenshots />
        <Testimonials /> */}
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
