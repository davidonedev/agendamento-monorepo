import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CalendarCheck, Store, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { registerBusinessApi, type BusinessRegisterPayload } from '@/services/register.service';
import { ApiError } from '@/lib/api';
import { LpButton } from '@/components/brand/LpButton';
import { AuthHeader, headerLinkClass } from '@/components/auth/AuthHeader';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { TextField, PasswordField } from '@/components/auth/TextField';
import { ChoiceGroup, type Choice } from '@/components/auth/ChoiceGroup';
import { Stepper } from '@/components/auth/Stepper';
import { Spinner } from '@/components/auth/Spinner';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step =
  | 'role'           // escolha: cliente ou negócio
  | 'client-find'    // cliente: buscar estabelecimento por slug
  | 'business-form'  // negócio: formulário completo
  | 'success';       // negócio: cadastro concluído

type Role = 'client' | 'business';

const STEP_LABELS = ['Perfil', 'Dados', 'Concluído'];
const stepIndex: Record<Step, number> = { role: 0, 'client-find': 1, 'business-form': 1, success: 3 };

const ROLE_OPTIONS: Choice<Role>[] = [
  {
    value: 'client',
    title: 'Sou cliente',
    description: 'Quero agendar serviços e acompanhar meus atendimentos.',
    icon: <CalendarCheck className="h-6 w-6" />,
    items: ['Agende serviços online', 'Escolha profissional e horário', 'Gerencie seus agendamentos'],
  },
  {
    value: 'business',
    title: 'Tenho um negócio',
    description: 'Quero gerenciar meu estabelecimento, equipe e agenda.',
    icon: <Store className="h-6 w-6" />,
    items: ['Perfil completo do estabelecimento', 'Gestão de profissionais e serviços', 'Agendamentos, faturamento e clientes'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

/**
 * Extrai apenas o slug a partir de qualquer entrada do usuário:
 * - "barber-kings"                  → "barber-kings"
 * - "http://localhost:5173/barber-kings" → "barber-kings"
 * - "agendepro.com/barber-kings"    → "barber-kings"
 * - "barber-kings/booking"          → "barber-kings"
 */
function extractSlug(input: string): string {
  const s = input.trim().toLowerCase();
  // Has explicit protocol (http:// or https://) → parse URL, take first path segment
  if (s.includes('://')) {
    try {
      const url = new URL(s);
      return url.pathname.split('/').filter(Boolean)[0]?.replace(/[^a-z0-9-]/g, '') ?? '';
    } catch { return ''; }
  }
  // Has a real domain with dot + slash → skip hostname, take first path segment
  // e.g. "agendepro.com/barber-kings" → "barber-kings"
  if (/\.[a-z]/.test(s) && s.includes('/')) {
    const parts = s.split('/').filter(Boolean);
    return (parts[1] ?? '').replace(/[^a-z0-9-]/g, '');
  }
  // Plain slug (most common): "barber-kings" or "barber-kings/booking"
  return s.split('/')[0].replace(/[^a-z0-9-]/g, '');
}

// ─── Estrutura visual das etapas ──────────────────────────────────────────────

/** Cartão branco das etapas de formulário. */
function StepCard({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[440px]'} rounded-lp-card border border-lp-line bg-lp-white p-6 shadow-lp-card sm:p-8`}>
      {children}
    </div>
  );
}

/** Linha de botões: Voltar (à esquerda) e ação principal. No mobile, o principal vem primeiro. */
function ActionRow({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <LpButton variant="outline" onClick={onBack} className="sm:min-w-[7.5rem]">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
      </LpButton>
      {children}
    </div>
  );
}

// ─── Etapa 2a — Cliente: acessar portal do estabelecimento ───────────────────

function ClientFindStep({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [slug,  setSlug]  = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const s = extractSlug(slug);
    if (!s) { setError('Informe o link do estabelecimento.'); return; }
    navigate(`/${s}`);
  };

  return (
    <StepCard>
      <div className="mb-7 text-center">
        <p className="text-sm font-bold text-lp-primary">Portal do cliente</p>
        <h1 className="lp-h3 mt-1">Qual é o link do seu estabelecimento?</h1>
        <p className="mt-3 text-sm text-lp-muted">
          Você encontra o link no site, cartão ou redes sociais do negócio onde quer agendar.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <TextField
          id="client-slug" label="Link do estabelecimento" prefixText="agendepro.com/" placeholder="barber-kings"
          value={slug} onChange={e => { setSlug(e.target.value); setError(''); }}
          error={error} required autoFocus
        />

        <ActionRow onBack={onBack}>
          <LpButton type="submit">Acessar portal <ArrowRight className="h-4 w-4" aria-hidden /></LpButton>
        </ActionRow>
      </form>

      <p className="mt-6 text-center text-xs text-lp-muted">
        Não sabe o link? Peça ao estabelecimento ou procure nas redes sociais.
      </p>
    </StepCard>
  );
}

// ─── Etapa 2b — Negócio: formulário completo ──────────────────────────────────

interface BusinessForm {
  ownerName:    string;
  email:        string;
  phone:        string;
  password:     string;
  confirmPw:    string;
  businessName: string;
  address:      string;
  slug:         string;
}

const INITIAL: BusinessForm = {
  ownerName: '', email: '', phone: '', password: '', confirmPw: '',
  businessName: '', address: '', slug: '',
};

type FormErrors = Partial<Record<keyof BusinessForm | 'general', string>>;

function validate(form: BusinessForm): FormErrors {
  const e: FormErrors = {};
  if (!form.ownerName.trim())      e.ownerName    = 'Informe seu nome completo.';
  if (!form.email.trim())          e.email        = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
  if (!form.password)              e.password     = 'Informe uma senha.';
  else if (form.password.length < 6) e.password   = 'Mínimo 6 caracteres.';
  if (form.password !== form.confirmPw) e.confirmPw = 'As senhas não coincidem.';
  if (!form.businessName.trim())   e.businessName = 'Informe o nome do estabelecimento.';
  if (form.slug && !/^[a-z0-9-]+$/.test(form.slug))
    e.slug = 'Use apenas letras minúsculas, números e hífens.';
  return e;
}

function BusinessFormStep({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (slug: string) => void;
}) {
  const uid = useId();
  const [form,     setForm]     = useState<BusinessForm>(INITIAL);
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [loading,  setLoading]  = useState(false);
  const [slugAuto, setSlugAuto] = useState(true); // se o slug ainda é auto-gerado

  const set = (key: keyof BusinessForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setForm(f => {
      const next = { ...f, [key]: value };
      // auto-gera slug enquanto usuário não editar manualmente
      if (key === 'businessName' && slugAuto) {
        next.slug = slugify(value);
      }
      return next;
    });
    setErrors(er => ({ ...er, [key]: undefined, general: undefined }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugAuto(false);
    setForm(f => ({ ...f, slug: e.target.value }));
    setErrors(er => ({ ...er, slug: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload: BusinessRegisterPayload = {
        ownerName:    form.ownerName.trim(),
        email:        form.email.trim().toLowerCase(),
        password:     form.password,
        phone:        form.phone.trim() || undefined,
        businessName: form.businessName.trim(),
        address:      form.address.trim() || undefined,
        slug:         form.slug.trim() || undefined,
      };
      const result = await registerBusinessApi(payload);
      onSuccess(result.slug);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar conta. Tente novamente.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepCard wide>
      <div className="mb-7 text-center">
        <p className="text-sm font-bold text-lp-primary">Cadastro de negócio</p>
        <h1 className="lp-h3 mt-1">Crie seu perfil profissional</h1>
        <p className="mt-2 text-sm text-lp-muted">Plano Trial gratuito · Sem cartão necessário</p>
      </div>

      <form id={uid} onSubmit={handleSubmit} noValidate className="space-y-7">

        {/* Dados pessoais */}
        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-extrabold">Dados pessoais</legend>
          <TextField
            id={`${uid}-ownerName`} label="Nome completo" placeholder="Seu nome completo" autoComplete="name"
            value={form.ownerName} onChange={set('ownerName')} error={errors.ownerName} required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id={`${uid}-email`} label="E-mail" type="email" placeholder="voce@email.com" autoComplete="email"
              value={form.email} onChange={set('email')} error={errors.email} required
            />
            <TextField
              id={`${uid}-phone`} label="Telefone" type="tel" placeholder="(00) 00000-0000" autoComplete="tel"
              value={form.phone} onChange={set('phone')} error={errors.phone}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordField
              id={`${uid}-password`} label="Senha" placeholder="Mín. 6 caracteres" autoComplete="new-password"
              value={form.password} onChange={set('password')} error={errors.password} required
            />
            <PasswordField
              id={`${uid}-confirmPw`} label="Confirmar senha" placeholder="Repita a senha" autoComplete="new-password"
              value={form.confirmPw} onChange={set('confirmPw')} error={errors.confirmPw} required
            />
          </div>
        </fieldset>

        {/* Dados do estabelecimento */}
        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-extrabold">Sobre o estabelecimento</legend>
          <TextField
            id={`${uid}-businessName`} label="Nome do estabelecimento" placeholder="Ex: Barber Kings, Studio Ana Lima…"
            value={form.businessName} onChange={set('businessName')} error={errors.businessName} required
          />
          <TextField
            id={`${uid}-address`} label="Endereço" placeholder="Rua, número, bairro, cidade" autoComplete="street-address"
            value={form.address} onChange={set('address')} error={errors.address}
          />
          <TextField
            id={`${uid}-slug`} label="URL do seu perfil" prefixText="agendepro.com/" placeholder="seu-negocio"
            value={form.slug} onChange={handleSlugChange} error={errors.slug}
            hint={form.slug ? <>Clientes acessarão: <span className="font-mono text-lp-black">agendepro.com/{form.slug}</span></> : undefined}
          />
        </fieldset>

        {/* Erro geral */}
        {errors.general && <AuthAlert kind="error">{errors.general}</AuthAlert>}

        <ActionRow onBack={onBack}>
          <LpButton type="submit" disabled={loading}>
            {loading
              ? <><Spinner /> Criando conta…</>
              : <>Criar minha conta <ArrowRight className="h-4 w-4" aria-hidden /></>}
          </LpButton>
        </ActionRow>
      </form>

      <p className="mt-6 text-center text-xs text-lp-muted">
        Ao criar uma conta você concorda com os{' '}
        <Link to="/termos" className="font-bold text-lp-primary underline-offset-4 hover:underline">termos de uso</Link>
        {' '}e a{' '}
        <Link to="/privacidade" className="font-bold text-lp-primary underline-offset-4 hover:underline">política de privacidade</Link>.
      </p>
    </StepCard>
  );
}

// ─── Etapa 3 — Sucesso ────────────────────────────────────────────────────────

function SuccessStep({ slug }: { slug: string }) {
  const navigate = useNavigate();

  return (
    <StepCard>
      <div className="text-center" role="status">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lp-success-soft">
          <CheckCircle2 className="h-8 w-8 text-lp-success-ink" aria-hidden />
        </div>

        <h1 className="lp-h3 mb-3">Conta criada com sucesso!</h1>
        <p className="mb-2 text-sm text-lp-muted">
          Sua conta está no plano <strong className="text-lp-black">Trial</strong>. Faça login para configurar seu estabelecimento.
        </p>
        <p className="mb-8 font-mono text-sm text-lp-black">agendepro.com/{slug}</p>

        <LpButton onClick={() => navigate('/login')} size="lg" className="w-full">
          Ir para o login <ArrowRight className="h-4 w-4" aria-hidden />
        </LpButton>
      </div>
    </StepCard>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState<Step>('role');
  const [role,     setRole]     = useState<Role | null>(null);
  const [choice,   setChoice]   = useState<Role | null>(null); // seleção atual na etapa 1 (antes de Continuar)
  const [newSlug,  setNewSlug]  = useState('');

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep(r === 'client' ? 'client-find' : 'business-form');
  };

  return (
    <div className="lp-root">
      <div className="flex min-h-screen flex-col bg-lp-alt">
        <AuthHeader
          right={<Link to="/login" className={headerLinkClass}>Já tenho conta <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
        />

        <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-12">
          <div className="mb-8">
            <Stepper steps={STEP_LABELS} current={stepIndex[step]} />
          </div>

          {/* ── Etapa 1: Seleção de perfil ── */}
          {step === 'role' && (
            <div className="w-full max-w-[720px]">
              <div className="mb-8 text-center">
                <h1 className="lp-h2">Como você quer usar o AgendePro?</h1>
                <p className="mt-3 text-lp-muted">Escolha seu perfil para personalizar sua experiência.</p>
              </div>

              <ChoiceGroup
                label="Perfil de uso"
                value={choice}
                onChange={setChoice}
                options={ROLE_OPTIONS}
              />

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <LpButton variant="outline" onClick={() => navigate('/')} className="sm:min-w-[7.5rem]">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
                </LpButton>
                <LpButton disabled={!choice} onClick={() => choice && handleRoleSelect(choice)} size="lg">
                  Continuar <ArrowRight className="h-4 w-4" aria-hidden />
                </LpButton>
              </div>

              <p className="mt-8 text-center text-sm text-lp-muted">
                Já tem conta?{' '}
                <Link to="/login" className="font-bold text-lp-primary underline-offset-4 hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          )}

          {/* ── Etapa 2a: Cliente ── */}
          {step === 'client-find' && (
            <ClientFindStep onBack={() => setStep('role')} />
          )}

          {/* ── Etapa 2b: Negócio ── */}
          {step === 'business-form' && (
            <BusinessFormStep
              onBack={() => setStep('role')}
              onSuccess={(slug) => { setNewSlug(slug); setStep('success'); }}
            />
          )}

          {/* ── Etapa 3: Sucesso ── */}
          {step === 'success' && role && (
            <SuccessStep slug={newSlug} />
          )}
        </main>
      </div>
    </div>
  );
}
