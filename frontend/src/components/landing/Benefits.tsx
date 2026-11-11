import { ArrowRight } from 'lucide-react';
import { Spotlight } from '@/components/aceternity/spotlight';

/** Cards de "Vantagens e recursos": só descrevem recursos que o sistema já tem. */
const SOLUTIONS = [
  {
    title: 'O básico, bem feito',
    text: 'Agenda online, serviços com a duração certa e a ficha de cada cliente no mesmo lugar. Menos improviso, mais tempo para atender.',
    items: ['Agenda online 24h', 'Serviços com duração e preço', 'Ficha e histórico de clientes', 'Link próprio do negócio'],
  },
  {
    title: 'Bora organizar o caixa',
    text: 'Acompanhe o faturamento do dia, da semana e do mês, por serviço e por profissional, sem planilha paralela nem conta de cabeça.',
    items: ['Faturamento por período', 'Receita por profissional', 'Receita por serviço', 'Produtos e estoque'],
  },
  {
    title: 'Conversa que fideliza',
    text: 'O cliente recebe a confirmação no WhatsApp e você chama de volta quem sumiu, com uma mensagem pronta e um clique.',
    items: ['Confirmação automática no WhatsApp', 'Quem não volta há 30, 60 ou 90 dias', 'Mensagem de retorno pronta', 'Link para Instagram, WhatsApp e Google'],
  },
  {
    title: 'Para crescer sem bagunça',
    text: 'Equipe maior? Cada profissional entra com login e agenda próprios, e você acompanha tudo de um painel só.',
    items: ['Login para cada profissional', 'Agenda separada por profissional', 'Mais profissionais conforme o plano', 'Visão completa para o dono'],
  },
];

/** Ilustração decorativa no canto: tablet com agenda sobre uma mancha verde. */
function Decoration() {
  const cols = [
    ['bg-lp-primary', 'bg-lp-success', 'bg-lp-primary'],
    ['bg-lp-success', 'bg-lp-primary', 'bg-lp-success'],
    ['bg-lp-primary', 'bg-lp-primary', 'bg-lp-success'],
  ];
  return (
    <div className="pointer-events-none absolute right-6 top-0 hidden h-40 w-[22rem] md:block lg:right-16" aria-hidden>
      <div className="absolute inset-x-6 bottom-0 top-8 rounded-[120px_24px_32px_32px] bg-lp-success" />
      <div className="absolute left-14 top-[-2.25rem] w-60 rotate-[-8deg] rounded-2xl border-[7px] border-lp-black bg-lp-white p-3 shadow-2xl">
        <div className="mb-2 flex gap-1.5"><span className="h-2 w-10 rounded-full bg-lp-line" /><span className="h-2 w-6 rounded-full bg-lp-line" /></div>
        <div className="grid grid-cols-3 gap-2">
          {cols.map((c, i) => (
            <div key={i} className="space-y-2">
              {c.map((tone, j) => <span key={j} className={`block rounded-md ${tone} ${j === 1 ? 'h-10' : 'h-6'}`} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "Benefícios e soluções" da referência: painel colorido com cartões brancos em colunas. */
export default function Benefits() {
  return (
    <section id="beneficios" aria-labelledby="benefits-title" className="px-3 py-6 sm:px-5 sm:py-10">
      <div className="lp-on-dark relative mx-auto max-w-[1400px] overflow-hidden rounded-lp-image bg-lp-primary px-5 pb-12 pt-14 text-white sm:px-10 lg:pb-16 lg:pt-16">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-48" fill="white" />
        <Decoration />

        <div className="relative z-[2] mx-auto max-w-[1100px]">
          <div className="flex items-center gap-4">
            <h2 id="benefits-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">Vantagens e recursos</h2>
            <span className="hidden items-center gap-2 sm:flex" aria-hidden>
              <span className="h-px w-16 bg-white" /><span className="text-xs">✦</span><span className="h-px w-16 bg-white" />
            </span>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {SOLUTIONS.map((s, i) => (
              <li key={s.title} className="reveal flex" style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
                <article className="flex w-full flex-col rounded-lp-card bg-lp-white p-6 text-lp-black shadow-lp-card">
                  <h3 className="text-xl font-bold leading-tight">{s.title}</h3>
                  <p className="mt-4 text-[13px] leading-[1.65]">{s.text}</p>
                  <ul className="mt-5 flex-1 space-y-1.5 text-[13px]">
                    {s.items.map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-px text-[10px] text-lp-primary" aria-hidden>✦</span>{item}
                      </li>
                    ))}
                  </ul>
                  <a href="#recursos" className="group mt-8 inline-flex items-center gap-2 py-1 text-xs font-extrabold uppercase tracking-[0.05em]">
                    Saiba mais <span className="sr-only">sobre {s.title}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </a>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
