import { GuestDemo } from "./GuestDemo";
import { LandingFooter, LandingHeader } from "./landing/Chrome";
import { HeroStory } from "./landing/HeroStory";
import { Download, HowItWorks, Languages, Privacy, SpecStrip, Tools } from "./landing/Sections";

export function App() {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <LandingHeader />
      <main id="main" tabIndex={-1}>
        <HeroStory />
        <SpecStrip />
        <HowItWorks />
        <Privacy />
        <Tools />
        <Languages />
        <GuestDemo />
        <Download />
      </main>
      <LandingFooter />
    </div>
  );
}
