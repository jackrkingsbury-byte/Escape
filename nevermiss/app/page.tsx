import {
  Nav,
  Hero,
  TradesBar,
  Proof,
  Problem,
  HowItWorks,
  Comparison,
  DemoBand,
  Pricing,
  Guarantee,
  Faq,
  FounderNote,
  CtaBand,
  Footer,
  StickyMobileCta,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="pb-20 sm:pb-0">
        <Hero />
        <TradesBar />
        <Proof />
        <Problem />
        <HowItWorks />
        <Comparison />
        <DemoBand />
        <Pricing />
        <Guarantee />
        <Faq />
        <FounderNote />
        <CtaBand />
      </main>
      <Footer />
      <StickyMobileCta />
    </>
  );
}
