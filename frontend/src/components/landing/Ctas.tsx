import { LpButton, Section } from './ui';

/** CTA isolado entre seções (padrão "Teste grátis por 5 dias" da referência). */
export function CtaStrip({ tone = 'white', text = 'Quer ver na prática? Crie sua conta e monte sua agenda hoje.' }: { tone?: 'white' | 'alt'; text?: string }) {
  return (
    <Section tone={tone} className="!py-12 sm:!py-14">
      <div className="reveal flex flex-col items-center gap-5 text-center">
        <p className="max-w-xl text-xl font-bold sm:text-2xl">{text}</p>
        <LpButton to="/signup" size="lg">Teste grátis</LpButton>
      </div>
    </Section>
  );
}

/** Bloco de chamada com fundo azul (meio da página). */
export function MidCta() {
  return (
    <Section tone="blue" labelledBy="mid-cta-title">
      <div className="reveal mx-auto max-w-3xl text-center">
        <h2 id="mid-cta-title" className="lp-h2">Se tem hora marcada no seu negócio, tem Nimbo na sua gestão</h2>
        <p className="mt-4 text-lg text-white/90">Agenda, equipe, clientes e caixa no mesmo lugar.</p>
        <div className="mt-8"><LpButton to="/signup" variant="light" size="lg">Teste grátis</LpButton></div>
      </div>
    </Section>
  );
}

/** CTA de conversão final (padrão "Você relaxa e seu negócio não para"). */
export function FinalCta() {
  return (
    <Section tone="blue" labelledBy="final-cta-title">
      <div className="reveal mx-auto max-w-3xl text-center">
        <h2 id="final-cta-title" className="lp-h2">Você atende. Sua agenda não para.</h2>
        <p className="mt-4 text-lg text-white/90">
          Crie sua conta em minutos, coloque o link na bio e deixe seus clientes agendarem enquanto você trabalha. Bora começar?
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LpButton to="/signup" variant="light" size="lg">Quero organizar meu negócio</LpButton>
          <LpButton to="/login" variant="ghost-light" size="lg">Já sou cliente</LpButton>
        </div>
      </div>
    </Section>
  );
}
