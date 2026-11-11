import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEGMENTS } from './content';
import { CheckList, LpButton, Section } from './ui';

const demo = SEGMENTS[0];
const PROS = demo.mockup.pros;
const TIMES = ['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:00', '17:30'];
const BUSY = new Set(['09:30', '14:00']); // horários já ocupados no exemplo

const fmtDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' });
const fmtLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-2 font-bold">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-lp-black text-xs text-white" aria-hidden>{n}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

const choice = (active: boolean) => cn(
  'rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors',
  active ? 'border-lp-primary bg-lp-primary text-white' : 'border-lp-line bg-lp-white hover:border-lp-primary hover:text-lp-primary',
);

/** Demonstração interativa do fluxo que o cliente final usa (dados de exemplo). */
export default function BookingDemo() {
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; }), []);
  const [service, setService] = useState(0);
  const [pro, setPro] = useState(0);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const svc = demo.bookingMockup.services[service];
  const reset = () => { setTime(null); setDone(false); };

  return (
    <Section id="agendamento" tone="alt" labelledBy="demo-title">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="reveal space-y-5 lg:sticky lg:top-28">
          <h2 id="demo-title" className="lp-h2">Seu cliente agenda em quatro toques</h2>
          <p className="text-lp-muted">
            Serviço, profissional, dia e horário. Só aparecem horários em que o procedimento inteiro cabe, e a confirmação chega no WhatsApp.
          </p>
          <CheckList items={['Sem baixar aplicativo', 'Horários livres, ocupados e escolhido sempre à vista', 'Funciona no celular, a qualquer hora']} />
          <LpButton to="/signup" size="lg">Teste grátis</LpButton>
        </div>

        <div className="reveal rounded-lp-image bg-lp-white p-5 shadow-lp-card sm:p-8">
          <p className="mb-5 text-sm text-lp-muted">Demonstração com dados de exemplo · {demo.mockup.business}</p>
          <div className="space-y-6">
            <Step n={1} title="Serviço">
              <div className="flex flex-wrap gap-2">
                {demo.bookingMockup.services.map((s, i) => (
                  <button key={s.name} type="button" aria-pressed={service === i} onClick={() => { setService(i); reset(); }} className={choice(service === i)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={2} title="Profissional">
              <div className="flex flex-wrap gap-2">
                {PROS.map((p, i) => (
                  <button key={p} type="button" aria-pressed={pro === i} onClick={() => { setPro(i); reset(); }} className={cn(choice(pro === i), 'flex items-center gap-2 pl-2')}>
                    <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-xs', pro === i ? 'bg-white text-lp-primary' : 'bg-lp-primary-soft text-lp-primary')} aria-hidden>{p[0]}</span>
                    {p}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={3} title="Dia">
              <div className="grid grid-cols-5 gap-2">
                {days.map((d, i) => (
                  <button
                    key={d.toISOString()}
                    type="button"
                    aria-pressed={day === i}
                    aria-label={fmtLong.format(d)}
                    onClick={() => { setDay(i); reset(); }}
                    className={cn('rounded-xl border-2 py-3 text-xs font-bold capitalize transition-colors', day === i ? 'border-lp-primary bg-lp-primary text-white' : 'border-lp-line hover:border-lp-primary')}
                  >
                    {fmtDay.format(d).replace('.', '')}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={4} title="Horário">
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map(t => {
                  const busy = BUSY.has(t);
                  const selected = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={busy}
                      aria-pressed={selected}
                      aria-label={busy ? `${t}, indisponível` : t}
                      onClick={() => { setTime(t); setDone(false); }}
                      className={cn(
                        'rounded-xl border-2 py-2.5 text-sm font-bold transition-colors',
                        busy && 'cursor-not-allowed border-transparent bg-lp-line text-lp-muted line-through',
                        !busy && !selected && 'border-lp-success bg-lp-success-soft text-lp-success-ink hover:bg-lp-success hover:text-lp-black',
                        selected && 'border-lp-primary bg-lp-primary text-white',
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-lp-muted" aria-label="Legenda">
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-lp-success" aria-hidden />Disponível</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-lp-primary" aria-hidden />Selecionado</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-lp-line" aria-hidden />Indisponível</li>
              </ul>
            </Step>

            {time && (
              <div className="lp-fade space-y-4 rounded-lp-card bg-lp-alt p-5" aria-live="polite">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-lp-muted">Serviço</dt><dd className="font-bold">{svc.name} · {svc.duration}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-lp-muted">Com</dt><dd className="font-bold">{PROS[pro]}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-lp-muted">Quando</dt><dd className="font-bold capitalize">{fmtLong.format(days[day])}, {time}</dd></div>
                  <div className="flex justify-between gap-4 border-t border-lp-line pt-2"><dt className="font-bold">Total</dt><dd className="font-extrabold text-lp-primary">{svc.price}</dd></div>
                </dl>
                {done ? (
                  <p role="status" className="flex items-center gap-2 rounded-xl bg-lp-success-soft px-4 py-3 font-bold text-lp-success-ink">
                    <CheckCircle2 className="h-5 w-5" aria-hidden /> Agendamento confirmado!
                  </p>
                ) : (
                  <button type="button" onClick={() => setDone(true)} className="h-12 w-full rounded-full bg-lp-primary text-sm font-bold uppercase tracking-[0.05em] text-white transition-colors hover:bg-lp-primary-hover active:bg-lp-primary-active">
                    Confirmar agendamento
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
