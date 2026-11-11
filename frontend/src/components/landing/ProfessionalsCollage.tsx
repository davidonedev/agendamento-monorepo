import { CheckCircle2 } from 'lucide-react';
import { SEGMENTS } from './content';

/** Fotos: Unsplash. Um profissional de cada área atendendo, para aproximar o produto de quem usa. */
const PHOTOS = [
  {
    id: 'barbearia',
    label: 'Barbearia',
    src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80&auto=format&fit=crop',
    alt: 'Barbeiro de avental secando o cabelo de um cliente sorridente na barbearia',
    className: 'row-span-2 rounded-[var(--radius-image)_var(--radius-image)_var(--radius-image)_110px]',
  },
  {
    id: 'lash',
    label: 'Lash design',
    src: 'https://images.unsplash.com/photo-1772236617396-2f8460293c07?w=800&q=80&auto=format&fit=crop',
    alt: 'Lash designer aplicando extensão de cílios em uma cliente',
    className: 'rounded-[var(--radius-image)_110px_var(--radius-image)_var(--radius-image)]',
  },
  {
    id: 'unhas',
    label: 'Manicure',
    src: 'https://images.unsplash.com/photo-1690749138086-7422f71dc159?w=800&q=80&auto=format&fit=crop',
    alt: 'Manicure passando esmalte nas unhas de uma cliente',
    className: 'rounded-[var(--radius-image)_var(--radius-image)_110px_var(--radius-image)]',
  },
];

/** Colagem de 3 fotos (barbearia, lash design e unhas) com um cartão de agenda sobreposto. */
export default function ProfessionalsCollage() {
  const total = SEGMENTS[0].mockup.slots.length;
  return (
    <div className="relative mx-auto w-full max-w-md pb-6 lg:max-w-lg">
      <div className="grid aspect-[1.05/1] grid-cols-[1.1fr_1fr] grid-rows-2 gap-3 sm:gap-4">
        {PHOTOS.map(p => (
          <figure key={p.id} className={`relative overflow-hidden shadow-2xl ${p.className}`}>
            <img src={p.src} alt={p.alt} loading="eager" className="h-full w-full object-cover" />
            <figcaption className="absolute left-3 top-3 rounded-full bg-lp-white px-3 py-1 text-xs font-bold text-lp-black shadow-lp-card">
              {p.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="absolute -bottom-1 left-4 flex items-center gap-3 rounded-2xl bg-lp-white p-3 pr-4 text-lp-black shadow-2xl sm:-left-6 sm:p-4 sm:pr-5" aria-hidden>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lp-success-soft">
          <CheckCircle2 className="h-5 w-5 text-lp-success-ink" />
        </span>
        <div>
          <p className="text-base font-extrabold leading-tight sm:text-lg">{total} agendamentos hoje</p>
          <p className="text-xs text-lp-muted">Confirmados no WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
