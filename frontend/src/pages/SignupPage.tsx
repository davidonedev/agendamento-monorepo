import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scissors, CalendarCheck, Store, ArrowRight, ArrowLeft,
  Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,
  User, Mail, Phone, Lock, Building2, MapPin, LinkIcon,
} from 'lucide-react';
import { registerBusinessApi, type BusinessRegisterPayload } from '@/services/register.service';
import { ApiError } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step =
  | 'role'           // escolha: cliente ou negócio
  | 'client-find'    // cliente: buscar estabelecimento por slug
  | 'business-form'  // negócio: formulário completo
  | 'success';       // negócio: cadastro concluído

type Role = 'client' | 'business';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ─── Sub-componentes de campo ─────────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, icon, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
        {icon && <span className="text-white/25">{icon}</span>}
        {label}
        {required && <span className="text-red-500/60">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = `w-full h-11 px-4 rounded-xl
  bg-white/[0.06] border border-white/[0.1]
  text-white placeholder:text-white/20 text-sm
  outline-none transition-all
  focus:bg-white/[0.09] focus:border-white/25 focus:ring-2 focus:ring-white/10`;

const inputError = `border-red-500/40 focus:border-red-500/60`;

// ─── Etapa 1 — Seleção de perfil ──────────────────────────────────────────────

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  onClick: () => void;
}

function RoleCard({ icon, title, description, items, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-6 rounded-2xl border border-white/[0.1]
        bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.2]
        transition-all duration-200 w-full"
    >
      <div className="h-11 w-11 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center mb-4 text-white/60 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white/80 group-hover:text-white mb-1.5 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-white/35 mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-1.5 mb-5">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2 text-xs text-white/30">
            <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-1.5 text-sm text-white/40 group-hover:text-white/70 transition-colors font-medium">
        Continuar <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

// ─── Helpers de slug ─────────────────────────────────────────────────────────

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
    <div className="w-full max-w-[420px]">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      <div className="mb-8">
        <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.2em] mb-2">Portal do cliente</p>
        <h2 className="text-[1.75rem] font-black text-white leading-tight tracking-tight">
          Qual é o link do<br />seu estabelecimento?
        </h2>
        <p className="text-white/40 text-sm mt-3 leading-relaxed">
          Você encontra o link no site, cartão ou redes sociais do negócio onde quer agendar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Link do estabelecimento" icon={<LinkIcon className="h-3 w-3" />} error={error} required>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm select-none pointer-events-none">
              agendepro.com/
            </span>
            <input
              type="text"
              placeholder="barber-kings"
              value={slug}
              onChange={e => { setSlug(e.target.value); setError(''); }}
              className={`${inputCls} pl-[9.5rem] ${error ? inputError : ''}`}
              autoFocus
            />
          </div>
        </Field>

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-white text-zinc-900 text-sm font-bold
            flex items-center justify-center gap-2
            hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg shadow-black/30"
        >
          Acessar portal <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="text-center text-white/20 text-xs mt-6">
        Não sabe o link? Peça ao estabelecimento ou procure nas redes sociais.
      </p>
    </div>
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
  const [showPw,   setShowPw]   = useState(false);
  const [showCPw,  setShowCPw]  = useState(false);
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
    <div className="w-full max-w-[480px]">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      <div className="mb-8">
        <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.2em] mb-2">Cadastro de negócio</p>
        <h2 className="text-[1.75rem] font-black text-white leading-tight tracking-tight">
          Crie seu perfil<br />profissional
        </h2>
        <p className="text-white/35 text-sm mt-2">Plano Trial gratuito · Sem cartão necessário</p>
      </div>

      <form id={uid} onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* Dados pessoais */}
        <div>
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.18em] mb-3">
            Dados pessoais
          </p>
          <div className="space-y-3">
            <Field label="Nome completo" icon={<User className="h-3 w-3" />} error={errors.ownerName} required>
              <input
                type="text" placeholder="Seu nome completo" value={form.ownerName}
                onChange={set('ownerName')} autoComplete="name"
                className={`${inputCls} ${errors.ownerName ? inputError : ''}`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="E-mail" icon={<Mail className="h-3 w-3" />} error={errors.email} required>
                <input
                  type="email" placeholder="voce@email.com" value={form.email}
                  onChange={set('email')} autoComplete="email"
                  className={`${inputCls} ${errors.email ? inputError : ''}`}
                />
              </Field>

              <Field label="Telefone" icon={<Phone className="h-3 w-3" />} error={errors.phone}>
                <input
                  type="tel" placeholder="(00) 00000-0000" value={form.phone}
                  onChange={set('phone')} autoComplete="tel"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Senha" icon={<Lock className="h-3 w-3" />} error={errors.password} required>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} placeholder="Mín. 6 caracteres"
                    value={form.password} onChange={set('password')} autoComplete="new-password"
                    className={`${inputCls} pr-10 ${errors.password ? inputError : ''}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar senha" icon={<Lock className="h-3 w-3" />} error={errors.confirmPw} required>
                <div className="relative">
                  <input
                    type={showCPw ? 'text' : 'password'} placeholder="Repita a senha"
                    value={form.confirmPw} onChange={set('confirmPw')} autoComplete="new-password"
                    className={`${inputCls} pr-10 ${errors.confirmPw ? inputError : ''}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowCPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showCPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Dados do estabelecimento */}
        <div>
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.18em] mb-3">
            Sobre o estabelecimento
          </p>
          <div className="space-y-3">
            <Field label="Nome do estabelecimento" icon={<Building2 className="h-3 w-3" />} error={errors.businessName} required>
              <input
                type="text" placeholder="Ex: Barber Kings, Studio Ana Lima…"
                value={form.businessName} onChange={set('businessName')}
                className={`${inputCls} ${errors.businessName ? inputError : ''}`}
              />
            </Field>

            <Field label="Endereço" icon={<MapPin className="h-3 w-3" />} error={errors.address}>
              <input
                type="text" placeholder="Rua, número, bairro, cidade"
                value={form.address} onChange={set('address')} autoComplete="street-address"
                className={inputCls}
              />
            </Field>

            {/* URL do perfil */}
            <Field
              label="URL do seu perfil"
              icon={<LinkIcon className="h-3 w-3" />}
              error={errors.slug}
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm select-none pointer-events-none whitespace-nowrap">
                  agendepro.com/
                </span>
                <input
                  type="text"
                  placeholder="seu-negocio"
                  value={form.slug}
                  onChange={handleSlugChange}
                  className={`${inputCls} pl-[9.5rem] ${errors.slug ? inputError : ''}`}
                />
              </div>
              {form.slug && !errors.slug && (
                <p className="text-[11px] text-white/25 pl-1">
                  Clientes acessarão: <span className="text-white/40 font-mono">agendepro.com/{form.slug}</span>
                </p>
              )}
            </Field>
          </div>
        </div>

        {/* Erro geral */}
        {errors.general && (
          <div className="flex items-center gap-2.5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.general}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full h-11 rounded-xl bg-white text-zinc-900 text-sm font-bold
            flex items-center justify-center gap-2
            hover:bg-zinc-100 active:scale-[0.98] transition-all
            disabled:opacity-50 shadow-lg shadow-black/30"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta…</>
            : <>Criar minha conta <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="text-center text-white/15 text-xs mt-5">
        Ao criar uma conta você concorda com os termos de uso da plataforma.
      </p>
    </div>
  );
}

