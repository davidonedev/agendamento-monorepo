import { useEffect, useState } from 'react';
import { BadgePercent, ChevronDown, Gift, MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Carousel from './Carousel';
import Devices from './Devices';
import ProfessionalsCollage from './ProfessionalsCollage';
import { LpButton } from './ui';
import { ANNUAL_DISCOUNT } from './content';


/** Indicador de rolagem: seta animada fixa no pé da tela, só enquanto o usuário está no topo. */
function ScrollHint() {
  const reduce = useReducedMotion();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href="#para-quem"
      tabIndex={atTop ? 0 : -1}
      aria-hidden={!atTop}
      className={`fixed bottom-5 [html[data-cookie-notice=open]_&]:bottom-44 sm:[html[data-cookie-notice=open]_&]:bottom-28 lg:[html[data-cookie-notice=open]_&]:bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full text-white transition-opacity duration-500 ${atTop ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <span className="hidden rounded-full bg-lp-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] shadow-lg sm:block">Role para ver mais</span>
      <motion.span
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-lp-primary shadow-lg"
        animate={reduce ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-5 w-5" aria-hidden />
        <span className="sr-only">Rolar para a próxima seção</span>
      </motion.span>
    </a>
  );
}

/** Vantagens do slide 3: só o que o produto já oferece (ver FAQ e Pricing). */
const ADVANTAGES = [
  { icon: Gift, title: 'Trial gratuito', text: 'Comece sem cartão de crédito.' },
  { icon: BadgePercent, title: 'R$ 0 por agendamento', text: 'Só a mensalidade fixa, sem taxa por cliente.' },
  { icon: MessageCircle, title: 'Confirmação no WhatsApp', text: 'Menos faltas, sem ligar para ninguém.' },
];

/** Visual do slide 3: promoção do plano anual + vantagens para o profissional. */
function PromoCard() {
  return (
    <div className="relative mx-auto w-full max-w-md pt-10 lg:max-w-lg">
      <div className="absolute right-3 top-0 z-10 flex h-28 w-28 rotate-[10deg] flex-col items-center justify-center rounded-full bg-lp-success text-lp-black shadow-2xl sm:right-6" aria-hidden>
        <span className="text-4xl font-extrabold leading-none">{ANNUAL_DISCOUNT * 100}%</span>
        <span className="mt-1 text-[11px] font-bold uppercase leading-tight tracking-[0.05em]">off no<br />plano anual</span>
      </div>

      <div className="rounded-lp-image bg-lp-white p-7 pt-9 text-lp-black shadow-2xl sm:p-8 sm:pt-10">
        <p className="text-sm font-bold uppercase tracking-[0.05em] text-lp-primary">Vantagens para começar</p>
        <ul className="mt-6 space-y-5">
          {ADVANTAGES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lp-primary-soft text-lp-primary" aria-hidden>
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-extrabold leading-tight">{title}</p>
                <p className="text-sm text-lp-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    id: 'agenda-cheia',
    title: 'Agenda cheia, menos faltas e clientes que voltam',
    text: 'Coloque o link na bio: cada cliente escolhe o profissional e marca o horário. Você abre o painel e já sabe quem chega.',
    primary: { label: 'Teste grátis', to: '/signup' },
    secondary: { label: 'Ver como funciona', href: '#agendamento' },
    visual: <Devices />,
  },
  {
    id: 'painel',
    title: 'Sua agenda do dia, em um só painel',
    text: 'Equipe, clientes e faturamento juntos. Sem caderno, sem planilha e sem horário perdido no WhatsApp.',
    primary: { label: 'Ver recursos', href: '#recursos' },
    secondary: undefined,
    visual: <ProfessionalsCollage />,
  },
  {
    id: 'promocao',
    title: `Teste grátis e economize ${ANNUAL_DISCOUNT * 100}% no plano anual`,
    text: 'Comece no Trial gratuito, sem cartão e sem cobrança por agendamento. Gostou? O plano anual sai mais barato.',
    primary: { label: 'Teste grátis', to: '/signup' },
    secondary: { label: 'Ver planos', href: '#planos' },
    visual: <PromoCard />,
  },
];

export default function Hero() {
  return (
    <section id="inicio" aria-label="Destaques" className="lp-on-dark lp-hero-bg relative isolate overflow-hidden text-white">
      <div className="mx-auto w-full px-5 py-12 sm:px-8 lg:py-20" style={{ maxWidth: 'var(--container-max)' }}>
        <Carousel label="Destaques do AgendePro" autoPlayMs={8000} onDark>
          {SLIDES.map((s, i) => {
            const Heading = i === 0 ? 'h1' : 'h2';
            return (
              <div key={s.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="space-y-6">
                  <Heading className="lp-h1">{s.title}</Heading>
                  <p className="max-w-lg text-lg text-white/90">{s.text}</p>
                  <div className="flex flex-wrap gap-3">
                    <LpButton variant="light" size="lg" to={'to' in s.primary ? s.primary.to : undefined} href={'href' in s.primary ? s.primary.href : undefined}>
                      {s.primary.label}
                    </LpButton>
                    {s.secondary && <LpButton variant="ghost-light" size="lg" href={s.secondary.href}>{s.secondary.label}</LpButton>}
                  </div>
                  {i === 0 && (
                    <p className="text-sm text-white/90">Comece grátis · Sem cartão de crédito · Cancele quando quiser</p>
                  )}
                </div>
                <div className="flex justify-center lg:justify-end">{s.visual}</div>
              </div>
            );
          })}
        </Carousel>
      </div>
      <ScrollHint />
    </section>
  );
}
