import { MapPin, CheckCircle2, Plus } from 'lucide-react';
import type { Segment } from './content';

function getInitials(name: string) {
  return name
    .split(/[\s·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function PhoneMockup({ segment }: { segment: Segment }) {
  const { business } = segment.mockup;
  const bm = segment.bookingMockup;
  const tone = segment.tone;

  return (
    <div className="relative mx-auto w-[272px]" aria-hidden="true">
      {/* Phone frame */}
      <div className="hero-mockup relative overflow-hidden rounded-[2.5rem] border-[8px] border-landing-ink/10 bg-white shadow-2xl shadow-landing-ink/15">
        {/* Notch pill */}
        <div className="flex justify-center bg-white pt-3 pb-1.5">
          <div className="h-[6px] w-[72px] rounded-full bg-landing-ink/15" />
        </div>

        {/* Cover strip */}
        <div className={`h-[56px] ${tone.soft}`} />

        {/* Avatar + header info */}
        <div className="-mt-7 px-4 pb-4 text-center">
          <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white text-[13px] font-bold shadow-sm ${tone.soft} ${tone.text}`}>
            {getInitials(business)}
          </div>
          <p key={segment.id} className="seg-swap text-[13px] font-bold text-landing-ink">{business}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-landing-muted">
            <MapPin className="h-2.5 w-2.5 shrink-0" />{bm.city}
          </p>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${tone.soft} ${tone.text}`}>
            {bm.status}
          </span>
        </div>

        <div className="border-t border-landing-line" />

        {/* Booking flow */}
        <div className="px-4 pt-3.5 pb-5">
          <p className="text-[10px] font-semibold text-landing-muted">1/3</p>
          <p className="mt-1 text-[13px] font-bold leading-snug text-landing-ink">
            Qual serviço você<br />quer agendar?
          </p>
          <p className="mt-1 text-[10px] leading-snug text-landing-muted">
            Toque no serviço para agendar — ou use + para juntar vários de uma vez.
          </p>

          {/* Category chips */}
          <div className="mt-2.5 flex gap-1.5">
            {bm.categories.map((cat, i) => (
              <span
                key={cat}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  i === 0
                    ? `${tone.soft} ${tone.text}`
                    : 'border border-landing-line bg-landing-bg text-landing-muted'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Service rows */}
          <div key={segment.id} className="seg-swap mt-3 space-y-2">
            {bm.services.map(svc => (
              <div
                key={svc.name}
                className="flex items-center justify-between rounded-xl border border-landing-line bg-landing-bg/60 px-3 py-2.5"
              >
                <div>
                  <p className="text-[11px] font-semibold text-landing-ink">{svc.name}</p>
                  <p className="mt-0.5 text-[10px] text-landing-muted">{svc.duration} · {svc.price}</p>
                </div>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone.soft} ${tone.text}`}>
                  <Plus className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2.5">
          <div className="h-[4px] w-[88px] rounded-full bg-landing-ink/15" />
        </div>
      </div>

      {/* Floating "Agendado" confirmation card */}
      <div className="animate-float absolute -bottom-3 -left-8 z-10 flex items-center gap-2.5 rounded-2xl border border-landing-line bg-landing-surface/95 px-3.5 py-2.5 shadow-xl shadow-landing-ink/10 backdrop-blur-xl">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-sage-light">
          <CheckCircle2 className="h-3.5 w-3.5 text-landing-sage-ink" />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-landing-ink">Agendado</p>
          <p key={segment.id} className="seg-swap text-[10px] text-landing-muted">{bm.confirmedBooking}</p>
        </div>
      </div>
    </div>
  );
}
