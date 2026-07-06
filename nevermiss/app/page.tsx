import {
  Nav,
  Hero,
  Proof,
  HowItWorks,
  Roi,
  Pricing,
  Faq,
  CtaBand,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Proof />
        <HowItWorks />
        <Roi />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
