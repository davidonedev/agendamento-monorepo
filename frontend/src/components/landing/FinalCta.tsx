import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCta() {
  return (
    <section className="px-4 pb-24">
      <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-landing-ink px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[360px] w-[520px] rounded-full bg-landing-petrol/50 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[300px] w-[400px] rounded-full bg-landing-lavender/30 blur-[100px]" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Pronto para organizar sua agenda?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-white/75">
            Barbearia, salão ou estética: crie sua conta em poucos minutos e compartilhe seu link hoje mesmo.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-landing-ink transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-landing-ink"
            >
              Quero organizar meu negócio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-lavender"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
