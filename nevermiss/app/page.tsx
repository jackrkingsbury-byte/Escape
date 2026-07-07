import {
  Nav,
  Hero,
  Proof,
  Problem,
  HowItWorks,
  Comparison,
  DemoBand,
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
        <Problem />
        <HowItWorks />
        <Comparison />
        <DemoBand />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
