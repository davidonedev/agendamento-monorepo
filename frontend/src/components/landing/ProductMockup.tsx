import { CalendarDays, Users, BarChart3, Contact, Settings, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Segment } from './content';

// Mockup ilustrativo da agenda do painel admin (dados fictícios, só visual).
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00'];
const ROW = 56; // px por hora

export default function ProductMockup({ segment }: { segment: Segment }) {
  const { business, pros, slots, newBooking } = segment.mockup;
  const Icon = segment.icon;
  const tone = segment.tone;

  return (
    <div className="relative mx-auto max-w-5xl" aria-hidden="true">
      <div className="hero-mockup relative rounded-2xl border border-landing-line bg-landing-surface/70 p-2 shadow-2xl shadow-landing-ink/10 backdrop-blur">
        <div className="overflow-hidden rounded-xl border border-landing-line bg-landing-surface">
          {/* barra da janela */}
          <div className="flex items-center gap-2 border-b border-landing-line px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-landing-ink/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-landing-ink/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-landing-ink/10" />
            <span className="ml-3 hidden rounded-md bg-landing-bg px-3 py-1 text-[11px] text-landing-muted sm:block">agendepro.com/admin/agenda</span>
          </div>

          <div className="flex">
            {/* sidebar */}
            <div className="hidden w-48 shrink-0 flex-col gap-1 border-r border-landing-line bg-landing-bg/60 p-3 md:flex">
              <div key={segment.id} className="seg-swap mb-3 flex items-center gap-2 px-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${tone.soft}`}>
                  <Icon className={`h-3 w-3 ${tone.text}`} />
                </span>
                <span className="truncate text-xs font-semibold text-landing-ink">{business}</span>
              </div>
              {[
                { icon: CalendarDays, label: 'Agenda', active: true },
                { icon: Users, label: 'Profissionais' },
                { icon: Contact, label: 'Clientes' },
                { icon: BarChart3, label: 'Faturamento' },
                { icon: Settings, label: 'Configurações' },
              ].map(({ icon: ItemIcon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${active ? 'bg-landing-surface font-medium text-landing-ink shadow-sm' : 'text-landing-muted'}`}>
                  <ItemIcon className="h-3.5 w-3.5" /> {label}
                </div>
              ))}
            </div>

            {/* agenda */}
            <div key={segment.id} className="seg-swap flex-1 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-landing-ink">Hoje</p>
                  <p className="text-[11px] text-landing-muted">{slots.length} agendamentos</p>
                </div>
                <span className="rounded-full bg-landing-petrol px-3 py-1 text-[11px] font-semibold text-white">+ Novo</span>
              </div>

              <div className="grid grid-cols-[44px_repeat(3,minmax(0,1fr))] gap-x-2">
                <div />
                {pros.map(p => (
                  <div key={p} className="pb-2 text-center text-[11px] font-medium text-landing-muted">{p}</div>
                ))}

                <div className="relative" style={{ height: ROW * HOURS.length }}>
                  {HOURS.map((h, i) => (
                    <span key={h} className="absolute left-0 text-[10px] text-landing-muted/70" style={{ top: i * ROW - 6 }}>{h}</span>
                  ))}
                </div>

                {pros.map((_, col) => (
                  <div key={col} className="relative rounded-lg border border-landing-line bg-landing-bg/50" style={{ height: ROW * HOURS.length }}>
                    {HOURS.slice(1).map((_, i) => (
                      <div key={i} className="absolute inset-x-0 border-t border-dashed border-landing-line" style={{ top: (i + 1) * ROW }} />
                    ))}
                    {slots.filter(s => s.col === col).map(s => (
                      <div
                        key={s.client}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 py-1 ${tone.soft} ${tone.border}`}
                        style={{ top: s.start * ROW + 2, height: s.span * ROW - 4 }}
                      >
                        <p className="truncate text-[11px] font-semibold text-landing-ink">{s.client}</p>
                        {s.span >= 0.75 && <p className="truncate text-[10px] text-landing-muted">{s.service}</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* cards flutuantes */}
      <div className="animate-float absolute -left-3 bottom-8 hidden w-60 rounded-2xl border border-landing-line bg-landing-surface/95 p-3.5 shadow-xl shadow-landing-ink/10 backdrop-blur-xl sm:block lg:-left-24 xl:-left-32">
        <div key={segment.id} className="seg-swap flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-landing-sage-light">
            <CheckCircle2 className="h-4 w-4 text-landing-sage-ink" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-landing-ink">Novo agendamento</p>
            <p className="mt-0.5 text-[11px] leading-snug text-landing-muted">
              {newBooking.client}, {newBooking.service}<br />{newBooking.when}
            </p>
          </div>
        </div>
      </div>

      <div className="animate-float-delayed absolute -right-3 bottom-10 hidden w-52 rounded-2xl border border-landing-line bg-landing-surface/95 p-4 shadow-xl shadow-landing-ink/10 backdrop-blur-xl sm:block lg:-right-16 xl:-right-24">
        <p className="text-[11px] text-landing-muted">Faturamento do mês</p>
        <p className="mt-1 font-display text-2xl font-bold text-landing-ink">R$ 18.420</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-landing-sage-ink">
          <TrendingUp className="h-3 w-3" /> 12% acima do mês passado
        </p>
        <div className="mt-3 flex h-10 items-end gap-1">
          {[40, 55, 35, 70, 60, 85, 100].map((h, i) => (
            <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-landing-petrol to-landing-lavender" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
