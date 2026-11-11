import { CalendarDays, Contact, BarChart3, Users } from 'lucide-react';
import { SEGMENTS } from './content';

const demo = SEGMENTS[0].mockup;

/** Horário de início do mockup (agenda começa às 09:00). */
const timeOf = (start: number) => `${String(9 + Math.floor(start)).padStart(2, '0')}:${String(Math.round((start % 1) * 60)).padStart(2, '0')}`;

const HOUR = 7.2; // altura de 1h na agenda do notebook, em cqw

/** Tela do notebook: agenda do dia por profissional (dados ilustrativos). */
function LaptopScreen() {
  return (
    <div className="flex h-full text-lp-black">
      <div className="flex w-[11%] flex-col items-center gap-[1.6cqw] bg-lp-primary py-[1.8cqw]">
        {[CalendarDays, Users, Contact, BarChart3].map((Icon, i) => (
          <Icon key={i} className={`h-[1.7cqw] w-[1.7cqw] ${i === 0 ? 'text-white' : 'text-white/60'}`} />
        ))}
      </div>
      <div className="flex-1 p-[1.8cqw]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[1.9cqw] font-extrabold leading-tight">Agenda de hoje</p>
            <p className="text-[1.15cqw] text-lp-muted">{demo.slots.length} agendamentos · {demo.business}</p>
          </div>
          <span className="rounded-full bg-lp-primary px-[1.3cqw] py-[0.5cqw] text-[1.05cqw] font-bold uppercase tracking-[0.05em] text-white">+ Novo</span>
        </div>
        <div className="mt-[1.4cqw] grid grid-cols-3 gap-[1cqw]">
          {demo.pros.map((pro, col) => (
            <div key={pro}>
              <p className="mb-[0.6cqw] text-center text-[1.15cqw] font-bold text-lp-muted">{pro}</p>
              <div className="relative rounded-[0.8cqw] bg-lp-alt" style={{ height: `${HOUR * 4.3}cqw` }}>
                {demo.slots.filter(s => s.col === col).map((s, i) => (
                  <div
                    key={s.client}
                    className={`absolute inset-x-[0.5cqw] overflow-hidden rounded-[0.6cqw] border-l-[0.4cqw] px-[0.8cqw] py-[0.4cqw] ${(col + i) % 2 === 0 ? 'border-lp-primary bg-lp-primary-soft' : 'border-lp-success bg-lp-success-soft'}`}
                    style={{ top: `${s.start * HOUR + 0.4}cqw`, height: `${Math.max(s.span * HOUR - 0.8, 3.6)}cqw` }}
                  >
                    <p className="truncate text-[1.1cqw] font-bold leading-tight">{s.client}</p>
                    <p className="truncate text-[0.95cqw] text-lp-black/70">{s.service}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tela do iPhone: "Meus agendamentos" com status confirmado. */
function PhoneScreen() {
  const items = demo.slots.slice(0, 3);
  return (
    <div className="flex h-full flex-col px-[1.7cqw] pb-[1.4cqw] pt-[4.6cqw] text-lp-black">
      <p className="text-[2.1cqw] font-extrabold leading-tight">Meus agendamentos</p>
      <p className="text-[1.25cqw] text-lp-muted">Hoje · {demo.business}</p>
      <div className="mt-[1.6cqw] space-y-[1.2cqw]">
        {items.map(s => (
          <div key={s.client} className="rounded-[1.4cqw] bg-lp-alt p-[1.3cqw]">
            <div className="flex items-center justify-between">
              <span className="text-[2cqw] font-extrabold">{timeOf(s.start)}</span>
              <span className="rounded-full bg-lp-success-soft px-[1cqw] py-[0.3cqw] text-[1cqw] font-bold text-lp-success-ink">Confirmado</span>
            </div>
            <p className="mt-[0.4cqw] text-[1.3cqw] font-bold">{s.service}</p>
            <p className="text-[1.1cqw] text-lp-muted">com {demo.pros[s.col]}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-around pt-[1.2cqw]">
        {[CalendarDays, Users, Contact].map((Icon, i) => (
          <Icon key={i} className={`h-[2.1cqw] w-[2.1cqw] ${i === 0 ? 'text-lp-primary' : 'text-lp-muted'}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * iPhone ao lado de um notebook, ambos mostrando os agendamentos (ilustração em CSS, dados de exemplo).
 * Tudo usa unidades de container (cqw): escala sozinho em qualquer largura.
 */
export default function Devices() {
  return (
    <div
      role="img"
      aria-label="Agenda do AgendePro no notebook e os agendamentos do cliente no celular"
      className="relative mx-auto aspect-[1.32/1] w-full max-w-[640px] [container-type:inline-size]"
    >
      {/* notebook */}
      <div className="absolute left-0 top-[2%] w-[80%]" aria-hidden>
        <div className="aspect-[16/10] overflow-hidden rounded-[1.5cqw] border-[0.8cqw] border-lp-black bg-lp-white shadow-2xl">
          <LaptopScreen />
        </div>
        <div className="mx-auto -mt-px h-[1.7cqw] w-[106%] -translate-x-[3%] rounded-b-[2.2cqw] bg-lp-line shadow-xl" />
      </div>

      {/* iPhone */}
      <div className="absolute bottom-0 right-0 w-[28%]" aria-hidden>
        <div className="relative aspect-[9/19] overflow-hidden rounded-[4cqw] border-[0.75cqw] border-lp-black bg-lp-white shadow-2xl">
          <span className="absolute left-1/2 top-[1.1cqw] z-10 h-[1.5cqw] w-[6.5cqw] -translate-x-1/2 rounded-full bg-lp-black" />
          <PhoneScreen />
        </div>
      </div>
    </div>
  );
}
