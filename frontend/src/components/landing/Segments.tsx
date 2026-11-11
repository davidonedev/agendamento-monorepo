import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AUDIENCES, SEGMENT_BULLETS, type SegmentId } from './content';
import { Section } from './ui';

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const SEGMENT_IMAGES: Record<SegmentId, string> = {
  barbearia: IMG('1503951914875-452162b0f3f1'),
  salao:     IMG('1522337360788-8b13dee7a37e'),
  estetica:  IMG('1570172619644-dfd03ed5d881'),
  autonomo:  IMG('1604654894610-df63bc536371'),
};

/** Texto curto de cada card (tom próximo e direto). */
const SEGMENT_TEXT: Record<SegmentId, string> = {
  barbearia: 'Bora dar um up na sua barbearia: o cliente marca pelo link da bio, escolhe o barbeiro e você abre o painel já sabendo quem chega. Menos mensagem, mais cadeira ocupada.',
  salao:     'Coloração de 3 horas e escova de 40 minutos na mesma agenda, cada serviço com o tempo certo. Sem encaixe na pressa e sem conflito de horário.',
  estetica:  'Cada procedimento com duração própria, histórico completo da cliente e retornos organizados. Tudo no mesmo painel, sem caderno e sem planilha.',
  autonomo:  'Atendendo sozinha? Coloque o link no WhatsApp e deixe a cliente marcar, escolher o serviço e receber a confirmação, sem você parar o atendimento.',
};

/** Títulos curtos (uma linha) dos cards. */
const TITLE: Record<SegmentId, string> = {
  barbearia: 'Barbearias',
  salao:     'Salões de beleza',
  estetica:  'Estética',
  autonomo:  'Autônomos',
};

const LINK_LABEL: Record<SegmentId, string> = {
  barbearia: 'barbearias',
  salao:     'salões de beleza',
  estetica:  'clínicas de estética',
  autonomo:  'profissionais autônomos',
};

interface SegmentCard {
  id: string;
  title: string;
  text: string;
  bullets: string[];
  linkLabel: string;
  image: string;
  alt: string;
  /** Enquadramento da foto no corte 3:2 (padrão: centro). */
  imagePosition?: string;
}

/** Os mesmos profissionais do banner do topo: lash design e manicure. */
const EXTRA_CARDS: SegmentCard[] = [
  {
    id: 'lash',
    title: 'Lash design',
    text: 'Cada técnica de cílios com a duração certa, e a cliente escolhe o horário pelo link, sem mensagem de vai e vem. Manutenções e retornos organizados no mesmo painel.',
    bullets: ['Duração própria para cada técnica', 'Cliente agenda pelo link, sem mensagem', 'Retornos de manutenção na agenda'],
    linkLabel: 'lash designers',
    image: IMG('1772236617396-2f8460293c07'),
    alt: 'Lash designer aplicando extensão de cílios em uma cliente',
    imagePosition: '50% 20%',
  },
  {
    id: 'manicure',
    title: 'Manicure',
    text: 'Manicure, pedicure e unhas em gel na mesma agenda, cada serviço com o tempo certo. A cliente marca sozinha e você atende sem olhar o celular.',
    bullets: ['Manicure, pedicure e gel com duração real', 'Link para o WhatsApp e o Instagram', 'Confirmação automática para a cliente'],
    linkLabel: 'manicures',
    image: IMG('1690749138086-7422f71dc159'),
    alt: 'Manicure passando esmalte nas unhas de uma cliente',
  },
];

const CARDS: SegmentCard[] = [
  ...AUDIENCES.filter(a => a.segment !== 'autonomo').map(a => ({
    id: a.segment,
    title: TITLE[a.segment],
    text: SEGMENT_TEXT[a.segment],
    bullets: SEGMENT_BULLETS[a.segment],
    linkLabel: LINK_LABEL[a.segment],
    image: SEGMENT_IMAGES[a.segment],
    alt: a.imageHint,
  })),
  ...EXTRA_CARDS,
];

/**
 * Título de posicionamento + cards por segmento (foto, título, texto, 3 itens e link).
 * Mostra 3 cards por vez (2 no tablet, 1 no celular); os demais ficam à direita:
 * seta, rolagem lateral ou swipe.
 */
export default function Segments() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setEdge({ start: t.scrollLeft <= 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    update();
    t.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { t.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [update]);

  const scrollByCard = (dir: 1 | -1) => {
    const t = trackRef.current;
    const first = t?.children[0] as HTMLElement | undefined;
    if (!t || !first) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({ left: dir * (first.getBoundingClientRect().width + gap), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const arrow = 'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-lp-primary text-lp-primary transition-colors hover:bg-lp-primary-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <Section id="para-quem" labelledBy="segments-title">
      <div className="reveal flex items-end justify-between gap-6">
        <h2 id="segments-title" className="lp-h2 max-w-3xl">
          Sistema de agendamento para todo tipo de negócio de beleza e bem-estar
        </h2>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" className={arrow} aria-label="Ver segmentos anteriores" onClick={() => scrollByCard(-1)} disabled={edge.start}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" className={arrow} aria-label="Ver mais segmentos" onClick={() => scrollByCard(1)} disabled={edge.end}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Segmentos atendidos (role para o lado para ver todos)"
        className="reveal mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-primary focus-visible:ring-offset-4 lg:mt-14 [&::-webkit-scrollbar]:hidden"
      >
        {CARDS.map(c => (
          <li
            key={c.id}
            className={cn('flex shrink-0 snap-start basis-full sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]')}
          >
            <article id={`seg-${c.id}`} aria-labelledby={`seg-title-${c.id}`} className="flex w-full scroll-mt-28 flex-col">
              <img
                src={c.image}
                alt={c.alt}
                loading="lazy"
                className="aspect-[3/2] w-full rounded-[14px_14px_64px_14px] object-cover"
                style={c.imagePosition ? { objectPosition: c.imagePosition } : undefined}
              />

              <h3 id={`seg-title-${c.id}`} className="mt-6 text-[1.375rem] font-bold leading-tight">{c.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-[1.65]">{c.text}</p>

              <ul className="mt-6 space-y-1.5 text-sm">
                {c.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-px text-xs text-lp-primary" aria-hidden>✦</span>
                    {b}
                  </li>
                ))}
              </ul>

              <a href="#recursos" className="group mt-6 inline-flex items-center gap-1.5 py-1 text-sm font-bold text-lp-primary">
                <span className="underline-offset-4 group-hover:underline">Soluções para {c.linkLabel}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </a>
            </article>
          </li>
        ))}
      </ul>

      {/* No celular as setas ficam abaixo dos cards */}
      <div className="mt-6 flex justify-end gap-2 sm:hidden">
        <button type="button" className={arrow} aria-label="Ver segmentos anteriores" onClick={() => scrollByCard(-1)} disabled={edge.start}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" className={arrow} aria-label="Ver mais segmentos" onClick={() => scrollByCard(1)} disabled={edge.end}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </Section>
  );
}
