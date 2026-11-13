import { useReveal } from '@/hooks/useReveal';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Segments from '@/components/landing/Segments';
import BookingDemo from '@/components/landing/BookingDemo';
import FeatureTabs from '@/components/landing/FeatureTabs';
import Benefits from '@/components/landing/Benefits';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import Faq from '@/components/landing/Faq';
import { CtaStrip, FinalCta, MidCta } from '@/components/landing/Ctas';
import LandingFooter from '@/components/landing/LandingFooter';
import StickyCta from '@/components/landing/StickyCta';
import CookieNotice from '@/components/landing/CookieNotice';

/**
 * Ritmo (referência: negocios.trinks.com): hero → segmentos → painel de benefícios → CTA → demo de agendamento →
 * abas de recursos → CTA → números → como começar → planos → FAQ → CTA final.
 */
export default function LandingPage() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="lp-root min-h-screen overflow-x-clip selection:bg-lp-primary/20">
      <a href="#conteudo" className="sr-only z-[60] rounded-full bg-lp-white px-5 py-3 font-bold text-lp-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
      <LandingNav />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero />
        <Segments />
        <Benefits />
        <CtaStrip />
        <BookingDemo />
        <FeatureTabs />
        <MidCta />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyCta />
      <CookieNotice />
    </div>
  );
}