// ─── Etapa 3 — Sucesso ────────────────────────────────────────────────────────

function SuccessStep({ slug }: { slug: string }) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[420px] text-center">
      <div className="h-16 w-16 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-white/70" />
      </div>

      <h2 className="text-[1.75rem] font-black text-white leading-tight tracking-tight mb-3">
        Conta criada<br />com sucesso!
      </h2>
      <p className="text-white/40 text-sm leading-relaxed mb-2">
        Sua conta está no plano <span className="text-white/60 font-medium">Trial</span>. Faça login para configurar seu estabelecimento.
      </p>
      <p className="text-white/25 text-xs mb-8 font-mono">agendepro.com/{slug}</p>

      <button
        onClick={() => navigate('/login')}
        className="w-full h-11 rounded-xl bg-white text-zinc-900 text-sm font-bold
          flex items-center justify-center gap-2
          hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg shadow-black/30"
      >
        Ir para o login <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const [step,     setStep]     = useState<Step>('role');
  const [role,     setRole]     = useState<Role | null>(null);
  const [newSlug,  setNewSlug]  = useState('');

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep(r === 'client' ? 'client-find' : 'business-form');
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-base text-white tracking-tight">AgendePro</span>
        </div>
        <Link
          to="/login"
          className="text-sm text-white/30 hover:text-white/70 transition-colors flex items-center gap-1.5"
        >
          Já tenho conta <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">

        {/* ── Etapa 1: Seleção de perfil ── */}
        {step === 'role' && (
          <div className="w-full max-w-[640px]">
            <div className="text-center mb-10">
              <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.2em] mb-3">
                Criar conta
              </p>
              <h1 className="text-[2rem] sm:text-[2.25rem] font-black text-white leading-tight tracking-tight mb-3">
                Como você quer<br />usar o AgendePro?
              </h1>
              <p className="text-white/35 text-sm">
                Escolha seu perfil para personalizar sua experiência
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RoleCard
                icon={<CalendarCheck className="h-5 w-5" />}
                title="Sou cliente"
                description="Quero agendar serviços e acompanhar meus atendimentos."
                items={[
                  'Agende serviços online',
                  'Escolha profissional e horário',
                  'Gerencie seus agendamentos',
                ]}
                onClick={() => handleRoleSelect('client')}
              />
              <RoleCard
                icon={<Store className="h-5 w-5" />}
                title="Tenho um negócio"
                description="Quero gerenciar meu estabelecimento, equipe e agenda."
                items={[
                  'Perfil completo do estabelecimento',
                  'Gestão de profissionais e serviços',
                  'Agendamentos, faturamento e clientes',
                ]}
                onClick={() => handleRoleSelect('business')}
              />
            </div>

            <p className="text-center text-white/20 text-xs mt-8">
              Já tem conta?{' '}
              <Link to="/login" className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors">
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
  );
}
