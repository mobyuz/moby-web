import { GuestDemo } from "./GuestDemo";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { HeroStory } from "./landing/HeroStory";
import { Download } from "./landing/Download";
import { HowItWorks, Languages, Privacy, SpecStrip, Tools } from "./landing/Sections";

export function App() {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader home />
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
      <SiteFooter home />
    </div>
  );
}
