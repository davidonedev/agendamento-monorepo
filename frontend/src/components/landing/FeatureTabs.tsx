import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Link2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURES, FEATURE_TAB_LABELS, SEGMENTS } from './content';
import { LpButton, Section } from './ui';

const barbearia = SEGMENTS[0];

// ── Visuais de cada aba (ilustrativos) ────────────────────────────────────────
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full space-y-3 rounded-lp-image bg-lp-primary-soft p-6 sm:p-8" aria-hidden>{children}</div>
);

function BookingVisual() {
  return (
    <Panel>
      <p className="flex items-center gap-2 rounded-xl bg-lp-white px-4 py-2.5 text-sm text-lp-black/70"><Link2 className="h-4 w-4 text-lp-primary" />agendepro.com/<b className="text-lp-black">seu-negocio</b></p>
      <p className="text-sm text-lp-black/70">Horários livres no sábado</p>
      <div className="grid grid-cols-4 gap-2">
        {['09:00', '09:30', '10:30', '11:00', '13:30', '14:00', '15:30', '16:00'].map((h, i) => (
          <span key={h} className={cn('rounded-lg py-2 text-center text-sm font-bold', i === 4 ? 'bg-lp-primary text-white' : 'bg-lp-success-soft text-lp-success-ink')}>{h}</span>
        ))}
      </div>
    </Panel>
  );
}

function ConfirmVisual() {
  return (
    <Panel>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-lp-success-soft p-4 text-sm text-lp-black">
        <p className="mb-1 flex items-center gap-1.5 font-bold text-lp-success-ink"><MessageCircle className="h-4 w-4" />WhatsApp</p>
        Oi, Lucas! Seu horário está confirmado: {barbearia.bookingMockup.confirmedBooking}.
      </div>
      <p className="text-center text-xs text-lp-black/70">Enviado assim que o cliente agenda</p>
    </Panel>
  );
}

function TeamVisual() {
  return (
    <Panel>
      {barbearia.mockup.pros.map((p, i) => (
        <div key={p} className="flex items-center gap-3 rounded-xl bg-lp-white px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lp-primary font-bold text-white">{p[0]}</span>
          <div><p className="font-bold">{p}</p><p className="text-sm text-lp-black/70">{barbearia.mockup.slots.filter(s => s.col === i).length} agendamentos hoje</p></div>
        </div>
      ))}
    </Panel>
  );
}

function RevenueVisual() {
  const bars = [{ name: 'Carlos', v: 92 }, { name: 'Diego', v: 76 }, { name: 'Rafa', v: 58 }];
  return (
    <Panel>
      {bars.map(b => (
        <div key={b.name}>
          <div className="mb-1 flex justify-between text-sm"><span className="font-bold">{b.name}</span><span className="text-lp-black/70">{b.v}%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-lp-white"><div className="h-full rounded-full bg-lp-primary" style={{ width: `${b.v}%` }} /></div>
        </div>
      ))}
      <p className="pt-1 text-xs text-lp-black/70">Exemplo: participação de cada profissional no mês</p>
    </Panel>
  );
}

function ServicesVisual() {
  return (
    <Panel>
      {barbearia.bookingMockup.services.map(s => (
        <div key={s.name} className="flex items-center justify-between rounded-xl bg-lp-white px-4 py-3">
          <div><p className="font-bold">{s.name}</p><p className="text-sm text-lp-black/70">{s.duration}</p></div>
          <span className="font-extrabold text-lp-primary">{s.price}</span>
        </div>
      ))}
    </Panel>
  );
}

function ReturnVisual() {
  const rows = [{ n: 'Marcos T.', s: 'Corte + barba', d: '34 dias' }, { n: 'Renata P.', s: 'Coloração', d: '52 dias' }, { n: 'Aline G.', s: 'Limpeza de pele', d: '41 dias' }];
  return (
    <Panel>
      <p className="text-sm text-lp-black/70">Sem visita há mais de 30 dias</p>
      {rows.map(r => (
        <div key={r.n} className="flex items-center justify-between gap-3 rounded-xl bg-lp-white px-4 py-3">
          <div className="min-w-0"><p className="truncate font-bold">{r.n}</p><p className="truncate text-sm text-lp-black/70">{r.s}, há {r.d}</p></div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lp-success px-3 py-1 text-xs font-bold text-lp-black"><MessageCircle className="h-3.5 w-3.5" />Chamar</span>
        </div>
      ))}
    </Panel>
  );
}

const VISUALS = [BookingVisual, ConfirmVisual, TeamVisual, RevenueVisual, ServicesVisual, ReturnVisual];

/** "Outros benefícios" da referência: abas com imagem + texto + botão. Radix cuida de setas, Home/End e aria. */
export default function FeatureTabs() {
  return (
    <Section id="recursos" tone="alt" labelledBy="features-title">
      <h2 id="features-title" className="lp-h2 reveal text-center">Tudo o que o seu negócio precisa</h2>

      <TabsPrimitive.Root defaultValue="0" className="mt-10">
        <TabsPrimitive.List aria-label="Recursos do Nimbo" className="flex gap-2 overflow-x-auto pb-2 lg:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FEATURES.map((f, i) => (
            <TabsPrimitive.Trigger
              key={f.title}
              value={String(i)}
              className="shrink-0 rounded-full border-2 border-lp-line bg-lp-white px-5 py-2.5 text-sm font-bold transition-colors hover:border-lp-primary hover:text-lp-primary data-[state=active]:border-lp-primary data-[state=active]:bg-lp-primary data-[state=active]:text-white"
            >
              {FEATURE_TAB_LABELS[i] ?? f.title}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {FEATURES.map((f, i) => {
          const Visual = VISUALS[i] ?? BookingVisual;
          const Icon = f.icon;
          return (
            <TabsPrimitive.Content key={f.title} value={String(i)} className="lp-fade mt-10 grid items-center gap-8 data-[state=inactive]:hidden lg:grid-cols-2 lg:gap-16">
              <Visual />
              <div className="space-y-5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-lp-primary text-white" aria-hidden><Icon className="h-6 w-6" /></span>
                <h3 className="lp-h3">{f.title}</h3>
                <p className="text-lp-muted">{f.description}</p>
                <LpButton to="/signup">Teste grátis</LpButton>
              </div>
            </TabsPrimitive.Content>
          );
        })}
      </TabsPrimitive.Root>
    </Section>
  );
}
