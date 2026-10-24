import { useReveal } from '@/hooks/useReveal';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import Benefits from '@/components/landing/Benefits';
import ForWho from '@/components/landing/ForWho';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import Faq from '@/components/landing/Faq';
import FinalCta from '@/components/landing/FinalCta';
import LandingFooter from '@/components/landing/LandingFooter';
import { SERVICE_TAGS } from '@/components/landing/content';

export default function LandingPage() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="min-h-screen overflow-x-clip bg-landing-bg font-landing text-landing-ink antialiased selection:bg-landing-lavender/50">
      <LandingNav />
      <main>
        <Hero />

        {/* Faixa de serviços */}
        <div className="border-y border-landing-line bg-landing-surface py-6">
          <p className="mb-4 text-center text-xs text-landing-muted">Do corte à limpeza de pele, cada serviço no seu tempo</p>
          <Marquee>
            {SERVICE_TAGS.map(tag => (
              <span key={tag} className="mx-6 flex items-center gap-6 whitespace-nowrap font-display text-lg font-semibold text-landing-ink/60">
                {tag}
                <span className="h-1.5 w-1.5 rounded-full bg-landing-lavender" aria-hidden="true" />
              </span>
            ))}
          </Marquee>
        </div>

        <Benefits />
        <ForWho />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
